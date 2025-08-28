import { CreateByPredicateFn } from "../../../../rdf-write-lib/dist/createByPredicateFnFactory";
import { UpdateByPredicateFn } from "../../../../rdf-write-lib/dist/updateByPredicateFnFactory";
import { DCATResource } from "../RDFSResource.DCATResource";
import { createUri } from "./createUri";
import { StoreTripleCreate, StoreTripleUpdate } from "./storeTriplesForPhase2";

// TODO remove these "wordy" manually created types
// WHY
//    - Needed exhaustive type-checking, but due
//      how instance properties that represent
//      graph db data are placed on the "root"
//      of the instance - there was not clean
//      object for types. So I made (and surely remade)
//      "guidelines" types.
// HOW
//    - For all instance properties that map to graph db data,
//      move them to their own data structure.
//    - And allow exhaustive type-checking via `keyof`
// WHEN if we invest in this file. And sick of creating so many
//    manual types
//
export type GraphData =
  | "classType" // special case
  | "identifier"
  | "title"
  | "description"
  | "contactPoint__fn"
  | "publisher__title"
  | "rights__description"
  | "accessRights"
  | "qualifiedAttribution__agent__title"
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
  | "__contributor"
  | "__distribution__type";

export type StoreTripleOperation = StoreTripleUpdate | StoreTripleCreate;

export type Triple = StoreTripleOperation["triple"];



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

export type CreateOperationsOptions = {
  instance: DCATResource;
  property: GraphData;
  newValue: string;
  api: {
    createByPredicateFns: CreateByPredicateFn;
    updateByPredicateFns: UpdateByPredicateFn;
  };
};

/**
 * Higher-order function
 *
 */
const pushLiteralWithOperations = (
  context: {
    operations: __Internal__StoreTripleOperation[];
  } & CreateOperationsOptions
) =>
  /**
   * function
   *
   */
  function pushLiteral(options: {
    s?: Triple["s"];
    p: Triple["p"];
    o?: Triple["o"];
    checkUnique?: boolean;
  }) {
    const { instance, property, operations, newValue } = context;
    const s = options.s || operations?.at(-1)?.triple.o || instance.uri; // back-one or start "root"
    const p = options.p;
    const o = options.o || newValue; // passed value, else end "leaf"

    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: { s, p, o },
      checkUnique: options.checkUnique,
      prev: instance[property] || null,
      onSuccess: () => {
        console.log(
          `instance[${property}] (${instance[property]}) = ${newValue}`,
          `${s} ${p} ${o}`
        );
        instance[property] = o;
      },
      dataset_uri: instance.uri,
      property,
    });
  };

/**
 * Higher-order function
 *
 */
const pushUriWithOperations = (
  context: {
    operations: __Internal__StoreTripleOperation[];
  } & CreateOperationsOptions
) =>
  /**
   * function
   *
   */
  function postUri(options: {
    s?: Triple["s"];
    p: Triple["p"];
    property: GraphData;
    postfix: string;
    newLocalName?: string;
  }) {
    const { instance, property, operations } = {
      ...context,
      property: options?.property,
    };
    const s = options.s || operations?.at(-1)?.triple.o || instance.uri; // back-one or start "root"
    const p = options.p;
    const o = instance[property] || createUri({ postfix: options.postfix }); // existing value, else create
    const prev = instance[property] || null;

    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: { s, p, o },
      prev,
      onSuccess: () => {
        console.log(
          `instance[${property}] (${instance[property]}) = ${options.newLocalName}`,
          `${s} ${p} ${o}`
        );
        instance[property] = o;
      },
      dataset_uri: instance.uri,
      property,
    });
  };

/**
 *
 *
 * Surely can be replaced with nmap or something
 */
export const createOperations = (options: CreateOperationsOptions) => {
  console.log(`createOperations for ${options.instance.uri}`, options);
  const operations: __Internal__StoreTripleOperation[] = [];
  const pushLiteral = pushLiteralWithOperations({
    operations,
    ...options,
  });
  const pushUri = pushUriWithOperations({
    operations,
    ...options,
  });

  // prettier-ignore
  switch (options.property) {
      // Edge-case: very first written
      case "classType":
        operations.push({
          type: "create" ,
          triple: {
            s: options.instance.uri,
            p: 'rdf:type',
            o: options.newValue,
          },
          dataset_uri: options.instance.uri,
          onSuccess: () => {},
        });
        break;
      case "title":
        pushLiteral({                               p: "dct:title",                                   checkUnique: true});
        break;
      case "identifier":
        pushLiteral({                               p:"dct:identifier"});
        break;
      case "description":
        pushLiteral({                               p:"dct:description"});
        break;
      case "publisher__title":
        pushUri({                                   p: "dct:publisher",                               property: "__publisher",                    postfix: "_Publisher" });
        pushLiteral({                               p:"dct:title"});
        break;
      case "contactPoint__fn":
        pushUri({                                   p: "dcat:contactPoint",                           property: "__contactPoint",                 postfix: "_ContactPoint" });
        pushLiteral({                               p:  "vcard:fn"});
        break;
      case "rights__description":
        pushUri({                                   p: "dct:rights",                                  property: "__rights",                       postfix: "_DataHandlingPolicy" });
        pushLiteral({                               p:  "dct:description"});
        break;
      case "accessRights":
        pushLiteral({                               p:  "dct:accessRights" as unknown as Triple['p']});
        break;
      case "qualifiedAttribution__agent__title":
        pushUri({                                   p: "prov:qualifiedAttribution",                  property: "__qualifiedAttribution",          postfix: "_DataOwnerAttribution" });
        pushUri({                                   p: "prov:agent",                                 property: "__qualifiedAttribution__agent",   postfix: "_DataOwner" });
        pushLiteral({                               p:  "dct:title"});
        break;
      // Phase 2
      case "distribution":
        pushUri({  s: options.instance.uri,         p: "dcat:distribution",                      property: "distribution",                   postfix: "_Distribution" });
        break;
      case "distribution__identifier":
      case "distribution__title":
      case "distribution__accessURL":
      case "distribution__mediaType": {
        pushUri({ s: options.instance.uri,          p: "dcat:distribution",                       property: "distribution",                  postfix: "_Distribution" });
        pushLiteral({                               p: "rdf:type",              o: "http://www.w3.org/ns/dcat#Distribution"})
        const p = 
          options.property === "distribution__identifier"   ? 'dct:identifier'
          : options.property === "distribution__title"      ? "dct:title"
          : options.property == 'distribution__accessURL'   ? "dcat:accessURL"
          : "dcat:mediaType";
        const checkUnique = options.property === "distribution__identifier";
        pushLiteral({s: operations.at(-2)?.triple.o,      p,                checkUnique  });
        break;
      }
      case "min_issued":
        pushLiteral({                                     p: "dct:issued"});
        break;
      
      case "contributor__title":       // Handled by paperback:
        break;
      // case "max_modified":             // Handled by paperback:
      // case '_type':                    // Handled during creation only
      // case 'uri':                      // Handled during creation only
      // case "distribution__available":  // Handled by pipeline
      default:
        console.error(`Unsupported property ${options.property}`);
    }
  return operations;
};
