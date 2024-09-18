import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import { RDF_TYPE_URI, DCATResourceSchema, UITreeViewBaseItemType, DCATResourceType } from "./common";
import { CatalogService } from "../../../../index";
import { tryInstantiate } from "./tryInstantiate";
import { formatDataAsArray } from "../../../__tests__/utils/formatDataAsArray";

type Transform = (leaf:UITreeViewBaseItemType) => Promise<UITreeViewBaseItemType>;

export const enrichRdfTree = async (
  options: {
    tree: UITreeViewBaseItemType[];
    service: CatalogService;
    triples: RDFTripleType[];
  }): Promise<UITreeViewBaseItemType[]> => {
    console.log('enrichRdfTree', new Set(options.triples.map(({ s }) => s.value)))

  


  const work: Transform = async (leaf) => {
    const tripleWithType = options.triples.find(
      (el) => el.p.value === RDF_TYPE_URI && el.s.value === leaf.id
    );
    if (tripleWithType === undefined) {
      console.error(`Could not find 
        el.p.value === ${RDF_TYPE_URI}
        && el.s.value === ${leaf.id}
        in
        ${formatDataAsArray(options.triples).join("\n")}
        `);
    }
    let type: DCATResourceType | undefined;
    try {
      type = DCATResourceSchema.parse(tripleWithType?.o.value);
    } catch (err) {
      console.error(
        `DCATResourceSchema failed to parse ${JSON.stringify(
          tripleWithType
        )}.o.type "${tripleWithType?.o.type}"`
      );
      console.error(`leaf: ${JSON.stringify(leaf, null, 2)}`);
      console.error(
        JSON.stringify(
          options.triples.filter((el) => el.p.value === RDF_TYPE_URI),
          null,
          2
        )
      );
      throw err;
    }
    const instance = tryInstantiate({
      service: options.service,
      id: leaf.id,
      type,
    });
    const titles = await instance.getDcTitle();
    if (titles.length > 1) {
      console.warn(
        `Data Catalogue frontend only supports 1 title, instead got ${
          titles.length
        }: ${titles.join(", ")}`
      );
    }
    return {
      ...leaf,
      label: titles[0],
    };
  };
  
  // Recursive function to traverse and transform each node
  const traverseAndTransform = async (node: UITreeViewBaseItemType): Promise<UITreeViewBaseItemType> => {
    // Apply work to the current node
    const transformedNode = await work(node);

    // Recursively apply to all children if they exist
    if (node.children && node.children.length > 0) {
      transformedNode.children = await Promise.all(node.children.map(async child => await traverseAndTransform(child)));
    }

    return transformedNode;
  };
  // Start the transformation from the root
  return Promise.all(options.tree.map(node => traverseAndTransform(node)));
};