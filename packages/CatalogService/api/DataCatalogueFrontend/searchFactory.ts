import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";

import { SearchParamsType } from "../DataCatalogueFrontend";
import {
  DATASET_URI,
  SERVICE_URI,
  CATALOG_URI,
  DataResourceSchema,
  RDFResponse,
  ResourceSchema,
  ResourceType,
} from "./common";
import { ResourceUriSchema } from "./common";
import { tryInstantiate } from "./tryInstantiate";

export const searchFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  return async function search(
    params: SearchParamsType
  ): Promise<Array<z.infer<typeof DataResourceSchema>>> {
    if (params.dataResourceFilter === "all") {
      const res = await service.runQuery(`
        SELECT ?s ?p ?o 
        WHERE { ?s ?p ?o }
      `);
      // TODO!?! fix ResourceType[] type below
      const resourceTriples: ResourceType[] = RDFResponse.parse(res)
        .results.bindings.filter((el) => ResourceSchema.safeParse(el).success)
        .map((el) => ResourceSchema.parse(el));

      const dcatInstances = resourceTriples
        .map((el) => {
          const { s, p, o } = ResourceSchema.parse(el);
          const uri = ResourceUriSchema.parse(el.o.value);

          return tryInstantiate({
            UriToClass,
            type: uri,
            service,
            id: s.value,
          });
        })
        .map(async (el) => {
          // TODO More validation ceremony for (sometimes stricter) frontend v.s. RDF/schema specs
          if (el.types.length !== 1) {
            throw new TypeError(
              `Expected types.length of ${el.uri} to be 1, instead got ${
                el.types.length
              }:${el.types.join(", ")})`
            );
          }

          const dcTitle = await el.getDcTitle();
          if (dcTitle.length > 1) {
            console.warn(
              `Data Catalogue frontend only supports 1 title, instead got ${
                dcTitle.length
              }: ${dcTitle.join(", ")}`
            );
          }

          const dcDescription = await el.getDcDescription();
          if (dcDescription.length > 1) {
            console.warn(
              `Data Catalogue frontend only supports 1 description, instead got ${
                dcDescription.length
              }: ${dcDescription.join(", ")}`
            );
          }
          // TODO Likley convert #ids to lowercase for frontend (if uris are case insensitive either in spec or in reality)
          return DataResourceSchema.parse({
            id: el.uri,
            title: dcTitle[0],
            description: dcDescription[0] || "",
            type: el.types[0].split("#")[1],
          });
        });
      return Promise.all(dcatInstances);
    }
    throw Error(
      `Only dataResourceFilter: "all" supported for now, instead got: "${params.dataResourceFilter}" `
    );
  };
};
