import { RdfService, RDFServiceConfig } from "@telicent-oss/rdfservice";

export type IESServicePassedOptions = {
  writeEnabled: boolean;
  triplestoreUri?: string;
  dataset?: string;
  defaultNamespace?: string;
  defaultSecurityLabel?: string;
  config?: RDFServiceConfig;
}


export class IESService extends RdfService {

  static DEFAULT_OPTIONS = {
    triplestoreUri: "http://localhost:3030/",
    dataset: "ies",
    defaultNamespace: "http://ies.data.gov.uk/ontology/ies4/",
    defaultSecurityLabel: "",
  };

  /**
   * An extension of RdfService for managing IES ontology elements
   * @see IESService.DEFAULT_OPTIONS for default values for constructor
   * @param {string} triplestoreUri - The host address of the triplestore
   * @param {boolean} [writeEnabled] - Controls if triplestore accepts updates, or is read-only
   * @param {string} dataset - the dataset name in the triplestore
   * @param {string} defaultNamespace - the default stub to use when building GUID URIs
   * @param {string} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
   */
  constructor(passedOptions: IESServicePassedOptions) {
    const options = {
      ...IESService.DEFAULT_OPTIONS,
      ...passedOptions,
    };
    super(
      options.triplestoreUri,
      options.dataset,
      options.defaultNamespace,
      options.defaultSecurityLabel,
      options.writeEnabled,
      options.config
    );
    // this.property = options.property
  }
}
