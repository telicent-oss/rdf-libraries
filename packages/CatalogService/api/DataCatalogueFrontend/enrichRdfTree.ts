import { RDFTripleType } from "@telicent-oss/rdfservice/index";
import { DCATDataset, DCATDataService, DCATCatalog } from "../../index";
import { DATASET_URI, SERVICE_URI, CATALOG_URI, RDF_TYPE_URI, ResourceUriSchema, TreeViewItemType } from "./common";
import { CatalogService } from "../../index";
import { tryInstantiate } from "./tryInstantiate";

type Transform = (leaf:TreeViewItemType) => Promise<TreeViewItemType>;

export const enrichRdfTree = async (
  options: {
    tree: TreeViewItemType;
    service: CatalogService;
    triples: RDFTripleType[];
  }): Promise<TreeViewItemType> => {

  // TODO Can I move elsewhere
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };

  const work:Transform = async (leaf) => {

    const instance = tryInstantiate({
      UriToClass,
      service: options.service,
      id: leaf.id,
      type: ResourceUriSchema
        .parse(
          options
          .triples
          .find(
            el => 
              el.p.value === RDF_TYPE_URI 
              && el.s.value === leaf.id
          )!.o.value
        )
    })
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
      label: titles[0]
    }
  }
  
  // Recursive function to traverse and transform each node
  const traverseAndTransform = async (node: TreeViewItemType): Promise<TreeViewItemType> => {
    // Apply work to the current node
    const transformedNode = await work(node);

    // Recursively apply to all children if they exist
    if (node.children && node.children.length > 0) {
      transformedNode.children = await Promise.all(node.children.map(async child => await traverseAndTransform(child)));
    }

    return transformedNode;
  };

  // Start the transformation from the root
  return traverseAndTransform(options.tree);
};