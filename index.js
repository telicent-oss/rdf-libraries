
//RdfService
//A fairly simple class that provides methods for creating, reading and deleting RDF triples
class RdfService {
    constructor(triplestoreUri,dataset) {
        this.rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        this.rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class"
        this.rdfsSubClassOf = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
        this.rdfsSubPropertyOf = "http://www.w3.org/2000/01/rdf-schema#subPropertyOf"
        this.owlClass = "http://www.w3.org/2002/07/owl#Class"
        this.rdfsDomain = "http://www.w3.org/2000/01/rdf-schema#domain"
        this.rdfsRange = "http://www.w3.org/2000/01/rdf-schema#range"
        this.rdfProperty = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"
        this.owlDatatypeProperty = "http://www.w3.org/2002/07/owl#DatatypeProperty"
        this.owlObjectProperty = "http://www.w3.org/2002/07/owl#ObjectProperty"

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

    async runQuery(query) {
        const response = await fetch(this.queryEndpoint+query)
        const ontojson = await response.json()
        return ontojson
    }

    async runUpdate(updateQuery) {
        postObject = {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/sparql-update'
              },
            body: updateQuery
        }
        const response = await fetch(updateEndpoint,postObject)
        return response.text()
    }

    async insertTriple(subject, predicate, object, isLiteral){
        if (isLiteral) {
            o = '"'+object+'"'
        }
        else {
            o = "<"+object+">"
        }
        return await runUpdate("INSERT DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }
    
    async deleteTriple(subject, predicate, object, isLiteral) {
        if (isLiteral) {
            o = '"'+object+'"'
        }
        else {
            o = "<"+object+">"
        }
        return await runUpdate("DELETE DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }
    
    async instantiate(uri,cls) {
        return await insertTriple(uri,rdfType,cls)
    }
}

class OntologyService extends RdfService {
    constructor(triplestoreUri,dataset) {
        if (!dataset) {
            dataset = "ontology"
        }
        if (!triplestoreUri) {
            triplestoreUri = "http://localhost:3030/"
        } //no idea why I have to do this here, should get caught in the superclass constructor. 
        super(triplestoreUri,dataset)
    }

    makeClass(elementID,output,subClass,superClass,rdfType){
        if (!(elementID in output.allElements)) {
            output.allElements[elementID] = {predicates:{}}
        }
        var element = output.allElements[elementID]
        if (!(elementID in output.classes)) {
            element["rdfType"] = []
            element["ownedProperties"] = []
            element["subClasses"] = []
            element["superClasses"] = []
            output.classes[elementID] = element
        }
        if (rdfType != null) {
            element.rdfType.push(rdfType)
        }
        else if (subClass != null) {
            element.subClasses.push(subClass)
        }
        else if (superClass != null) {
            element.superClasses.push(superClass)
        }
    }

    makeProperty(elementID,output,subProperty,superProperty,rdfType, domain, range){
        if (!(elementID in output.allElements)) {
            output.allElements[elementID] = {predicates:{}}
        }
        var element = output.allElements[elementID]
        if (!(elementID in output.properties)) {
            element["rdfType"] = []
            element["subProperties"] = []
            element["superProperties"] = []
            element["domain"] = []
            element["range"] = []
            output.properties[elementID] = element
        }
        if (rdfType != null) {
            element.rdfType.push(rdfType)
        }
        else if (subProperty != null) {
            element.subProperties.push(subProperty)
        }
        else if (superProperty != null) {
            element.superProperties.push(superProperty)
        }
        else if (domain != null) {
            element.domain.push(domain)
            this.makeClass(domain,output)
            output.allElements[domain].ownedProperties.push(elementID)
        }
        else if (range != null) {
            element.range.push(range)
            this.makeClass(range,output)
        }
    }
    
    //This is a function that gets every triple in the ontology dataset and shapes it into an object that holds all the properties and classes.
    //It also provides a list of all the top-of-the-shop classes in the ontology hierarchy and a dictionary of all elements
    //Don't stringify the returned object as JSON, it'll get huge as there is a lot of repeating use of object references !!!!
    async getAll() {
        const ontojson = await this.runQuery("SELECT * WHERE {?s ?p ?o}")
    
        var output = {
            top:[],
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
                    output.allElements[o] = {predicates:{}}
                }
    
                if (!(s in output.allElements)) {
                    output.allElements[s] = {predicates:{}}
                }
                var element = output.allElements[s]
    
                if (!(p in element["predicates"])) {
                    element["predicates"][p] = [o]
                }
                else
                {
                    element["predicates"][p].push(o)
                }
    
                if (p == this.rdfsSubClassOf) {
                    this.makeClass(s,output,null,o)
                    this.makeClass(o,output,s)
                }
                else if (p == this.rdfsSubPropertyOf) {
                    this.makeProperty(s,output,null,o)
                    this.makeProperty(o,output,s)
                }
                else if (p == this.rdfsDomain) {
                    this.makeProperty(s,output,null,null,null,o)
                }
                else if (p == this.rdfsRange) {
                    this.makeProperty(s,output,null,null,null,null,o)
                }
                else if (p == this.rdfType) {
                    if ((o == this.rdfsClass) || (o == this.owlClass)){
                        this.makeClass(s,output,null,null,o)
                    }
                    else if ((o == this.rdfProperty) || (o ==this. owlDatatypeProperty) || (o == this.owlObjectProperty)){
                        this.makeProperty(s,output,null,null,o)
                    }
                }
            }
        }
        for (var i in output.classes) {
            var cls = output.classes[i]
            if (!(this.rdfsSubClassOf in cls.predicates)) {
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
        super(triplestoreUri,dataset)
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


//testUpdate().then(console.log)
//getAll().then(writeJson)

obj = new OntologyService()

obj.getAll().then(writeJson)