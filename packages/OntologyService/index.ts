/** 
  * @module OntologyService
  * @remarks
  * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
  * @author Ian Bailey
  */

import { z } from "zod"
import RdfService, { DiagramListQuery, InheritedDomainQuery, SPARQL, StylesQuery, SuperClassQuery } from "@telicent-oss/rdfservice";
import { StyleObject } from "./Types";
import ClassDefinition, { ClassDefinitionSchema } from "./ClassDefinition";
import { PropertyDefinitionSchema } from "./PropertyDefinition";
import { ElementDefinitionSchema } from "./ElementDefinition";
import { buildStatementPartial } from "./helper";

const NamedElements = z.record(ElementDefinitionSchema)
const NamedClassDefinitions = z.record(ClassDefinitionSchema)
const NamedPropertiesDefinitions = z.record(PropertyDefinitionSchema)

// export type AllElements = NamedPropertiesDefinitions | NamedClassDefinitions | NamedElements;
const AllElements = z.union([
  NamedPropertiesDefinitions,
  NamedClassDefinitions,
  NamedElements
])

export type AllElements = z.infer<typeof AllElements>

const ontologyOutput = z.object({
  allElements: AllElements,
  properties: NamedPropertiesDefinitions,
  classes: NamedClassDefinitions
})

export type OntologyOutput = z.infer<typeof ontologyOutput>

const DiagramRelationship = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string()
});

export type DiagramRelationship = z.infer<typeof DiagramRelationship>;

export interface NamedDiagramRelationship {
  [subject: string]: DiagramRelationship
}

const DiagramElement = z.object({
  style: StyleObject,
  element: z.string()
});

export type DiagramElement = z.infer<typeof DiagramElement>;

export interface NamedDiagramElement {
  [subject: string]: DiagramElement;
}

const Diagram = z.object({
  uuid: z.string(),
  title: z.string(),
  uri: z.string(),
  diagramElements: z.record(DiagramElement),
  diagramRelationships: z.record(DiagramRelationship)
})

export type Diagram = z.infer<typeof Diagram>;

const sparqlObject = z.object({
  value: z.string(),
  type: z.string()
})

const responseHeaders = z.object({
  vars: z.array(z.string())
})

const DiagramStatement = z.object({
  title: sparqlObject,
  uuid: sparqlObject,
  source: sparqlObject,
  target: sparqlObject,
  rel: sparqlObject,
  diagRel: sparqlObject,
  elem: sparqlObject,
  diagElem: sparqlObject,
  elemStyle: sparqlObject,
  elemBaseType: sparqlObject
})

const diagramResponseBindings = z.array(DiagramStatement)

const diagramResponseSchema = z.object({
  head: responseHeaders,
  results: z.object({
    bindings: diagramResponseBindings
  })
})


const diagramSummaryStatement = z.object({
  title: sparqlObject,
  uri: sparqlObject,
  uuid: sparqlObject,
})

const diagramSummaryResponseBindings = z.array(diagramSummaryStatement)

const diagramSummaryResponseSchema = z.object({
  head: responseHeaders,
  results: z.object({
    bindings: diagramSummaryResponseBindings
  })
})

const StyleStatement = z.object({
  cls: sparqlObject,
  style: sparqlObject
})

const styleResponseSchema = z.object({
  head: responseHeaders,
  results: z.object({
    bindings: z.array(StyleStatement)
  })
})

const StyleResponse = z.record(z.object({
  defaultStyles: z.object({
    dark: z.object({
      backgroundColor: z.string(),
      color: z.string()
    }),
    light: z.object({
      backgroundColor: z.string(),
      color: z.string()
    }),
    shape: z.string(),
    borderRadius: z.string(),
    borderWidth: z.string(),
    selectedBorderWidth: z.string()
  }),
  defaultIcons: z.object({
    riIcon: z.string(),
    faIcon: z.string(),
    faUnicode: z.string(),
    faClass: z.string()
  })
}))

const SubjectPredicateObjectStatement = z.object({
  s: sparqlObject,
  p: sparqlObject,
  o: sparqlObject
})

const ObjectPropertyStatement = z.object({
  relationship: sparqlObject
})

const subjectPredicateObjectResponseSchema = z.object({
  head: responseHeaders,
  results: z.object({
    bindings: z.array(SubjectPredicateObjectStatement)
  })
})

const objectPropertiesResponseSchema = z.object({
  head: responseHeaders,
  results: z.object({
    bindings: z.array(ObjectPropertyStatement)
  })
})
const getAndCheckValidation = <T>(data: unknown, schema: z.ZodType<T, any, any>): T => {
  try {
    return schema.parse(data);
  } catch (err) {
    console.log(data)
    if (err instanceof z.ZodError) {
      throw new Error(`Validation failed: ${err.message} ${JSON.stringify(data)}`);
    }
    throw new Error('Validation failed');
  }
};

const getAndCheckStyleQueryResponse = (data: unknown): z.infer<typeof styleResponseSchema> =>
  getAndCheckValidation(data, styleResponseSchema)

const getAndCheckQueryResponse = (data: unknown): z.infer<typeof diagramResponseSchema> =>
  getAndCheckValidation(data, diagramResponseSchema);

const getAndCheckDiagram = (data: unknown): Diagram =>
  getAndCheckValidation(data, Diagram);

const getAndCheckDiagramSummary = (data: unknown): z.infer<typeof diagramSummaryResponseSchema> =>
  getAndCheckValidation(data, diagramSummaryResponseSchema)

const getAndCheckResultObject = (data: unknown): z.infer<typeof subjectPredicateObjectResponseSchema> =>
  getAndCheckValidation(data, subjectPredicateObjectResponseSchema);

const getAndCheckObjectProperties = (data: unknown): z.infer<typeof objectPropertiesResponseSchema> =>
  getAndCheckValidation(data, objectPropertiesResponseSchema)

export default class OntologyService extends RdfService {
  telDiagram: string;
  telUUID: string;
  telTitle: string;
  telElementStyle: string;
  telInDiagram: string;
  telRepresents: string;
  telBaseType: string;
  telDiagramElement: string;
  telDiagramRelationship: string;
  telSourceElem: string;
  telTargetElem: string;
  nodes: OntologyOutput = {
    allElements: {},
    classes: {},
    properties: {}
  };

  /**
   * @method constructor
   * @remarks
   * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
   * @param triplestoreUri - The host address of the triplestore
   * @param dataset - the dataset name in the triplestore
   * @param defaultUriStub - the default stub to use when building GUID URIs
   * @param defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
  */
  constructor(triplestoreUri = "http://localhost:3030/", dataset = "ontology", defaultUriStub = "http://telicent.io/ontology/", defaultSecurityLabel = "") {
    super(triplestoreUri, dataset, defaultUriStub, defaultSecurityLabel)
    this.telDiagram = this.telicent + "Diagram"
    this.telUUID = this.telicent + "uuid"
    this.telTitle = this.telicent + "title"
    this.telElementStyle = this.telicent + "elementStyle"
    this.telInDiagram = this.telicent + "inDiagram"
    this.telRepresents = this.telicent + "represents"
    this.telBaseType = this.telicent + "baseType"
    this.telDiagramElement = this.telicent + "DiagramElement"
    this.telDiagramRelationship = this.telicent + "DiagramRelationship"
    this.telSourceElem = this.telicent + "sourceElem"
    this.telTargetElem = this.telicent + "targetElem"
  }

  /**
    * @method newClass
  * @ remarks
   * Creates a new Class (default rdfs:Class - override via clsType parameter)
   * if it's a subclass of another class, then provide this via the superClass parameter
   * optionally add a style object if needed
   * @param uri - The uri of the new class
   * @param clsType - The type of the new class
   * @param styleObject - pass in a style object (call makeStyleObject to get a new one)
   * @param superclass - the parent (superclass) of the new class
   * @returns the uri of the new class (which you've already provided...I know...I know...)
  */
  newClass(uri: string, clsType: string = this.rdfsClass, styleObject?: z.infer<typeof StyleObject>, superClass?: string) {
    var cls = this.instantiate(clsType, uri)
    if ((superClass) && (superClass !== "")) {
      this.addSubClass(uri, superClass)
    }
    if (styleObject) {
      this.setStyle(uri, styleObject)
    }
    return cls
  }



  /**
   * @method getClass 
   * @remarks
   * brings back a class object that collects together all the useful info about the class
   * @param uri - The uri of the class to fetch
   * @param getAllPredicates - if true, it brings back all the related items. Set to false if you just need the basic info back
   * @param getSubClasses - runs a second query to get all the subclasses of the class. Set to false if you don't need it - saves traffic
   * @param getDomainProperties - runs a second query to get all the properties whose domain is this class
   * @returns object - an object describing the class
  */
  async getClass(uri: string, getAllPredicates = true, getSubClasses = true, getDomainProperties = true) {
    const cls = new ClassDefinition()
    if (!getAllPredicates && !getSubClasses && !getDomainProperties) return cls

    var query = `SELECT ?s ?p ?o WHERE {<${uri}> ?p ?o .  BIND (IRI("${uri}") as ?s) }`
    const ontojson = await this.runQuery<SPARQL[]>(query)

    //TODO: add class to nodes.allElements and nodes.classes after result is returned
    if (ontojson?.results?.bindings) {
      const statements = ontojson.results.bindings

      statements.forEach(statement => {
        const subject = statement.s.value;
        const predicate = statement.p.value;
        const object = statement.o.value;

        getAllPredicates && cls.addPredicate(predicate, object)

        if (predicate === this.telicentStyle) {
          cls.setDefaultStyle(JSON.parse(object))
        }

        // TODO find a grouped name for what this figures out and 
        // add it to the class setPredicate?
        switch (predicate) {
          case this.rdfsSubClassOf:
            cls.addSuperClass(object)
            break;
          case this.rdfType:
            cls.addRdfType(object)
            break;
          case this.rdfsLabel:
            cls.addLabel(object)
            break;
          case this.rdfsComment:
            cls.addComment(object)
            break;
          default:
            break;
        }
        cls.uri = subject;
      })

      if (getSubClasses) {
        cls.subClasses = await this.getSubClasses(uri)
      }

      if (getDomainProperties) {
        cls.ownedProperties = await this.getDomainProperties(uri)
      }

    }
    return cls
  }

  /**
   * @method getDomainProperties 
   * @remarks
   * returns all properties which have this class as their domain
   * @param uri - The uri of the class which is the domain for the properties returned
   * @returns an array of properties whose domain is this class
  */
  async getDomainProperties(uri: string) {
    return await this.getRelating(uri, this.rdfsDomain)
  }

  /**
   * @method getRangeProperties
   * @remarks
   * returns all properties which have this class as their range
   * @param uri - The uri of the class which is the range for the properties returned
   * @returns - an array of properties whose range is this class
  */
  async getRangeProperties(uri: string) {
    return await this.getRelating(uri, this.rdfsRange)
  }

  /**
   * @method getInheritedDomainProperties 
   * @remarks
   * returns all properties defined (domain) against the superclasses of the provided class
   * @param uri - The uri of the class (or subclass) which is the domain for the properties returned
   * @returns an array of properties whose domain is this class or one of its superclasses
  */
  async getInheritedDomainProperties(uri: string) {
    const query = `SELECT ?prop ?item WHERE {?prop <${this.rdfsDomain}> ?item . <${uri}> <${this.rdfsSubClassOf}>* ?item. }`
    const spOut = await this.runQuery<InheritedDomainQuery[]>(query)
    if (!(spOut?.results?.bindings)) return

    const statements = spOut.results.bindings;
    return statements.filter(statement => statement.item.value !== uri)
      .map(statement => ({ property: statement.prop.value, domain: statement.item.value }))
  }

  /**
   * @method getInheritedRangeProperties 
   * @remarks
   * returns all properties defined (range) against the superclasses of the provided class
   * @param uri - The uri of the class (or subclass) which is the range for the properties returned
   * @returns an array of properties whose range is this class or one of its superclasses
  */
  async getInheritedRangeProperties(uri: string) {
    const query = `SELECT ?prop ?item WHERE {?prop <${this.rdfsRange}> ?item . <${uri}> <${this.rdfsSubClassOf}>* ?item. }`
    const spOut = await this.runQuery<InheritedDomainQuery[]>(query)
    if (!(spOut?.results?.bindings)) return
    const statements = spOut.results.bindings
    return statements.filter(statement => statement.item.value !== uri)
      .map(statement => ({ property: statement.prop.value, domain: statement.item.value }))
  }

  /**
   * @method addSubClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship between two classes
   * @param subClass - The subclass that is to be related to the superclass using rdfs:subClassOf
   * @param superClass - The superclass that is to be related to the subclass using rdfs:subClassOf
  */
  addSubClass(subClass: string, superClass: string) {
    this.insertTriple(subClass, this.rdfsSubClassOf, superClass)
  }

  /**
   * @method getSubClasses
   * @remarks
   * Returns a list of all the subclasses of the provided class
   * If your ontology uses any subproperties of rdfs:subClassOf then it will also return those too...unless you set ignoreSubProps
   * @param uri - The uri of the class whose subclasses are returned
   * @returns an array of subclasses
  */
  async getSubClasses(uri: string) {
    return await this.getRelating(uri, this.rdfsSubClassOf)
  }

  /**
   * @method getSuperClasses 
   * @remarks
   * Returns a list of all the superclasses of the provided class
   * If your ontology uses any subproperties of rdfs:subClassOf then it will also return those too...unless you set ignoreSubProps
   * If you want to get all the supers going all the way to the top (i.e. transitively climbing up the hierarchy) then set getAll to true
   * @param uri - The uri of the class whose subclasses are returned
   * @param ignoreSubProps - set to true to ignore all subproperties of rdfs:subClassOf. Most ontologies don't do this, but IES, BORO and IDEAS do...
   * @param getAll - set to true to chase up the transitive hierarchy and get all the other levels of superclass (you might get a lot of these !)
   * @returns an array of superclasses
  */
  async getSuperClasses(uri: string, ignoreSubProps = false, getAll = false) {
    const pathOp = getAll ? "*" : "";

    const query = ignoreSubProps ?
      `SELECT ?super WHERE {<${uri}> <${this.rdfsSubClassOf}>${pathOp} ?super .}` :
      `SELECT ?super WHERE {<${uri}> ?subRel${pathOp} ?super . ?subRel <${this.rdfsSubPropertyOf}>* <${this.rdfsSubClassOf}> .}`

    const spOut = await this.runQuery<SuperClassQuery[]>(query)
    if (!(spOut?.results?.bindings)) return
    const statements = spOut.results.bindings
    return statements.map(statement => statement.super.value)
  }

  /**
   * @method getStyles 
   * @remarks
   * returns a dictionary object of styles for each specified class. If no classes are specified, it will get all the styles for every class it finds with style
   * pass the classes in as an array of URIs
   * @param classes - An array of URIs (strings) of the classes whose styles are required
   * @returns a dictionary keyed by the class URIs, with the values being style objects
  */
  async getStyles(classes: string[] = []) {
    var filter = ""

    if (classes.length > 0) {
      filter = 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )';
    }
    const query = `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`
    const spOut = await this.runQuery<StylesQuery[]>(query)

    const spOutValidated = getAndCheckStyleQueryResponse(spOut)
    const statements = spOutValidated.results.bindings

    let acc: z.infer<typeof StyleResponse> = {}
    return statements.reduce((statements, statement) => {
      if (!statement.style.value || statement.style.value === "undefined") return statements

      statements[statement.cls.value] = JSON.parse(decodeURIComponent(statement.style.value))
      return statements
    }, acc)
  }

  /**
   * @method setStyle 
   * @remarks
   * sets the default style for a class. Deletes any previous styles
   * @param uri - The URI of the class that have the style assigned
   * @param styleObj - A style object for the class - call makeStyleObject to get one
  */
  setStyle(uri: string, styleObj: z.infer<typeof StyleObject>) {
    const styleStr = encodeURIComponent(JSON.stringify(styleObj))
    this.deleteRelationships(uri, this.telicentStyle)
    this.insertTriple(uri, this.telicentStyle, styleStr, "LITERAL")
  }


  /**
   * @method #addPropertiesToOutput
   */
  //function that goes through ?s ?p ?o results and formats an object structure for js consumption
  async #buildResultsObject(query: string, getAllPredicates = false) {
    const spOut = await this.runQuery(query)
    const spOutValidated = getAndCheckResultObject(spOut)

    const statements = spOutValidated.results.bindings

    const processStatement = buildStatementPartial(this, getAllPredicates)
    statements.forEach(processStatement)

    return this.nodes
  }

  /**
   * @method getAllElements 
   * @remarks
   * This is a function that gets every triple in the ontology dataset and shapes it into an object that holds all the properties and classes.
   * It also provides a list of all the top-of-the-shop classes in the ontology hierarchy and a dictionary of all elements
   * Set getAllPredicates to true if you want all predicates in the ontology - the object gets approximately 2x the size if you do this though - it doesn't affect the server though, so just need to consider browser memory
   * Don't stringify the returned object as JSON, it'll get huge as there is a lot of repeating use of object references 
   * @param  [getAllPredicates=false] - if true this will return all predicates owned by the element, not just the essential ones
   * @returns array of classes and properties that are in the ontology
  */
  async getAllElements(getAllPredicates = false) {
    const result = await this.#buildResultsObject("SELECT * WHERE {?s ?p ?o}", getAllPredicates)

    //TODO has no ability to get predicates

    const topOutput = z.object({
      top: z.array(ClassDefinitionSchema)
    })

    const combinedOutput = ontologyOutput.merge(topOutput)
    const output: z.infer<typeof combinedOutput> = {
      ...result,
      top: []
    }
    for (let className in output.classes) {
      const cls = output.classes[className]
      if (cls.superClasses.length === 0) {
        output.top.push(cls)
      }
    }

    return output
  }

  /**
   * @method getAllDiagrams 
   * @remarks
   * returns a list of all the ODM UML diagrams in the triplestore
   * @returns array of objects summarising all the diagrams
  */
  async getAllDiagrams() {
    const query = `SELECT ?uri ?uuid ?title WHERE {
            ?uri a <${this.telDiagram}> . 
            {?uri <${this.telUUID}> ?uuid} 
            {?uri <${this.telTitle}> ?title } 
        }`
    const spOut = await this.runQuery(query)
    const spOutValidated = getAndCheckDiagramSummary(spOut)

    const statements = spOutValidated.results.bindings
    return statements.map(statement => {
      const diag: Diagram = { uuid: statement.uuid.value, title: statement.title.value, uri: statement.uri.value, diagramElements: {}, diagramRelationships: {} }
      if (statement.title) {
        diag.title = statement.title.value
      }
      if (statement.uuid) {
        diag.uuid = statement.uuid.value
      }

      return diag
    })
  }

  /**
   * @method getDiagram 
   * @remarks
   * fetches all info about a given diagram - all the elements and relationships in it
   * @param   the uri of the diagram
   * @returns an object containing all the information about the diagram
  */
  async getDiagram(uri: string) {

    const query = `
        SELECT ?uuid ?title ?diagElem ?elem ?elemStyle ?diagRel ?rel ?source ?target ?elemBaseType WHERE {
            <${uri}> a <${this.telDiagram}> . 
            OPTIONAL {<${uri}> <${this.telUUID}> ?uuid} 
            OPTIONAL {<${uri}> <${this.telTitle}> ?title } 
            OPTIONAL {
                ?diagElem <${this.telInDiagram}> <${uri}> .
                ?diagElem a <${this.telDiagramElement}> .
                ?diagElem <${this.telElementStyle}> ?elemStyle .
                ?diagElem <${this.telRepresents}> ?elem .
                ?diagElem <${this.telBaseType}> ?elemBaseType .
            }
            OPTIONAL {
                ?diagRel <${this.telInDiagram}> <${uri}> .
                ?diagRel a <${this.telDiagramRelationship}> .
                ?diagRel <${this.telRepresents}> ?rel .
                ?diagRel <${this.telSourceElem}> ?source .
                ?diagRel <${this.telTargetElem}> ?target .
            }
        }`

    const spOut = await this.runQuery(query)
    const spOutValidated = getAndCheckQueryResponse(spOut)

    const statements = spOutValidated.results.bindings
    const output = statements.reduce((acc: Diagram, statement) => {
      acc.title = statement.title.value
      acc.uuid = statement.uuid.value

      if (!(statement.diagElem.value in acc.diagramElements)) {
        acc.diagramElements[statement.diagElem.value] = {} as DiagramElement
      }

      acc.diagramElements[statement.diagElem.value] = {
        ...acc.diagramElements[statement.diagElem.value],
        element: statement.elem.value,
        style: JSON.parse(decodeURIComponent(statement.elemStyle.value))
      }

      if (!(statement.diagRel.value in acc.diagramRelationships)) {
        acc.diagramRelationships[statement.diagRel.value] = {} as DiagramRelationship
      }

      acc.diagramRelationships[statement.diagRel.value] = {
        ...acc.diagramRelationships[statement.diagRel.value],
        relationship: statement.rel.value,
        source: statement.source.value,
        target: statement.target.value
      }

      return acc
    }, { uri: uri, uuid: '', title: '', diagramElements: {}, diagramRelationships: {} })

    return getAndCheckDiagram(output);
  }

  /**
   * @method newDiagram 
   * @remarks
   * creates a new diagram
   * @param title - the title of the diagram (mandatory)
   * @param uri - if unset, a new URI will be minted, and will be based on the UUID 
   * @param uuid - if unset, a new UUID will be minted
   * @param securityLabel - the security label enforced by the CORE platform
  */
  newDiagram(title: string, uri: string, uuid: string, securityLabel: string) {
    if (!uuid) {
      uuid = crypto.randomUUID()
    }
    if (!uri) {
      uri = this.mintUri()
    }
    this.instantiate(this.telDiagram, uri, securityLabel)
    this.setTitle(uri, title)
    this.addLiteral(uri, this.telUUID, uuid)
  }


  /**
   * @method setTitle 
   * @remarks
   * sets the telicent:title property - used in diagrams and similar
   * @param {string} uri - the URI of the diagram
   * @param {string} title - the telicent:title to be applied to the diagram - this will remove any previous title.
  */
  setTitle(uri: string, title: string) {
    this.addLiteral(uri, this.telTitle, title, true)
  }

  /**
   * @method getAllObjectProperties
   * @remarks
   * get all object properties (relationships)
   */
  async getAllObjectProperties() {
    const query = `
      SELECT
        ?relationship
      WHERE {
        ?relationship a owl:ObjectProperty
      }
    `

    const spOut = await this.runQuery(query)
    const spOutValidated = getAndCheckObjectProperties(spOut)

    const statements = spOutValidated.results.bindings;

    return statements.map(statement => statement.relationship.value)
  }
}

//export const expectedResponse: z.infer<typeof diagramResponseSchema> = {
//  head: {
//    "vars": [
//      "uuid",
//      "title",
//      "diagElem",
//      "elem",
//      "elemStyle",
//      "diagRel",
//      "rel",
//      "source",
//      "target"
//    ]
//  },
//  results: {
//    bindings: [
//      {
//        "uuid": {
//          "type": "literal",
//          "value": "EAID_C8EE24EF_889D_4e8f_96DE_CCBE47D4BE4F"
//        },
//        "title": {
//          "type": "literal",
//          "value": "Agreement"
//        },
//        "diagElem": {
//          "type": "uri",
//          "value": "http://ies.data.gov.uk/diagrams#EAID_C8EE24EF_889D_4e8f_96DE_CCBE47D4BE4F_EAID_FB2EA8AE_164A_4642_82E3_D2622DC6FCCB"
//        },
//        "elem": {
//          "type": "uri",
//          "value": "http://ies.data.gov.uk/ontology/ies4#Negotiation"
//        },
//        "elemStyle": {
//          "type": "literal",
//          "value": "{\"shape\": \"roundrectangle\", \"bgColour\": \"#FF8AD8\", \"colour\": \"#FFFFFF\", \"borderColour\": \"#FFFFFF\", \"icon\": \"fa-solid fa-play\", \"x\": 686, \"y\": 349, \"height\": 55, \"width\": 119}"
//        },
//        "diagRel": {
//          "type": "uri",
//          "value": "http://ies.data.gov.uk/diagrams#EAID_C8EE24EF_889D_4e8f_96DE_CCBE47D4BE4F_EAID_759F13D4_9709_4501_A301_73E49D4BE109"
//        },
//        "rel": {
//          "type": "uri",
//          "value": "http://www.w3.org/2000/01/rdf-schema#subClassOf"
//        },
//        "source": {
//          "type": "uri",
//          "value": "http://ies.data.gov.uk/diagrams#EAID_C8EE24EF_889D_4e8f_96DE_CCBE47D4BE4F_EAID_1ECB4C6E_6A30_4dc5_A4AC_9A9DF5B6A54F"
//        },
//        "target": {
//          "type": "uri",
//          "value": "http://ies.data.gov.uk/diagrams#EAID_C8EE24EF_889D_4e8f_96DE_CCBE47D4BE4F_EAID_D09EDE21_E862_4ec1_BC0F_045CCE5454A9"
//        }
//      }
//    ]
//  }
//}
