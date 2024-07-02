var m = Object.defineProperty;
var P = (a, t, e) => t in a ? m(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var i = (a, t, e) => (P(a, typeof t != "symbol" ? t + "" : t, e), e), x = (a, t, e) => {
  if (!t.has(a))
    throw TypeError("Cannot " + e);
};
var w = (a, t, e) => {
  if (t.has(a))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(a) : t.set(a, e);
};
var u = (a, t, e) => (x(a, t, "access private method"), e);
const p = "Cannot have an empty URI", E = "predicate must be provided", b = "W3C/XML prefixes must end with a : (colon) character", g = "Unknown Prefix ", L = "ID field is not in the results", n = (a) => !a;
class v {
  constructor(t, e, s, r) {
    i(this, "uri");
    i(this, "_type");
    i(this, "service");
    if (this.service = t, r)
      this.uri = r.uri.value, this._type = r._type.value;
    else if (e ? this.uri = e : this.uri = this.service.mintUri(), s)
      this._type = s, this.service.instantiate(this._type, this.uri);
    else
      throw new Error("An RDFResource requires a type, or a statement PropertyQuery object");
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
  async addLiteral(t, e, s = !1) {
    if (n(t))
      throw new Error("Cannot have an empty predicate");
    if (n(e))
      throw new Error("Cannot have empty text in a triple");
    s && await this.service.deleteRelationships(this.uri, t), await this.service.insertTriple(this.uri, t, e, "LITERAL");
  }
  /**
   * @method addLabel 
   * @remarks
   * simple convenience function to add an rdfs:label 
   *
   * @param {string} label - the literal text of the rdfs:label
   * @param {boolean} deletePrevious - remove any existing labels - defaults to false 
  */
  async addLabel(t, e = !1) {
    if (n(t))
      throw new Error("invalid label string");
    await this.addLiteral(this.service.rdfsLabel, t, e);
  }
  /**
   * @method addComment 
   * @remarks
   * simple convenience function to add an rdfs:comment 
   *
   * @param {string} comment - the literal text of the rdfs:comment
   * @param {boolean} deletePrevious - remove any existing comments - defaults to false 
  */
  async addComment(t, e = !1) {
    if (n(t))
      throw new Error("invalid comment string");
    await this.addLiteral(this.service.rdfsComment, t, e);
  }
}
class c extends v {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param type - if not being created from a query, then type (e.g. rdf Property, owl ObjectProperty / DatatypeProperty) must be supplied - will add data to ontology
  */
  constructor(t, e, s, r) {
    s || (s = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"), super(t, e, s, r);
  }
  /**
   * @method getSubProperties
   * @remarks
   * returns the sub properties of this property as an array of Property objects
   * @param recurse - if true (default) only immediate subproperties are return otherwise the  hierarchy will be fully recursed
  */
  async getSubProperties(t = !1) {
    var e = "";
    t && (e = "*");
    const s = `SELECT ?uri ?_type WHERE {?uri rdfs:subPropertyOf${e} <${this.uri}> . ?uri a ?_type}`, r = await this.service.runQuery(s);
    var o = [];
    for (var h of r.results.bindings) {
      var d = this.service.lookupClass(h._type.value, c), f = new d(this.service, void 0, void 0, h);
      o.push(f);
    }
    return o;
  }
}
var l, y;
class R {
  /**
   * @method constructor 
   * @remarks
   * A fairly simple class that provides methods for creating, reading and deleting RDF triples
   * @param {string} [triplestoreUri="http://localhost:3030/"] - The host address of the triplestore
   * @param {string} [dataset="ds"] - the dataset name in the triplestore
   * @param {string} [defaultUriStub="http://telicent.io/data/"] - the default stub to use when building GUID URIs
   * @param {string} [defaultSecurityLabel=""] - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
  */
  constructor(t = "http://localhost:3030/", e = "ds", s = "http://telicent.io/data/", r = "") {
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
    w(this, l);
    /**
      * A fallback security label if none is specified
      */
    i(this, "defaultSecurityLabel");
    i(this, "dataset");
    i(this, "triplestoreUri");
    i(this, "queryEndpoint");
    // should these be made a private method?
    i(this, "updateEndpoint");
    i(this, "dc");
    i(this, "xsd");
    i(this, "rdf");
    i(this, "rdfs");
    i(this, "owl");
    i(this, "telicent");
    i(this, "prefixDict");
    i(this, "rdfType");
    i(this, "rdfProperty");
    i(this, "rdfsClass");
    i(this, "rdfsResource");
    i(this, "rdfsSubClassOf");
    i(this, "rdfsSubPropertyOf");
    i(this, "rdfsLabel");
    i(this, "rdfsComment");
    i(this, "rdfsDomain");
    i(this, "rdfsRange");
    i(this, "owlClass");
    i(this, "owlDatatypeProperty");
    i(this, "owlObjectProperty");
    i(this, "telicentStyle");
    i(this, "classLookup");
    this.defaultSecurityLabel = r, this.dataset = e, this.triplestoreUri = t, this.queryEndpoint = this.triplestoreUri + e + "/query?query=", this.updateEndpoint = this.triplestoreUri + e + "/update", this.dc = "http://purl.org/dc/elements/1.1/", this.xsd = "http://www.w3.org/2001/XMLSchema#", this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#", this.rdfs = "http://www.w3.org/2000/01/rdf-schema#", this.owl = "http://www.w3.org/2002/07/owl#", this.telicent = "http://telicent.io/ontology/", this.rdfType = `${this.rdf}type`, this.rdfProperty = `${this.rdf}Property`, this.rdfsResource = `${this.rdfs}Resource`, this.rdfsClass = `${this.rdfs}Class`, this.rdfsSubClassOf = `${this.rdfs}subClassOf`, this.rdfsSubPropertyOf = `${this.rdfs}subPropertyOf`, this.rdfsLabel = `${this.rdfs}label`, this.rdfsComment = `${this.rdfs}comment`, this.rdfsDomain = `${this.rdfs}domain`, this.rdfsRange = `${this.rdfs}range`, this.owlClass = `${this.owl}#Class`, this.owlDatatypeProperty = `${this.owl}DatatypeProperty`, this.owlObjectProperty = `${this.owl}ObjectProperty`, this.telicentStyle = `${this.telicent}style`, this.prefixDict = {}, this.addPrefix(":", s), this.addPrefix("xsd:", this.xsd), this.addPrefix("dc:", this.dc), this.addPrefix("rdf:", this.rdf), this.addPrefix("rdfs:", this.rdfs), this.addPrefix("owl:", this.owl), this.addPrefix("telicent:", this.telicent), this.classLookup = {}, this.classLookup[this.rdfsResource] = v, this.classLookup[this.rdfProperty] = c;
  }
  wrapPropertyList(t) {
    var e = [];
    return t.results.bindings.forEach((s) => {
      var r = this.lookupClass(s._type.value, c), o = new r(this, void 0, void 0, s);
      e.push(o);
    }), e;
  }
  lookupClass(t, e) {
    return this.classLookup[t] ? this.classLookup[t] : e;
  }
  getAllElements(t) {
    console.warn("This has been deprecated - who wants to get everything at once ?");
  }
  /**
   * @method addPrefix
   * @remarks
   * Adds an XML/W3C prefix to the RdfService so it can be used in query production, URI shortening, etc.
   *
   * @param prefix - a valid W3C prefix, with the : (colon) character at the end
   * @param uri - the URI represented by the prefix
  */
  addPrefix(t, e) {
    if (t.slice(-1) != ":")
      throw b;
    this.prefixDict[t] = e;
  }
  set defaultNamespace(t) {
    this.addPrefix(":", t);
  }
  get defaultNamespace() {
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
  getPrefix(t) {
    const e = Object.keys(this.prefixDict), s = Object.values(this.prefixDict);
    return e.find((r, o) => s[o] === t) || t;
  }
  /**
   * @method shorten
   * @remarks
   * Shortens a URI to its prefixed equivalent. If no prefix is found, the full URI is returned
   *
   * @param uri - the URI represented by the prefix
   * @returns the prefix that matches the URI, if not found, the URI is returned 
  */
  shorten(t) {
    const s = Object.keys(this.prefixDict).find((r) => t.includes(this.prefixDict[r]));
    return s ? t.replace(this.prefixDict[s], s) : t;
  }
  /**
   * @method getSparqlPrefix
   * @remarks
   * Returns a formatted SPARQL prefix statement for the provided prefix
   *
   * @param prefix - the prefix for which you need the statement
   * @returns a formatted SPARQL prefix statement
  */
  getSparqlPrefix(t) {
    if (t in this.prefixDict)
      return `PREFIX ${t} <${this.prefixDict[t]}> `;
    throw g + t;
  }
  /**
   * @returns a formatted set of SPARQL prefix statements
  */
  get sparqlPrefixes() {
    let t = "";
    for (let e in this.prefixDict)
      t = t + `PREFIX ${e} <${this.prefixDict[e]}> `;
    return t;
  }
  /**
   * @method mintUri
   * @remarks
   * Generates a random (UUID) URI based on the namespace passed to it. If not namespace is passed, it will use the RDF Service default namespace
   *
   * @param namespace - a valid uri namespace - if none, the default will be used
   * @returns a random URI
  */
  mintUri(t = this.defaultNamespace) {
    return t + crypto.randomUUID();
  }
  /**
   * @method runQuery
   * @remarks
   * Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
   *
   * @param string - A valid SPARQL query
   * @returns the results of the query in standard SPARQL JSON results format
  */
  async runQuery(t) {
    if (n(t))
      throw Error("runQuery: A valid query is required");
    const e = await fetch(this.queryEndpoint + encodeURIComponent(this.sparqlPrefixes + t));
    if (!e.ok)
      throw e.statusText;
    return await e.json();
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
  async runUpdate(t, e) {
    let s = e ?? this.defaultSecurityLabel;
    n(s) && console.warn("Security label is being set to an empty string. Please check your security policy as this may make the data inaccessible");
    var r = {
      method: "POST",
      headers: {
        //
        Accept: "*/*",
        // 'Security-Label': sl, Temporarily removed because if this label is applied
        //  it omits CORS headers from the pre-flight response
        "Content-Type": "application/sparql-update"
      },
      body: this.sparqlPrefixes + t
    };
    const o = await fetch(this.updateEndpoint, r);
    if (!o.ok)
      throw o.statusText;
    return o.text();
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
  async insertTriple(t, e, s, r, o, h) {
    var d = u(this, l, y).call(this, s, r, h);
    return await this.runUpdate("INSERT DATA {<" + t + "> <" + e + "> " + d + " . }", o);
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
  async deleteTriple(t, e, s, r, o) {
    var h = u(this, l, y).call(this, s, r, o);
    return await this.runUpdate("DELETE DATA {<" + t + "> <" + e + "> " + h + " . }");
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
  async deleteNode(t, e = !1) {
    if (n(t))
      throw Error(p);
    await this.runUpdate("DELETE WHERE {<" + t + "> ?p ?o . }"), e || await this.runUpdate("DELETE WHERE {?s ?p <" + t + ">}");
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
  async deleteRelationships(t, e) {
    if (n(t))
      throw Error(p);
    if (n(e))
      throw Error("Cannot have an empty predicate");
    await this.runUpdate(`DELETE WHERE {<${t}> <${e}> ?o . }`);
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
  async instantiate(t, e, s) {
    if (n(t))
      throw Error("Cannot have an empty cls");
    return e || (e = this.mintUri()), await this.insertTriple(e, this.rdfType, t, void 0, s), e;
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
  async getRelated(t, e) {
    var d;
    if (n(t))
      throw new Error(p);
    if (n(e))
      throw new Error(E);
    const s = `SELECT ?related WHERE {<${t}> ?pred ?related . ?pred <${this.rdfsSubPropertyOf}>* <${e}> .}`, r = await this.runQuery(s);
    return (d = r == null ? void 0 : r.results) != null && d.bindings ? r.results.bindings.map((f) => f.related.value) : [];
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
  async getRelating(t, e) {
    var h;
    if (n(t))
      throw new Error(p);
    if (n(e))
      throw new Error(E);
    const s = `SELECT ?relating WHERE {?relating ?pred <${t}> . ?pred <${this.rdfsSubPropertyOf}>* <${e}> . }`, r = await this.runQuery(s);
    return (h = r == null ? void 0 : r.results) != null && h.bindings ? r.results.bindings.map((d) => d.relating.value) : [];
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
l = new WeakSet(), y = function(t, e = "URI", s) {
  if (e === "URI")
    var r = `<${t}>`;
  else if (e == "LITERAL") {
    var r = `"${t}"`;
    s && (r = `${r}^^${s}`);
  } else
    throw new Error("unknown objectType");
  return r;
};
export {
  c as RDFProperty,
  v as RDFSResource,
  R as default,
  E as emptyPredicateErrorMessage,
  p as emptyUriErrorMessage,
  b as noColonInPrefixException,
  g as unknownPrefixException,
  L as unrecognisedIdField
};
