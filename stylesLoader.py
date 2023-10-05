def loadIESStyle(adapter,sink,broker,topic):
    print("loading IES Styles")
    try:
        with open('./stylez.json') as f:
            graph = Graph()
            styles = json.load(f)
            for uri in styles:
                addToGraph(graph,URIRef(uri),URIRef("http://telicent.io/ontology/style"),Literal(json.dumps(styles[uri])))
    
            data = graph.serialize(format="nt")
            record = Record(RecordUtils.to_headers({"Security-Label":"", "Content-Type": "text/turtle"}),None,data )
            adapter.send(record)
    except Exception as e:
        print(e)
        raise Exception("IES Styles failed to load")
    