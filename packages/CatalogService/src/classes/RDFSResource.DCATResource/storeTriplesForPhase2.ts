import {
  UpdateByPredicateFn,
  CreateByPredicateFn,
  UpdateTriple,
  PredicateFnOptionsBase,
} from "@telicent-oss/rdf-write-lib";

import { CatalogService, DCATResource } from "../../index";
import {
  createOperations,
  GraphData,
  StoreTripleOperation,
} from "./createOperations";
import { maybeGetNotUniqueError } from "./maybeGetNotUniqueError";
// import { COMMON_PREFIXES_MAP } from "../../constants";

type StoreTripleBase = {
  triple: UpdateTriple;
  property?: string;
  onSuccess: () => void;
  checkUnique?: boolean;
} & PredicateFnOptionsBase;
// TODO move to generic file
export type StoreTripleUpdate = StoreTripleBase & {
  type: "update";
  prev: string | null;
};

// TODO move to generic file
export type StoreTripleCreate = StoreTripleBase & {
  type: "create";
};

export type StoreTripleError = { error: string };
export type StoreTripleMessage = { message: string };

export type StoreTriplesResult =
  | StoreTripleOperation
  | StoreTripleError
  | StoreTripleMessage;

/**
 * Given:
 *  1. Ontology A -> B -> C -> <literal>
 *  2. TS class instance property that represents graph literal:
 *        a -> b -> c -> <literal>
 *  3. A new value for <literal>: "blah"
 *
 * Then:
 * 1. Graph operations:
 *    1. "Gap fill" Create missing triples leading to <literal>
 *    2. upsert the literal
 *    ```
 *    before: a -> b
 *    after:  a -> b -> c ->  "blah"
 *    ```
 * 2. store the new value in the instance's property
 *
 * TODO: Generalise; Split out:
 *  1. structural ontological data: Move to static DCATResource
 *  2. processing code and move to ancestor of RDFSResource
 * HOW: Create ontology concept (instance properties mapped to ontology predicates)
 * ```tsx
 * type Ontology = Record<property, predicate[]>;
 * ontology:Ontology = {
 *  title: [
 *    'dct:title'
 *  ],
 *  owner: [
 *    'prov:qualifiedAttribution',
 *    'prov:agent',
 *    'dct:title',
 *  ],
 * }
 *
 * ```
 */

export type StoreTripleForOntology = (options: {
  instance: DCATResource;
  property: GraphData;
  newValue: string;
  api: {
    createByPredicateFns: CreateByPredicateFn;
    updateByPredicateFns: UpdateByPredicateFn;
  };
  catalogService: CatalogService;
}) => Promise<StoreTriplesResult[]>;

/**
 *
 *
 * @returns
 */
export const storeTriplesForPhase2: StoreTripleForOntology = async ({
  instance,
  property,
  newValue,
  api,
  catalogService,
}) => {
  const asErrorValueObject = (error: unknown, meta: unknown) => ({
    details: `[${property}] ${error} ${JSON.stringify(meta)}`,
    error: `${error}`,
  });
  const asMessage = (str: string) => ({ message: `[${property}] ${str}` });

  const operations = createOperations({
    instance,
    property,
    newValue,
    api,
  });
  const results: StoreTriplesResult[] = [];
  let isErrorUpstream: boolean = false;
  for (const operation of operations) {
    const operationError = (error: unknown) =>
      asErrorValueObject(error, operation);
    try {
      const notUniqueError =
        "checkUnique" in operation &&
        operation.checkUnique &&
        (await maybeGetNotUniqueError(catalogService, operation));
      if (isErrorUpstream) {
        results.push(asMessage(`No-op, error isErrorUpstream `));
      } else if (notUniqueError) {
        console.log("notUniqueError!", notUniqueError, operation);
        results.push(operationError(notUniqueError));
        isErrorUpstream = true;
      } else if (operation.type === "update") {
        const updateFn = api.updateByPredicateFns[operation.triple.p];
        results.push(
          operation.prev === operation.triple.o
            ? asMessage("No-op, unchanged")
            : !updateFn
            ? operationError(`No updateFn for ${JSON.stringify(operation)}`)
            : await updateFn(operation).then(() => {
                if ("onSuccess" in operation) {
                  const { onSuccess, ...restUpdate } = operation;
                  onSuccess(); // call and remove onSuccess
                  return restUpdate as StoreTriplesResult;
                }
                return operation;
              })
        );
      } else if (operation.type === "create") {
        console.log("operation:: create", operation);
        // create
        const createFn = api.createByPredicateFns[operation.triple.p];
        results.push(
          !createFn
            ? operationError(`No createFn for ${JSON.stringify(operation)}`)
            : await createFn(operation).then(() => {
                if ("onSuccess" in operation) {
                  const { onSuccess, ...restUpdate } = operation;
                  onSuccess(); // call and remove onSuccess
                  return restUpdate as StoreTriplesResult;
                }
                return operation;
              })
        );
      }
    } catch (error) {
      if (typeof error === "object" && error !== null) {
        results.push(
          operationError(
            "message" in error && error?.message
              ? error?.message
              : "details" in error && error?.details
              ? error?.details
              : "detail" in error && error?.detail
              ? error?.detail
              : JSON.stringify(error)
          )
        );
      } else {
        results.push(operationError(`Error ${error}`));
      }
      isErrorUpstream = true;
    }
  }
  return results;
};
