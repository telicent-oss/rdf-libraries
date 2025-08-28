// Returns true if SOME OTHER subject conflicts with (S, "ID") under the rules:
// - IF S has at least one rdf:type ?t 
//      THEN any other with the SAME ?t and same identifier is a conflict
// - IF S has NO rdf:type 
//      THEN only others with NO rdf:type and same identifier are a conflict
export const askIfUniqueIdentifierOfType = ({
  s,
  o,
}: {
  s: string;
  o: string;
}) => {
  return `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

ASK {
  VALUES (?s ?id) { ( <${s}>  "${o}"^^xsd:string ) }
  OPTIONAL { ?s rdf:type ?t }

  FILTER NOT EXISTS {
    {  # typed S: any OTHER with same type + id
      FILTER(BOUND(?t))
      ?other a ?t ; dct:identifier ?id .
      FILTER(?other != ?s)
    }
    UNION
    {  # untyped S: any OTHER untyped with same id
      FILTER(!BOUND(?t))
      ?other dct:identifier ?id .
      FILTER(?other != ?s)
      FILTER NOT EXISTS { ?other rdf:type ?any }
    }
  }
}
  # Is Unique Identifier of type
  `;
};
