import {
  SPARQLResultBinding,
  TypedNodeQuerySolution,
  RDFSResource,
  LongURI,
} from "@telicent-oss/rdfservice";
import { RESOURCE_URI, UIDataResourceType } from "../apiFactory/operations/utils/common";
import { getHashOrLastUrlSegment } from "../utils/getHashOrLastUrlSegment/getHashOrLastUrlSegment";
import { CatalogService, DCATCatalog } from "../index";

export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
  identifier: SPARQLResultBinding;
  title: SPARQLResultBinding;
  // title

  description?: SPARQLResultBinding;
  publisher__name?: SPARQLResultBinding;
  publisher__email?: SPARQLResultBinding;
  rights__description?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  owner?: SPARQLResultBinding;
  qualifiedAttribution__agent?: SPARQLResultBinding;
  qualifiedAttribution__hadRole?: SPARQLResultBinding;
  // DCAT Phase 2
  distribution?: SPARQLResultBinding;
  distribution__title?: SPARQLResultBinding;
  distribution__downloadURL?: SPARQLResultBinding;
  distribution__mediaType?: SPARQLResultBinding;
  distribution__identifier?: SPARQLResultBinding;
}

type DCATStringProps =
  | "distribution"
  | "distribution__title"
  | "distribution__downloadURL"
  | "distribution__mediaType"
  | "distribution__identifier"
  | "qualifiedAttribution__agent";

interface Mapping {
  binding: keyof DcatResourceQuerySolution;
  property: DCATStringProps;
  transform?: (value: string) => string;
}

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
  //  to map triples to UI
  identifier?: string;
  // uri
  title: string = "-";
  description: string = "-";
  publisher__email: string = "-";
  publisher__name: string = "-";
  rights__description: string = "-";
  owner: string = "-";
  // _type
  qualifiedAttribution: string = "-";
  qualifiedAttribution__agent: string = "-";
  qualifiedAttribution__hadRole: string = "-";
  accessRights: string = "-";
  // Phase 2
  distribution: string = "-";
  distribution__title: string = "-";
  distribution__downloadURL: string = "-";
  distribution__mediaType: string = "-";
  distribution__identifier: string = "-";
  // Promises created in service constructor
  // TODO Great candidate for well-typed params object
  constructor(
    service: CatalogService,
    uri?: string,
    title?: string,
    type: LongURI = "http://www.w3.org/ns/dcat#Resource",
    catalog?: DCATCatalog,
    statement?: DcatResourceQuerySolution
  ) {
    let cached = false;
    if (uri) {
      cached = service.inCache(uri);
    }
    super(service, uri, type, statement);
    this.service = service;
    if (statement != undefined) {
      this.uri = statement.uri.value;
      if (!statement.title) {
        console.warn(`No title set for ${this.uri} in query response`);
      }
      if (statement?.title) {
        this.title = statement?.title.value;
      }
      if (statement?.identifier) {
        this.identifier = statement?.identifier.value;
      } else {
        this.identifier = this.uri;
      }
      if (statement?.description) {
        this.description = statement?.description.value;
      }
      if (statement?.publisher__email) {
        const email = statement?.publisher__email.value;
        this.publisher__email = email.substring(email.lastIndexOf("/") + 1);
      }
      if (statement?.publisher__name) {
        this.publisher__name = statement?.publisher__name.value;
      }
      if (statement?.rights__description) {
        this.rights__description = statement?.rights__description.value;
      }
      if (statement?.accessRights) {
        this.accessRights = statement?.accessRights.value;
      }
      if (statement?.owner) {
        this.owner = statement?.owner.value;
      }
      if (statement?.qualifiedAttribution__agent) {
        let formatted = getHashOrLastUrlSegment(
          statement?.qualifiedAttribution__agent.value
        );
        if (formatted) {
          /**
           * This uri value is intentionally combining multiple values.
           * "_Publisher" is not relevant so we can remove it
           * @see "src/main/java/io/telicent/datacatalog/dcat3/Provenance.java"
           */
          formatted = formatted.replace(/_Publisher$/, "");
        }
        this.qualifiedAttribution__agent =
          formatted || this.qualifiedAttribution__agent;
      }
      if (statement?.qualifiedAttribution__hadRole) {
        this.qualifiedAttribution__agent =
          statement?.qualifiedAttribution__hadRole.value;
      }
      if (statement?._type) {
        this.dataResourceType = statement?._type.value;
      } else {
        this.dataResourceType = type;
      }

      if (uri || title) {
        console.warn(
          `individual parameters such as uri, title, etc. should not be set if the statement parameter is set: ${JSON.stringify(
            statement,
            null,
            2
          )}`
        );
      }
      // Phase 2
      // prettier-ignore
      const mappings: Mapping[] = [
        {
          binding: "distribution",
          property: "distribution" 
        },
        {
          binding: "distribution__title",
          property: "distribution__title" },
        {
          binding: "distribution__downloadURL",
          property: "distribution__downloadURL",
        },
        {
          binding: "distribution__mediaType",
          property: "distribution__mediaType",
        },
        {
          binding: "distribution__identifier",
          property: "distribution__identifier",
        },
      ];

      for (const m of mappings) {
        const binding = m.binding;
        const property = m.property;
        const statementValue = statement[binding];
        if (!statementValue) continue;

        const raw = statementValue.value;
        const result = m.transform ? m.transform(raw) : raw;
        if (result) {
          this[property] = result;
        }
      }
    } else {
      if (cached) {
        return this;
      }
      if (uri == undefined) {
        throw new Error("uri must be provided for a new resource");
      }
      if (title == undefined) {
        throw new Error(
          `title must be provided for a new resource uri: ${uri}, type: ${type}`
        );
      }

      if (title && title != "") {
        this.constructorPromises.push(this.setTitle(title));
      }
      if (catalog) {
        this.constructorPromises.push(
          this.service.insertTriple(
            catalog.uri,
            `http://www.w3.org/ns/dcat#Resource`,
            this.uri
          )
        );
      }
    }
  }

  toFindString() {
    return `${this.title} + ${this.description} + ${this.owner} + ${this.publisher__name} + ${this.publisher__email} + ${this.identifier}`;
  }


  async toUIRepresentation() {
    // TODO remove
    // HOW use packages/CatalogService/scripts/.dev/task/task-extract-triples-to-file
    // WHEN Now.
    // NOTE:
    //  MIN/MAX might not be needed
    //  AG suggests duplicates will not exist when data refreshed
    const [modified, issued] = await Promise.all([
      await this.getDcModified(),
      await this.getDcIssued(),
    ]);
    return {
      identifier: this.identifier ?? this.uri,
      uri: this.uri,
      title: this.title,
      description: this.description,
      contactEmail: this.publisher__email,
      creator: this.publisher__name,
      publishDate: Array.isArray(issued) && issued.length > 0 ? issued[0] : "-",
      modified:
        Array.isArray(modified) && modified.length > 0 ? modified[0] : "-",
      accessRights: this.accessRights,
      rights: this.rights__description,
      attributionAgentStr: this.qualifiedAttribution__agent,
      type: this.dataResourceType ?? RESOURCE_URI,
      owner: this.owner,
      attributionRole: this.qualifiedAttribution__hadRole,
      // Phase 2
        // TODO make nested
      // WHEN got bandwidth for downstream UI and type changes
      distributionUri: this.distribution,
      distributionIdentifier: this.distribution__identifier,
      distributionTitle: this.distribution__title,
      distributionDownloadURL: this.distribution__downloadURL,
      distributionMediaType: this.distribution__mediaType,

    }  as UIDataResourceType;
  }
}
