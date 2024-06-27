import { z } from "zod";
import { RDFTripleSchema } from "@telicent-oss/rdfservice/index";

// START COPY telicent-data-catalogue-frontend
export const SearchParamsSchema = z.object({
  dataResourceFilter: z.union([z.literal("all"), z.string()]), // TODO Array
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

const TreeViewBaseItemSchema: z.ZodSchema<{
  id: string;
  label: string;
  children?: Array<{
    id: string;
    label: string;
    children?: any[];
  }>;
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    children: z.array(TreeViewBaseItemSchema).optional(),
  })
);

export const TreeViewItemSchema = z.array(TreeViewBaseItemSchema);
// TODO export type TreeViewItemType = z.infer<typeof TreeViewItemSchema>;
export type TreeViewItemType = {
  id: string;
  label: string;
  children?: TreeViewItemType[];
};
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
export const RDF_TYPE_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// object or subject
export const DATASET_URI = "http://www.w3.org/ns/dcat#Dataset";
export const SERVICE_URI = "http://www.w3.org/ns/dcat#DataService";
export const CATALOG_URI = "http://www.w3.org/ns/dcat#Catalog";

export const ResourceUriSchema = z.union([
  z.literal(DATASET_URI),
  z.literal(SERVICE_URI),
  z.literal(CATALOG_URI),
]);

export type RESOURCE_URI =
  | typeof DATASET_URI
  | typeof SERVICE_URI
  | typeof CATALOG_URI;

export const createEntitySchema = (entityUri: RESOURCE_URI) =>
  RDFTripleSchema.refine(
    ({ o, p }) => o.value === entityUri && p.value === RDF_TYPE_URI,
    {
      message: `Expecting
      o.value: "${entityUri}"
      p.value: "${RDF_TYPE_URI}"`,
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

