import { z } from "zod";
import {
  CatalogService,
  DCATCatalog,
  DCATDataService,
  DCATDataset,
} from "../../index";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";
import { HumanError } from "../..//utils/HumanError";

// START COPY telicent-data-catalogue-frontend
export const SearchParamsSchema = z.object({
  dataResourceFilter: z.union([z.literal("all"), z.string()]),
  searchText: z.string(),
});
export type SearchParamsType = z.infer<typeof SearchParamsSchema>;
export const DataResourceSchema = z.object({
  title: z.string(),
  id: z.string(),
  description: z.string(),
  type: z.enum(["Catalog", "DataService", "Dataset"]),
});
export type DataResourceType = z.infer<typeof DataResourceSchema>;
// END COPY

export const RDFResponse = z.object({
  head: z.object({
    vars: z.tuple([z.literal("s"), z.literal("p"), z.literal("o")]),
  }),
  results: z.object({
    bindings: z.array(RDFTripleSchema), // Assuming bindings can hold any structure
  }),
});

// predicate
const RDF_TYPE_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// object or subject
const DATASET_URI = "http://www.w3.org/ns/dcat#Dataset";
const SERVICE_URI = "http://www.w3.org/ns/dcat#DataService";
const CATALOG_URI = "http://www.w3.org/ns/dcat#Catalog";

const ResourceUriSchema = z.union([
  z.literal(DATASET_URI),
  z.literal(SERVICE_URI),
  z.literal(CATALOG_URI),
]);

type RESOURCE_URI =
  | typeof DATASET_URI
  | typeof SERVICE_URI
  | typeof CATALOG_URI;

const createEntitySchema = (entityUri: RESOURCE_URI) =>
  RDFTripleSchema.refine(
    ({ o, p }) => o.value === entityUri && p.value === RDF_TYPE_URI,
    {
      message: `Expecting
    o.value: "${entityUri}"
    p.value: "${RDF_TYPE_URI}"`,
    }
  );

const DatasetTripleSchema = createEntitySchema(DATASET_URI);
const ServiceTripleSchema = createEntitySchema(SERVICE_URI);
const CatalogTripleSchema = createEntitySchema(CATALOG_URI);

const ResourceSchema = z.union([
  DatasetTripleSchema,
  ServiceTripleSchema,
  CatalogTripleSchema,
]);
type ResourceType = z.infer<typeof ResourceSchema>;

type DCATResourceType =
  | typeof DCATDataset
  | typeof DCATDataService
  | typeof DCATCatalog;

export const searchFactory = (service: CatalogService) => {
  // TODO why must UriToClass be defined within searchFactory?
  const UriToClass = {
    [DATASET_URI]: DCATDataset,
    [SERVICE_URI]: DCATDataService,
    [CATALOG_URI]: DCATCatalog,
  };
  return async function search(params: SearchParamsType):Promise<Array<z.infer<typeof DataResourceSchema>>> {
    if (params.dataResourceFilter === "all") {
      const res = await service.runQuery(`
        SELECT ?s ?p ?o 
        WHERE { ?s ?p ?o }
      `);
      const resourceTriples: ResourceType[] = RDFResponse.parse(res)
        .results.bindings.filter((el) => ResourceSchema.safeParse(el).success)
        .map((el) => ResourceSchema.parse(el));

      const dcatInstances = resourceTriples
        .map((el) => {
          const { s, p, o } = ResourceSchema.parse(el);
          const uri = ResourceUriSchema.parse(el.o.value);

          const DCATClass = UriToClass[uri];
          if (DCATClass === undefined) {
            throw TypeError(`
              DCATClass is undefined:
                key: ${uri}, 
                keys: ${Object.keys(UriToClass)}
                values: ${Object.values(UriToClass)}
              `);
          }
          try {
            return new DCATClass(service, s.value);
          } catch (err) {
            throw err instanceof Error
              ? new HumanError(`new ${DCATClass}(s, ${s.value}) ${err}`, err)
              : err;
          }
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
            console.warn(`Data Catalogue frontend only supports 1 title, instead got ${dcTitle.length}: ${dcTitle.join(', ')}`);
          }

          const dcDescription = await el.getDcDescription();
          if (dcDescription.length > 1) {
            console.warn(`Data Catalogue frontend only supports 1 description, instead got ${dcDescription.length}: ${dcDescription.join(', ')}`);
          }
          // TODO Likley convert #ids to lowercase for frontend (if uris are case insensitive either in spec or in reality)
          return DataResourceSchema.parse({
            id: el.uri,
            title: dcTitle[0],
            description: dcDescription[0] || '',
            type: el.types[0].split("#")[1],
          });
        });
      return Promise.all(dcatInstances);
    }
    throw Error('Only all supported for now');
  };
};
