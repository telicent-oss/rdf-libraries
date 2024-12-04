/*
 * @module RdfService @remarks
 * A fairly simple class that provides methods for creating, reading and deleting RDF triples @author Ian Bailey
 */

import { AbstractConstructorPromises } from './AbstractConstructorPromises';
import { LongURI, PrefixedURI, QueryResponse, RDFBasetype, ResourceFindSolution, SPOQuerySolution, TypedNodeQuerySolution, XsdDataType } from '../types';
import { RDFSResource, RDFSResourceDescendant } from './AbstractConstructorPromises.RDFSResource';
import { isEmptyString } from '../utils/isEmptyString';
import { emptyUriErrorMessage, noColonInPrefixException, unknownPrefixException } from '../constants';

const DEBUG = false;

export type RankWrapper = {
    score?: number;
    item: RDFSResource;
  };

  
export type RDFServiceConfig = Partial<{
    NO_WARNINGS: boolean;
  }>

export class RdfService extends AbstractConstructorPromises {
    public config: RDFServiceConfig;
    public constructorPromises: Promise<unknown>[] = [];
  
    /**
     * A fallback security label if none is specified
     */
    defaultSecurityLabel: string;
    #writeEnabled: boolean;
    showWarnings: boolean;
    dataset: string;
    triplestoreUri: string;
    queryEndpoint: string; // should these be made a private method?
    updateEndpoint: string;
    dc: string;
    xsd: string;
    rdf: string;
    rdfs: string;
    skos: string;
    owl: string;
    telicent: string;
    prefixDict: {
      [key: PrefixedURI]: LongURI;
    };
    rdfType: LongURI;
  
    rdfsResource: LongURI;
  
    rdfsLabel: LongURI;
    rdfsComment: LongURI;
  
    nodes: {
      [key: LongURI]: RDFSResource;
    };
  
    dct: LongURI;
    dcTitle: LongURI;
    dcDescription: LongURI; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/description
    // TODO QUESTION: Should these be dctCreator?. Feel like we need a value object { prefix: DublineCoreUri, id:  DublineCoreTerms} | { prefix, id }
    dcCreator: LongURI; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/creator
    dcAccessRights: LongURI; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/accessRights
    // TODO! Perhaps misusing "rights" temporarily for demo
    dcRights: LongURI; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/rights
    dcCreated: LongURI;
    dcModified: LongURI; // https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#modified
    dcPublished: LongURI;
    classLookup: {
      [key: LongURI]: RDFSResourceDescendant;
    };
    updateCount: number;
  
    /**
     * @method constructor
     * @remarks
     * A fairly simple class that provides methods for creating, reading and deleting RDF triples
     * @param {string} [triplestoreUri="http://localhost:3030/"] - The host address of the triplestore
     * @param {string} [dataset="ds"] - the dataset name in the triplestore
     * @param {string} [defaultUriStub="http://telicent.io/data/"] - the default stub to use when building GUID URIs
     * @param {string} [defaultSecurityLabel=""] - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
     * @param {boolean} [write=false] - set to true if you want to update the data, default is false (read only)
     */
    constructor(
      triplestoreUri = "http://localhost:3030/",
      dataset = "ds",
      defaultNamespace = "http://telicent.io/data/",
      defaultSecurityLabel = "",
      write = false,
      config: { NO_WARNINGS?: boolean } = {}
    ) {
      super();
      this.config = config;
      this.defaultSecurityLabel = defaultSecurityLabel;
      this.dataset = dataset;
      this.triplestoreUri = `${triplestoreUri}${
        triplestoreUri.endsWith("/") ? "" : "/"
      }`;
      this.queryEndpoint = this.triplestoreUri + dataset + "/query?query=";
      this.updateEndpoint = this.triplestoreUri + dataset + "/update";
      this.#writeEnabled = write;
      this.updateCount = 0;
      this.showWarnings = true;
  
      // why is this in the constructor if it is static?
      this.dc = "http://purl.org/dc/elements/1.1/";
      this.dct = "http://purl.org/dc/terms/"; //@Dave -  DC items  to move up to the RdfService class. Didn't want to go messing with your code though
      this.xsd = "http://www.w3.org/2001/XMLSchema#";
      this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"; 
      this.rdfs = "http://www.w3.org/2000/01/rdf-schema#";
      this.owl = "http://www.w3.org/2002/07/owl#";
      this.skos = "http://www.w3.org/2004/02/skos/core#";
      this.telicent = "http://telicent.io/ontology/";
      this.rdfType = `${this.rdf}type`;
      this.rdfsResource = `${this.rdfs}Resource`;
      this.rdfsLabel = `${this.rdfs}label`;
      this.rdfsComment = `${this.rdfs}comment`;
  
      this.dcTitle = `${this.dct}title`;
      this.dcDescription = `${this.dct}description`;
      this.dcCreator = `${this.dct}creator`;
      this.dcRights = `${this.dct}rights`;
      this.dcCreated = `${this.dct}created`;
      this.dcModified = `${this.dct}modified`;
      this.dcPublished = `${this.dct}published`;
      this.dcAccessRights = `${this.dct}accessRights`;
      this.prefixDict = {};
      this.addPrefix(":", defaultNamespace);
      this.addPrefix("xsd:", this.xsd);
      this.addPrefix("dc:", this.dc);
      this.addPrefix("rdf:", this.rdf);
      this.addPrefix("rdfs:", this.rdfs);
      this.addPrefix("rdfs:", this.rdfs);
      this.addPrefix("skos:", this.skos);
      this.addPrefix("telicent:", this.telicent);
      this.addPrefix("foaf:", "http://xmlns.com/foaf/0.1/");
      this.addPrefix("dct:", "http://purl.org/dc/terms/");
      this.classLookup = {};
      this.classLookup[this.rdfsResource] = RDFSResource;
      this.nodes = {};
    }
  
    inCache(uri: LongURI) {
      if (uri in this.nodes) {
        return true;
      } else {
        return false;
      }
    }
  
    public set setWarnings(sw: boolean) {
      this.showWarnings = sw;
    }
  
    warn(warning: string) {
      if (this.showWarnings) {
        console.warn(warning);
      }
    }
    
    lookupClass<T extends RDFSResourceDescendant>(
      clsUri: LongURI,
      defaultCls: T
    ) {
      if (this.classLookup[clsUri]) return this.classLookup[clsUri];
      else {
        return defaultCls;
      }
    }
  
    getAllElements() {
      this.warn(
        "This has been deprecated - who wants to get everything at once ?"
      );
    }
  
    /**
     * @method addPrefix
     * @remarks
     * Adds an XML/W3C prefix to the RdfService so it can be used in query production, URI shortening, etc.
     *
     * @param prefix - a valid W3C prefix, with the : (colon) character at the end
     * @param uri - the URI represented by the prefix
     */
    addPrefix(prefix: PrefixedURI, uri: LongURI) {
      if (prefix.slice(-1) != ":") {
        throw noColonInPrefixException;
      }
      this.prefixDict[prefix] = uri;
    }
  
    public set defaultNamespace(uri: LongURI) {
      this.addPrefix(":", uri);
    }
  
    public get defaultNamespace(): LongURI {
      return this.prefixDict[":"];
    }
  
    /**
     * @method getPrefix
     * @remarks
     * returns the prefix for a given URI - if no prefix is known, the URI is returned instead of a prefix
     *
     * @param uri - the URI represented by the prefix
     * @returns the prefix that matches the URI, if not found, the URI is returned
     */
    getPrefix(uri: LongURI): string {
      const keys = Object.keys(this.prefixDict);
      const values = Object.values(this.prefixDict);
  
      return keys.find((_, index) => values[index] === uri) || uri;
    }
  
    /**
     * @method shorten
     * @remarks
     * Shortens a URI to its prefixed equivalent. If no prefix is found, the full URI is returned
     *
     * @param uri - the URI represented by the prefix
     * @returns the prefix that matches the URI, if not found, the URI is returned
     */
    shorten(uri: LongURI): PrefixedURI | LongURI {
      const keys = Object.keys(this.prefixDict);
  
      const result = keys.find((key) => uri.includes(this.prefixDict[key]));
      return result ? uri.replace(this.prefixDict[result], result) : uri;
    }
  
    /**
     * @method getSparqlPrefix
     * @remarks
     * Returns a formatted SPARQL prefix statement for the provided prefix
     *
     * @param prefix - the prefix for which you need the statement
     * @returns a formatted SPARQL prefix statement
     */
    getSparqlPrefix(prefix: string): string {
      if (prefix in this.prefixDict) {
        return `PREFIX ${prefix} <${this.prefixDict[prefix]}> `;
      } else {
        throw unknownPrefixException + prefix;
      }
    }
  
    /**
     * @returns a formatted set of SPARQL prefix statements
     */
    get sparqlPrefixes() {
      let prefixStr = "";
      for (const prefix in this.prefixDict) {
        prefixStr = prefixStr + `PREFIX ${prefix} <${this.prefixDict[prefix]}> `;
      }
      return prefixStr;
    }
  
    /**
     * @method mintUri
     * @remarks
     * Generates a random (UUID) URI based on the namespace passed to it. If not namespace is passed, it will use the RDF Service default namespace
     *
     * @param namespace - a valid uri namespace - if none, the default will be used
     * @returns a random URI
     */
    mintUri(namespace: string = this.defaultNamespace): LongURI {
      return namespace + crypto.randomUUID();
    }
  
    /**
     * @method runQuery
     * @remarks
     * Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
     *
     * @param string - A valid SPARQL query
     * @returns the results of the query in standard SPARQL JSON results format
     */
    async runQuery<T>(query: string): Promise<QueryResponse<T>> {
      const response = await fetch(this.queryEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-query",
          Accept: "application/sparql-results+json",
        },
        body: this.sparqlPrefixes + query,
      });
  
      if (!response.ok) {
        throw response.statusText;
      }
      const results: QueryResponse<T> = await response.json();
      return results;
    }
  
    async checkTripleStore(): Promise<boolean> {
      const result = await this.runQuery<SPOQuerySolution>("ASK WHERE {}");
      if ("boolean" in result) {
        return true;
      }
      return false;
    }
  
    /**
     * @method runUpdate
     * @remarks
     * Sends a SPARQL update to the triplestore specified when the RdfService was initiated.
     * SPARQL endpoints don't tend to provide much feedback on success. The full response text is returned from this function however.
     *
     * @param updateQuery - A valid SPARQL update query
     * @param securityLabel - the security label to apply to new data. If none provided, the default will be used.
     * @returns the response text from the triplestore after running the update
     * @throws if the triplestore does not accept the update
     */
    async runUpdate(
      updateQueries: string[],
      securityLabel?: string
    ): Promise<string> {
      let updateQuery = this.sparqlPrefixes;
  
      updateQueries.map((query: string) => {
        updateQuery = `${updateQuery}
        ${query} ;
        `;
        this.updateCount = this.updateCount + 1;
      });
  
      if (this.#writeEnabled) {
        const sl = securityLabel ?? this.defaultSecurityLabel;
  
        if (isEmptyString(sl)) {
          if (!this.config?.NO_WARNINGS) {
            console.warn(
              "Security label is being set to an empty string. Please check your security policy as this may make the data inaccessible"
            );
          }
        }
  
        const postObject = {
          method: "POST",
          headers: {
            //
            Accept: "*/*",
            // 'Security-Label': sl, Temporarily removed because if this label is applied
            //  it omits CORS headers from the pre-flight response
            "Content-Type": "application/sparql-update",
          },
          body: this.sparqlPrefixes + updateQuery,
        };
  
        const response = await fetch(this.updateEndpoint, postObject);
        if (!response.ok) {
          throw response.statusText;
        }
        return await response.text();
      } else {
        console.warn("service is in read only node, updates are not permitted");
        return "service is in read only node, updates are not permitted";
      }
    }
  
    /**
     * @method checkObject
     * @remarks
     * private function to sort out type of object in a subject-predicate-object triple.
     * returns a formatted string suitable for insertion into a SPARQL query
     * if the object is a literal, a valid xsd datatype can also be provided
     *
     * @param object - the triple object (third position in a triple) to be prepared
     * @param objectType - the type of the provided object - either URI or LITERAL. Blank nodes are not supported because they're a really stupid idea.
     * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. (optional)
     * @returns - a SPARQL component for a triple that is either formatted as a literal or a URI
     * @throws
     * Thrown if the object type is unknown
     */
    #checkObject(
      object: string,
      objectType: RDFBasetype = "URI",
      xsdDatatype?: XsdDataType
    ): string {
      let o: string = "";
      if (objectType === "URI") {
        o = `<${object}>`;
      } else if (objectType == "LITERAL") {
        o = `"${object}"`;
        if (xsdDatatype) {
          //      if ((xsdDatatype) && (xsdDatatype !== "")) {
          o = `${o}^^${xsdDatatype}`;
        }
      } else {
        throw new Error("unknown objectType");
      }
      return o;
    }
  
    /**
     * @method insertTriple
     * @remarks
     * Performs a SPARQL update to insert the provided subject,predicate, object triple.
     * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter.
     * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
     *
     * @param subject - The first position in the triple (the SUBJECT)
     * @param predicate - The second position in the triple (the PREDICATE)
     * @param object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not supported because we want the world to be a better place
     * @param securityLabel - the security label to apply to new data. If none provided, the default will be used. (optional)
     * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes (optional)
     * @returns the results of the query in standard SPARQL JSON results format
     * @throws
     * Thrown if the object type is unknown
     */
    async insertTriple(
      subject: LongURI,
      predicate: LongURI,
      object: LongURI | string,
      objectType?: RDFBasetype,
      securityLabel?: string,
      xsdDatatype?: XsdDataType,
      deleteAllPrevious: boolean = false
    ): Promise<string> {
      const updates: string[] = [];
      if (deleteAllPrevious) {
        updates.push(`DELETE WHERE {<${subject}> <${predicate}> ?o}`);
      }
      const o = this.#checkObject(object, objectType, xsdDatatype);
      updates.push(`INSERT DATA {<${subject}> <${predicate}> ${o} . }`);
      const result = await this.runUpdate(updates, securityLabel);
      DEBUG && console.log("INSERTED");
      DEBUG && console.log(updates.join("\n"));
      return result;
    }
  
    /**
     * @method deleteTriple
     * @remarks
     * Performs a SPARQL update to delete the triples corresponding to the provided subject,predicate, object.
     * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter.
     * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
     *
     * @param subject - The first position in the triple (the SUBJECT)
     * @param predicate - The second position in the triple (the PREDICATE)
     * @param object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not support because, why would you.
     * @param xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @returns the http response text from the server
     * @throws
     * Thrown if the object type is unknown
     */
    async deleteTriple(
      subject: LongURI,
      predicate: LongURI,
      object: LongURI | string,
      objectType: RDFBasetype,
      xsdDatatype?: XsdDataType
    ) {
      const o = this.#checkObject(object, objectType, xsdDatatype);
      return await this.runUpdate([
        "DELETE DATA {<" + subject + "> <" + predicate + "> " + o + " . }",
      ]);
    }
  
    /**
     * @method deleteNode
     * @remarks
     * Careful with this one!  It removes all references to a URI - effectively deleting all trace of an node from the triplestore.
     * If you only want to remove the outgoing references (i.e. not the triples where this is the object) from the node then set ignoreInboundReferences to true
     *
     * @param uri - The uri of the Node you want to get rid of
     * @param - if set to true, this will not delete any triples that refer to the node
     * @throws
     * Thrown if the object type is unknown
     */
    async deleteNode(uri: LongURI, ignoreInboundReferences = false) {
      if (isEmptyString(uri)) throw Error(emptyUriErrorMessage);
  
      if (!ignoreInboundReferences) {
        return await this.runUpdate(["DELETE WHERE {?s ?p <" + uri + ">}"]);
      }
      return await this.runUpdate(["DELETE WHERE {<" + uri + "> ?p ?o . }"]);
    }
  
    /**
     * @method deleteRelationships
     * @remarks
     * deletes all triples that match the pattern <uri> <predicate> <ALL>
     *
     * @param uri - The uri of the subject of the triples you want remove
     * @param predicate - the predicate to match for all triples being removed
     * @throws
     * Thrown if the object type is unknown
     */
    async deleteRelationships(uri: LongURI, predicate: LongURI): Promise<string> {
      if (isEmptyString(uri)) throw Error(emptyUriErrorMessage);
      if (isEmptyString(predicate)) throw Error("Cannot have an empty predicate");
  
      return await this.runUpdate([
        `DELETE WHERE {<${uri}> <${predicate}> ?o . }`,
      ]);
    }
  
    /**
     * @method instantiate
     * @remarks
     * Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
     *
     * @param cls - The class (uri of an rdfs:Class or owl:Class) that is to be instantiated
     * @param clsURI - The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub
     * @param securityLabel - the security label to apply to new data. If none provided, the default will be used.
     * @returns  the resulting instance's URI as a string
     */
    async instantiate(
      clsURI: LongURI,
      uri?: LongURI,
      securityLabel?: string
    ): Promise<string> {
      if (isEmptyString(clsURI))
        throw new Error(
          "Cannot have an empty clsURI ( The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub)"
        );
  
      if (!uri) {
        uri = this.mintUri();
      }
      await this.insertTriple(
        uri,
        this.rdfType,
        clsURI,
        undefined,
        securityLabel
      );
      return uri;
    }
  
    /**
     * Performs a very basic string-matching search - this should be used if no search index is available. The method will return a very basic match count that can be used to rank results.
     * @param {string} matchingText - The text string to find in the data
     * @param {Array} types - OPTIONAL - the types of items to search for
     * @returns {Array} - An array of DataService objects with URIs, titles, and published dates
     */
    async find(matchingText: string, types?: LongURI[]): Promise<RankWrapper[]> {
      let typeMatch = "";
      if (types) {
        const typelist = '"' + types.join('", "') + '"';
        typeMatch = `
        BIND (STR(?type) AS ?typestr) .
        FILTER (?typestr in (${typelist}) ) .
        `;
      }
  
      //let re = new RegExp(matchingText.toLowerCase(), "g")
  
      const query = `
          SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) (group_concat(DISTINCT ?literal) as ?concatLit)
          WHERE {
              ?uri a ?type .
              ?uri ?pred ?literal .
              ${typeMatch}
              FILTER CONTAINS(LCASE(?literal), "${matchingText.toLowerCase()}")
          } GROUP BY ?uri
          `;
      const results = await this.runQuery<ResourceFindSolution>(query);
      return this.rankedWrap(results, matchingText);
    }
  
    compareScores(a: RankWrapper, b: RankWrapper) {
      if (!a.score || !b.score) {
        return 0;
      }
      if (a.score < b.score) {
        return 1;
      }
      if (a.score > b.score) {
        return -1;
      }
      return 0;
    }
  
    async rankedWrap(
      queryReturn: QueryResponse<ResourceFindSolution>,
      matchingText: string
    ) {
      const items = [];
      let Class: RDFSResourceDescendant = RDFSResource;
      const re = new RegExp(matchingText.toLowerCase(), "g");
      let concatLit: string = "";
      if (
        matchingText &&
        matchingText != "" &&
        queryReturn.results &&
        queryReturn.results.bindings
      ) {
        if (queryReturn.head && queryReturn.head.vars) {
          for (const i in queryReturn.results.bindings) {
            const binding = queryReturn.results.bindings[i];
            if (binding._type) {
              const types = binding._type.value.split(" ");
              Class = this.lookupClass(types[0], RDFSResource);
            } else {
              Class = RDFSResource;
            }
            const item = await Class.createAsync(
              this,
              undefined,
              undefined,
              binding
            );
            //The query concatenates all the matching literals in the result - we can then count the number of matches to provide a basic score for ranking search results.
            let score = 0;
            if (binding.concatLit) {
              concatLit = binding.concatLit.value;
              const match = concatLit.match(re);
              if (match) {
                score = match.length;
              } //Cosplay strong typing
            }
            const wrapper: RankWrapper = { item: item, score: score };
            items.push(wrapper);
          }
        }
      }
      return items.sort(this.compareScores);
    }
  
    makeTypedStatement(uri: LongURI, _type: LongURI): TypedNodeQuerySolution {
      return {
        uri: { value: uri, type: "URI" },
        _type: { value: _type, type: "URI" },
      };
    }
  }
  