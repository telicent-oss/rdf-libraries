import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import { TreeViewBaseItemType } from "./common";

type EdgePredicate = (triple: RDFTripleType) => boolean;

export const transformRdfToTree = (options: {
  triples: RDFTripleType[];
  edgePredicate: EdgePredicate;
  reverseEdgePredicate: EdgePredicate;
}): TreeViewBaseItemType => {
  // Filter and map triples based on the edgePredicate
  const childrenMap = new Map<string, TreeViewBaseItemType[]>();
  const objectIds = new Set<string>();

  options.triples.forEach(triple => {
    // Handle normal direction
    if (options.edgePredicate(triple)) {
      if (!childrenMap.has(triple.s.value)) {
        childrenMap.set(triple.s.value, []);
      }
      const childNode: TreeViewBaseItemType = {
        id: triple.o.value,
        label: triple.o.value,
        children: []
      };
      childrenMap.get(triple.s.value)!.push(childNode);
      objectIds.add(triple.o.value);
    }

    // Handle reverse direction
    if (options.reverseEdgePredicate(triple)) {
      if (!childrenMap.has(triple.o.value)) {
        childrenMap.set(triple.o.value, []);
      }
      const parentNode: TreeViewBaseItemType = {
        id: triple.s.value,
        label: triple.s.value,
        children: []
      };
      childrenMap.get(triple.o.value)!.push(parentNode);
      objectIds.add(triple.s.value);
    }
  });

  // Find root: A node that is a subject but never an object
  const rootNode = Array.from(childrenMap.keys()).find(key => !objectIds.has(key));

  // Build the tree recursively
  function buildTree(nodeId: string): TreeViewBaseItemType {
    const children = childrenMap.get(nodeId) || [];
    return {
      id: nodeId,
      label: nodeId, // Assuming the label is the nodeId, adjust as needed
      children: children.map(child => buildTree(child.id))
    };
  }

  if (!rootNode) {
    throw new Error(`Root node not found in the RDF data based on the given edge predicate
      ${JSON.stringify(options.triples, null, 2)}
      ${childrenMap}
      ${objectIds}
      `);
  }

  // Return the tree starting from the root
  return buildTree(rootNode);
};