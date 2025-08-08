import { z } from "zod";
import {
  RDFTripleSchema,
  RDFTripleType,
  TripleObjectSchema,
} from "@telicent-oss/rdfservice";
import { CatalogService, DCATResource } from "../../../index";

// predicate
export const RDF_TYPE_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// object or subject
export const DATASET_URI: string = "http://www.w3.org/ns/dcat#Dataset";
export const SERVICE_URI: string = "http://www.w3.org/ns/dcat#DataService";
export const CATALOG_URI: string = "http://www.w3.org/ns/dcat#Catalog";
export const RESOURCE_URI: string = "http://www.w3.org/ns/dcat#Resource";

// hierarchy relationship
export const DATASET_PROP_URI = "http://www.w3.org/ns/dcat#dataset";
export const SERVICE_PROP_URI = "http://www.w3.org/ns/dcat#service";
export const CATALOG_PROP_URI = "http://www.w3.org/ns/dcat#catalog";
export const SERVES_PROP_URI = "http://www.w3.org/ns/dcat#servesDataset";

export const UIDataResourceSchema = z.object({
  title: z.string(),
  id: z.string(),
  description: z.string(),
  creator: z.string(),
  publishDate: z.string(),
  modified: z.string(),
  accessRights: z.string(),
  rights: z.string(),
  contactEmail: z.string(),
  attributionAgentStr: z.string(),
  type: z.enum([SERVICE_URI, DATASET_URI, CATALOG_URI, RESOURCE_URI]),
  // Phase 2
  distributionUri: z.string(),
  distributionTitle: z.string(),
  distributionDownloadURL: z.string(),
  distributionMediaType: z.string(),
  distributionIdentifier: z.string(),
});
export type UIDataResourceType = z.infer<typeof UIDataResourceSchema>;

export const UIDataResourceArraySchema = z.array(UIDataResourceSchema);
export type UIDataResourceArrayType = z.infer<typeof UIDataResourceArraySchema>;

export const UISearchParamsSchema = z.object({
  dataResourceFilters: z.array(z.union([z.literal("all"), z.string()])),
  searchText: z.string(),
});
export type UISearchParamsType = z.infer<typeof UISearchParamsSchema>;
export const UISearchContextSchema = z.object({
  ownerEmail: z.string().optional(),
});
export type UISearchContextType = z.infer<typeof UISearchContextSchema>;

const UITreeViewBaseItemSchema: z.ZodSchema<{
  id: string;
  label: string;
  children: Array<{
    id: string;
    label: string;
    children: any[];
  }>;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    children: z.array(UITreeViewBaseItemSchema),
  })
);

export const UITreeViewItemArraySchema = z.array(UITreeViewBaseItemSchema);

export type UITreeViewBaseItemType = {
  id: string;
  label: string;
  children: UITreeViewBaseItemType[];
};

export const RDFResponseSchema = z.object({
  head: z.object({
    vars: z.tuple([z.literal("s"), z.literal("p"), z.literal("o")]),
  }),
  results: z.object({
    bindings: z.array(RDFTripleSchema), // Assuming bindings can hold any structure
  }),
});

export type ResourceQueryType = {
  s: z.infer<typeof TripleObjectSchema>;
  p: z.infer<typeof TripleObjectSchema>;
  o: z.infer<typeof TripleObjectSchema>;
  relationship?: z.infer<typeof TripleObjectSchema>;
  partner?: z.infer<typeof TripleObjectSchema>;
  resourceTitle?: z.infer<typeof TripleObjectSchema>;
};
// Schema for other result
export const ResourceQuerySchema = z.object({
  o: TripleObjectSchema,
  p: TripleObjectSchema,
  s: TripleObjectSchema,
  relationship: z.optional(TripleObjectSchema),
  partner: z.optional(TripleObjectSchema),
  resourceTitle: z.optional(TripleObjectSchema),
});

export const ResourceDetailResponseSchema = z.object({
  head: z.object({
    vars: z.tuple([
      z.literal("s"),

      z.literal("p"),
      z.literal("o"),
      z.literal("relationship"),
      z.literal("partner"),
      z.literal("resourceTitle"),
    ]),
  }),
  results: z.object({
    bindings: z.array(ResourceQuerySchema), // Assuming bindings can hold any structure
  }),
});

export const DCATResourceSchema = z.union([
  z.literal(DATASET_URI),
  z.literal(SERVICE_URI),
  z.literal(CATALOG_URI),
]);

export type DCATResourceType = z.infer<typeof DCATResourceSchema>;

export type RESOURCE_URI_TYPE =
  | typeof DATASET_URI
  | typeof SERVICE_URI
  | typeof CATALOG_URI;

/**
 *
 * @param entityUri
 * @returns
 */
export const typeStatementMatcherWithId =
  (id: string) =>
  /**
   *
   * @param rdfTriple
   * @returns
   */
  ({ s, p }: RDFTripleType) =>
    s.value === id && p.value === RDF_TYPE_URI;

export const dataResourceObjByURI =
  (findUri: string) =>
  ({ uri }: DCATResource) =>
    findUri === uri;

export const createEntitySchema = (entityUri: RESOURCE_URI_TYPE) =>
  RDFTripleSchema.refine(
    ({ o, p }) => o.value === entityUri && p.value === RDF_TYPE_URI,
    {
      message: `Expecting o.value "${entityUri}" p.value: "${RDF_TYPE_URI}"`,
    }
  );

export const DatasetTripleSchema = createEntitySchema(DATASET_URI);
export const ServiceTripleSchema = createEntitySchema(SERVICE_URI);
export const CatalogTripleSchema = createEntitySchema(CATALOG_URI);

export const ResourceSchema = z.union([
  DatasetTripleSchema,
  ServiceTripleSchema,
  CatalogTripleSchema,
]);

export type ResourceType = z.infer<typeof ResourceSchema>;

export const getAllResourcesWithDetails = async (options: {
  service: CatalogService;
}) =>
  ResourceDetailResponseSchema.parse(
    await options.service.runQuery(`
      SELECT ?s  ?p ?o ?relationship ?partner ?resourceTitle WHERE {
        {
          SELECT ?s ?p ?o  WHERE {
            {
              SELECT ?s (<${RDF_TYPE_URI}> AS ?p) (<${DATASET_URI}> AS ?o) WHERE {
                ?s <${RDF_TYPE_URI}> <${DATASET_URI}> .
              }
            } UNION {
              SELECT ?s (<${RDF_TYPE_URI}> AS ?p) (<${SERVICE_URI}> AS ?o) WHERE {
                ?s <${RDF_TYPE_URI}> <${SERVICE_URI}>  .
              }
            } UNION {
              SELECT ?s (<${RDF_TYPE_URI}> AS ?p) (<${CATALOG_URI}> AS ?o) WHERE {
                ?s <${RDF_TYPE_URI}> <${CATALOG_URI}> .
              }
            }
          }
        }
        OPTIONAL {
          ?s ?relationship ?partner .
          FILTER(?relationship in (<${DATASET_PROP_URI}>, <${SERVICE_PROP_URI}>, <${CATALOG_PROP_URI}>))
        }
        OPTIONAL {
          ?s dct:title ?resourceTitle .
        }
      }
    `)
  );
