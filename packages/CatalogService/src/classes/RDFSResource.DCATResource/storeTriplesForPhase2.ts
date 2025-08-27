import {
  UpdateByPredicateFn,
  CreateByPredicateFn,
  UpdateTriple,
  CreateTriple,
} from "@telicent-oss/rdf-write-lib";

import { CatalogService, DCATResource } from "../../index";
import {
  createOperations,
  GraphData,
  StoreTripleOperation,
} from "./createOperations";
import { builder } from "@telicent-oss/sparql-lib";
// import { COMMON_PREFIXES_MAP } from "../../constants";

// TODO move to generic file
export type StoreTripleUpdate = {
  triple: UpdateTriple;
  prev: string | null;
  onSuccess: () => void;
  type: "update";
  property?:string;
};

// TODO move to generic file
export type StoreTripleCreate = {
  type: "create";
  triple: CreateTriple;
  checkUnique?: boolean;
  onSuccess: () => void;
  property?:string;
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
  catalogService: CatalogService
}) => Promise<StoreTriplesResult[]>;




  const maybeGetNotUniqueError = async  (catalogService:CatalogService, operation:StoreTripleOperation): Promise<undefined | string> => {
    
    const result = await catalogService.runQuery(builder.catalog.askIfUniqueIdentifierOfType(operation.triple));
    if (result.boolean === true) {
      return undefined;
    }
    return `Value "${operation.triple.o}" already exists`;
  }

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
  catalogService
}) => {
  const asErrorValueObject = (error: unknown, meta: unknown) => ({
    details: `[${property}] ${error} ${JSON.stringify(meta)}`,
    error: `${error}`
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
      const notUniqueError = 'checkUnique' in operation && operation.checkUnique && await maybeGetNotUniqueError(catalogService, operation);
      if (isErrorUpstream) {
        results.push(asMessage(`No-op, error isErrorUpstream `));
      } else if (notUniqueError) {
        console.log('notUniqueError!', notUniqueError)
        results.push(operationError(notUniqueError));
        isErrorUpstream = true;
      } else if (operation.type === "update") {
        
        const updateFn = api.updateByPredicateFns[operation.triple.p];
        results.push(
          operation.prev === operation.triple.o
            ? asMessage("No-op, unchanged")
            : !updateFn
            ? operationError(`No updateFn for ${JSON.stringify(operation)}`)
            : await updateFn(operation).then((res) => {
                if ("onSuccess" in operation) {
                  const { onSuccess, ...restUpdate } = operation;
                  onSuccess(); // call and remove onSuccess
                  return restUpdate as StoreTriplesResult;
                }
                return operation;
              })
        );
      } else if (operation.type === "create") {
        // create
        const createFn = api.createByPredicateFns[operation.triple.p];
        results.push(
          !createFn
            ? operationError(`No createFn for ${JSON.stringify(operation)}`)
            : await createFn(operation).then((res) => {
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
      results.push(operationError(error));
      isErrorUpstream = true;
    }
  }
  return results;
};
