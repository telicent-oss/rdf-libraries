const rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
const rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class"
const rdfsSubClassOf = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
const rdfsSubPropertyOf = "http://www.w3.org/2000/01/rdf-schema#subPropertyOf"
const owlClass = "http://www.w3.org/2002/07/owl#Class"
const rdfsDomain = "http://www.w3.org/2000/01/rdf-schema#domain"
const rdfsRange = "http://www.w3.org/2000/01/rdf-schema#range"
const rdfProperty = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"
const owlDatatypeProperty = "http://www.w3.org/2002/07/owl#DatatypeProperty"
const owlObjectProperty = "http://www.w3.org/2002/07/owl#ObjectProperty"

const ontologyDataset = "ontology"
const triplestoreUri = "http://localhost:3030/"
const ontologyQueryEndpoint = triplestoreUri+ontologyDataset+"/query?query="
const ontologyUpdateEndpoint = triplestoreUri+ontologyDataset+"/update"

async function runQuery(query) {
    const response = await fetch(ontologyQueryEndpoint+query)
    const ontojson = await response.json()
    return ontojson
}


async function runUpdate(updateQuery) {
    postObject = {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/sparql-update'
          },
        body: updateQuery
    }
    const response = await fetch(ontologyUpdateEndpoint,postObject)
    return response.text()
}

async function testUpdate() {
    const result = await runUpdate("INSERT DATA { <http://a> <http://b> <http://c> . }")
    return result
}

async function insertTriple(subject, predicate, object, isLiteral){
    if (isLiteral) {
        o = '"'+object+'"'
    }
    else {
        o = "<"+object+">"
    }
    result = await runUpdate("INSERT DATA {<"+subject+"> <" + predicate + "> " + o + " }")
}

//testUpdate().then(console.log)


function makeClass(elementID,output,subClass,superClass,rdfType){
    if (!(elementID in output.allElements)) {
        output.allElements[elementID] = {predicates:{}}
    }
    element = output.allElements[elementID]
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

function makeProperty(elementID,output,subProperty,superProperty,rdfType, domain, range){
    if (!(elementID in output.allElements)) {
        output.allElements[elementID] = {predicates:{}}
    }
    element = output.allElements[elementID]
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
        makeClass(domain,output)
        output.allElements[domain].ownedProperties.push(elementID)
    }
    else if (range != null) {
        element.range.push(range)
        makeClass(range,output)
    }
}

//This is a function that gets every triple in the ontology dataset and shapes it into an object that holds all the properties and classes.
//It also provides a list of all the top-of-the-shop classes in the ontology hierarchy and a dictionary of all elements
//Don't stringify the returned object as JSON, it'll get huge as there is a lot of repeating use of object references !!!!
async function getAll() {
    const ontojson = await runQuery("SELECT * WHERE {?s ?p ?o}")

    output = {
        top:[],
        allElements:{},
        properties:{},
        classes:{},
    }

    if (ontojson && ontojson.results && ontojson.results.bindings) {
        for (i in ontojson.results.bindings) {
            stmt = ontojson.results.bindings[i]
            s = stmt.s.value
            p = stmt.p.value
            o = stmt.o.value
            if ((stmt.o.type != "literal") && !(o in output.allElements))
            {
                output.allElements[o] = {predicates:{}}
            }

            if (!(s in output.allElements)) {
                output.allElements[s] = {predicates:{}}
            }
            element = output.allElements[s]

            if (!(p in element["predicates"])) {
                element["predicates"][p] = [o]
            }
            else
            {
                element["predicates"][p].push(o)
            }

            if (p == rdfsSubClassOf) {
                makeClass(s,output,null,o)
                makeClass(o,output,s)
            }
            else if (p == rdfsSubPropertyOf) {
                makeProperty(s,output,null,o)
                makeProperty(o,output,s)
            }
            else if (p == rdfsDomain) {
                makeProperty(s,output,null,null,null,o)
            }
            else if (p == rdfsRange) {
                makeProperty(s,output,null,null,null,null,o)
            }
            else if (p == rdfType) {
                if ((o == rdfsClass) || (o == owlClass)){
                    makeClass(s,output,null,null,o)
                }
                else if ((o == rdfProperty) || (o == owlDatatypeProperty) || (o == owlObjectProperty)){
                    makeProperty(s,output,null,null,o)
                }
            }
        }
    }
    for (i in output.classes) {
        cls = output.classes[i]
        if (!(rdfsSubClassOf in cls.predicates)) {
            output.top.push(i)
        }
    }

    return output

}

function writeJson(jsonData){
    var fs = require('fs');
    fs.writeFile("test.json", JSON.stringify(jsonData,null,"  "), function(err) {
        if (err) {
            console.log(err);
        }
    });
}



getAll().then(writeJson)