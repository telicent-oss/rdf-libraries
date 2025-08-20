import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { UIDataResourceType } from "../utils/common";
import {
  createByPredicateFnFactory,
  RdfWriteApiClientType,
} from "@telicent-oss/rdf-write-lib";

import { StoreTriplesResult, storeTriplesPhase2 } from "../../../classes/RDFSResource.DCATResource/storeTriplesPhase2";
import { DCATResource } from "../../../classes/RDFSResource.DCATResource";
import { createUriComponents } from "../utils/createUriComponents";
import { ZodError } from "zod/v4";

export type ResourceCreateParamsType = {
  type: "dataSet";
  payload: Partial<Omit<UIDataResourceType, "uri">>;
};

const CLASS_MAP: Record<
  ResourceCreateParamsType["type"],
  keyof typeof CatalogService.classLookup
> = {
  dataSet: CatalogService.dcatResource,
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
  // accessRights: "accessRights",
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

const POSTFIX_MAP: Record<ResourceCreateParamsType["type"], string> = {
  dataSet: "_Dataset",
} as const;

const throwAsAlreadyExists = (
  item_uri: string,
  catalogService: CatalogService
) => {
  throw new Error(
    `Expected ${item_uri} to not be instance of DCATResource. Instead this already exists ${catalogService.nodes[item_uri]}`
  );
};
export type ResourceCreateResults = Partial<
  Record<keyof UIDataResourceType, StoreTriplesResult[]>
>;

/**
 *
 * @param rdfWriteApiClient
 * @returns
 */
export const resourceCreateFactory = ({
  catalogService,
  rdfWriteApiClient,
}: {
  catalogService: CatalogService;
  rdfWriteApiClient: RdfWriteApiClientType;
}) => {
  return async function resourceCreate(operation: ResourceCreateParamsType) {
    const uriComponents = await createUriComponents({
      base: "http://telicent.io/catalog#",
      postfix: POSTFIX_MAP[operation.type],
    }).catch((error) => {
      if (error instanceof ZodError) {
        throw error.message;
      }
      throw { uri: `${error}` };
    });
    if (typeof uriComponents.uri !== "string") {
      throw { uri: "Expected to generate uri" };
    }

    const ClassForType = catalogService.lookupClass(
      CLASS_MAP[operation.type],
      DCATResource
    ) as unknown as typeof DCATResource;

    const dcatResource = catalogService.nodes[uriComponents.uri]
      ? throwAsAlreadyExists(uriComponents.uri, catalogService)
      : await ClassForType.createAsync(
          catalogService,
          uriComponents.uri,
          operation.payload.title
        );

    const createByPredicateFns = createByPredicateFnFactory({
      client: rdfWriteApiClient,
    });
    const uiFieldEntires = editableEntries(operation.payload);
    const results: ResourceCreateResults = {};
    for (const [uiField, uiFieldValue] of uiFieldEntires) {
      console.log(`Updating ${uiField} to ${uiFieldValue}`);
      const updateErrors = await storeTriplesPhase2(
        "create",
        dcatResource,
        UIToProperty[uiField],
        uiFieldValue,
        {
          createByPredicateFns,
        }
      );
      if (updateErrors?.length) {
        results[uiField] = updateErrors;
      }
    }
    if (Object.values(results).some((value) => value.length)) {
      throw results;
    }
    return results;
  };
};
