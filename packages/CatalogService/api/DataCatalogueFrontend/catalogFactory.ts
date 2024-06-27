import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";
import { transformRdfToTree } from "./transformRdfToTree";
import { enrichRdfTree } from "./enrichRdfTree";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  TreeViewItemType,
  RDFResponse,
  ResourceSchema,
} from "./common";

export const catalogFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  // TODO!!! should really handle arrays of trees!!!
  return async function catalog(): Promise<TreeViewItemType> {
    const res = await service.runQuery(`
        SELECT ?s ?p ?o 
        WHERE { ?s ?p ?o }
      `);
    const triples = RDFResponse.parse(res)
      .results.bindings.filter((el) => ResourceSchema.safeParse(el).success)
      .map((el) => ResourceSchema.parse(el));

    const CONNECTIONS = [DATASET_URI, SERVICE_URI, CATALOG_URI];
    const tree = transformRdfToTree({
      triples,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
    });

    return enrichRdfTree({ tree, service, triples });
  };
};
