import json
from rdflib.plugins.sparql.results.jsonresults import JSONResultSerializer
from rdflib import Graph, URIRef, Literal, XSD
from urllib.parse import quote

telicent = "http://telicent.io/ontology/"
ies = "http://ies.data.gov.uk/ontology/ies4#"

g = Graph()
ont = Graph()
ont.parse("./ies4.ttl")
ont.parse("./owl.ttl")
ont.parse("./rdf.ttl")
ont.parse("./rdf-schema.ttl")
ont.parse("./iesExtensions.ttl")

def loadStyles(filename='./stylez.json'):
    with open(filename) as f:
        styles = json.load(f)
        for uri in styles:
            style = styles[uri]
            if not in_ontology(uri):
                print(uri)
            #print(uri,in_ontology(uri),is_element(uri))
            g.add((URIRef(uri),URIRef("http://telicent.io/ontology/style"),Literal(quote(json.dumps(style)))))

def is_sub_class_f(uri,superclass):
    query = 'ASK  { <'+uri+'> <http://www.w3.org/2000/01/rdf-schema#subClassOf>*  <'+superclass+'>}'
    res = ont.query(query)
    return bool(res)

def in_ontology(uri):
    query = 'ASK  { <'+uri+'> ?p ?o}'
    res = ont.query(query)
    return bool(res)

def is_element(uri):
    return is_sub_class_f(uri,ies+"Element")

def removeRemix(style):
    del style["icon"]
    return style

def setSize(style,s_m_l="M"):
    style["size"] = s_m_l
    return style

def setShape(style,shape):
    style["shape"] = shape
    return style

def modifyStyle(uri,style):
    style[""]

loadStyles()