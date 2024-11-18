// import OntologyService from "../packages/OntologyService/index"
const OntologyService = require('../packages/OntologyService/index')
//testing functions - please ignore these !


function writeJson(jsonData){
    var fs = require('fs');
    fs.writeFile("test.json", JSON.stringify(jsonData,null,"  "), function(err) {
        if (err) {
            console.log(err);
        }
    });
}


async function runTests(){
    obj = new OntologyService()
    obj.getAllElements()//.then(console.log)
    await obj.instantiate("http://cls")//.then(console.log)
    obj.insertTriple("http://x","http://y","http://abc")
    obj.insertTriple("http://x","http://yy","test","LITERAL","xsd:string")
    obj.deleteNode("http://abc")
    obj.setStyle('http://ies.data.gov.uk/ontology/ies4#PersonalRadioHandset',{})
    obj.getStyles(['http://ies.data.gov.uk/ontology/ies4#PersonalRadioHandset','http://ies.data.gov.uk/ontology/ies4#Crossing'])//.then(console.log)
    obj.getSubClasses('http://ies.data.gov.uk/ontology/ies4#Asset')//.then(console.log)
    obj.getSuperClasses('http://ies.data.gov.uk/ontology/ies4#Asset',true)//.then(console.log)
    obj.getClass('http://ies.data.gov.uk/ontology/ies4#Entity')//.then(console.log)
    obj.getDiagram('http://ies.data.gov.uk/diagrams#EAID_5DF03A2C_F6DF_4433_82D5_7E5C14B6045C')//.then(console.log)
}

await runTests()

