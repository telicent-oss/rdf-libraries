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
