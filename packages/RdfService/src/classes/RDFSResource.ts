import {
  LongURI,
  TypedNodeQuerySolution,
  XsdDataType,
  CountQuerySolution,
  RelatedResources,
  RelatedNodeQuerySolution,
  ResourceDescription,
  SPOOSQuerySolution,
  StringsDict,
  RelatedLiterals,
  LiteralPropertyQuerySolution,
  RdfService,
  isEmptyString,
} from "../index";
import { AbstractConstructorPromises } from "../utils";

//A wrapper class for an RDFS Resource - i.e. typed node in the graph
export class RDFSResource extends AbstractConstructorPromises {
  uri: LongURI;
  types: LongURI[];
  statement?: TypedNodeQuerySolution;
  public constructorPromises: Promise<unknown>[] = [];
  protected service: RdfService;

  // TODO makes args and option object
  public constructor(
    service: RdfService,
    uri?: LongURI,
    type: LongURI = "http://www.w3.org/2000/01/rdf-schema#Resource",
    statement?: TypedNodeQuerySolution
  ) {
    super();
    this.uri = "";
    this.types = [];
    this.service = service;
    this.statement = statement;
    if (statement) {
      if (statement.uri.value in this.service.nodes) {
        // we've already created an object for this item
        const existingItem = this.service.nodes[statement.uri.value];
        if (statement._type) {
          const newTypes = statement._type.value.split(" ");
          newTypes.forEach((typ: LongURI) => {
            if (!existingItem.types.includes(typ)) {
              existingItem.types.push(typ);
            }
          });
        }
        return existingItem;
      } else {
        // TODO handle object not created
      }
      this.uri = statement.uri.value;
      if (statement._type && !this.types.includes(statement._type.value)) {
        this.types = statement._type.value.split(" ");
      }
      //no need to instantiate this data in the triplestore as it's already come from a query
    } else {
      if (uri) {
        this.uri = uri;
        if (uri in this.service.nodes) {
          //we've already created an object for this item
          const existingItem: RDFSResource = this.service.nodes[uri];
          // WARNING
          // Comparing constructor names like so:
          //      if (existingItem.constructor.name != this.constructor.name) {
          // Won't work when code was minified - as the name of the class was minified.
          // In JS, function are first class citizens; Classes are lipstick on a pig.
          if (existingItem.constructor != this.constructor) {
            throw Error(
              `Cached instance for ${uri} has unexpected constructor "${existingItem.constructor.name}", ` +
                `expected "${this.constructor.name}" ` +
                `(names may be minified)`
            );
          }
          if (type && !existingItem.types.includes(type)) {
            existingItem.types.push(type);
          }
          return existingItem;
        }
      } else {
        this.uri = this.service.mintUri();
      }
      if (type && !this.types.includes(type)) {
        this.types.push(type);

        this.constructorPromises.push(this.service.instantiate(type, this.uri));
      } else {
        throw new Error(
          "An RDFResource requires a type, or a statement PropertyQuery object"
        );
      }
    }
    this.service.nodes[this.uri] = this;
  }

  public async getAllConstructorAsync() {
    await Promise.all(this.constructorPromises);
    return;
  }
  /**
   * @method addLiteral
   * @remarks
   * Adds a literal property
   *
   * @param predicate - The second position in the triple (the PREDICATE)
   * @param text - the literal to be assigned to the triple
   * @param {boolean} deletePrevious - remove any existing properties with that predicate type - defaults to false
   */
  async addLiteral(
    predicate: LongURI,
    text: string,
    securityLabel?: string,
    xsdDatatype?: XsdDataType,
    deleteAllPrevious: boolean = false
  ) {
    if (isEmptyString(predicate)) {
      throw new Error("Cannot have an empty predicate");
    }
    if (isEmptyString(text)) {
      throw new Error("Cannot have empty text in a triple");
    }
    return await this.service.insertTriple(
      this.uri,
      predicate,
      text,
      "LITERAL",
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method addLabel
   * @remarks
   * simple convenience function to add an rdfs:label
   *
   * @param {string} label - the literal text of the rdfs:label
   * @param {boolean} deletePrevious - remove any existing labels - defaults to false
   */
  async addLabel(
    label: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = false
  ) {
    if (isEmptyString(label)) throw new Error("invalid label string");
    return this.addLiteral(
      this.service.rdfsLabel,
      label,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }
  /**
   * @method addComment
   * @remarks
   * simple convenience function to add an rdfs:comment
   *
   * @param {string} comment - the literal text of the rdfs:comment
   * @param {boolean} deletePrevious - remove any existing comments - defaults to false
   */
  async addComment(
    comment: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = false
  ) {
    if (isEmptyString(comment)) throw new Error("invalid comment string");
    return this.addLiteral(
      this.service.rdfsComment,
      comment,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * Adds a value by a key
   */
  async setKeyValue(options: {
    key: string;
    value: string;
    securityLabel?: string;
    xsdDatatype: XsdDataType;
    deleteAllPrevious: boolean;
  }) {
    if (options.key)
      throw new Error(`Expected key to be set, instead got ${options.key}`);
    return this.addLiteral(
      options.key,
      options.value,
      options?.securityLabel,
      options?.xsdDatatype || "xsd:string",
      options?.deleteAllPrevious || false
    );
  }

  /**
   * @method setTitle
   * @remarks
   * Adds a dublin core title to a node
   * @param {string} title - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true
   */
  async set(
    title: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(title)) throw new Error("invalid title string");
    return this.addLiteral(
      this.service.dcTitle,
      title,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setTitle
   * @remarks
   * Adds a dublin core title to a node
   * @param {string} title - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true
   */
  async setTitle(
    title: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(title)) throw new Error("invalid title string");
    return await this.addLiteral(
      this.service.dcTitle,
      title,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }
  /**
   * @method setDescription
   * @remarks
   * Adds a dublin core description to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   * @param {string} description - the description to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true
   */
  async setDescription(
    description: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(description))
      throw new Error("invalid description string");
    return this.addLiteral(
      this.service.dcDescription,
      description,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setCreator
   * @remarks
   * Adds a dublin core creator to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/creator}
   * @param {string} creator - the creator to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true
   */
  async setCreator(
    creator: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(creator)) throw new Error("invalid creator string");
    return this.addLiteral(
      this.service.dcCreator,
      creator,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }
  /**
   * @method setRights
   * @remarks
   * Adds a dublin core rights to a node
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/rights}
   * @param {string} rights - the rights to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing comments - defaults to true
   */
  async setRights(
    rights: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(rights)) throw new Error("invalid rights string");
    return this.addLiteral(
      this.service.dcRights,
      rights,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setPublished
   * @remarks
   * Adds a dublin core published to a node
   * @param {string} publishedDate - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing published dates - defaults to true
   */
  async setPublished(
    publishedDate: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(publishedDate)) throw new Error("invalid published date");
    return this.addLiteral(
      this.service.dcPublished,
      publishedDate,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setModified
   * @remarks
   * Adds a dublin core modified to a node
   * @param {string} modified - date
   * @param {boolean} deletePrevious - remove any existing modified dates - defaults to true
   */
  async setModified(
    modified: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(modified)) throw new Error("invalid modified date");
    return this.addLiteral(
      this.service.dcModified,
      modified,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setAccessRights
   * @remarks
   * Adds a dublin core modified to a node
   * @param {string} modified - date
   * @param {boolean} deletePrevious - remove any existing modified dates - defaults to true
   */
  async setAccessRights(
    modified: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(modified)) throw new Error("invalid modified date");
    return this.addLiteral(
      this.service.dcAccessRights,
      modified,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setPrefLabel
   * @remarks
   * Adds a SKOS preferred label to a node - will overwrite all previous prefLabels by default
   * @param {string} label - the label to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing labels - defaults to true
   */
  async setPrefLabel(
    label: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = true
  ) {
    if (isEmptyString(label)) throw new Error("invalid skos:prefLabel");
    return this.addLiteral(
      `${this.service.skos}prefLabel`,
      label,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  /**
   * @method setAltLabel
   * @remarks
   * Adds a SKOS alternative label to a node
   * @param {string} label - the title to be applied (simple text)
   * @param {boolean} deletePrevious - remove any existing labels - defaults to false
   */
  async setAltLabel(
    label: string,
    securityLabel?: string,
    xsdDatatype: XsdDataType = "xsd:string",
    deleteAllPrevious: boolean = false
  ) {
    if (isEmptyString(label)) throw new Error("invalid skos:altLabel");
    return this.addLiteral(
      `${this.service.skos}altLabel`,
      label,
      securityLabel,
      xsdDatatype,
      deleteAllPrevious
    );
  }

  async countRelated(rel: string): Promise<number> {
    // MERGE PREVIOUSLY const query = `SELECT (count(DISTINCT ?item) as ?count) WHERE {<${this.uri}> ${rel} ?item}`
    const query = `SELECT DISTINCT (count(DISTINCT ?item) as ?count) WHERE {<${this.uri}> ${rel} ?item}`;
    const queryReturn = await this.service.runQuery<CountQuerySolution>(query);
    if (queryReturn.results.bindings.length < 1) {
      return 0;
    } else {
      if (queryReturn.results.bindings.length > 1) {
        throw new Error(
          "Count query should never return more than one binding"
        );
      } else {
        if (queryReturn.results.bindings[0].count) {
          return Number(queryReturn.results.bindings[0].count.value);
        } else {
          return 0;
        }
      }
    }
  }

  /**
   * @method getRelated
   * @remarks
   * Simple function to get all objects related to this node by a predicate
   * @param predicate - the predicate relating to the objects that are returned
   * @returns -  a RelatedResources object
   */
  async getRelated(predicate?: string): Promise<RelatedResources> {
    let predString = "";
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`;
    }
    // MERGE PREVIOUS const query = `SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) ?predicate WHERE {${predString} <${this.uri}> ?predicate ?uri . OPTIONAL {?uri a ?type} FILTER isIRI(?uri) } GROUP BY ?uri ?predicate`
    const query = `SELECT DISTINCT ?uri ?_type ?predicate WHERE {${predString} <${this.uri}> ?predicate ?uri . OPTIONAL {?uri a ?_type} FILTER isIRI(?uri) }`;
    const spOut = await this.service.runQuery<RelatedNodeQuerySolution>(query);
    if (!spOut?.results?.bindings) return {};
    const output: RelatedResources = {};
    await Promise.all(
      spOut.results.bindings.map(
        async (statement: RelatedNodeQuerySolution) => {
          const related = await RDFSResource.createAsync(
            this.service,
            undefined,
            undefined,
            statement
          );
          if (!(statement.predicate.value in output)) {
            output[statement.predicate.value] = [];
          }
          if (output[statement.predicate.value].indexOf(related) < 0) {
            output[statement.predicate.value].push(related);
          }
        }
      )
    );
    return output;
  }

  /**
   * @method getRelating
   * @remarks
   * simple function to get all subjects relating to this node by a predicate - i.e. reverse relationships
   *
   * @param predicate - the predicate relating to the objects that are returned
   * @returns a RelatedResources object
   */
  async getRelating(predicate: string): Promise<RelatedResources> {
    let predString = "";
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`;
    }
    const query = `SELECT DISTINCT ?uri ?_type ?predicate WHERE {${predString} ?uri ?predicate <${this.uri}> . OPTIONAL {?uri a ?_type} }`;
    const spOut = await this.service.runQuery<RelatedNodeQuerySolution>(query);
    if (!spOut?.results?.bindings) return {};
    const output: RelatedResources = {};
    spOut.results.bindings.forEach((statement: RelatedNodeQuerySolution) => {
      const related = new RDFSResource(
        this.service,
        undefined,
        undefined,
        statement
      );
      if (!(statement.predicate.value in output)) {
        output[statement.predicate.value] = [];
      }
      if (output[statement.predicate.value].indexOf(related) < 0) {
        output[statement.predicate.value].push(related);
      }
    });
    return output;
  }

  protected async describeNode(
    furtherInRel?: LongURI
  ): Promise<ResourceDescription> {
    let invFurtherClause = "";
    if (furtherInRel) {
      invFurtherClause = ` . OPTIONAL {?invS <${furtherInRel}> ?invFurther}`;
    }
    const query: string = `SELECT ?s ?p ?o ?invP ?invS ?oType ?invType ?invFurther WHERE {
      BIND (<${this.uri}> AS ?s) .
      OPTIONAL {?s ?p ?o OPTIONAL {?o a ?oType} }
      OPTIONAL {?invS ?invP ?s OPTIONAL {?invS a ?invType} ${invFurtherClause} }
    }`;
    const description: ResourceDescription = {
      literals: {},
      inLinks: {},
      outLinks: {},
      furtherInLinks: [],
    };
    const spOut = await this.service.runQuery<SPOOSQuerySolution>(query);
    spOut.results.bindings.forEach((statement: SPOOSQuerySolution) => {
      if (statement.p) {
        if (statement.o && statement.o.type.toUpperCase() == "LITERAL") {
          if (!Object.keys(description.literals).includes(statement.p.value)) {
            description.literals[statement.p.value] = [statement.o.value];
          } else {
            if (
              !description.literals[statement.p.value].includes(
                statement.o.value
              )
            ) {
              description.literals[statement.p.value].push(statement.o.value);
            }
          }
        } else {
          let pObj: StringsDict = {};
          if (!Object.keys(description.outLinks).includes(statement.p.value)) {
            description.outLinks[statement.p.value] = pObj;
          } else {
            pObj = description.outLinks[statement.p.value];
          }
          let oArray: LongURI[] = [];
          if (statement.o) {
            if (!Object.keys(pObj).includes(statement.o.value)) {
              pObj[statement.o.value] = oArray;
            } else {
              oArray = pObj[statement.o.value];
            }
            if (statement.oType && !oArray.includes(statement.oType.value)) {
              oArray.push(statement.oType.value);
            }
          }
        }
      }
      if (statement.invP && statement.invS) {
        let pObj: StringsDict = {};
        if (!Object.keys(description.inLinks).includes(statement.invP.value)) {
          description.inLinks[statement.invP.value] = pObj;
        } else {
          pObj = description.inLinks[statement.invP.value];
        }
        let sArray: LongURI[] = [];
        if (statement.o) {
          if (!Object.keys(pObj).includes(statement.invS.value)) {
            pObj[statement.invS.value] = sArray;
          } else {
            sArray = pObj[statement.invS.value];
          }
          if (statement.invType && !sArray.includes(statement.invType.value)) {
            sArray.push(statement.invType.value);
          }
        }
        if (
          statement.invFurther &&
          !description.furtherInLinks.includes(statement.invFurther.value)
        ) {
          description.furtherInLinks.push(statement.invFurther.value);
        }
      }
    });
    return description;
  }

  /**
   * @method getLiteralProperties
   * @remarks
   * Simple function to get all literals related to this node
   *
   * @param predicate - the predicate relating to the literal properties that are returned
   * @returns - a RelatedLiterals object
   */
  async getLiterals(predicate?: LongURI): Promise<RelatedLiterals> {
    let predString = "";
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`;
    }
    // MERGE PREVIOUS const query = `SELECT ?literal ?predicate WHERE {${predString} <${this.uri}> ?predicate ?literal . FILTER isLiteral(?literal) }`

    const query = `SELECT DISTINCT ?literal ?predicate WHERE {${predString} <${this.uri}> ?predicate ?literal . FILTER isLiteral(?literal) }`;
    const spOut = await this.service.runQuery<LiteralPropertyQuerySolution>(
      query
    );
    if (!spOut?.results?.bindings) return {};
    const output: RelatedLiterals = {};
    spOut.results.bindings.forEach(
      (statement: LiteralPropertyQuerySolution) => {
        const lit: string = statement.literal.value;
        if (!(statement.predicate.value in output)) {
          output[statement.predicate.value] = [];
        }
        if (output[statement.predicate.value].indexOf(lit) < 0) {
          output[statement.predicate.value].push(lit);
        }
      }
    );
    return output;
  }
  /**
   * @method getMinLiterals
   * @remarks
   * Simple function to get the minimal value of literals
   *
   * @param predicate - the predicate relating to the literal properties that are returned
   * @returns - a RelatedLiterals object
   */
  async getMinLiterals(predicate?: LongURI): Promise<RelatedLiterals> {
    let predString = "";
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`;
    }

    const query = `SELECT DISTINCT (min(?literals) AS ?literal) ?predicate WHERE {${predString} <${this.uri}> ?predicate ?literals . FILTER isLiteral(?literals) } GROUP BY ?predicate`;
    const spOut = await this.service.runQuery<LiteralPropertyQuerySolution>(
      query
    );
    if (!spOut?.results?.bindings) return {};
    const output: RelatedLiterals = {};
    spOut.results.bindings.forEach(
      (statement: LiteralPropertyQuerySolution) => {
        const lit: string = statement.literal.value;
        if (!(statement.predicate.value in output)) {
          output[statement.predicate.value] = [];
        }
        if (output[statement.predicate.value].indexOf(lit) < 0) {
          output[statement.predicate.value].push(lit);
        }
      }
    );
    return output;
  }

  /**
   * @method getMaxLiterals
   * @remarks
   * Simple function to get the maximum value of literals
   *
   * @param predicate - the predicate relating to the literal properties that are returned
   * @returns - a RelatedLiterals object
   */
  async getMaxLiterals(predicate?: LongURI): Promise<RelatedLiterals> {
    let predString = "";
    if (predicate) {
      predString = ` BIND (<${predicate}> AS ?predicate) .`;
    }

    const query = `SELECT DISTINCT (max(?literals) AS ?literal) ?predicate WHERE {${predString} <${this.uri}> ?predicate ?literals . FILTER isLiteral(?literals) } GROUP BY ?predicate`;
    const spOut = await this.service.runQuery<LiteralPropertyQuerySolution>(
      query
    );
    if (!spOut?.results?.bindings) return {};
    const output: RelatedLiterals = {};
    spOut.results.bindings.forEach(
      (statement: LiteralPropertyQuerySolution) => {
        const lit: string = statement.literal.value;
        if (!(statement.predicate.value in output)) {
          output[statement.predicate.value] = [];
        }
        if (output[statement.predicate.value].indexOf(lit) < 0) {
          output[statement.predicate.value].push(lit);
        }
      }
    );
    return output;
  }
  /**
   * Get value by key
   *
   * @returns - an array of strings
   */
  async getLiteralsList(options: {
    key: string;
    validate?: (value: any) => void;
  }): Promise<string[]> {
    if (!options.key)
      throw new Error(`Expected key to be set, instead got ${options.key}`);
    const lits: RelatedLiterals = await this.getLiterals(options.key);
    let values: string[] = [];
    if (options.key in lits) {
      values = lits[options.key];
    }
    options?.validate?.(values);
    return values;
  }

  /**
   * @method getLabels
   * @remarks
   * Simple function to get all rdfs labels
   *
   * @returns - an array of strings
   */
  async getLabels(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.rdfsLabel
    );
    let labels: string[] = [];
    if (this.service.rdfsLabel in lits) {
      labels = lits[this.service.rdfsLabel];
    }
    return labels;
  }

  /**
   * @method getPrefLabels
   * @remarks
   * Simple function to get all skos preferred labels
   *
   * @returns - an array of strings
   */
  async getPrefLabel(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      `${this.service.skos}prefLabel`
    );
    let labels: string[] = [];
    if (`${this.service.skos}prefLabel` in lits) {
      labels = lits[`${this.service.skos}prefLabel`];
    }
    if (labels.length > 1) {
      this.service.warn(`More than one SKOS preferred label on ${this.uri}`);
    }
    return labels;
  }

  /**
   * @method getAltLabels
   * @remarks
   * Simple function to get all skos alternative labels
   *
   * @returns - an array of strings
   */
  async getAltLabels(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      `${this.service.skos}altLabel`
    );
    let labels: string[] = [];
    if (`${this.service.skos}altLabel` in lits) {
      labels = lits[`${this.service.skos}altLabel`];
    }
    return labels;
  }

  /**
   * @method getComments
   * @remarks
   * Simple function to get all rdfs comments
   *
   * @returns - an array of strings
   */
  async getComments(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.rdfsComment
    );
    let comments: string[] = [];
    if (this.service.rdfsComment in lits) {
      comments = lits[this.service.rdfsComment];
    }
    return comments;
  }

  /**
   * @method getTitle
   * @remarks
   * Simple function to get all dublin core title - there should only be one, but sometimes you get multiple with different lang strings
   *
   * @returns - an array of strings
   */
  async getDcTitle(options: { isAssert?: boolean } = {}): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(this.service.dcTitle);
    let titles: string[] = [];
    if (this.service.dcTitle in lits) {
      titles = lits[this.service.dcTitle];
    }
    if (titles.length > 1) {
      console.warn(`More than one Dublin Core title tag on ${this.uri}`);
    }
    if (options.isAssert) {
      if (titles.filter(Boolean).length === 0) {
        throw TypeError(`Expected ${this.uri} to have title`);
      }
    }
    return titles;
  }

  /**
   * @method getDescription
   * @remarks
   * Simple function to get all dublin core descriptions
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
   */
  async getDcDescription(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.dcDescription
    );
    let descriptions: string[] = [];
    if (this.service.dcDescription in lits) {
      descriptions = lits[this.service.dcDescription];
    }
    if (descriptions.length > 1) {
      console.warn(`More than one Dublin Core description tag on ${this.uri}`);
    }
    return descriptions;
  }

  /**
   * @method getRights
   * @remarks
   * Simple function to get all dublin core rights
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
   */
  async getDcRights(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(this.service.dcRights);
    let rights: string[] = [];
    if (this.service.dcRights in lits) {
      rights = lits[this.service.dcRights];
    }
    return rights;
  }

  /**
   * @method getCreator
   * @remarks
   * Simple function to get all dublin core creators
   * There should only be one, but sometimes you get multiple with different lang strings
   * {@link https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description}
   *
   * @returns - an array of strings
   */
  async getDcCreator(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.dcCreator
    );
    let creators: string[] = [];
    if (this.service.dcCreator in lits) {
      creators = lits[this.service.dcCreator];
    }
    if (creators.length > 1) {
      console.warn(`More than one Dublin Core creator tag on ${this.uri}`);
    }
    return creators;
  }

  /**
   * @method getDcPublished
   * @remarks
   * Simple function to get all dublin core published tags. There should only be one though
   *
   * @returns - an array of strings
   */
  async getDcPublished(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.dcPublished
    );
    let pubs: string[] = [];
    if (this.service.dcPublished in lits) {
      pubs = lits[this.service.dcPublished];
    }
    if (pubs.length > 1) {
      this.service.warn(
        `More than one Dublin Core published tag on ${this.uri}`
      );
    }
    return pubs;
  }

  /**
   * @method getDcCreated
   * @remarks
   * Simple function to get all dublin core published tags. There should only be one though
   *
   * @returns - an array of strings
   */
  async getDcCreated(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.dcCreated
    );
    let pubs: string[] = [];
    if (this.service.dcCreated in lits) {
      pubs = lits[this.service.dcCreated];
    }
    if (pubs.length > 1) {
      this.service.warn(`More than one Dublin Core created tag on ${this.uri}`);
    }
    return pubs;
  }

  /**
   * @method getDcModified
   * @remarks
   * Get dublin core "max_modified"
   * https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#modified
   * @returns - Date literal
   */
  async getDcModified(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getMaxLiterals(
      this.service.dcModified
    );
    let pubs: string[] = [];
    if (this.service.dcModified in lits) {
      pubs = lits[this.service.dcModified];
    }
    if (pubs.length > 1) {
      console.warn(`More than one Dublin Core created tag on ${this.uri}`);
    }
    return pubs;
  }

  /**
   * @method getDcIssued
   * @remarks
   * Get dublin core "min_issued"
   * https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#issued
   * @returns - Date literal
   */
  async getDcIssued(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getMinLiterals(
      this.service.dcIssued
    );
    let pubs: string[] = [];
    if (this.service.dcIssued in lits) {
      pubs = lits[this.service.dcIssued];
    }
    if (pubs.length > 1) {
      console.warn(`More than one Dublin Core created tag on ${this.uri}`);
    }
    return pubs;
  }

  /**
   * @method getDcAccessRights
   * @remarks
   * Get dublin core "max_modified"
   * https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#modified
   * @returns - Date literal
   */
  async getDcAccessRights(): Promise<string[]> {
    const lits: RelatedLiterals = await this.getLiterals(
      this.service.dcAccessRights
    );
    let pubs: string[] = [];
    if (this.service.dcAccessRights in lits) {
      pubs = lits[this.service.dcAccessRights];
    }
    if (pubs.length > 1) {
      console.warn(`More than one Dublin Core created tag on ${this.uri}`);
    }
    return pubs;
  }
}
