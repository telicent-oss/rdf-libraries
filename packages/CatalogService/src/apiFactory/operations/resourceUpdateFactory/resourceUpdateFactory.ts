import {
  updateByPredicateFnFactory,
  RdfWriteApiClientType,
  createByPredicateFnFactory,
} from "@telicent-oss/rdf-write-lib";

import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { DCATResource } from "../../../classes/RDFSResource.DCATResource";
import { storeTriplesForPhase2 } from "../../../classes/RDFSResource.DCATResource/storeTriplesForPhase2";
import { storeTripleResultsToValueObject } from "../../../classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";

import { UIDataResourceType } from "../utils/common";
import { throwWriteErrorForUri } from "../utils/throwWriteErrorForUri";

export type ResourceUpdateParamsType = {
  type: "dataSet";
  payload: Partial<UIDataResourceType>;
};

/**
 *
 *
 * @returns
 */
export const resourceUpdateFactory = ({
  catalogService,
  rdfWriteApiClient,
}: {
  catalogService: CatalogService;
  rdfWriteApiClient: RdfWriteApiClientType;
}) => {
  const options = { client: rdfWriteApiClient };
  const updateByPredicateFns = updateByPredicateFnFactory(options);
  const createByPredicateFns = createByPredicateFnFactory(options);
  const storeTripleApi = { updateByPredicateFns, createByPredicateFns };
  const throwWrongTypes = (item_uri: string) =>
    throwWriteErrorForUri(
      `Expected ${item_uri} to be DCATResource instance, instead got ${catalogService.nodes[item_uri]}`
    );
  /**
   *
   *
   * @returns
   */
  return async function resourceUpdate(operation: ResourceUpdateParamsType) {
    if (typeof operation.payload.uri !== "string") {
      throw new Error("Expected payload.uri to exist");
    }

    const item_uri = operation.payload.uri;
    const rdfsResource = catalogService.nodes[item_uri];
    const dcatResource =
      rdfsResource instanceof DCATResource
        ? (rdfsResource as DCATResource)
        : throwWrongTypes(item_uri);

    
    return storeTripleResultsToValueObject({
      uiFields: operation.payload,
      instance: dcatResource,
      storeTriplesForOntology: storeTriplesForPhase2,
      api: storeTripleApi,
    });
  };
};
