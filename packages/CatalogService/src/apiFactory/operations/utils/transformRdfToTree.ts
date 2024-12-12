import { ResourceQueryType, UITreeViewBaseItemType } from "./common";

export const transformRdfToTree = (options: {
  resources: ResourceQueryType[];
}): UITreeViewBaseItemType[] => {
  // Filter and map triples based on the edgePredicate
  const childrenMap = new Map<string, UITreeViewBaseItemType[]>();
  const objectIds = new Set<string>();
  const subjectIds = new Set<string>();
  options.resources.forEach((resource) => {
    // Handle normal direction

    if (resource?.relationship) {
      if (!childrenMap.has(resource.s.value)) {
        childrenMap.set(resource.s.value, []);
      }
      if (resource?.partner) {
        const childNode: UITreeViewBaseItemType = {
          id: resource.partner.value,
          label: resource.partner.value,
          children: [],
        };
        childrenMap.get(resource.s.value)?.push(childNode);
        objectIds.add(resource.partner.value);
      }
    }

    // Track all subjects
    subjectIds.add(resource.s.value);
  });

  // Find roots: Nodes that are subjects but never objects
  const rootNodes = Array.from(subjectIds).filter((key) => !objectIds.has(key));

  // Build the tree recursively
  function buildTree(nodeId: string): UITreeViewBaseItemType {
    const children = childrenMap.get(nodeId) || [];
    const node = options.resources.find(
      (resource) => resource.s.value === nodeId
    );
    return {
      id: nodeId,
      label: node?.resourceTitle?.value ?? nodeId, // Assuming the label is the nodeId, adjust as needed
      children: children.map((child) => buildTree(child.id)),
    };
  }

  // Handle the case where no roots are found
  if (rootNodes.length === 0) {
    throw new Error(
      `Root node(s) not found in the RDF data based on the given edge predicates. Please check the edge predicates or the RDF data structure.`
    );
  }

  // Return the trees starting from each root
  return rootNodes.map((rootNode) => buildTree(rootNode));
};
