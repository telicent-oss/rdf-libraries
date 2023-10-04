console.log("javascript")
const rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
const rdfsClass = "http://www.w3.org/2000/01/rdf-schema#Class"
const rdfsSubClassOf = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
const rdfsSubPropertyOf = "http://www.w3.org/2000/01/rdf-schema#subPropertyOf"
const owlClass = "http://www.w3.org/2002/07/owl#Class"
const rdfProperty = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"
const owlDatatypeProperty = "http://www.w3.org/2002/07/owl#DatatypeProperty"
const owlObjectProperty = "http://www.w3.org/2002/07/owl#ObjectProperty"


async function getAll() {
    //query = "SELECT%20%2A%20WHERE%20%7B%0A%20%20%3Fs%20%3Fp%20%3Fo%20.%0A%7D"
    query = "SELECT * WHERE {?s ?p ?o}"
    endpoint = " http://localhost:3030/ontology/query"
    output = {
        classes:{},
        properties:{},
        top:[]
    }

    all = {}
    const response = await fetch(endpoint+"?query="+query)
    const ontojson = await response.json()
    if (ontojson && ontojson.results && ontojson.results.bindings) {
        for (i in ontojson.results.bindings) {
            stmt = ontojson.results.bindings[i]
            console.log(stmt)
            if (!(stmt.s.value in all)) {
                all[stmt.s.value] = {predicates:{}}
            }
            if (!(stmt.o.value in all[stmt.s.value])) {
                all[stmt.s.value]["predicates"][stmt.p.value] = [stmt.o.value]
            }
            else
            {
                all[stmt.s.value]["predicates"][stmt.p.value].push(stmt.o.value)
            }
            if (stmt.p.value == rdfsSubClassOf) {
                if (!(stmt.o.value in all)) {
                    all[stmt.o.value] = {predicates:{},ownedProperties:{}}
                }
                if (!(stmt.o.value in output.classes)) {
                    output.classes[stmt.o.value] = all[stmt.o.value]
                }
            }
            else if (stmt.p.value == rdfsSubPropertyOf) {
                if (!(stmt.o.value in output.properties)) {
                    output.properties[stmt.o.value] = {predicates:{}}
                }
            }
            else if (stmt.p.value == rdfType) {
                if ((stmt.o.value == rdfsClass) || (stmt.o.value == owlClass)){
                    all[stmt.s.value]["ownedProperties"] = {}
                    output.classes[stmt.s.value] = all[stmt.s.value]
                }
                else if ((stmt.o.value == rdfProperty) || (stmt.o.value == owlDatatypeProperty) || (stmt.o.value == owlObjectProperty)){
                        output.properties[stmt.s.value] = all[stmt.s.value]
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
    console.log(output)

}

getAll()