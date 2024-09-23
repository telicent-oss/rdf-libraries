import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import {
  DCATResourceSchema,
  UITreeViewBaseItemType,
  DCATResourceType,
} from "./common";
import { CatalogService } from "../../../../index";
import { findTypeInTripleOrNeighbor } from "../../../utils/triplesOrNeighborWithType";
import { tryInstantiate } from "./tryInstantiate/tryInstantiate";

type Transform = (
  leaf: UITreeViewBaseItemType
) => Promise<UITreeViewBaseItemType>;

export const enrichRdfTree = async ({
  tree,
  triples,
  service,
}: {
  tree: UITreeViewBaseItemType[];
  service: CatalogService;
  triples: RDFTripleType[];
}): Promise<UITreeViewBaseItemType[]> => {
  const leafToUI: Transform = async ({ id, ...rest }) => {
    const typeTriple = findTypeInTripleOrNeighbor({
      id,
      triples,
      assert: true,
    });
    const { error, data: type } = DCATResourceSchema.safeParse(
      typeTriple?.o.value
    );
    if (error) {
      console.error(`DCATResourceSchema failed: ${JSON.stringify(typeTriple)}`);
      throw error;
    }

    const instance = tryInstantiate({
      id,
      type,
      service,
      triples,
    });
    // const titles = await instance.getDcTitle({ isAssert: true });
    // if (titles.length > 1) {
    //   console.warn(`Expected 1 title, instead got "${titles.join(", ")}"`);
    // }
    const title = instance.service.interpretation.dcTitleFromTriples(id, triples, { assert: true });
    if (!title) {
      // TODO remove if (!title) { ... }
      // HOW create version of dcTitleFromTriples that always returns string
      // WHEN no rush
      throw new Error('no title');
    }
    return {
      id,
      ...rest,
      label: title,
    };
  };

  // Recursive function to traverse and transform each node
  const traverseAndTransform = async (
    node: UITreeViewBaseItemType
  ): Promise<UITreeViewBaseItemType> => {
    // Apply work to the current node
    const transformedNode = await leafToUI(node);

    // Recursively apply to all children if they exist
    if (node.children && node.children.length > 0) {
      transformedNode.children = await Promise.all(
        node.children.map(async (child) => await traverseAndTransform(child))
      );
    }

    return transformedNode;
  };
  // Start the transformation from the root
  return Promise.all(tree.map((node) => traverseAndTransform(node)));
};
