import { v4 as uuidv4 } from "uuid";
import { CreateByPredicateFn } from "../../../../rdf-write-lib/dist/createByPredicateFnFactory";
import { UpdateByPredicateFn } from "../../../../rdf-write-lib/dist/updateByPredicateFnFactory";
import { DCATResource } from "../RDFSResource.DCATResource";
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

// TODO use createUriComponents
const createUri = (postfix: string = "") =>
  `http://telicent.io/catalog#${uuidv4()}${postfix}`;

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

/**
 *
 *
 * Surely can be replaced with nmap or something
 */
export const createOperations = ({
  instance,
  property,
  newValue,
}: {
  instance: DCATResource;
  property: GraphData;
  newValue: string;
  api:
    | {
        createByPredicateFns: CreateByPredicateFn;
        updateByPredicateFns: UpdateByPredicateFn;
      }
    | {
        createByPredicateFns: CreateByPredicateFn;
      };
}) => {
  console.log({ property, newValue });
  const operations: __Internal__StoreTripleOperation[] = [];

  const pushLiteral = ({
    s = operations?.at(-1)?.triple.o || instance.uri,
    p,
    o = newValue,
  }: {
    s?: Triple["s"];
    p: Triple["p"];
    o?: Triple["o"];
  }) =>
    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: {
        s,
        p,
        o,
      },
      prev: instance[property] || null,
      onSuccess: () => (instance[property] = newValue),
    });

  const pushUri = (p: Triple["p"], property: GraphData, postfix?: string) =>
    operations.push({
      type: instance[property] === undefined ? "create" : "update",
      triple: {
        s: operations?.at(-1)?.triple.o || instance.uri,
        p,
        o: instance[property] || createUri(postfix),
      },
      prev: instance[property] || null,
      onSuccess: () => (instance[property] = newValue),
    });

  const pushUriForDistribution = () => {
    pushUri("dcat:distribution", "distribution", "_Distribution");
  };

  // prettier-ignore
  switch (property) {
      // Edge-case: Init only
      case "classType":
        operations.push({
          type: "create" ,
          triple: {
            s: instance.uri,
            p: 'rdf:type',
            o: newValue,
          },
          onSuccess: () => {},
        });
        break;
      case "title":
        pushLiteral({                               p: "dct:title"});
        break;
      case "identifier":
        pushLiteral({                               p:"dct:identifier"});
        break;
      case "description":
        pushLiteral({                               p:"dct:description"});
        break;
      case "publisher__title":
        pushUri(      "dct:publisher",              "__publisher",                      "_Publisher");
        pushLiteral({                               p:"dct:title"});
        break;
      case "contactPoint__fn":
        pushUri(      "dcat:contactPoint",          "__contactPoint",                   "_ContactPoint");
        pushLiteral({                               p:  "vcard:fn"});
        break;
      case "rights__description":
        pushUri(      "dct:rights",                 "__rights",                         "_DataHandlingPolicy");
        pushLiteral({                               p:  "dct:description"});
        break;
      case "accessRights":
        pushLiteral({                               p:  "dct:accessRights" as unknown as Triple['p']});
        break;
      case "qualifiedAttribution__agent__title":
        pushUri(      "prov:qualifiedAttribution", "__qualifiedAttribution",          "_DataOwnerAttribution");
        pushUri(      "prov:agent",                "__qualifiedAttribution__agent",   "_DataOwner");
        pushLiteral({                               p:  "dct:title"});
        break;
      // Phase 2
      case "distribution":
        pushLiteral({                               p:  "dcat:distribution"});
        break;
      case "distribution__identifier":
      case "distribution__title":
      case "distribution__accessURL":
      case "distribution__mediaType": {
        const p = property === "distribution__identifier"
            ? "dct:identifier"
            : property === "distribution__title"
            ? "dct:title"
            :property == 'distribution__accessURL'
            ? "dcat:accessURL"
            : "dcat:mediaType";
        pushUriForDistribution();
        pushLiteral({                                 p: "rdf:type",          o: "http://www.w3.org/ns/dcat#Distribution"})
        pushLiteral({s: operations.at(-2)?.triple.o,  p });
        break;
      }
      case "contributor__title":
        pushUriForDistribution();
        pushLiteral({p:  "dct:title"});
        break;
      case "min_issued":
        pushLiteral({p:  "dct:issued"});
        break;
      case "max_modified":
        pushLiteral({p:  "dct:modified"});
        break;
      // case '_type': // handled during creation only
      // case 'uri': // handled during creation only
      // case "distribution__available": // auto-generated
      default:
    }
  return operations;
};
