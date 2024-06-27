import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";
import { transformRdfToTree } from "./transformRdfToTree";
import { enrichRdfTree } from "./enrichRdfTree";
import maybeTriples from "../../__tests__/transformRdfToTree.test.mock";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  TreeViewBaseItemType,
  RDFResponse,
  ResourceSchema,
} from "./common";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";

export const catalogFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  // TODO!!! should really handle arrays of trees!!!
  return async function catalog(): Promise<TreeViewBaseItemType[]> {
    const res = await service.runQuery(`
        SELECT ?s ?p ?o 
        WHERE { ?s ?p ?o }
      `);
    const triples = RDFResponse.parse(res).results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const DATASET = "http://www.w3.org/ns/dcat#dataset";
    const SERVICE = "http://www.w3.org/ns/dcat#service";
    const CATALOG = "http://www.w3.org/ns/dcat#catalog";
    const CONNECTIONS = [DATASET, SERVICE, CATALOG];
    
    const RESOURCE = "http://www.w3.org/ns/dcat#resource";
    const CONNECTIONS_REVERSE = [RESOURCE];
    const tree = transformRdfToTree({
      triples,
      edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
      reverseEdgePredicate: (triple) => CONNECTIONS_REVERSE.includes(triple.p.value),
    });
    return [await enrichRdfTree({ tree, service, triples })];
  };
};
