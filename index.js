const crypto = require('crypto');

//RdfService
//A fairly simple class that provides methods for creating, reading and deleting RDF triples
class RdfService {
    constructor(triplestoreUri,dataset,defaultUriStub) {
        this.rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        this.rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class"
        this.rdfsSubClassOf = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
        this.rdfsSubPropertyOf = "http://www.w3.org/2000/01/rdf-schema#subPropertyOf"
        this.rdfsLabel = "http://www.w3.org/2000/01/rdf-schema#label"
        this.rdfsComment = "http://www.w3.org/2000/01/rdf-schema#comment"
        this.owlClass = "http://www.w3.org/2002/07/owl#Class"
        this.rdfsDomain = "http://www.w3.org/2000/01/rdf-schema#domain"
        this.rdfsRange = "http://www.w3.org/2000/01/rdf-schema#range"
        this.rdfProperty = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"
        this.owlDatatypeProperty = "http://www.w3.org/2002/07/owl#DatatypeProperty"
        this.owlObjectProperty = "http://www.w3.org/2002/07/owl#ObjectProperty"
        this.telicentStyle = "http://telicent.io/ontology/style"

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

        if (!defaultUriStub) {
            this.defaultUriStub = "http://telicent.io/data/"
        }
        else
        {
            this.defaultUriStub = defaultUriStub
        }

        if (!dataset) {
            this.dataset = "ds"
        }
        else
        {
            this.dataset = dataset
        }
        if (!triplestoreUri) {
            this.triplestoreUri = "http://localhost:3030/"
        }
        else
        {
            this.triplestoreUri = triplestoreUri
        }
        this.queryEndpoint = triplestoreUri+dataset+"/query?query="
        this.updateEndpoint = triplestoreUri+dataset+"/update"
    }

    //runQuery
    //Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
    async runQuery(query) {
        const response = await fetch(this.queryEndpoint+escape(query))
        const ontojson = await response.json()
        return ontojson
    }

    //runUpdate
    //Sends a SPARQL update to the triplestore specified when the RdfService was initiated 
    //SPARQL endpoints don't tend to provide much feedback on success. The full response text is returned from this function however. 
    async runUpdate(updateQuery) {
        var postObject = {
            method: 'POST',
            headers: {//
                'Accept': '*/*',
                'Content-Type': 'application/sparql-update'
              },
            body: updateQuery
        }
        const response = await fetch(this.updateEndpoint,postObject)
        return response.text()
    }

    //in-built function to sort out type of object in a subject-predicate-object triple. 
    //returns a formatted string suitable for insertion into a SPARQL query
    //if the object is a literal, a valid xsd datatype can also be provided
    _checkObject(object,objectType,xsdDatatype) {
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
    async insertTriple(subject, predicate, object, objectType, xsdDatatype){
        var o = this._checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("INSERT DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }
    
    //deleteTriple
    //Performs a SPARQL update to delete the triples corresponding to the provided subject,predicate, object. 
    //Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
    //Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
    async deleteTriple(subject, predicate, object, objectType, xsdDatatype) {
        var o = this._checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("DELETE DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }

    //deleteNode
    //Careful with this one !  It removes all references to a URI - effectively deleting all trace of an node from the triplestore. 
    //If you only want to remove the outgoing references (i.e. not the triples where this is the object) from the node then set ignoreInboundReferences to true
    async deleteNode(uri,ignoreInboundReferences) {
        this.runUpdate("DELETE WHERE {<"+uri+"> ?p ?o . }")
        if (!ignoreInboundReferences) {
            this.runUpdate("DELETE WHERE {?s ?p <"+uri+">}")
        }
    }
    
    //instantiate
    //Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
    async instantiate(cls,uri) {
        if (!uri) {
            uri = this.defaultUriStub+crypto.randomUUID()
        }
        await this.insertTriple(uri,this.rdfType,cls)
        return uri
    }

    //addLabel
    //simple convenience function to add an rdfs:label to the given uri - simply pass in the label literal
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
    async addComment(uri,comment) {
        if (comment && (comment != "")) {
            this.insertTriple(uri,this.rdfsComment,comment,true)
        }
        else {
            throw new Error("invalid comment string")
        }
    }

}


class OntologyService extends RdfService {
    constructor(triplestoreUri,dataset,defaultUriStub) {
        if (!dataset) {
            dataset = "ontology"
        }
        if (!triplestoreUri) {
            triplestoreUri = "http://localhost:3030/"
        } //no idea why I have to do this here, should get caught in the superclass constructor. 
        if (!defaultUriStub) {
            defaultUriStub = "http://telicent.io/ontology/"
        }
        super(triplestoreUri,dataset,defaultUriStub)
    }

    newClass(uri,superClass,clsType) {
        if (!clsType) {
            clsType = this.rdfsClass
        }
        var cls = this.instantiate(clsType,uri)
        if ((superClass) && (superClass != "")) {
            this.addSuperClass(uri,superClass)
        }
        return cls
    }

    addSuperClass(subClass,superClass) {
        this.insertTriple(subClass,this.rdfsSubClassOf,superClass)
    }

    async getSubClasses(uri) {
        const query = "SELECT ?s ?p ?o WHERE {?s <"+this.rdfsSubClassOf+"> ?style .}"
    }

    async getStyle(uri) {
        const query = "SELECT ?style WHERE {<"+uri+"> <"+this.telicentStyle+"> ?style .}"
        const styles = await this.runQuery(query)
        var output = []
        if (styles && styles.results && styles.results.bindings) {
            for (var i in styles.results.bindings) {
                var stmt = styles.results.bindings[i]
                var st = stmt.style.value
                console.log(st)
                output.push(JSON.parse(unescape(st)))
            }
        }
        return output
    }

    setStyle(uri,backgroundColor, color, icon, faIcon, faUnicode, faClass) {
        var styleObj = {
            backgroundColor: backgroundColor,
            color: color,
            icon: icon,
            faIcon: faIcon,
            faUnicode: faUnicode,
            faClass: faClass
        }
        var styleStr = encodeURIComponent(JSON.stringify(styleObj))
        this.insertTriple(uri,this.telicentStyle,styleStr,true)
    }

    _makeElement() {
        return {
            rdfType:[],
            labels:[],
            comments:[],
            defaultStyle:{},
            predicates:{}
        }
    }

    _makeClass(elementID,output,subClass,superClass){
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

    _makeProperty(elementID,output,subProperty,superProperty, domain, range){
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
            this._makeClass(domain,output)
            output.allElements[domain].ownedProperties.push(elementID)
        }
        else if (range != null) {
            element.range.push(range)
            this._makeClass(range,output)
        }
    }


    //function that goes through ?s ?p ?o results and formats an object structure for js consumption
    async _buildResultsObject(query,getAllPredicates) {
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
                    output.allElements[o] = this._makeElement()
                }
    
                if (!(s in output.allElements)) {
                    output.allElements[s] = this._makeElement()
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
                if (p == this.telicentStyle) {
                    var styleObj = JSON.parse(unescape(o))
                    element.defaultStyle = styleObj
                }
                if (p == this.rdfsSubClassOf) {
                    this._makeClass(s,output,null,o)
                    this._makeClass(o,output,s)
                }
                else if (p == this.rdfsSubPropertyOf) {
                    this._makeProperty(s,output,null,o)
                    this._makeProperty(o,output,s)
                }
                else if (p == this.rdfsDomain) {
                    this._makeProperty(s,output,null,null,null,o)
                }
                else if (p == this.rdfsRange) {
                    this._makeProperty(s,output,null,null,null,null,o)
                }
                else if (p == this.rdfType) {
                    if ((o == this.rdfsClass) || (o == this.owlClass)){
                        this._makeClass(s,output,null,null,o)
                    }
                    else if ((o == this.rdfProperty) || (o ==this. owlDatatypeProperty) || (o == this.owlObjectProperty)){
                        this._makeProperty(s,output,null,null,o)
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
    async getAllElements(getAllPredicates) {
        var output = await this._buildResultsObject("SELECT * WHERE {?s ?p ?o}",getAllPredicates)

        output.top = []

        for (var i in output.classes) {
            var cls = output.classes[i]
            if (cls.superClasses.length == 0) {
                output.top.push(i)
            }
    
        }
    
        return output
    
    }

}

class IesService extends RdfService {
    constructor(triplestoreUri,dataset) {
        if (!dataset) {
            dataset = "knowledge" //knowledge *is* power
        }
        if (!triplestoreUri) {
            triplestoreUri = "http://localhost:3030/"
        } //no idea why I have to do this here, should get caught in the superclass constructor. 
        if (!defaultUriStub) {
            defaultUriStub = "http://telicent.io/data/"
        }
        super(triplestoreUri,dataset,defaultUriStub)
    }

}


function writeJson(jsonData){
    var fs = require('fs');
    fs.writeFile("test.json", JSON.stringify(jsonData,null,"  "), function(err) {
        if (err) {
            console.log(err);
        }
    });
}


obj = new OntologyService()

obj.getAllElements().then(writeJson)

obj.instantiate("http://cls").then(console.log)
obj.insertTriple("http://x","http://y","http://abc")

obj.deleteNode("http://abc")
