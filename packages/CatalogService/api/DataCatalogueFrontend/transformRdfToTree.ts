import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import { UITreeViewBaseItemType } from "./common";

type EdgePredicate = (triple: RDFTripleType) => boolean;

export const transformRdfToTree = (options: {
  triples: RDFTripleType[];
  edgePredicate: EdgePredicate;
  reverseEdgePredicate: EdgePredicate;
}): UITreeViewBaseItemType[] => {
  // Filter and map triples based on the edgePredicate
  const childrenMap = new Map<string, UITreeViewBaseItemType[]>();
  const objectIds = new Set<string>();
  const subjectIds = new Set<string>();

  options.triples.forEach(triple => {
    // Handle normal direction
    if (options.edgePredicate(triple)) {
      if (!childrenMap.has(triple.s.value)) {
        childrenMap.set(triple.s.value, []);
      }
      const childNode: UITreeViewBaseItemType = {
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
      const parentNode: UITreeViewBaseItemType = {
        id: triple.s.value,
        label: triple.s.value,
        children: []
      };
      childrenMap.get(triple.o.value)!.push(parentNode);
      objectIds.add(triple.s.value);
    }

    // Track all subjects
    subjectIds.add(triple.s.value);
  });

  // Find roots: Nodes that are subjects but never objects
  const rootNodes = Array.from(subjectIds).filter(key => !objectIds.has(key));

  // Build the tree recursively
  function buildTree(nodeId: string): UITreeViewBaseItemType {
    const children = childrenMap.get(nodeId) || [];
    return {
      id: nodeId,
      label: nodeId, // Assuming the label is the nodeId, adjust as needed
      children: children.map(child => buildTree(child.id))
    };
  }

  // Handle the case where no roots are found
  if (rootNodes.length === 0) {
    throw new Error(`Root node(s) not found in the RDF data based on the given edge predicates. Please check the edge predicates or the RDF data structure.`);
  }

  // Return the trees starting from each root
  return rootNodes.map(rootNode => buildTree(rootNode));
};