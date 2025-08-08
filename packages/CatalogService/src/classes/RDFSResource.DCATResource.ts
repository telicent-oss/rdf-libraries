import {
  SPARQLResultBinding,
  TypedNodeQuerySolution,
  RDFSResource,
  LongURI,
} from "@telicent-oss/rdfservice";
import { RESOURCE_URI } from "../apiFactory/operations/utils/common";
import { getHashOrLastUrlSegment } from "../utils/getHashOrLastUrlSegment/getHashOrLastUrlSegment";
import { CatalogService, DCATCatalog } from "../index";

export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
  id: SPARQLResultBinding;
  title: SPARQLResultBinding;
  description?: SPARQLResultBinding;
  creator?: SPARQLResultBinding;
  rights?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  contactEmail?: SPARQLResultBinding;
  owner?: SPARQLResultBinding;
  attributionAgentStr?: SPARQLResultBinding;
  attributionRole?: SPARQLResultBinding;
  // DCAT Phase 2
  distributionUri?: SPARQLResultBinding;
  distributionTitle?: SPARQLResultBinding;
  distributionDownloadURL?: SPARQLResultBinding;
  distributionMediaType?: SPARQLResultBinding;
  distributionIdentifier?: SPARQLResultBinding;
}

type DCATStringProps =
  | "distributionUri"
  | "distributionTitle"
  | "distributionDownloadURL"
  | "distributionMediaType"
  | "distributionIdentifier"
  | "attributionAgentStr";

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
  service: CatalogService;
  title: string = "-";
  id?: string;
  dataResourceType?: LongURI;
  contactEmail: string = "-";
  description: string = "-";
  creator: string = "-";
  rights: string = "-";
  owner: string = "-";
  attributionAgentStr: string = "-";
  attributionRole: string = "-";
  accessRights: string = "-";
  // Phase 2
  distributionUri: string = "-";
  distributionTitle: string = "-";
  distributionDownloadURL: string = "-";
  distributionMediaType: string = "-";
  distributionIdentifier: string = "-";
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
      if (statement?.id) {
        this.id = statement?.id.value;
      } else {
        this.id = this.uri;
      }
      if (statement?.description) {
        this.description = statement?.description.value;
      }
      if (statement?.contactEmail) {
        const email = statement?.contactEmail.value;
        this.contactEmail = email.substring(email.lastIndexOf("/") + 1);
      }
      if (statement?.creator) {
        this.creator = statement?.creator.value;
      }
      if (statement?.rights) {
        this.rights = statement?.rights.value;
      }
      if (statement?.accessRights) {
        this.accessRights = statement?.accessRights.value;
      }
      if (statement?.owner) {
        this.owner = statement?.owner.value;
      }
      if (statement?.attributionAgentStr) {
        let formatted = getHashOrLastUrlSegment(
          statement?.attributionAgentStr.value
        );
        if (formatted) {
          /**
           * This uri value is intentionally combining multiple values.
           * "_Publisher" is not relevant so we can remove it
           * @see "src/main/java/io/telicent/datacatalog/dcat3/Provenance.java"
           */
          formatted = formatted.replace(/_Publisher$/, "");
        }
        this.attributionAgentStr = formatted || this.attributionAgentStr;
      }
      if (statement?.attributionRole) {
        this.attributionAgentStr = statement?.attributionRole.value;
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
      const mappings: Mapping[] = [
        { binding: "distributionUri", property: "distributionUri" },
        { binding: "distributionTitle", property: "distributionTitle" },
        {
          binding: "distributionDownloadURL",
          property: "distributionDownloadURL",
        },
        { binding: "distributionMediaType", property: "distributionMediaType" },
        {
          binding: "distributionIdentifier",
          property: "distributionIdentifier",
        },

      for (const m of mappings) {
        const binding = m.binding;
        const prop = m.property;
        const b = statement[binding];
        if (!b) continue;

        const raw = b.value;
        const out = m.transform ? m.transform(raw) : raw;
        if (out) {
          this[prop] = out;
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
    return `${this.title} + ${this.description} + ${this.owner} + ${this.creator} + ${this.contactEmail} + ${this.id}`;
  }

  async toUIRepresentation() {
    const [modified, issued] = await Promise.all([
      await this.getDcModified(),
      await this.getDcIssued(),
    ]);
    return {
      id: this.id ?? this.uri,
      uri: this.uri,
      title: this.title,
      description: this.description,
      modified:
        Array.isArray(modified) && modified.length > 0 ? modified[0] : "-",
      publishDate: Array.isArray(issued) && issued.length > 0 ? issued[0] : "-",
      accessRights: this.accessRights,
      creator: this.creator,
      type: this.dataResourceType ?? RESOURCE_URI,
      contactEmail: this.contactEmail,
      rights: this.rights,
      owner: this.owner,
      attributionAgentStr: this.attributionAgentStr,
      attributionRole: this.attributionRole,
      // Phase 2
      distributionUri: this.distributionUri,
      distributionTitle: this.distributionTitle,
      distributionDownloadURL: this.distributionDownloadURL,
      distributionMediaType: this.distributionMediaType,
      distributionIdentifier: this.distributionIdentifier,
    }
  }
}
