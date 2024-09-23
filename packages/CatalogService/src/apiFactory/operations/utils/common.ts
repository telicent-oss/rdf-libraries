import { z } from "zod";
import { RDFTripleSchema, RDFTripleType } from "@telicent-oss/rdfservice/index";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "../../../../index";
import { session } from "../../../constants";
import { getValuesByBailey } from "./getValuesByBailey";
import { getValuesByCola } from "./getValuesByCola";
export const UIDataResourceSchema = z.object({
  title: z.string(),
  id: z.string(),
  description: z.string(),
  creator: z.string(),
  userHasAccess: z.boolean(),
  publishDate: z.string(),
  modified: z.string(),
  accessRights: z.string(),
  rights: z.string(),
  contactEmail: z.string(),
  type: z.enum(["Catalog", "DataService", "Dataset"]),
});
export type UIDataResourceType = z.infer<typeof UIDataResourceSchema>;

export const UIDataResourceArraySchema = z.array(UIDataResourceSchema);
export type UIDataResourceArrayType = z.infer<typeof UIDataResourceArraySchema>;

export const UISearchParamsSchema = z.object({
  dataResourceFilters: z.array(z.union([z.literal("all"), z.string()])),
  searchText: z.string(),
});
export type UISearchParamsType = z.infer<typeof UISearchParamsSchema>;

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

// predicate
export const RDF_TYPE_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// object or subject
export const DATASET_URI = "http://www.w3.org/ns/dcat#Dataset";
export const SERVICE_URI = "http://www.w3.org/ns/dcat#DataService";
export const CATALOG_URI = "http://www.w3.org/ns/dcat#Catalog";
export const RESOURCE_URI = "http://www.w3.org/ns/dcat#Resource";

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



export const getAllRDFTriples = async (options: {
  service: CatalogService;
  hasAccess?: boolean;
}) =>
  RDFResponseSchema.parse(
    await options.service.runQuery(`
      SELECT ?s ?p ?o
      WHERE {
        ${options.hasAccess 
          // REQUIREMENTS 8.1 Search by user-owned data-resources
          ? `?s dct:accessRights "${session.user.name}" .` 
          : ""}
        ?s ?p ?o
      }`)
  );

/**
 * Read UI data from the DCAT instances
 * @param options
 * @returns
 */
export const uiDataResourceFromInstanceWithTriples = (triples:RDFTripleType[]) =>
  /**
   *
   * @param el
   * @returns
   */
  async (el: DCATDataset | DCATDataService | DCATCatalog):Promise<UIDataResourceType> => {

    
    // Note: Renaming from spec-specific to spec-agnostic values
    // Rationale: For now, keeping spec concepts out of UI
    return UIDataResourceSchema.parse(
      el.service.interpretation ? await getValuesByCola(el, triples) : await getValuesByBailey(el));
  };

