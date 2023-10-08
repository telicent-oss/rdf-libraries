
import json
import os
import requests
from urllib.parse import quote



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
        print(uri)
        addToGraph(uri,"http://telicent.io/ontology/style",quote(json.dumps(styles[uri])))



    