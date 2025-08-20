import { DCATResource } from "../../index";
import {
  UpdateByPredicateFn,
  CreateByPredicateFn,
  UpdateTriple,
  CreateTriple,
} from "@telicent-oss/rdf-write-lib";
import { v4 as uuidv4 } from "uuid";

const asErrorValueObject = (error: unknown, meta: unknown) => ({
  error: `${error} ${JSON.stringify(meta)}`,
});

// TODO remove this
// HOW move all graph data properties to their own data structure
//    And allow exhaustive type-checking
//
type GraphData =
  | "identifier"
  | "title"
  | "description"
  | "contactPoint__fn"
  | "publisher__title"
  | "rights__description"
  | "accessRights"
  | "qualifiedAttribution__agent__title"
  | "owner"
  | "distribution"
  | "distribution__identifier"
  | "distribution__title"
  | "distribution__accessURL"
  | "distribution__mediaType"
  | "distribution__available"
  | "contributor__title"
  | "min_issued"
  | "max_modified"
  | "__contactPoint"
  | "__publisher"
  | "__rights"
  | "__qualifiedAttribution"
  | "__qualifiedAttribution__agent"
  | "__distribution"
  | "__contributor";

export type StoreTripleUpdate = {
  type: "update";
  triple: UpdateTriple;
  prev: string | null;
  onSuccess: () => void;
};
export type StoreTripleCreate = {
  type: "create";
  triple: CreateTriple;
  onSuccess: () => void;
};

export type StoreTripleOperation = StoreTripleUpdate | StoreTripleCreate;

type Triple = StoreTripleOperation["triple"];

export type StoreTriplesResult =
  | StoreTripleOperation
  | { error: string }
  | { message: string };

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
 * TODO: Generalise; Split out
 *  - structural ontological data: Move to static DCATResource
 *  -  processing code and move to ancestor of RDFSResource
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
 * - maybe time to introduce
 * ```
 */
export const storeTriplesPhase2 = async (
  type: StoreTripleOperation["type"],
  instance: DCATResource,
  property: GraphData,
  newValue: string,
  api: {
    updateByPredicateFns: UpdateByPredicateFn;
  } | {
    createByPredicateFns: CreateByPredicateFn
  }
): Promise<StoreTriplesResult[]> => {
  if (type === "create" && !("createByPredicateFns" in api)) {
    throw new Error(
      `Expected calls with ${type} operations to have api.createByPredicateFns`
    );
  }
  if (type === "update" && !("updateByPredicateFns" in api)) {
    throw new Error(
      `Expected calls with ${type} operations to have api.updateByPredicateFns`
    );
  }
  
  const my = (property: GraphData) =>
    instance[property] === null ||
    instance[property] === undefined ||
    instance[property] === "-"
      ? ""
      : instance[property];
  /** __Internal__StoreTripleUpdate is exactly the same
   * as StoreTripleUpdate. EXCEPT it includes an
   * onSuccess handler that is:
   * 1. called
   * 2. removed
   * If the write dispatch is successful
   */
  type __Internal__StoreTripleUpdate = StoreTripleUpdate & {
    onSuccess: () => void;
  };
  type __Internal__StoreTripleCreate = StoreTripleCreate & {
    onSuccess: () => void;
  };
  type __Internal__StoreTripleOperation =
    | __Internal__StoreTripleUpdate
    | __Internal__StoreTripleCreate;

  const operations: __Internal__StoreTripleOperation[] = [];

  const forProperty = (property: GraphData) => ({
    type,
    prev: my(property) || null,
    onSuccess: () => (instance[property] = newValue),
  });

  const pushLiteral = (predicate: Triple["p"]) =>
    operations.push({
      triple: {
        s: operations?.length ? operations.at(-1)!.triple.o : instance.uri,
        p: predicate,
        o: newValue,
      },
      ...forProperty(property),
    });

  const pushUri = (p: Triple["p"], property: GraphData, postfix: string = "") =>
    operations.push({
      triple: {
        s: operations?.length ? operations.at(-1)!.triple.o : instance.uri,
        p,
        o: my(property) || `${uuidv4()}${postfix}`,
      },
      ...forProperty(property),
    });

  const pushUriForDistribution = () =>
    pushUri("dcat:distribution", "distribution", "_Distribution");

  console.log(`Building operations...`);
  // prettier-ignore
  switch (property) {
      case "title":
        pushLiteral(  "dct:title");
        break;
      case "identifier":
        pushLiteral(  "dct:identifier");
        break;
      case "description":
        pushLiteral(  "dct:description");
        break;
      case "publisher__title":
        pushUri(      "dct:publisher", "__publisher", "_Publisher");
        pushLiteral(  "dct:title");
        break;
      case "contactPoint__fn":
        pushUri(      "dcat:contactPoint", "__contactPoint", "_ContactPoint");
        pushLiteral(  "vcard:fn");
        break;
      case "rights__description":
        pushUri(      "dct:rights", "__rights", "_DataHandlingPolicy");
        pushLiteral(  "dct:description");
        break;
      case "accessRights":
        pushLiteral(  "dct:accessRights" as unknown as Triple['p']);
        break;
      case "owner":
        pushUri(      "prov:qualifiedAttribution", "__qualifiedAttribution", "_DataOwnerAttribution");
        pushUri(      "prov:agent",                "__qualifiedAttribution__agent","_DataOwner");
        pushLiteral(  "dct:title");
        break;
      // Phase 2
      case "distribution":
        pushLiteral(  "dcat:distribution");
        break;
      case "distribution__identifier":
        pushUriForDistribution();
        pushLiteral(  "dct:identifier");
        break;
      case "distribution__title":
        pushUriForDistribution();
        pushLiteral(  "dct:title");
        break;
      case "distribution__accessURL":
        pushUriForDistribution();
        pushLiteral(  "dcat:accessURL");
        break;
      case "distribution__mediaType":
        pushUriForDistribution();
        pushLiteral(  "dcat:mediaType");
        break;
      case "distribution__available":
        pushUriForDistribution();
        pushLiteral(  "dct:available" as unknown as Triple['p']);
        break;
      case "contributor__title":
        pushUriForDistribution();
        pushLiteral(  "dct:title");
        break;
      case "min_issued":
        pushLiteral(  "dct:issued");
        break;
      case "max_modified":
        pushLiteral(  "dct:modified");
        break;
      // case '_type':
      // case 'uri':
      default:
        console.log(`storeTriples(): UNSUPPORTED property "${property}`);
    }
  const results: StoreTriplesResult[] = [];
  console.log(`Getting results ${operations.length} operations...`, operations);
  for (const operation of operations) {
    console.log(`Do ${operation.type}:`, operation);
    const operationError = (error: unknown) =>
      asErrorValueObject(error, operation);
    try {
      if (operation.type === "update" && 'updateByPredicateFns' in api) {
        const updateFn = api.updateByPredicateFns[operation.triple.p];
        results.push(
          operation.prev === operation.triple.o
          ? { message: "No-op, unchanged" }
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
      } else if ('createByPredicateFns' in api) {
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
      results.push(operationError(error));
    }
  }
  console.log(`${results.length} results:`, results);

  return results;
};
