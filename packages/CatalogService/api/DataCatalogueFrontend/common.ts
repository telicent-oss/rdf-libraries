import { z } from "zod";
import { RDFTripleSchema, RDFTripleType } from "@telicent-oss/rdfservice/index";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATDataService,
} from "../../index";
import { tryInstantiate } from "./tryInstantiate";
import { HumanError } from "../../utils/HumanError";
import { printJSON } from "./utils/printJSON";

// START COPY telicent-data-catalogue-frontend
// TODO name UIResource? UIDCATResource?
export const DataResourceSchema = z.object({
  title: z.string(),
  id: z.string(),
  description: z.string(),
  creator: z.string(),
  userHasAccess: z.boolean(),
  publishDate: z.string(),
  type: z.enum(["Catalog", "DataService", "Dataset"]),
});
export type DataResourceType = z.infer<typeof DataResourceSchema>;

export const DataResourceArraySchema = z.array(DataResourceSchema);
export type DataResourceArrayType = z.infer<typeof DataResourceArraySchema>;

export const SearchParamsSchema = z.object({
  dataResourceFilters: z.array(z.union([z.literal("all"), z.string()])),
  searchText: z.string(),
});
export type SearchParamsType = z.infer<typeof SearchParamsSchema>;

const TreeViewBaseItemSchema: z.ZodSchema<{
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
    children: z.array(TreeViewBaseItemSchema),
  })
);

export const TreeViewItemArraySchema = z.array(TreeViewBaseItemSchema);
// TODO export type TreeViewBaseItemType = z.infer<typeof TreeViewItemArraySchema>;
export type TreeViewBaseItemType = {
  id: string;
  label: string;
  children: TreeViewBaseItemType[];
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
export const RESOURCE_URI = "http://www.w3.org/ns/dcat#Resource";

export const DCATResourceSchema = z.union([
  z.literal(DATASET_URI),
  z.literal(SERVICE_URI),
  z.literal(CATALOG_URI),
]);

export type RESOURCE_URI_TYPE =
  | typeof DATASET_URI
  | typeof SERVICE_URI
  | typeof CATALOG_URI;

// TODO used for types only; Until work out odd minification behavior
const UriToClass = {
  [DATASET_URI]: DCATDataset,
  [SERVICE_URI]: DCATDataService,
  [CATALOG_URI]: DCATCatalog,
};
type UriToClassType = typeof UriToClass;

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

// TODO
const session = { user: { name: "James Hardacre" } };

export const getAllRDFTriples = async (options: {
  service: CatalogService;
  hasAccess?: boolean;
}) =>
  RDFResponse.parse(
    await options.service.runQuery(`
      SELECT ?s ?p ?o
      WHERE {
        ${options.hasAccess 
          // REQUIREMENTS 8.1 Search by user-owned data-resources
          ? `?s dct:rights "${session.user.name}" .` 
          : ""}
        ?s ?p ?o
      }`)
  );

export const getAllResourceTriples = async (options: {
  service: CatalogService;
  hasAccess?: boolean;
}) =>
  (await getAllRDFTriples(options)).results.bindings
    .filter(
      (el) =>
        ResourceSchema.safeParse(el).success 
      // || console.log(`removing ${printJSON(el)}`)
    )
    .map((el) => ResourceSchema.parse(el));

/**
 *
 * @param options
 * @returns
 */
export const instanceFromResourceFactory =
  (options: { UriToClass: UriToClassType; service: CatalogService }) =>
  /**
   *
   * @param el
   * @returns
   */
  (el: ResourceType) => {
    const { UriToClass, service } = options;
    const { s, p, o } = ResourceSchema.parse(el);
    try {
      const uri = DCATResourceSchema.parse(el.o.value);
      return tryInstantiate({
        UriToClass,
        type: uri,
        service,
        id: s.value,
      });
    } catch (err) {
      throw err instanceof Error
        ? new HumanError(
            `expected DCATResource in ${printJSON(el)}, ${err}`,
            err
          )
        : err;
    }
  };

/**
 *
 * @param options
 * @returns
 */
export const uiDataResourceFromInstance =
  /**
   *
   * @param el
   * @returns
   */
  async (el: DCATDataset | DCATDataService | DCATCatalog) => {
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
    const dcRights = (await el.getDcRights());
    if (dcRights?.length) {
      console.warn(
        `Data Catalogue frontend expects dcRights to exit, instead got ${
          dcRights
        }`
      );
    }
    const userHasAccess = dcRights.includes(session.user.name); // TODO mock

    const dcCreator = await el.getDcCreator();
    const dcPublished = await el.getDcPublished();
    // TODO Likley convert #ids to lowercase for frontend (if uris are case insensitive either in spec or in reality)
    return DataResourceSchema.parse({
      id: el.uri,
      title: dcTitle[0],
      description: dcDescription[0] || "",
      creator: dcCreator[0] || "Standard McDefaultFace",
      userHasAccess,
      publishDate: dcPublished[0] || "-",
      type: el.types[0].split("#")[1],
    });
  };

export const transformDataResourceFilters = (
  val: SearchParamsType["dataResourceFilters"]
) => {
  // TODO sync with frontend (currently copied from frontend)
  const OWNED_FACET = { id: "all-owned-datasets", label: "Owned" };
  // TODO! move Owned to its own field in url
  const hasAccess = val.includes(OWNED_FACET.label);
  const dataResourceFilter = val.filter((el) => el !== OWNED_FACET.label)?.[0];
  console.info("hasAccess", hasAccess);
  return { hasAccess, dataResourceFilter };
};
