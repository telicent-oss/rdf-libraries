
import json
import os
import requests
from urllib.parse import quote

with open('rdf.ttl') as file:
    data = file.read()
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post('http://localhost:3030/ontology/data?default', data=data, headers=headers)
print("RDF loaded")

with open('owl.ttl') as file:
    data = file.read()
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post('http://localhost:3030/ontology/data?default', data=data, headers=headers)
print("OWL loaded")

with open('rdf-schema.ttl') as file:
    data = file.read()
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post('http://localhost:3030/ontology/data?default', data=data, headers=headers)
print("RDFS loaded")

with open('ies4.ttl') as file:
    data = file.read()
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post('http://localhost:3030/ontology/data?default', data=data, headers=headers)
print("IES4 loaded")

with open('diagrams.ttl') as file:
    data = file.read()
    headers = {'Content-Type': 'text/turtle;charset=utf-8'}
    r = requests.post('http://localhost:3030/ontology/data?default', data=data, headers=headers)
print("Diagrams loaded")
quit()
def addToGraph(subject,predicate,obj):
    url = 'http://localhost:3030/ontology/update'
    updateQuery = 'INSERT DATA { <'+subject+'> <'+predicate+'> "'+obj+'" . }'
    myobj = {'method': 'POST',
            'headers': {
                'Accept': '*/*',
                'Content-Type': 'application/sparql-update'
              },
            'body': updateQuery}

    x = requests.post(url, data = updateQuery)

with open('./stylez.json') as f:
    styles = json.load(f)
    for uri in styles:
        addToGraph(uri,"http://telicent.io/ontology/style",quote(json.dumps(styles[uri])))

print("Styles loaded")


    