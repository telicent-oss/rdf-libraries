import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { UIDataResourceType } from "../utils/common";
import {
  updateByPredicateFnFactory,
  RdfWriteApiClientType,
} from "@telicent-oss/rdf-write-lib";
import {
  DCATResource,
  StoreTriplesResult,
} from "../../../classes/RDFSResource.DCATResource";
import { RDFSResource } from "@telicent-oss/rdfservice";

export type ResourceUpdateParamsType = {
  type: "dataSet";
  payload: Partial<UIDataResourceType>;
};

// !TODO
// const convertToDcatResourceQuerySolution = (val: unknown) =>
//   val as DcatResourceQuerySolution;
// type StringKeys<T> = {
//   [K in keyof T]-?: T[K] extends string ? K : never
// }[keyof T];
type StringOrUndefinedKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T];

const UIToProperty = {
  identifier: "identifier",
  title: "title",
  description: "description",
  contact: "contactPoint__fn",
  creator: "publisher__title",
  rights: "rights__description",
  accessRights: "accessRights",
  owner: "qualifiedAttribution__agent__title",
  distributionUri: "distribution",
  distributionIdentifier: "distribution__identifier",
  distributionTitle: "distribution__title",
  distributionURL: "distribution__accessURL",
  distributionMediaType: "distribution__mediaType",
  distributionAvailable: "distribution__available",
  lastModifiedBy: "contributor__title",
  publishDate: "min_issued",
  modified: "max_modified",
} as const satisfies Partial<
  Record<keyof UIDataResourceType, StringOrUndefinedKeys<DCATResource>>
>;

type EditableField = keyof typeof UIToProperty;

function editableEntries(
  payload: Partial<UIDataResourceType>
): Array<[EditableField, UIDataResourceType[EditableField]]> {
  return (
    Object.entries(payload) as Array<[keyof UIDataResourceType, unknown]>
  ).filter(
    (e): e is [EditableField, UIDataResourceType[EditableField]] =>
      e[0] in UIToProperty
  );
}

const throwAsMatchedInstanceWrongTypes = (
  item_uri: string,
  catalogService: CatalogService
) => {
  console.log("catalogService", catalogService.dataResources);
  throw new Error(
    `Expected ${item_uri} to be instance of DCATResource. Instead got ${catalogService.nodes[item_uri]}`
  );
};
export type ResourceUpdateResults = Partial<
  Record<keyof UIDataResourceType, StoreTriplesResult[]>
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
}) => {
  return async function resourceUpdate(operation: ResourceUpdateParamsType) {
    if (typeof operation.payload.uri !== "string") {
      throw new Error("Expected payload.uri to exist");
    }

    const item_uri = operation.payload.uri;
    const rdfsResource = catalogService.nodes[item_uri];
    const dcatResource =
      rdfsResource instanceof DCATResource
        ? (rdfsResource as DCATResource)
        : throwAsMatchedInstanceWrongTypes(item_uri, catalogService);

    const updateByPredicateFns = updateByPredicateFnFactory({
      client: rdfWriteApiClient,
    });
    const uiFieldEntires = editableEntries(operation.payload);
    const results: ResourceUpdateResults = {};
    for (const [uiField, uiFieldValue] of uiFieldEntires) {
      const updateErrors = await dcatResource.storeTriples(
        UIToProperty[uiField],
        uiFieldValue,
        {
          updateByPredicateFns,
        }
      );
      if (updateErrors?.length) {
        results[uiField] = updateErrors;
      }
    }
    console.log({ results });
    if (Object.values(results).some((value) => value.length)) {
      throw results;
    }
    return results;
  };
};
