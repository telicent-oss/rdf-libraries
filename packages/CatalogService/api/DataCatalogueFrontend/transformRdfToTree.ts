import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import { TreeViewItemType } from "./common";

type EdgePredicate = (triple: RDFTripleType) => boolean;

export const transformRdfToTree = (options: {
  triples: RDFTripleType[];
  edgePredicate: EdgePredicate;
}): TreeViewItemType => {
  // Filter and map triples based on the edgePredicate
  const childrenMap = new Map<string, TreeViewItemType[]>();
  const objectIds = new Set<string>();

  options.triples.forEach(triple => {
    if (options.edgePredicate(triple)) {
      if (!childrenMap.has(triple.s.value)) {
        childrenMap.set(triple.s.value, []);
      }
      const childNode: TreeViewItemType = {
        id: triple.o.value,
        label: triple.o.value,
        children: []
      };
      childrenMap.get(triple.s.value)!.push(childNode);
      objectIds.add(triple.o.value);
    }
  });

  // Find root: A node that is a subject but never an object
  const rootNode = Array.from(childrenMap.keys()).find(key => !objectIds.has(key));

  // Build the tree recursively
  function buildTree(nodeId: string): TreeViewItemType {
    const children = childrenMap.get(nodeId) || [];
    return {
      id: nodeId,
      label: nodeId, // Assuming the label is the nodeId, adjust as needed
      children: children.map(child => buildTree(child.id))
    };
  }

  if (!rootNode) {
    throw new Error("Root node not found in the RDF data based on the given edge predicate");
  }

  // Return the tree starting from the root
  return buildTree(rootNode);
};