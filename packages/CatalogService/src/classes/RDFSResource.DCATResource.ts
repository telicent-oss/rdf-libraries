import {
  SPARQLResultBinding,
  TypedNodeQuerySolution,
  RDFSResource,
  LongURI,
} from "@telicent-oss/rdfservice";
import {
  RESOURCE_URI,
  UIDataResourceType,
} from "../apiFactory/operations/utils/common";
import { CatalogService, DCATCatalog } from "../index";
import { RdfWriteApiByPredicateFn, Triple } from "@telicent-oss/rdf-write-lib";
import { v4 as uuidv4 } from "uuid";
export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
  // inherit uri: SPARQLResultBinding;
  // inherit _type?: SPARQLResultBinding;
  identifier: SPARQLResultBinding;
  title: SPARQLResultBinding;
  description?: SPARQLResultBinding;
  contactPoint?: SPARQLResultBinding;
  contactPoint__fn?: SPARQLResultBinding;
  publisher?: SPARQLResultBinding;
  publisher__title?: SPARQLResultBinding;
  rights?: SPARQLResultBinding;
  rights__description?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  qualifiedAttribution?: SPARQLResultBinding;
  qualifiedAttribution__agent__title?: SPARQLResultBinding;
  // DCAT Phase 2
  distribution?: SPARQLResultBinding;
  distribution__identifier?: SPARQLResultBinding;
  distribution__title?: SPARQLResultBinding;
  distribution__accessURL?: SPARQLResultBinding;
  distribution__mediaType?: SPARQLResultBinding;
  distribution__available?: SPARQLResultBinding;
  //
  contributor?: SPARQLResultBinding;
  contributor__title?: SPARQLResultBinding;
  min_issued?: SPARQLResultBinding;
  max_modified?: SPARQLResultBinding;
}

type ConstructorOptions = {
  service: CatalogService;
  uri?: string;
  title?: string;
  type: LongURI;
  catalog?: DCATCatalog;
  statement?: DcatResourceQuerySolution;
};

const warnWhenOptionsAndStatement = (
  options: ConstructorOptions,
  instance: DCATResource
) => {
  if (!options.statement?.title) {
    console.warn(
      `No title set for ${instance.uri} in query response ${JSON.stringify(
        options?.statement
      )}`
    );
  }
  if (options.uri || options.title) {
    const optionsStatementStr = JSON.stringify(options.statement, null, 2);
    console.warn(
      `Expect either properties (e.g. uri, title, etc)`,
      `or statement (${optionsStatementStr.slice(0, 40)}...)`,
      `But not both`
    );
  }
};

const errorWhenInvalidOptionsAndNotStatement = (
  options: ConstructorOptions
) => {
  if (options.uri == undefined) {
    throw new Error("uri must be provided for a new resource");
  }
  if (options.title == undefined) {
    throw new Error(
      `title must be provided for a new resource uri: ${options.uri}, type: ${options.type}`
    );
  }
};

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
  triple: Triple;
  prev: string | null;
  onSuccess: () => void;
};
export type StoreTriplesResult =
  | StoreTripleUpdate
  | { error: string }
  | { message: string };
export class DCATResource extends RDFSResource {
  className = "DCATResource";
  /**
   * The DCAT base class from which all the other classes inherit - a Resource published or curated by a single agent.
   * @param {CatalogService} service - the CatalogService being used
   * @param {DcatResourceQuerySolution} statement - SPARQL return binding - use this to initiate a DCATResource from a query response
   * @param {string} uri - the uri of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
   * @param {string} title - the title of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
   * @param {string} published - ISO8601 string for the publication (defaults to now)
   * @param {string} type - the type (class URI) of the object to create - NOT TO BE USED IN CONJUNCTION WITH binding parameter
   * @param {DCATCatalog} catalog - optional catalog this resource belongs to
   */
  dataResourceType?: LongURI;
  service: CatalogService;

  // GUIDANCE
  // Don't alias properties if you can help it
  // Extra transformation makes it it harder for the human
  // to map triples to UI

  // _type
  // uri
  identifier?: string;
  title: string = "-";
  description: string = "-";
  contactPoint__fn: string = "-";
  publisher__title: string = "-";
  rights__description: string = "-";
  accessRights: string = "-";
  qualifiedAttribution__agent__title: string = "-";
  owner: string = "-";
  // Phase 2
  distribution: string = "-";
  distribution__identifier: string = "-";
  distribution__title: string = "-";
  distribution__accessURL: string = "-";
  distribution__mediaType: string = "-";
  distribution__available: string = "-";
  contributor__title: string = "-";
  min_issued: string = "-";
  max_modified: string = "-";
  // Not directly used by UI, only by "API"
  __contactPoint?: string;
  __publisher?: string;
  __rights?: string;
  __qualifiedAttribution?: string;
  __qualifiedAttribution__agent?: string;
  __distribution?: string;
  __contributor?: string;

  // Promises created in service constructor
  constructor(
    // TODO Great candidate for well-typed params object
    // WHY: An "options" object namespaces/dis-ambiguates
    // NOTE: As interim create options object; As no-downstream impact
    optionService: CatalogService,
    optionUri?: string,
    optionTitle?: string,
    optionType: LongURI = "http://www.w3.org/ns/dcat#Resource",
    optionCatalog?: DCATCatalog,
    optionStatement?: DcatResourceQuerySolution
  ) {
    const options: ConstructorOptions = {
      service: optionService,
      uri: optionUri,
      title: optionTitle,
      type: optionType,
      catalog: optionCatalog,
      statement: optionStatement,
    };
    const cached = options.uri && options.service.inCache(options.uri);
    super(options.service, options.uri, options.type, options.statement);
    this.service = options.service;

    if (options.statement != undefined) {
      warnWhenOptionsAndStatement(options, this);
      this.update(options.statement, {
        defaults: {
          // !WARNING: Slightly different life-cycles
          // options  - will default to fresh type
          //          - (super() processes string and pushes split to types )
          // uri      - will default to pre-existing uri
          type: options.type,
          uri: this.uri,
        },
      });
    } else {
      if (cached) {
        return this;
      }

      errorWhenInvalidOptionsAndNotStatement(options);
      if (options.title && options.title != "") {
        this.constructorPromises.push(this.setTitle(options.title));
      }
      if (options.catalog) {
        this.constructorPromises.push(
          this.service.insertTriple(
            options.catalog.uri,
            `http://www.w3.org/ns/dcat#Resource`,
            this.uri
          )
        );
      }
    }
  }

  update(
    statement: DcatResourceQuerySolution,
    options: {
      defaults?: {
        uri?: string;
        type?: string;
      };
    } = {}
  ) {
    const {
      // _type
      uri,
      identifier,
      title,
      description,
      contactPoint__fn,
      publisher__title,
      rights__description,
      accessRights,
      qualifiedAttribution,
      qualifiedAttribution__agent__title,
      distribution,
      distribution__identifier,
      distribution__title,
      distribution__accessURL,
      distribution__mediaType,
      distribution__available,
      contributor__title,
      min_issued,
      max_modified,
      ...urisAndAliasedBindings
    } = statement;

    Object.assign(this, {
      // _type
      uri: uri?.value,
      identifier: identifier?.value,
      title: title?.value,
      description: description?.value,
      contactPoint__fn: contactPoint__fn?.value,
      publisher__title: publisher__title?.value,
      rights__description: rights__description?.value,
      accessRights: accessRights?.value,
      qualifiedAttribution: qualifiedAttribution?.value,
      qualifiedAttribution__agent__title:
        qualifiedAttribution__agent__title?.value,
      // Phase 2
      distribution: distribution?.value,
      distribution__identifier: distribution__identifier?.value,
      distribution__title: distribution__title?.value,
      distribution__accessURL: distribution__accessURL?.value,
      distribution__mediaType: distribution__mediaType?.value,
      distribution__available: distribution__available?.value,
      contributor__title: contributor__title?.value,
      min_issued: min_issued?.value,
      max_modified: max_modified?.value,
    });
    const { contactPoint, publisher, rights, contributor, ...aliasedBindings } =
      urisAndAliasedBindings;
    // used for build triples for writing
    this.__contactPoint = contactPoint?.value;
    this.__publisher = publisher?.value;
    this.__rights = rights?.value;
    this.__distribution = distribution?.value;
    this.__contributor = contributor?.value;

    // !DANGER !DANGER !DANGER
    // this.identifier = aliasedBindings.identifier
    //   ? aliasedBindings.identifier.value
    //   : options.defaults?.uri;
    // !REMOVED !REMOVED !REMOVED
    // Unsure why defaulting to different field.
    // If sparql assumes identifier exists in graph
    // Then serious bugs could occur.

    // IDEA Aliased as this is singular type for dcat
    // parent class can have multiple types (see this.types[])
    // perhaps this can be a getter?
    // IDEA: Probably type-narrow to 3 types
    this.dataResourceType = aliasedBindings._type
      ? aliasedBindings._type.value
      : options.defaults?.type;
  }
  toFindString() {
    return `${this.title} + ${this.description} + ${this.owner} + ${this.publisher__title} + ${this.contactPoint__fn} + ${this.identifier}`;
  }

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
  async storeTriples(
    property: GraphData,
    newValue: string,
    api: {
      updateByPredicateFns: RdfWriteApiByPredicateFn;
    }
  ): Promise<StoreTriplesResult[]> {
    const my = (property:GraphData) => this[property] === null || this[property] === undefined || this[property] === "-" ? "" : this[property]
    /** __Internal__StoreTripleUpdate is exactly the same
     * as StoreTripleUpdate. EXCEPT it includes an
     * onSuccess handler that is:
     * 1. called
     * 2. removed
     * If the write dispatch is successful
     */
    type __Internal__StoreTripleUpdate = {
      triple: Triple;
      prev: string | null;
      onSuccess: () => void;
    };

    const updates: __Internal__StoreTripleUpdate[] = [];

    const forProperty = (property: GraphData) => ({
      prev: my(property) || null,
      onSuccess: () => (this[property] = newValue),
    });

    const pushLiteral = (predicate: Triple["p"]) =>
      updates.push({
        triple: {
          s: updates?.length ? updates.at(-1)!.triple.o : this.uri,
          p: predicate,
          o: newValue,
        },
        ...forProperty(property),
      });

    const pushUri = (
      p: Triple["p"],
      property: GraphData,
      postfix: string = ""
    ) =>
      updates.push({
        triple: {
          s: updates?.length ? updates.at(-1)!.triple.o : this.uri,
          p,
          o: my(property) || `${uuidv4()}${postfix}`,
        },
        ...forProperty(property),
      });

    const pushUriForDistribution = () =>
      pushUri("dcat:distribution", "distribution", "_Distribution");

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
    for (const update of updates) {
      const updateError = (error: unknown) => asErrorValueObject(error, update);
      const updateFn = api.updateByPredicateFns[update.triple.p];
      try {
        console.log(
          "update.prev === update.o",
          update.prev === update.triple.o,
          update.prev,
          update.triple.o
        );
        results.push(
          update.prev === update.triple.o
            ? { message: "No-op, unchanged" }
            : !updateFn
            ? updateError(`No updateFn`)
            : await updateFn(update).then(() => {
                if ("onSuccess" in update) {
                  const { onSuccess, ...restUpdate } = update;
                  onSuccess(); // call and remove onSuccess
                  return restUpdate as StoreTriplesResult;
                }
                return update;
              })
        );
      } catch (error) {
        results.push(updateError(error));
      }
    }
    return results;
  }

  // IDEA make nested
  // PRO UI data-type makes semantic sense
  // CON Transform mid-callstack, harder to track
  // WHEN got bandwidth for downstream UI and type changes
  //
  async toUIRepresentation() {
    // const [modified, issued] = await Promise.all([
    //   await this.getDcModified(),
    //   await this.getDcIssued(),
    // ]);

    return {
      type: this.dataResourceType ?? RESOURCE_URI,
      uri: this.uri,
      identifier: this.identifier,
      title: this.title,
      description: this.description,
      contact: this.contactPoint__fn,
      creator: this.publisher__title,
      rights: this.rights__description,
      owner: this.qualifiedAttribution__agent__title,
      // Phase 2
      distributionUri: this.distribution,
      distributionIdentifier: this.distribution__identifier,
      distributionTitle: this.distribution__title,
      distributionURL: this.distribution__accessURL,
      distributionMediaType: this.distribution__mediaType,
      distributionAvailable: this.distribution__available,
      lastModifiedBy: this.contributor__title,
      publishDate: this.min_issued,
      modified: this.max_modified,
    } as Partial<UIDataResourceType>;
  }
}
