import { CatalogService } from "packages/CatalogService/src/classes/RdfService.CatalogService";
import { UIDataResourceType } from "../utils/common";
import { RdfWriteApiClientType } from "@telicent-oss/rdf-write-lib";

type Endpoints = Parameters<RdfWriteApiClientType["POST"]>[0];

type UIKeys = keyof UIDataResourceType;

const asUIEntries = (payload: Partial<UIDataResourceType>) =>
  Object.entries(payload) as Array<
    // TODO type is bad
    [keyof UIDataResourceType, UIDataResourceType[keyof UIDataResourceType]]
  >;

export const UIDataResourceToEndpoint: Partial<Record<UIKeys, Endpoints>> = {
  title: "/dcterms/title",
  identifier: "/dcterms/identifier",
  description: "/dcterms/description",
  // creator: z.string(),
  // issued: z.string(),
  // modified: z.string(),
  // accessRights: z.string(),
  // rights: z.string(),
  // publisher__email: z.string(),
  // attributionAgentStr: z.string(),
  // type: z.enum([SERVICE_URI, DATASET_URI, CATALOG_URI, RESOURCE_URI]),
  // // Phase 2
  // distribution: z.string(),
  // distributionTitle: z.string(),
  // distributionDownloadURL: z.string(),
  // distributionMediaType: z.string(),
  // distributionIdentifier: z.string(),
};

const uiDataFieldToRDFWriteApiCall = (
  payload: Partial<UIDataResourceType>,
  rdfWriteApiClient: RdfWriteApiClientType,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catalogService: CatalogService
) => {
  const item_uri = payload.uri;
  if (typeof item_uri !== "string") {
    throw new Error("Expected payload.uri to exist");
  }
  // const item = catalogService.nodes[item_uri];
  return asUIEntries(payload)
    .map(([key, value]) => {
      const endpoint = UIDataResourceToEndpoint[key];
      switch (endpoint) {
        // https://github.com/Telicent-io/paperback-writer/blob/TPT-330-Catalog-Routes-fixes/paperback_writer/models.py#L138
        case "/dcterms/title":
          return rdfWriteApiClient.POST(endpoint, {
            body: {
              item_uri,
              title: value
            },
          });
        case "/dcterms/identifier":
          return rdfWriteApiClient.POST(endpoint, {
            body: {
              item_uri,
              identifier: value,
            },
          });
      }
      return { error: { description: `Not implemented: ${endpoint}` } };
    })
    .map(async (request) => {
      try {
        return await request;
      } catch (error) {
        return { error: { details: error } };
      }
    })
    .filter(Boolean);
};

// export type ResourceUpdateParamsType = {
//   catalogService: CatalogService;
//   rdfWriteApiClient: RdfWriteApiClientType;
// };
export type ResourceUpdateParamsType = {
  type: "dataSet";
  payload: Partial<UIDataResourceType>;
};

export type ResourceUpdateItem = Awaited<
  ReturnType<typeof uiDataFieldToRDFWriteApiCall>[number]
>;

/**
 *
 * @param rdfWriteApiClient
 * @returns
 */
export const resourceUpdateFactory = ({
  catalogService,
  rdfWriteApiClient,
}: {
  catalogService: CatalogService;
  rdfWriteApiClient: RdfWriteApiClientType;
}) =>
  async function resourceUpdate(
    operation: ResourceUpdateParamsType
  ): Promise<ResourceUpdateItem[]> {
    return Promise.all(
      uiDataFieldToRDFWriteApiCall(
        operation.payload,
        rdfWriteApiClient,
        catalogService
      )
    );
  };
