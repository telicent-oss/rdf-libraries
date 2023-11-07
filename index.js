const crypto = require('crypto');

//RdfService
//A fairly simple class that provides methods for creating, reading and deleting RDF triples
class RdfService {
    /**
     * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
     * @param {string="ds"} dataset - the dataset name in the triplestore
     * @param {string="http://telicent.io/data/"} defaultUriStub - the default stub to use when building GUID URIs
     * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/",dataset="ds",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {

        this.defaultSecurityLabel = defaultSecurityLabel
        this.dataset = dataset
        this.defaultUriStub = defaultUriStub
        this.triplestoreUri = triplestoreUri
        this.queryEndpoint = this.triplestoreUri+dataset+"/query?query="
        this.updateEndpoint = this.triplestoreUri+dataset+"/update"

        this.dc = "http://purl.org/dc/elements/1.1/"
        this.xsd = "http://www.w3.org/2001/XMLSchema#"
        this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        this.rdfs = "http://www.w3.org/2000/01/rdf-schema#"
        this.owl = "http://www.w3.org/2002/07/owl#"
        this.telicent = "http://telicent.io/ontology/"

        this.sparqlPrefixes = `PREFIX xsd: <${this.xsd}>  PREFIX dc: <${this.dc}> PREFIX rdf: <${this.rdf}> PREFIX rdfs: <${this.rdfs}> PREFIX owl: <${this.owl}> PREFIX telicent: <${this.telicent}> `

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

        this.objectTypes = [
            "URI",
            "LITERAL"
        ]

        this.xsdDatatypes = [
            "xsd:string", //	Character strings (but not all Unicode character strings)
            "xsd:boolean",  // true / false
            "xsd:decimal", // Arbitrary-precision decimal numbers
            "xsd:integer", // Arbitrary-size integer numbers
            "xsd:double", // 	64-bit floating point numbers incl. ±Inf, ±0, NaN
            "xsd:float", // 	32-bit floating point numbers incl. ±Inf, ±0, NaN
            "xsd:date", // 	Dates (yyyy-mm-dd) with or without timezone
            "xsd:time", // 	Times (hh:mm:ss.sss…) with or without timezone
            "xsd:dateTime", // 	Date and time with or without timezone
            "xsd:dateTimeStamp", // Date and time with required timezone
            "xsd:gYear", // 	Gregorian calendar year
            "xsd:gMonth", // 	Gregorian calendar month
            "xsd:gDay", // 	Gregorian calendar day of the month
            "xsd:gYearMonth", // 	Gregorian calendar year and month
            "xsd:gMonthDay", // 	Gregorian calendar month and day
            "xsd:duration", // 	Duration of time
            "xsd:yearMonthDuration", //	Duration of time (months and years only)
            "xsd:dayTimeDuration",	//Duration of time (days, hours, minutes, seconds only)
            "xsd:byte",	//-128…+127 (8 bit)
            "xsd:short", //	-32768…+32767 (16 bit)
            "xsd:int", //	-2147483648…+2147483647 (32 bit)
            "xsd:long",	//-9223372036854775808…+9223372036854775807 (64 bit)
            "xsd:unsignedByte", //	0…255 (8 bit)
            "xsd:unsignedShort", //	0…65535 (16 bit)
            "xsd:unsignedInt", //	0…4294967295 (32 bit)
            "xsd:unsignedLong", //	0…18446744073709551615 (64 bit)
            "xsd:positiveInteger", //	Integer numbers >0
            "xsd:nonNegativeInteger", //	Integer numbers ≥0
            "xsd:negativeInteger", //	Integer numbers <0
            "xsd:nonPositiveInteger", //	Integer numbers ≤0
            "xsd:hexBinary", //	Hex-encoded binary data
            "xsd:base64Binary", //	Base64-encoded binary data
            "xsd:anyURI", //	Absolute or relative URIs and IRIs
            "xsd:language", //	Language tags per [BCP47]
            "xsd:normalizedString", //	Whitespace-normalized strings
            "xsd:token", //	Tokenized strings
            "xsd:NMTOKEN", //	XML NMTOKENs
            "xsd:Name", //	XML Names
            "xsd:NCName"
        ]
    
    }


    //runQuery
    //Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
    /**
     * @param {string} query - A valid SPARQL query
     * @returns {object} the results of the query in standard SPARQL JSON results format
    */    
    async runQuery(query) {
        const response = await fetch(this.queryEndpoint+escape(this.sparqlPrefixes + query))
        const ontojson = await response.json()
        return ontojson
    }

    //runUpdate
    //Sends a SPARQL update to the triplestore specified when the RdfService was initiated 
    //SPARQL endpoints don't tend to provide much feedback on success. The full response text is returned from this function however. 
    /**
     * @param {string} updateQuery - A valid SPARQL update query
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {string} the response text from the triplestore after running the update
    */    
    async runUpdate(updateQuery,securityLabel) {
        if (securityLabel == undefined) {
            securityLabel = this.defaultSecurityLabel
        }
        var postObject = {
            method: 'POST',
            headers: {//
                'Accept': '*/*',
                'Security-Label':securityLabel,
                'Content-Type': 'application/sparql-update'
              },
            body: this.sparqlPrefixes + updateQuery
        }
        const response = await fetch(this.updateEndpoint,postObject)
        return response.text()
    }

    //in-built function to sort out type of object in a subject-predicate-object triple. 
    //returns a formatted string suitable for insertion into a SPARQL query
    //if the object is a literal, a valid xsd datatype can also be provided
    /**
     * @param {string} object - the triple object (third position in a triple) to be prepared
     * @param {string} objectType - the type of the provided object - either URI or LITERAL. Blank nodes are not supported because they're a really stupid idea.
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @returns {string} a SPARQL component for a triple that is either formatted as a literal or a URI
    */    
    #checkObject(object,objectType,xsdDatatype) {
        if (objectType == undefined) {
            objectType = "URI"
        }
        if (!(this.objectTypes.includes(objectType))) {
            throw new Error('objectType parameter must be one of "URI" or "LITERAL". Null value will be interpreted as "URI"')
        }
        else if (objectType == "URI"){
            var o = "<"+object+">"
        }
        else if (objectType == "LITERAL"){
            var o = '"'+object+'"'
            if ((xsdDatatype) && (xsdDatatype != ""))
            {
                if (this.xsdDatatypes.includes(xsdDatatype)) {
                    o = o + "^^" + xsdDatatype
                }
                else
                {
                    throw new Error("invalid xsd:datatype provided - see RDF 1.1 specification")
                }
            }
        }
        else {
            throw new Error('unknown objectType')
        }
        return o
    }

    //insertTriple
    //Performs a SPARQL update to insert the provided subject,predicate, object triple. 
    //Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
    //Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
    /**
     * @param {string} subject - The first position in the triple (the SUBJECT)
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param {string} objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not supported because we want the world to be a better place
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {object} the results of the query in standard SPARQL JSON results format
    */    
    async insertTriple(subject, predicate, object, objectType, xsdDatatype,securityLabel){
        var o = this.#checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("INSERT DATA {<"+subject+"> <" + predicate + "> " + o + " . }",securityLabel)
    }
    
    //deleteTriple
    //Performs a SPARQL update to delete the triples corresponding to the provided subject,predicate, object. 
    //Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
    //Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
    /**
     * @param {string} subject - The first position in the triple (the SUBJECT)
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param {string} objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not support because, why would you.
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @returns {string} the http response text from the server
    */    
    async deleteTriple(subject, predicate, object, objectType, xsdDatatype) {
        var o = this.#checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("DELETE DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }

    //deleteNode
    //Careful with this one !  It removes all references to a URI - effectively deleting all trace of an node from the triplestore. 
    //If you only want to remove the outgoing references (i.e. not the triples where this is the object) from the node then set ignoreInboundReferences to true
    /**
     * @param {string} uri - The uri of the Node you want to get rid of
     * @param {boolean=false} ignoreInboundReferences - if set to true, this will not delete any triples that refer to the node 
    */    
    async deleteNode(uri,ignoreInboundReferences=false) {
        this.runUpdate("DELETE WHERE {<"+uri+"> ?p ?o . }")
        if (!ignoreInboundReferences) {
            this.runUpdate("DELETE WHERE {?s ?p <"+uri+">}")
        }
    }

    //deleteRelationships
    //deletes all triples that match the pattern <uri> <predicate> <ALL>
    /**
     * @param {string} uri - The uri of the subject of the triples you want remove
     * @param {string} predicate - the predicate to match for all triples being removed 
    */    
    async deleteRelationships(uri,predicate) {
        this.runUpdate(`DELETE WHERE {<${uri}> <${predicate}> ?o . }`)
    }
    
    //instantiate
    //Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
    /**
     * @param {string} cls - The class (uri of an rdfs:Class or owl:Class) that is to be instantiated
     * @param {string} uri - The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {string} the URI of the instantiated item
    */    
    async instantiate(cls,uri,securityLabel) {
        if (!uri) {
            uri = this.defaultUriStub+crypto.randomUUID()
        }
        await this.insertTriple(uri,this.rdfType,cls,null,null,securityLabel)
        return uri
    }

    //addLiteral
    /**
     * @param {string} uri - The uri of the subject of the literal
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} text - the literal to be assigned to the triple
    */    
    async addLiteral(uri,predicate,text,deletePrevious = false) {
        if (label && (label != "")) {
            if (deletePrevious) {
                await this.deleteRelationships(uri,predicate)
            }
            this.insertTriple(uri,predicate,text,true)
        }
        else {
            throw new Error("invalid literal string")
        }        
    }

    //addLabel
    //simple convenience function to add an rdfs:label to the given uri - simply pass in the label literal
    /**
     * @param {string} uri - The uri of the subject of the label
     * @param {string} label - the literal text of the rdfs:label
    */    
    async addLabel(uri,label) {
        if (label && (label != "")) {
            this.insertTriple(uri,this.rdfsLabel,label,true)
        }
        else {
            throw new Error("invalid label string")
        }
    }

    //addComment
    //simple convenience function to add an rdfs:comment to the given uri - simply pass in the comment literal
    /**
     * @param {string} uri - The uri of the subject of the comment
     * @param {string} comment - the literal text of the rdfs:comment
    */    
    async addComment(uri,comment) {
        if (comment && (comment != "")) {
            this.insertTriple(uri,this.rdfsComment,comment,true)
        }
        else {
            throw new Error("invalid comment string")
        }
    }

    //getRelated
    //Simple function to get all objects related to the uri by a predicate
    /**
     * @param {string} uri - The uri of the subject
     * @param {string} predicate - the predicate relating to the objects that are returned
     * @returns {Array} - an array of related items (each is a string - may be a URI or a literal)
    */    
    async getRelated(uri,predicate) {
        if (!uri) {
            throw new Error("URI must be provided")
        }
        if (!predicate) {
            throw new Error("predicate must be provided")
        }

        var query = `SELECT ?related WHERE {<${uri}> ?pred ?related . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> .}`

        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.push(stmt.related.value)
            }
        }
        return output
    }

    //getRelating
    //Simple function to get all subjects relating to the uri by a predicate - i.e. reverse relationships
    /**
     * @param {string} uri - The uri of the subject
     * @param {string} predicate - the predicate relating to the objects that are returned
     * @returns {Array} - an array of relating items (URIs, as strings). By relating, we mean those that point back at the uri
    */    
    async getRelating(uri,predicate) {
        if (!uri) {
            throw new Error("URI must be provided")
        }
        if (!predicate) {
            throw new Error("predicate must be provided")
        }
        var query = `SELECT ?relating WHERE {?relating ?pred <${uri}> . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> . }`
        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.push(stmt.relating.value)
            }
        }
        return output
    }
}

//OntologyService
// - and RdfService for managing ontology elements (RDFS and OWL)
class OntologyService extends RdfService {
    /**
     * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
     * @param {string="ontology"} dataset - the dataset name in the triplestore
     * @param {string="http://telicent.io/ontology/"} defaultUriStub - the default stub to use when building GUID URIs
     * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */

    constructor(triplestoreUri = "http://localhost:3030/",dataset="ontology",defaultUriStub="http://telicent.io/ontology/", defaultSecurityLabel="") {

        super(triplestoreUri,dataset,defaultUriStub, defaultSecurityLabel)
        this.telDiagram = this.telicent+"Diagram"
        this.telUUID = this.telicent+"uuid"
        this.telTitle = this.telicent+"title"
        this.telElementStyle = this.telicent+"elementStyle"
        this.telInDiagram = this.telicent+"inDiagram"
        this.telRepresents = this.telicent+"represents"
        this.telDiagramElement = this.telicent+"DiagramElement"
        this.telDiagramRelationship = this.telicent+"DiagramRelationship"
        this.telSourceElem = this.telicent+"sourceElem"
        this.telTargetElem = this.telicent+"targetElem"
    }

    //newClass
    //Creates a new Class (default rdfs:Class - override via clsType parameter)
    //if it's a subclass of another class, then provide this via the superClass parameter
    //optionally add a style object if needed
    /**
     * @param {string} uri - The uri of the new class
     * @param {string} superclass - the parent (superclass) of the new class
     * @param {object} styleObject - pass in a style object (call makeStyleObject to get a new one)
     * @returns {string} - the uri of the new class (which you've already provided...I know...I know...)
    */    
    newClass(uri,superClass,clsType = this.rdfsClass, styleObject) {
        var cls = this.instantiate(clsType,uri)
        if ((superClass) && (superClass != "")) {
            this.addSuperClass(uri,superClass)
        }
        if (styleObject) {
            this.setStyle(uri,styleObject)
        }
        return cls
    }

    //getClass
    //brings back a class object that collects together all the useful info about the class - parameters:
    //uri - the uri of the class
    //getAllPredicates - set to false if you don't want the raw predicate info
    //getSubClasses - set to false if you're not interested in its subclasses (this would require another to the database)
    //getDomainProperties - set to false to ignore properties whose domain is this class - again requires an additional query to database
    //getInheritedDomainProperties - another parameter that if true (default) fires another query
    //if this is being heavily used, you might want to set some of the paramters to false if you don't need them
    //...especially if you're calling lots of getClass calls, it might be quicker to call getAllElements()
    /**
     * @param {string} uri - The uri of the class to fetch
     * @param {boolean=true} getAllPredicates - if true, it brings back all the related items. Set to false if you just need the basic info back
     * @param {boolean=true} getSubClasses - runs a second query to get all the subclasses of the class. Set to false if you don't need it - saves traffic
     * @param {boolean=true} getDomainProperties - runs a second query to get all the properties whose domain is this class
     * @returns {object} - an object describing the class
    */    
    async getClass(uri,getAllPredicates=true,getSubClasses=true,getDomainProperties = true) {
        var query = `SELECT ?s ?p ?o WHERE {<${uri}> ?p ?o .  BIND (IRI("${uri}") as ?s) }`
        const ontojson = await this.runQuery(query)
        var element = this.#makeElement(uri)
        element["ownedProperties"] = []
        element["superClasses"] = []

        if (ontojson && ontojson.results && ontojson.results.bindings) {
            for (var i in ontojson.results.bindings) {
                var stmt = ontojson.results.bindings[i]
                var s = stmt.s.value
                var p = stmt.p.value
                var o = stmt.o.value
                
                if (getAllPredicates) {
                    if (!(p in element["predicates"])) {
                        element["predicates"][p] = [o]
                    }
                    else
                    {
                        element["predicates"][p].push(o)
                    }
                }
                if (p == this.telicentStyle) {
                    var styleObj = JSON.parse(unescape(o))
                    element.defaultStyle = styleObj
                }
                if (p == this.rdfsSubClassOf) {
                    element.superClasses.push(o)
                }
                else if (p == this.rdfType) {
                    element.rdfType.push(o)
                }
                else if (p == this.rdfsLabel) {
                    element.labels.push(o)
                }
                else if (p == this.rdfsComment) {
                    element.comments.push(o)
                }
            }
        }
        if (getSubClasses) {
            element.subClasses = await this.getSubClasses(uri)
        }
        if (getDomainProperties) {
            element.ownedProperties = await this.getDomainProperties(uri)
        }
        return element
    }

    //getDomainProperties
    //returns all properties which have this class as their domain
    /**
     * @param {string} uri - The uri of the class which is the domain for the properties returned
     * @returns {Array} - an array of properties whose domain is this class
    */    
    async getDomainProperties(uri) {
        return await this.getRelating(uri,this.rdfsDomain)
    }

    //getRangeProperties
    //returns all properties which have this class as their range
    /**
     * @param {string} uri - The uri of the class which is the range for the properties returned
     * @returns {Array} - an array of properties whose range is this class
    */    
    async getRangeProperties(uri) {
        return await this.getRelating(uri,this.rdfsRange)
    }

    //getInheritedDomainProperties
    //returns all properties defined (domain) against the superclasses of the provided class
    /**
     * @param {string} uri - The uri of the class (or subclass) which is the domain for the properties returned
     * @returns {Array} - an array of properties whose domain is this class or one of its superclasses
    */    
    async getInheritedDomainProperties(uri) {
        var query = `SELECT ?prop ?item WHERE {?prop <${this.rdfsDomain}> ?item . <${uri}> <${this.rdfsSubClassOf}>* ?item. }`
        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {

            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                if (stmt.item.value != uri) {
                    output.push({property:stmt.prop.value,domain:stmt.item.value})
                }
            }
        }
        return output
    }

    //getInheritedRangeProperties
    //returns all properties defined (range) against the superclasses of the provided class
    /**
     * @param {string} uri - The uri of the class (or subclass) which is the range for the properties returned
     * @returns {Array} - an array of properties whose range is this class or one of its superclasses
    */    
    async getInheritedRangeProperties(uri) {
        var query = `SELECT ?prop ?item WHERE {?prop <${this.rdfsRange}> ?item . <${uri}> <${this.rdfsSubClassOf}>* ?item. }`
        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {

            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                if (stmt.item.value != uri) {
                    output.push({property:stmt.prop.value,domain:stmt.item.value})
                }
            }
        }
        return output
    }

    //addSubClass
    //instantiates an rdfs:subClassOf relationship between two classes
    /**
     * @param {string} subClass - The subclass that is to be related to the superclass using rdfs:subClassOf
     * @param {string} superClass - The superclass that is to be related to the subclass using rdfs:subClassOf
    */    
    addSubClass(subClass,superClass) {
        this.insertTriple(subClass,this.rdfsSubClassOf,superClass)
    }

    //getSubClasses
    //Returns a list of all the subclasses of the provided class
    //If your ontology uses any subproperties of rdfs:subClassOf then it will also return those too...unless you set ignoreSubProps
    /**
     * @param {string} uri - The uri of the class whose subclasses are returned
     * @returns {Array} - an array of subclasses
    */    
    async getSubClasses(uri) {
        return await this.getRelating(uri,this.rdfsSubClassOf)
    }

    //getSuperClasses
    //Returns a list of all the superclasses of the provided class
    //If your ontology uses any subproperties of rdfs:subClassOf then it will also return those too...unless you set ignoreSubProps
    //If you want to get all the supers going all the way to the top (i.e. transitively climbing up the hierarchy) then set getAll to true
    /**
     * @param {string} uri - The uri of the class whose subclasses are returned
     * @param {boolean} ignoreSubProps - set to true to ignore all subproperties of rdfs:subClassOf. Most ontologies don't do this, but IES, BORO and IDEAS do...
     * @param {boolean} getAll - set to true to chase up the transitive hierarchy and get all the other levels of superclass (you might get a lot of these !)
     * @returns {Array} - an array of superclasses
    */    
    async getSuperClasses(uri,ignoreSubProps = false, getAll = false) {
        if (getAll) {
            var pathOp = "*"
        } 
        else {
            var pathOp = ""
        }
        if (ignoreSubProps) {
            var query = `SELECT ?super WHERE {<${uri}> <${this.rdfsSubClassOf}>${pathOp} ?super .}`
        }
        else {
            var query = `SELECT ?super WHERE {<${uri}> ?subRel${pathOp} ?super . ?subRel <${this.rdfsSubPropertyOf}>* <${this.rdfsSubClassOf}> .}`
        }
        console.log(query)
        var output = []
        var spOut = await this.runQuery(query)
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.push(stmt.super.value)
            }
        }
        return output
    }

    //getStyles
    //returns a dictionary object of styles for each specified class. If no classes are specified, it will get all the styles for every class it finds with style
    //pass the classes in as an array of URIs
    /**
     * @param {Array} classes - An array of URIs (strings) of the classes whose styles are required
     * @returns {object} - a dictionary keyed by the class URIs, with the values being style objects
    */    
    async getStyles(classes = []) {
        var filter = ""
        if (!Array.isArray(classes)) {
            throw new Error("classes parameter must be an array")
        }
        else if (classes.length > 0){
            filter = 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )';
        }
        var query = `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`
        var output = {}
        var spOut = await this.runQuery(query)
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output[stmt.cls.value] = JSON.parse(unescape(stmt.style.value))
            }
        }
        return output
    }

    //makeStyleObject
    //creates a js object with the provided colours, icons, etc. If you leave them unset, they'll default to the grey box.
    /**
     * @param {string = "#888"} backgroundColor - An array of URIs (strings) of the classes whose styles are required
     * @param {string = "#000"} color - An array of URIs (strings) of the classes whose styles are required
     * @param {string = "ri-question-mark"} icon - Legacy feature - an alternative remix icon ID for older apps that still use remix. This will be deprecated in future versions
     * @param {string ="fa-solid fa-question"} faIcon - The font awesome icon string
     * @param {string = "\u003f"} faUnicode - The unicode representation of the font awesome icon
     * @param {string="fa-solid"} faClass - The class string of font awesome icon - usually this also included in the faIcon string
     * @returns {object} - a style object for use in other methods
    */    
    makeStyleObject(backgroundColor = "#888", color ="#000", icon="ri-question-mark", faIcon="fa-solid fa-question", faUnicode="\u003f", faClass="fa-solid") {
        return {
            backgroundColor: backgroundColor,
            color: color,
            icon: icon,
            faIcon: faIcon,
            faUnicode: faUnicode,
            faClass: faClass
        }
    }

    //setStyle
    //sets the default style for a class. Deletes any previous styles
    /**
     * @param {string} uri - The URI of the class that have the style assigned
     * @param {object} styleObj - A style object for the class - call makeStyleObject to get one
    */    
    setStyle(uri,styleObj) {
        var styleStr = encodeURIComponent(JSON.stringify(styleObj))
        this.deleteRelationships(uri,this.telicentStyle)
        this.insertTriple(uri,this.telicentStyle,styleStr,"LITERAL")
    }

    //#makeElement - built-in function to create an empty element object
    #makeElement(uri) {
        return {
            uri:uri,
            rdfType:[],
            labels:[],
            comments:[],
            defaultStyle:{},
            predicates:{}
        }
    }

    //#makeClass - built-in function for handling elements that are classes
    #makeClass(elementID,output,subClass,superClass){
        if (!(elementID in output.allElements)) {
            output.allElements[elementID] = {predicates:{}}
        }
        var element = output.allElements[elementID]
        if (!(elementID in output.classes)) {
            element["ownedProperties"] = []
            element["subClasses"] = []
            element["superClasses"] = []
            output.classes[elementID] = element
        }
        if (subClass != null) {
            element.subClasses.push(subClass)
        }
        else if (superClass != null) {
            element.superClasses.push(superClass)
        }
    }

    //#makeProperty - a built-in function to handle elements that are property definitions
    #makeProperty(elementID,output,subProperty,superProperty, domain, range){
        if (!(elementID in output.allElements)) {
            output.allElements[elementID] = {predicates:{}}
        }
        var element = output.allElements[elementID]
        if (!(elementID in output.properties)) {
            element["subProperties"] = []
            element["superProperties"] = []
            element["domain"] = []
            element["range"] = []
            output.properties[elementID] = element
        }
        if (subProperty != null) {
            element.subProperties.push(subProperty)
        }
        else if (superProperty != null) {
            element.superProperties.push(superProperty)
        }
        else if (domain != null) {
            element.domain.push(domain)
            this.#makeClass(domain,output)
            output.allElements[domain].ownedProperties.push(elementID)
        }
        else if (range != null) {
            element.range.push(range)
            this.#makeClass(range,output)
        }
    }


    //#flatOut()
    //Simplest, default format for SPARQL returns
    #flatOut(spOut, returnFirstObj=false) {
        output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                obj = {}
                for (var j in spOut.head.vars) {
                    var v = spOut.head.vars[j]
                    if ((v in stmt) && (stmt[v])) {
                        obj[v] = stmt[v].value
                    }
                }
                output.push(stmt.relating.value)
            }
        }
        if (returnFirstObj) {
            return output[0]
        }
        else {
            return output
        }
    }

    //function that goes through ?s ?p ?o results and formats an object structure for js consumption
    async #buildResultsObject(query,getAllPredicates) {
        const ontojson = await this.runQuery(query)
        var output = {
            allElements:{},
            properties:{},
            classes:{},
        }
        if (ontojson && ontojson.results && ontojson.results.bindings) {
            for (var i in ontojson.results.bindings) {
                var stmt = ontojson.results.bindings[i]
                var s = stmt.s.value
                var p = stmt.p.value
                var o = stmt.o.value
                if ((stmt.o.type != "literal") && !(o in output.allElements))
                {
                    output.allElements[o] = this.#makeElement(o)
                }
    
                if (!(s in output.allElements)) {
                    output.allElements[s] = this.#makeElement(s)
                }
                var element = output.allElements[s]
                
                if (getAllPredicates) {
                    if (!(p in element["predicates"])) {
                        element["predicates"][p] = [o]
                    }
                    else
                    {
                        element["predicates"][p].push(o)
                    }
                }
                if ((p == this.telicentStyle) && (o) && (o != "undefined")) {
                    var styleObj = JSON.parse(unescape(o))
                    element.defaultStyle = styleObj
                }
                if (p == this.rdfsSubClassOf) {
                    this.#makeClass(s,output,null,o)
                    this.#makeClass(o,output,s)
                }
                else if (p == this.rdfsSubPropertyOf) {
                    this.#makeProperty(s,output,null,o)
                    this.#makeProperty(o,output,s)
                }
                else if (p == this.rdfsDomain) {
                    this.#makeProperty(s,output,null,null,null,o)
                }
                else if (p == this.rdfsRange) {
                    this.#makeProperty(s,output,null,null,null,null,o)
                }
                else if (p == this.rdfType) {
                    if ((o == this.rdfsClass) || (o == this.owlClass)){
                        this.#makeClass(s,output,null,null,o)
                    }
                    else if ((o == this.rdfProperty) || (o ==this. owlDatatypeProperty) || (o == this.owlObjectProperty)){
                        this.#makeProperty(s,output,null,null,o)
                    }
                    element.rdfType.push(o)
                }
                else if (p == this.rdfsLabel) {
                    element.labels.push(o)
                }
                else if (p == this.rdfsComment) {
                    element.comments.push(o)
                }
            }
        }
        return output
    }
    
    //This is a function that gets every triple in the ontology dataset and shapes it into an object that holds all the properties and classes.
    //It also provides a list of all the top-of-the-shop classes in the ontology hierarchy and a dictionary of all elements
    //Set getAllPredicates to true if you want all predicates in the ontology - the object gets approximately 2x the size if you do this though - it doesn't affect the server though, so just need to consider browser memory
    //Don't stringify the returned object as JSON, it'll get huge as there is a lot of repeating use of object references 
    /**
     * @param {boolean=false} getAllPredicates - if true this will return all predicates owned by the element, not just the essential ones
     * @returns {Array} array of classes and properties that are in the ontology
    */    
    async getAllElements(getAllPredicates=false) {
        var output = await this.#buildResultsObject("SELECT * WHERE {?s ?p ?o}",getAllPredicates)
        output.top = []

        for (var i in output.classes) {
            var cls = output.classes[i]
            if (cls.superClasses.length == 0) {
                output.top.push(i)
            }
    
        }
    
        return output
    }



    //getAllDiagrams
    //returns a list of all the ODM UML diagrams in the triplestore
    /**
     * @returns {Array} array of objects summarising all the diagrams
    */    
    async getAllDiagrams() {
        var query = `SELECT ?uri ?uuid ?title WHERE {
            ?uri a <${this.telDiagram}> . 
            OPTIONAL {?uri <${this.telUUID}> ?uuid} 
            OPTIONAL {?uri <${this.telTitle}> ?title } 
        }`
        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                var diag = {uri:stmt.uri.value}
                if (stmt.title){
                    diag.title = stmt.title.value
                }
                if (stmt.uuid){
                    diag.uuid = stmt.uuid.value
                }
                output.push(diag)
            }
        }
        return output
    }

    //getDiagram()
    //fetches all info about a given diagram - all the elements and relationships in it
    /**
     * @param {boolean=false} uri - the uri of the diagram
     * @returns {object} an object containing all the information about the diagram
    */    
    async getDiagram(uri) {
        var query = `
        SELECT ?uuid ?title ?diagElem ?elem ?elemStyle ?diagRel ?rel ?source ?target WHERE {
            <${uri}> a <${this.telDiagram}> . 
            OPTIONAL {<${uri}> <${this.telUUID}> ?uuid} 
            OPTIONAL {<${uri}> <${this.telTitle}> ?title } 
            OPTIONAL {
                ?diagElem <${this.telInDiagram}> <${uri}> .
                ?diagElem a <${this.telDiagramElement}> .
                ?diagElem <${this.telElementStyle}> ?elemStyle .
                ?diagElem <${this.telRepresents}> ?elem
            }
            OPTIONAL {
                ?diagRel <${this.telInDiagram}> <${uri}> .
                ?diagRel a <${this.telDiagramRelationship}> .
                ?diagRel <${this.telRepresents}> ?rel .
                ?diagRel <${this.telSourceElem}> ?source .
                ?diagRel <${this.telTargetElem}> ?target .
            }
        }`
        var spOut = await this.runQuery(query)
        var output = {uri:uri,uuid:'',title:'',diagramElements:{},diagramRelationships:{}}
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.title = stmt.title.value
                output.uuid = stmt.uuid.value
                if (!(stmt.diagElem.value in output.diagramElements)) {
                    output.diagramElements[stmt.diagElem.value] = {style:{}}
                }
                output.diagramElements[stmt.diagElem.value].element = stmt.elem.value
                output.diagramElements[stmt.diagElem.value].style = JSON.parse(unescape(stmt.elemStyle.value))
                if (!(stmt.diagRel.value in output.diagramRelationships)) {
                    output.diagramRelationships[stmt.diagRel.value] = {}
                }
                output.diagramRelationships[stmt.diagRel.value].relationship = stmt.rel.value
                output.diagramRelationships[stmt.diagRel.value].source = stmt.source.value
                output.diagramRelationships[stmt.diagRel.value].target = stmt.target.value
            }
        }
        return output
    }

    /**
     * @param {string} title - the title of the diagram (mandatory)
     * @param {string} uri - if unset, a new URI will be minted, and will be based on the UUID 
     * @param {string} uuid - if unset, a new UUID will be minted
     * @param {string} securityLabel - the security label enforced by the CORE platform
    */    
    newDiagram(title,uri,uuid,securityLabel) {
        if (!uuid) {
            uuid = crypto.randomUUID()
        }
        if (!uri) {
            uri = this.defaultUriStub+uuid
        }        
        this.instantiate(this.telDiagram,uri,securityLabel)
        this.setTitle(uri,title)
        this.addLiteral(uri,this.telUUID,uuid)
    }


    /**
     * @param {string} uri - the URI of the diagram
     * @param {string} title - the telicent:title to be applied to the diagram - this will remove any previous title.
    */    
    setTitle(uri,title){
        this.addLiteral(uri,this.telTitle,title,true)
    }



}



class IesService extends RdfService {
    constructor(triplestoreUri = "http://localhost:3030/",dataset="knowledge",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {
        super(triplestoreUri,dataset,defaultUriStub,defaultSecurityLabel)
        this.ies = "http://ies.data.gov.uk/ontology/ies4#"
        this.iesAssessment = this.ies+"Assessment"
        this.iesEvent = this.ies+"Event"
        this.iesState = this.ies+"State"
        this.ies_isPartOf = this.ies+"isPartOf"
        this.ies_isStateOf = this.ies+"isStateOf"
    }

    addPart(element, part, partRelType=this.ies_isPartOf){
        this.insertTriple(part,partRelType,element,"URI")
    }

    createState(element, stateType=this.iesState, stateRelType=this.ies_isStateOf, securityLabel){
        state = this.instantiate(stateType,stateUri,securityLabel)
        this.insertTriple(state,stateRelType,element,"URI","",securityLabel)

    }

    # adds a state to an item
    def add_state(self, state_type: Optional[str] = None, state_uri: Optional[str] = None,
                     state_rel: Optional[str] = None, start: Optional[str] = None, end: Optional[str] = None,
                     in_location: Optional[str] = None) -> BaseExchangedItem:

        if not state_type:
            state_type = self._default_state_type

        from ies_tool.ies_temporal_classes import BaseState
        state = BaseState(self._tool, start=start, end=end, uri=state_uri, classes=[state_type])

        if not state_rel:
            state_rel = "http://ies.data.gov.uk/ontology/ies4#isStateOf"

        self._tool.add_to_graph(subject=state._uri, predicate=state_rel, object=self._uri)

        if in_location is not None:
            state.in_location(in_location)
        return state

    createEvent(uri,event_start, event_end, cls = this.iesEvent,telicent_primary_name="",securityLabel) {
        var event = this.instantiate(cls,uri,securityLabel)
    }



}


class ParalogService extends IesService {
    constructor(triplestoreUri = "http://localhost:3030/",dataset="knowledge",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {
        super(triplestoreUri,dataset,defaultUriStub,defaultSecurityLabel)
    }
    async getAssessments() {
        query = `SELECT ?uri ?name (COUNT(?asset) AS ?numberOfAssessedItems)
        WHERE {
            ?uri a ies:CarverAssessment .
            ?uri ies:hasName ?cAssNameObj .
            ?cAssNameObj ies:representationValue ?name .
            OPTIONAL {
                ?uri ies:assessed ?asset
            }
        }
        GROUP BY ?uri ?name
    `
    
    }
}

//testing functions - please ignore these !


function writeJson(jsonData){
    var fs = require('fs');
    fs.writeFile("test.json", JSON.stringify(jsonData,null,"  "), function(err) {
        if (err) {
            console.log(err);
        }
    });
}


obj = new OntologyService()

obj.getAllElements().then(console.log)

obj.instantiate("http://cls").then(console.log)

/*
obj.insertTriple("http://x","http://y","http://abc")

obj.insertTriple("http://x","http://yy","test","LITERAL","xsd:string")

obj.deleteNode("http://abc")

obj.setStyle('http://ies.data.gov.uk/ontology/ies4#PersonalRadioHandset')

obj.getStyles(['http://ies.data.gov.uk/ontology/ies4#PersonalRadioHandset','http://ies.data.gov.uk/ontology/ies4#Crossing']).then(console.log)

obj.getSubClasses('http://ies.data.gov.uk/ontology/ies4#Asset').then(console.log)

obj.getSuperClasses('http://ies.data.gov.uk/ontology/ies4#Asset',true).then(console.log)

obj.getClass('http://ies.data.gov.uk/ontology/ies4#Entity').then(console.log)

obj.getDiagram('http://ies.data.gov.uk/diagrams#EAID_5DF03A2C_F6DF_4433_82D5_7E5C14B6045C').then(console.log)
*/