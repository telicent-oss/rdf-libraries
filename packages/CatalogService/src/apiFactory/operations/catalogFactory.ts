import {
  CatalogService,
} from "../../../index";
import { transformRdfToTree } from "./utils/transformRdfToTree";
import { enrichRdfTree } from "./utils/enrichRdfTree";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  UITreeViewBaseItemType,
  UISearchParamsType,
  getAllRDFTriples,
  RESOURCE_URI,
} from "./utils/common";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";
import { transformDataResourceFilters } from "./utils/transformDataResourceFilters";

export const catalogFactory = (service: CatalogService) => {
  return async function catalog(
    params: UISearchParamsType
  ): Promise<UITreeViewBaseItemType[]> {
    const { hasAccess } = transformDataResourceFilters(
      params.dataResourceFilters
    );

    const rdfTriples = await getAllRDFTriples({
      service, 
      // TODO! Fix hasAccess
      // ADD `hasAccess` to `getAllRDFTriples`
      // WHEN know priority
    });
    const triples = rdfTriples.results.bindings.map((el) =>
      RDFTripleSchema.parse(el)
    );

    const CONNECTIONS = [DATASET_URI, SERVICE_URI, CATALOG_URI];    
    const CONNECTIONS_REVERSE = [RESOURCE_URI];

    const tree = transformRdfToTree({
        triples,
        edgePredicate: (triple) => CONNECTIONS.includes(triple.p.value),
        reverseEdgePredicate: (triple) =>
          CONNECTIONS_REVERSE.includes(triple.p.value),
      });
    
    return [{
      id: 'all',
      label: 'All',
      children: await enrichRdfTree({ tree, service, triples })
    }];
  };
};
