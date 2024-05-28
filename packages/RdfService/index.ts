/*
  * @module RdfService @remarks 
  * A fairly simple class that provides methods for creating, reading and deleting RDF triples @author Ian Bailey
  */
export const emptyUriErrorMessage = "Cannot have an empty URI"
export const emptyPredicateErrorMessage = "predicate must be provided"
export const noColonInPrefixException = "W3C/XML prefixes must end with a : (colon) character"
export const unknownPrefixException = "Unknown Prefix "
export const unrecognisedIdField = "ID field is not in the results"
const isEmptyString = (str: string) => !Boolean(str);

export type IESObject = "URI" | "LITERAL" | "BNODE";

export interface SPARQLObject {
  value: string;
  type: string;
}

export type SPARQL = {
  s: SPARQLObject,
  p: SPARQLObject,
  o: SPARQLObject
}

export type RelatingQuery = {
  relating: SPARQLObject,
  pred: SPARQLObject
}

export type RelatedQuery = {
  related: SPARQLObject,
  pred: SPARQLObject
}

export type InheritedDomainQuery = {
  prop: SPARQLObject,
  item: SPARQLObject
}

export type SuperClassQuery = {
  super: SPARQLObject,
  subRel: SPARQLObject
}

export type StylesQuery = {
  cls: SPARQLObject,
  style: SPARQLObject
}

export type DiagramListQuery = {
  uri: SPARQLObject,
  uuid: SPARQLObject,
  title: SPARQLObject
}

export type DiagramQuery = {
  uuid: SPARQLObject,
  title: SPARQLObject,
  diagElem: SPARQLObject,
  elem: SPARQLObject,
  elemStyle: SPARQLObject,
  diagRel: SPARQLObject,
  rel: SPARQLObject,
  source: SPARQLObject,
  target: SPARQLObject
}

export type QueryResponse<T> = {
  "head": {
    "vars": string[]
  },
  "results": {
    "bindings": T
  }
}

/**
  * @typeParam XsdDataType
  */
export type XsdDataType = "xsd:string" | //	Character strings (but not all Unicode character strings)
  "xsd:boolean" |  // true / false
  "xsd:decimal" | // Arbitrary-precision decimal numbers
  "xsd:integer" | // Arbitrary-size integer numbers
  "xsd:double" | // 	64-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:float" | // 	32-bit floating point numbers incl. ±Inf, ±0, NaN
  "xsd:date" | // 	Dates (yyyy-mm-dd) with or without timezone
  "xsd:time" | // 	Times (hh:mm:ss.sss…) with or without timezone
  "xsd:dateTime" | // 	Date and time with or without timezone
  "xsd:dateTimeStamp" | // Date and time with required timezone
  "xsd:gYear" | // 	Gregorian calendar year
  "xsd:gMonth" | // 	Gregorian calendar month
  "xsd:gDay" | // 	Gregorian calendar day of the month
  "xsd:gYearMonth" | // 	Gregorian calendar year and month
  "xsd:gMonthDay" | // 	Gregorian calendar month and day
  "xsd:duration" | // 	Duration of time
  "xsd:yearMonthDuration" | //	Duration of time (months and years only)
  "xsd:dayTimeDuration" | //Duration of time (days, hours, minutes, seconds only)
  "xsd:byte" | //-128…+127 (8 bit)
  "xsd:short" | //	-32768…+32767 (16 bit)
  "xsd:int" | //	-2147483648…+2147483647 (32 bit)
  "xsd:long" | //-9223372036854775808…+9223372036854775807 (64 bit)
  "xsd:unsignedByte" | //	0…255 (8 bit)
  "xsd:unsignedShort" | //	0…65535 (16 bit)
  "xsd:unsignedInt" | //	0…4294967295 (32 bit)
  "xsd:unsignedLong" | //	0…18446744073709551615 (64 bit)
  "xsd:positiveInteger" | //	Integer numbers >0
  "xsd:nonNegativeInteger" | //	Integer numbers ≥0
  "xsd:negativeInteger" | //	Integer numbers <0
  "xsd:nonPositiveInteger" | //	Integer numbers ≤0
  "xsd:hexBinary" | //	Hex-encoded binary data
  "xsd:base64Binary" | //	Base64-encoded binary data
  "xsd:anyURI" | //	Absolute or relative URIs and IRIs
  "xsd:language" | //	Language tags per [BCP47]
  "xsd:normalizedString" | //	Whitespace-normalized strings
  "xsd:token" | //	Tokenized strings
  "xsd:NMTOKEN" | //	XML NMTOKENs
  "xsd:Name" | //	XML Names
  "xsd:NCName";

export default class RdfService {
  /**
    * A fallback security label if none is specified
    */
  defaultSecurityLabel: string;
  dataset: string;
  triplestoreUri: string;
  queryEndpoint: string; // should these be made a private method?
  updateEndpoint: string;
  dc: string;
  xsd: string;
  rdf: string;
  rdfs: string;
  owl: string;
  telicent: string;
  prefixDict: {
    [key: string]: string;
  };
  rdfType: string;
  rdfProperty: string;
  rdfsClass: string;
  rdfsSubClassOf: string;
  rdfsSubPropertyOf: string;
  rdfsLabel: string;
  rdfsComment: string;
  rdfsDomain: string;
  rdfsRange: string;
  owlClass: string;
  owlDatatypeProperty: string;
  owlObjectProperty: string;
  telicentStyle: string;
  /**
   * @method constructor 
   * @remarks
   * A fairly simple class that provides methods for creating, reading and deleting RDF triples
   * @param {string} [triplestoreUri="http://localhost:3030/"] - The host address of the triplestore
   * @param {string} [dataset="ds"] - the dataset name in the triplestore
   * @param {string} [defaultUriStub="http://telicent.io/data/"] - the default stub to use when building GUID URIs
   * @param {string} [defaultSecurityLabel=""] - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
  */
  constructor(triplestoreUri = "http://localhost:3030/", dataset = "ds", defaultNamespace = "http://telicent.io/data/", defaultSecurityLabel = "") {
    this.defaultSecurityLabel = defaultSecurityLabel
    this.dataset = dataset
    this.triplestoreUri = `${triplestoreUri}${triplestoreUri.endsWith("/") ? "" : "/"}`
    this.queryEndpoint = this.triplestoreUri + dataset + "/query?query="
    this.updateEndpoint = this.triplestoreUri + dataset + "/update"

    // why is this in the constructor if it is static?
    this.dc = "http://purl.org/dc/elements/1.1/"
    this.xsd = "http://www.w3.org/2001/XMLSchema#"
    this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    this.rdfs = "http://www.w3.org/2000/01/rdf-schema#"
    this.owl = "http://www.w3.org/2002/07/owl#"
    this.telicent = "http://telicent.io/ontology/"

    this.rdfType = `${this.rdf}type`
    this.rdfProperty = `${this.rdf}Property`
    this.rdfsClass = `${this.rdfs}Class`
    this.rdfsSubClassOf = `${this.rdfs}subClassOf`
    this.rdfsSubPropertyOf = `${this.rdfs}subPropertyOf`
    this.rdfsLabel = `${this.rdfs}label`
    this.rdfsComment = `${this.rdfs}comment`
    this.rdfsDomain = `${this.rdfs}domain`
    this.rdfsRange = `${this.rdfs}range`
    this.owlClass = `${this.owl}#Class`
    this.owlDatatypeProperty = `${this.owl}DatatypeProperty`
    this.owlObjectProperty = `${this.owl}ObjectProperty`
    this.telicentStyle = `${this.telicent}style`
    this.prefixDict = {}
    this.addPrefix(":", defaultNamespace)
    this.addPrefix("xsd:", this.xsd)
    this.addPrefix("dc:", this.dc)
    this.addPrefix("rdf:", this.rdf)
    this.addPrefix("rdfs:", this.rdfs)
    this.addPrefix("owl:", this.owl)
    this.addPrefix("telicent:", this.telicent)

  }

  /**
   * @method addPrefix
   * @remarks
   * Adds an XML/W3C prefix to the RdfService so it can be used in query production, URI shortening, etc.
   *
   * @param prefix - a valid W3C prefix, with the : (colon) character at the end
   * @param uri - the URI represented by the prefix
  */
  addPrefix(prefix: string, uri: string) {
    if (prefix.slice(-1) != ":") {
      throw noColonInPrefixException
    }
    this.prefixDict[prefix] = uri
  }

  public set defaultNamespace(uri: string) {
    this.addPrefix(":", uri)
  }

  public get defaultNamespace(): string {
    return this.prefixDict[":"]
  }

  /**
   * @method getPrefix
   * @remarks
   * returns the prefix for a given URI - if no prefix is known, the URI is returned instead of a prefix
   *
   * @param uri - the URI represented by the prefix
   * @returns the prefix that matches the URI, if not found, the URI is returned 
  */
  getPrefix(uri: string) {
    const keys = Object.keys(this.prefixDict)
    const values = Object.values(this.prefixDict)

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
  shorten(uri: string) {
    const keys = Object.keys(this.prefixDict)

    const result = keys.find(key => uri.includes(this.prefixDict[key]));
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
  getSparqlPrefix(prefix: string) {
    if (prefix in this.prefixDict) {
      return `PREFIX ${prefix} <${this.prefixDict[prefix]}> `
    }
    else {
      throw unknownPrefixException + prefix
    }
  }

  /**
   * @returns a formatted set of SPARQL prefix statements
  */
  get sparqlPrefixes() {
    let prefixStr = ""
    for (let prefix in this.prefixDict) {
      prefixStr = prefixStr + `PREFIX ${prefix} <${this.prefixDict[prefix]}> `
    }
    return prefixStr
  }

  /**
   * @method mintUri
   * @remarks
   * Generates a random (UUID) URI based on the namespace passed to it. If not namespace is passed, it will use the RDF Service default namespace
   *
   * @param namespace - a valid uri namespace - if none, the default will be used
   * @returns a random URI
  */
  mintUri(namespace: string = this.defaultNamespace) {
    return namespace + crypto.randomUUID()
  }


  /**
   * @method runQuery
   * @remarks
   * Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
   *
   * @param string - A valid SPARQL query
   * @returns the results of the query in standard SPARQL JSON results format
  */
  async runQuery<T>(query: string) {
    if (isEmptyString(query)) throw Error("runQuery: A valid query is required");

    const response = await fetch(this.queryEndpoint + encodeURIComponent(this.sparqlPrefixes + query))
    if (!response.ok) {
      throw response.statusText
    }

    const ontojson: QueryResponse<T> = await response.json()
    return ontojson
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
   * @throws Fetch query errors are not handled.
  */
  async runUpdate(updateQuery: string, securityLabel?: string) {
    let sl = securityLabel ?? this.defaultSecurityLabel;

    if (isEmptyString(sl)) {
      console.warn("Security label is being set to an empty string. Please check your security policy as this may make the data inaccessible")
    }

    var postObject = {
      method: 'POST',
      headers: {//
        'Accept': '*/*',
        // 'Security-Label': sl, Temporarily removed because if this label is applied
        //  it omits CORS headers from the pre-flight response
        'Content-Type': 'application/sparql-update',
      },
      body: this.sparqlPrefixes + updateQuery
    }

    const response = await fetch(this.updateEndpoint, postObject)
    if (!response.ok) {
      throw response.statusText
    }
    return response.text()
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
  #checkObject(object: string, objectType: IESObject = "URI", xsdDatatype?: XsdDataType) {
    if (objectType === "URI") {
      var o = `<${object}>`
    }
    else if (objectType == "LITERAL") {
      var o = `"${object}"`
      if (xsdDatatype) {
        //      if ((xsdDatatype) && (xsdDatatype !== "")) {
        o = `${o}^^${xsdDatatype}`
      }
    }
    else {
      throw new Error('unknown objectType')
    }
    return o
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
  async insertTriple(subject: string, predicate: string, object: string, objectType?: IESObject, securityLabel?: string, xsdDatatype?: XsdDataType) {
    var o = this.#checkObject(object, objectType, xsdDatatype)
    return await this.runUpdate("INSERT DATA {<" + subject + "> <" + predicate + "> " + o + " . }", securityLabel)
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
  async deleteTriple(subject: string, predicate: string, object: string, objectType: IESObject, xsdDatatype?: XsdDataType) {
    var o = this.#checkObject(object, objectType, xsdDatatype)
    return await this.runUpdate("DELETE DATA {<" + subject + "> <" + predicate + "> " + o + " . }")
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
  async deleteNode(uri: string, ignoreInboundReferences = false) {
    if (isEmptyString(uri)) throw Error(emptyUriErrorMessage)

    await this.runUpdate("DELETE WHERE {<" + uri + "> ?p ?o . }")
    if (!ignoreInboundReferences) {
      await this.runUpdate("DELETE WHERE {?s ?p <" + uri + ">}")
    }
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
  async deleteRelationships(uri: string, predicate: string) {
    if (isEmptyString(uri)) throw Error(emptyUriErrorMessage)
    if (isEmptyString(predicate)) throw Error("Cannot have an empty predicate")

    await this.runUpdate(`DELETE WHERE {<${uri}> <${predicate}> ?o . }`)
  }

  /**
   * @method instantiate
   * @remarks
   * Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
   *
   * @param cls - The class (uri of an rdfs:Class or owl:Class) that is to be instantiated
   * @param uri - The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub
   * @param securityLabel - the security label to apply to new data. If none provided, the default will be used. 
   * @returns  the URI of the instantiated item
  */
  async instantiate(cls: string, uri?: string, securityLabel?: string) {
    if (isEmptyString(cls)) throw Error("Cannot have an empty cls");

    if (!uri) {
      uri = this.mintUri()
    }
    await this.insertTriple(uri, this.rdfType, cls, undefined, securityLabel)
    return uri
  }

  /**
   * @method addLiteral
   * @remarks 
   * Adds a literal property to the specified node (uri)
   *
   * @param uri - The uri of the subject of the literal
   * @param predicate - The second position in the triple (the PREDICATE)
   * @param text - the literal to be assigned to the triple
   * @param deletePrevious - defaults to false
  */
  async addLiteral(uri: string, predicate: string, text: string, deletePrevious = false) {
    if (isEmptyString(uri)) throw new Error(emptyUriErrorMessage)
    if (isEmptyString(predicate)) throw new Error("Cannot have an empty predicate")
    if (isEmptyString(text)) throw new Error("Cannot have empty text in a triple")

    if (deletePrevious) {
      await this.deleteRelationships(uri, predicate)
    }
    await this.insertTriple(uri, predicate, text, "LITERAL")
  }

  /**
   * @method addLabel 
   * @remarks
   * simple convenience function to add an rdfs:label to the given uri - simply pass in the label literal
   *
   * @param {string} uri - The uri of the subject of the label
   * @param {string} label - the literal text of the rdfs:label
  */
  async addLabel(uri: string, label: string) {
    if (isEmptyString(uri)) throw new Error(emptyUriErrorMessage)
    if (isEmptyString(label)) throw new Error("invalid label string")

    await this.insertTriple(uri, this.rdfsLabel, label)
  }

  /**
   * @method addComment 
   * @remarks
   * simple convenience function to add an rdfs:comment to the given uri - simply pass in the comment literal
   *
   * @param {string} uri - The uri of the subject of the comment
   * @param {string} comment - the literal text of the rdfs:comment
  */
  async addComment(uri: string, comment: string) {
    if (isEmptyString(uri)) throw new Error(emptyUriErrorMessage)
    if (isEmptyString(comment)) throw new Error("invalid comment string");
    await this.insertTriple(uri, this.rdfsComment, comment)
  }

  /**
   * @method getRelated
   * @remarks
   * Simple function to get all objects related to the uri by a predicate
   *
   * @param uri - The uri of the subject
   * @param predicate - the predicate relating to the objects that are returned
   * @returns - an array of related items (each is a string - may be a URI or a literal)
  */
  async getRelated(uri: string, predicate: string) {
    if (isEmptyString(uri)) throw new Error(emptyUriErrorMessage);
    if (isEmptyString(predicate)) throw new Error(emptyPredicateErrorMessage);

    const query = `SELECT ?related WHERE {<${uri}> ?pred ?related . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> .}`

    const spOut = await this.runQuery<RelatedQuery[]>(query)
    if (!spOut?.results?.bindings) return []

    const statements = spOut.results.bindings
    const output = statements.map(statement => statement.related.value)
    return output
  }

  /**
   * @method getRelating 
   * @remarks
   * simple function to get all subjects relating to the uri by a predicate - i.e. reverse relationships
   *
   * @param uri - The uri of the subject
   * @param predicate - the predicate relating to the objects that are returned
   * @returns an array of relating items (URIs, as strings). By relating, we mean those that point back at the uri
  */
  async getRelating(uri: string, predicate: string) {
    if (isEmptyString(uri)) throw new Error(emptyUriErrorMessage);
    if (isEmptyString(predicate)) throw new Error(emptyPredicateErrorMessage)

    const query = `SELECT ?relating WHERE {?relating ?pred <${uri}> . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> . }`
    const spOut = await this.runQuery<RelatingQuery[]>(query)
    if (!(spOut?.results?.bindings)) return []

    const statements = spOut.results.bindings;
    return statements.map(statement => statement.relating.value);
  }

  //#flatOut()
  //Simplest, default format for SPARQL returns
  //  #flatOut(spOut, returnFirstObj = false) {
  //    output = []
  //    if (spOut && spOut.results && spOut.results.bindings) {
  //      for (var i in spOut.results.bindings) {
  //        var stmt = spOut.results.bindings[i]
  //        obj = {}
  //        for (var j in spOut.head.vars) {
  //          var v = spOut.head.vars[j]
  //          if ((v in stmt) && (stmt[v])) {
  //            obj[v] = stmt[v].value
  //          }
  //        }
  //        output.push(stmt.relating.value)
  //      }
  //    }
  //    if (returnFirstObj) {
  //      return output[0]
  //    }
  //    else {
  //      return output
  //    }
  //  }
}

