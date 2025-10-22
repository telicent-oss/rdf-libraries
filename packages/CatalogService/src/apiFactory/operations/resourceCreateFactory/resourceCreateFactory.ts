import {
  createByPredicateFnFactory,
  RdfWriteApiClientType,
  updateByPredicateFnFactory,
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
import { COMMON_PREFIXES_MAP } from "../../../constants";
import { FieldError } from "../utils/fieldError";
import { normaliseOperationFailure } from "../utils/normaliseOperationFailure";
import { HACK_doNoOverwriteIdentiferIfExists } from "../utils/HACK_doNoOverwriteIdentiferIfExists";


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

const throwAsAlreadyExists = (uri: string, identifier: string) => {
  const fieldError: FieldError = {
    code: "dataset.uri.duplicate",
    summary: `Dataset uri "${uri}" is already in use`,
    context: { identifier, uri },
  };
  throw {
    errors: {
      identifier: [fieldError],
    },
  };
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
  const updateByPredicateFns = updateByPredicateFnFactory(options);
  const storeTripleAPI = { createByPredicateFns, updateByPredicateFns };
  /**
   *
   *
   * @returns
   */
  return async function resourceCreate(operation: ResourceCreateParamsType) {
    await HACK_doNoOverwriteIdentiferIfExists(catalogService, operation.payload);
    try {
      await validateResourceCreate({
        catalogService,
        operation,
      });
      // const identifier =
      //   operation.payload.identifier && operation.payload.identifier.trim();
      // if (!identifier) {
      //   throwWriteErrorForUri("identifier is required");
      // }

      const uriComponents = await createUriComponents({
        base: COMMON_PREFIXES_MAP["tcat-dataset"],
        postfix: POSTFIX_MAP[operation.type],
      }).catch(throwWriteErrorForUri);

      if (typeof uriComponents.uri !== "string") {
        throwWriteErrorForUri(`Expected to generate ${operation}`);
      }

      const ClassForType = catalogService.lookupClass(
        CLASS_MAP[operation.type],
        DCATResource
      ) as unknown as typeof DCATResource;
      
      console.log(`${uriComponents.uri}: ${catalogService.nodes[uriComponents.uri] ? 'ALREADY EXISTS' : ' does not exist'}`);
      const dcatResource = catalogService.nodes[uriComponents.uri]
        ? throwAsAlreadyExists(uriComponents.uri, uriComponents.localName)
        : await ClassForType.createAsync(
            catalogService,
            uriComponents.uri,
            operation.payload.title
          );

      return storeTripleResultsToValueObject({
        uri: dcatResource.uri, // Special case, created ahead of time
        uiFields: {
          classType: dcatResource.types[0], // dcatResource.types.includes(dcatResource.types[0]) ? undefined :
          ...operation.payload,
          identifier: uriComponents.localName,
        },
        instance: dcatResource,
        storeTriplesForOntology: storeTriplesForPhase2,
        api: storeTripleAPI,
        catalogService,
      });
    } catch (error) {
      throw normaliseOperationFailure(error, {
        code: "catalog.write.unknown",
        summary: "Failed to create dataset",
      });
    }
  };
};
