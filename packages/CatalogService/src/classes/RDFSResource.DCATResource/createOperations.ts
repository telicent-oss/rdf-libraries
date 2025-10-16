import { PredicateFnOptionsBase } from "@telicent-oss/rdf-write-lib";
import { CreateByPredicateFn } from "../../../../rdf-write-lib/dist/createByPredicateFnFactory";
import { UpdateByPredicateFn } from "../../../../rdf-write-lib/dist/updateByPredicateFnFactory";
import { DCATResource } from "../RDFSResource.DCATResource";
import { createUri } from "./createUri";
import { StoreTripleCreate, StoreTripleUpdate } from "./storeTriplesForPhase2";
import { COMMON_PREFIXES_MAP } from "../../constants";

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
  | "qualifiedAttribution"
  | "qualifiedAttribution__agent"
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
const pushLiteralWithContext = (
  context: {
    operations: __Internal__StoreTripleOperation[];
    predicateFnOptionsBase: PredicateFnOptionsBase;
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
    checkObjectIsUniqueForPredicate?: boolean;
    checkSubjectExists?: boolean;
  }) {
    const { instance, property, operations, newValue } = context;
    const s = options.s || operations?.at(-1)?.triple.o || instance.uri; // back-one or start "root". This should REALLY be explict and not a default
    const p = options.p;
    const o = options.o || newValue; // passed value, else end "leaf"

    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: { s, p, o },
      checkObjectIsUniqueForPredicate: options.checkObjectIsUniqueForPredicate,
      // checkSubjectExists: options.checkSubjectExists,
      prev: instance[property] || null,
      onSuccess: () => {
        console.log(
          `instance[${property}] (${instance[property]}) = ${o}`,
          `${s} ${p} ${o}`
        );
        instance[property] = o;
      },
      property,
      ...context.predicateFnOptionsBase,
    });
  };

/**
 * Higher-order function
 *
 */
const pushUriWithContext = (
  context: {
    operations: __Internal__StoreTripleOperation[];
    predicateFnOptionsBase: PredicateFnOptionsBase;
  } & CreateOperationsOptions
) =>
  /**
   * function
   *
   */
  function postUri(options: {
    s?: Triple["s"];
    p: Triple["p"];
    // TODO union of param value objects for 2 methods for building uris
    // This (
    o?: Triple["o"];
    // ) and this (
    postfix?: string;
    newLocalName?: string;
    // ) should be mutually exclusive value objects
    property: GraphData;
    isObjectRequired?:boolean;
  }) {
    const { instance, property, operations } = {
      ...context,
      property: options?.property,
    };
    if (options.isObjectRequired && !instance[property]) {
      throw new Error(`expected ${property} to exist in instance, instead got ${instance[property]} (${instance.className} ${instance.uri})`)
    }
    const s = options.s || operations?.at(-1)?.triple.o || instance.uri; // back-one or start "root"
    const p = options.p;
    const o = options.o || instance[property] || createUri({ postfix: options.postfix || '' }); // existing value, else create
    const prev = instance[property] || null;

    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: { s, p, o },
      prev,
      onSuccess: () => {
        console.log(
          `instance[${property}] (${instance[property]}) = ${o}`,
          `${s} ${p} ${o}`
        );
        instance[property] = o;
      },
      property,
      ...context.predicateFnOptionsBase,
    });
  };

/**
 *
 *
 * Idea: Leverage Triples library to make exhaustive/complete type-safe operations
 */
export const createOperations = (options: CreateOperationsOptions) => {
  const predicateFnOptionsBase: PredicateFnOptionsBase = {
    dataset_uri: options.instance.uri,
    vocab: {
      mint_base: COMMON_PREFIXES_MAP.tcat,
      PROV_PREFIX: COMMON_PREFIXES_MAP.prov,
      XSD_DATETIME: `${COMMON_PREFIXES_MAP.xsd}dateTime`,
    },
  };
  const operations: __Internal__StoreTripleOperation[] = [];
  const pushLiteral = pushLiteralWithContext({
    operations,
    predicateFnOptionsBase,
    ...options,
  });
  const pushUri = pushUriWithContext({
    operations,
    predicateFnOptionsBase,
    ...options,
  });

  // prettier-ignore
  switch (options.property) {
      // Edge-case: very first written
      case "classType":
        // TODO improve. This solution is very much relying of the state of things TODAY.
        // WHY Today, due to a bug, 
        //  writing rdf:type is a more permitted operation than,
        //  writing dct:title
        //
        //  I don't suppose rdf:type should inherently be more permitted than dc:title. 
        //  Its more likely a fluke of the current paperback-writer bugs/implementation
        //  
        //  So this SHORT-TERM solution is to simply do rdf:type write after title write
        //  This binds them unnecessarily; but oh well.
        //
        //  Note: This code can't be relied to clean up triples, it it has user permission 
        // (which might be missing delete)
        //
        // HOW
        // Actual solution would create new endpoint to dryrun/probe creation
        //    or enable compound operations with rollback capability
        //
        // pushLiteral({                               p: "dct:title",                                   dryRun: true});
        // pushLiteral({                               p: "dct:title",                                   checkObjectIsUniqueForPredicate: true});
        // operations.push({                           p: 'rdf:type',
        //
        //
        //  NOTE
        //  The data contained within the ontology should include what is compound/mandatory and also drive FE validation
        // TODO improve - see above
        operations.push({
          type: "create" ,
          triple: {
            s: options.instance.uri,
            p: 'rdf:type',
            o: options.newValue,
          },
          onSuccess: () => {},
          ...predicateFnOptionsBase,
        });
        break;
      case "title":
        pushLiteral({                               p: "dct:title",                                   });
        break;
      case "identifier":
        pushLiteral({                               p:"dct:identifier"});
        break;
      case "description":
        pushLiteral({                               p:"dct:description"});
        break;
      case "publisher__title":
        pushUri({                                   p: "dct:publisher",                               property: "__publisher",                    postfix: "_Publisher" });
        pushLiteral({                               p: "dct:title"});
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
        pushUri({                                   p: "prov:qualifiedAttribution",                  property: "qualifiedAttribution",          postfix: "_DataOwnerAttribution" });
        pushUri({                                   p: "prov:agent",                                 property: "qualifiedAttribution__agent",   postfix: "_DataOwner" });
        pushLiteral({                               p:  "dct:title"});
        break;
      // Phase 2
      case "distribution":
        // FE sends distributionId; derive the fully qualified URI here to keep ontology wiring local.
        const distributionUri = `${COMMON_PREFIXES_MAP["tcat-distribution"]}${options.newValue}`
        pushUri({       s: options.instance.uri,    p: "dcat:distribution",               o: distributionUri,                 property: 'distribution',  });
        break;
      case "distribution__identifier":
      case "distribution__title":
      case "distribution__accessURL":
      case "distribution__mediaType": {
        pushUri({       s: options.instance.uri,    p: "dcat:distribution",                                                     property: 'distribution',  isObjectRequired: true});
        pushLiteral({                               p: "rdf:type",              o: "http://www.w3.org/ns/dcat#Distribution"})
        const p = 
          options.property === "distribution__identifier"   ? 'dct:identifier'
          : options.property === "distribution__title"      ? "dct:title"
          : options.property == 'distribution__accessURL'   ? "dcat:accessURL"
          : "dcat:mediaType";
        pushLiteral({s: operations.at(-2)?.triple.o,      p,                  o: options.newValue });
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
        console.warn(`Unsupported property ${options.property}`);
    }
    console.log(`Operations for ${options.property}`, operations);
  return operations;
};
