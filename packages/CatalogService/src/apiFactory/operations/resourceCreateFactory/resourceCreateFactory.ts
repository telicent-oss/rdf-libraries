import {
  createByPredicateFnFactory,
  RdfWriteApiClientType,
} from "@telicent-oss/rdf-write-lib";

import { CatalogService } from "../../../classes/RdfService.CatalogService";
import {
  StoreTriplesResult,
  storeTriplesForPhase2,
} from "../../../classes/RDFSResource.DCATResource/storeTriplesForPhase2";
import { DCATResource } from "../../../classes/RDFSResource.DCATResource";
import { storeTripleResultsToValueObject } from "../../../classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";

import { UIDataResourceType } from "../utils/common";
import { createUriComponents } from "../utils/createUriComponents";
import { throwWriteErrorForUri } from "../utils/throwWriteErrorForUri";
import { validateResourceCreate } from "./validateResourceCreate";

export type ResourceCreateParamsType = {
  type: "dataSet";
  payload: Partial<Omit<UIDataResourceType, "uri">>;
};

const CLASS_MAP: Record<
  ResourceCreateParamsType["type"],
  keyof typeof CatalogService.classLookup
> = {
  dataSet: CatalogService.dcatDataset,
};

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
 *
 * @returns
 */
export const resourceCreateFactory = ({
  catalogService,
  rdfWriteApiClient,
}: {
  catalogService: CatalogService;
  rdfWriteApiClient: RdfWriteApiClientType;
}) => {
  const options = { client: rdfWriteApiClient };
  const createByPredicateFns = createByPredicateFnFactory(options);
  const storeTripleAPI = { createByPredicateFns };
  /**
   *
   *
   * @returns
   */
  return async function resourceCreate(operation: ResourceCreateParamsType) {
    await validateResourceCreate({
      catalogService,
      operation,
    });
    const uriComponents = await createUriComponents({
      base: "http://telicent.io/catalog#",
      postfix: POSTFIX_MAP[operation.type],
    }).catch(throwWriteErrorForUri);

    if (typeof uriComponents.uri !== "string") {
      throwWriteErrorForUri(`Expected to generate ${operation}`);
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

    return storeTripleResultsToValueObject({
      uiFields: {
        classType: dcatResource.types[0], // dcatResource.types.includes(dcatResource.types[0]) ? undefined :
        identifier: `${uriComponents.uuid}${uriComponents.postfix}`,
        ...operation.payload,
      },
      instance: dcatResource,
      storeTriplesForOntology: storeTriplesForPhase2,
      api: storeTripleAPI,
    });
  };
};
