/** 
  * @module OntologyService
  * @remarks
  * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
  * @author Ian Bailey
  */

import  RdfService, { SPARQLQuerySolution, SPARQLResultBinding, QueryResponse, TypedNodeQuerySolution, RDFSResource, RDFProperty } from "@telicent-oss/rdfservice";

export interface InheritedDomainQuerySolution extends SPARQLQuerySolution {
  prop: SPARQLResultBinding,
  item: SPARQLResultBinding
}

export interface SuperClassQuerySolution extends SPARQLQuerySolution {
  super: SPARQLResultBinding,
  subRel: SPARQLResultBinding
}

export type StylesQuerySolution = {
  cls: SPARQLResultBinding,
  style: SPARQLResultBinding
}

export type DiagramListQuerySolution = {
  uri: SPARQLResultBinding,
  uuid: SPARQLResultBinding,
  title: SPARQLResultBinding
}

export interface DiagramQuerySolution extends TypedNodeQuerySolution {
  uuid: SPARQLResultBinding,
  title: SPARQLResultBinding
}

export interface DiagramElementQuerySolution extends TypedNodeQuerySolution {
  style: SPARQLResultBinding
}

export class Style  {
  bgColour: string
  colour: string
  icon: string
  height: number
  width: number
  x: number
  y: number
  shape: string
  public constructor(bgColour?:string,colour?:string,icon?:string,height?:number,width?:number,x?:number,y?:number,shape?:string) {
    this.bgColour = bgColour || "#888"
    this.colour = colour || "#000"
    this.icon = icon || "fa-solid fa-question"
    this.height = height || 0
    this.width = width || 0
    this.x = x||0
    this.y = y||0
    this.shape = shape || "diamond"
  }
}

export class AppliedStyle {
  cls: string
  style: Style
  public constructor(cls:string, style:Style) {
    this.cls = cls
    this.style = style
  }
}

export class DiagramElement extends RDFSResource {
  style?: Style
  element?: RDFSResource
  baseType?: string
}

export class DiagramProperty extends DiagramElement {
  domain?: DiagramElement
  range?: DiagramElement
}

export class DiagramRelationship {
  source?: string
  target?: string
  relationship?: string
  style?: Style
}


export class Diagram extends RDFSResource {
  uuid: string
  title: string
  diagramElements: DiagramElement[]
  diagramProperties: DiagramProperty[]
  diagramRelations: DiagramRelationship[]
  service: OntologyService
  public constructor(service: OntologyService, uri?:string, uuid?:string, title?:string, statement?:DiagramQuerySolution) {
    super(service,uri,service.telDiagram,statement)   
    this.service = service
    this.uuid = ""
    this.title = ""
    this.diagramElements = []
    this.diagramProperties = []
    this.diagramRelations = []
    if (statement) {
      if (statement.uuid) {
        this.uuid = statement.uuid.value
      }
      if (statement.title) {
        this.uuid = statement.title.value
      }
    }  
    else {
      if (!uuid) {
        uuid = crypto.randomUUID()
      }
      this.setUUID(uuid)
      if (!uri) {
        uri = this.service.mintUri()
      }
      if (title) {
        this.setTitle(title)
      }
    } 
  }

  async setTitle(title:string) {
    this.addLiteral(this.service.telTitle,title,true)
  }

  async setUUID(uuid:string) {
    this.addLiteral(this.service.telUUID,uuid,true)
  }

  async getDiagramElements() : Promise<DiagramElement[]> {
    const query = `SELECT `
    const spOut = await this.service.runQuery<DiagramElementQuerySolution>(query)
    var elems:DiagramElement[] = []
    spOut.results.bindings.forEach((statement:DiagramElementQuerySolution) => {
      var style:Style = JSON.parse(decodeURIComponent(statement.style.value))
      elems.push(new DiagramElement(this.service,undefined,undefined,statement))
    })
    return elems
  }

 // { uri: uri, uuid: '', title: '', diagramElements: {}, diagramRelationships: {} }

}

//A wrapper class for an OWL ObjectProperty 
export class OWLObjectProperty extends RDFProperty {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an OWL ObjectProperty
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
  */
  public constructor(service: RdfService, uri? : string, statement? : TypedNodeQuerySolution) {
    super(service,uri,"http://www.w3.org/2002/07/owl#ObjectProperty",statement)           
  }
}

//A wrapper class for an OWL DatatypeProperty 
export class OWLDatatypeProperty extends RDFProperty {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an OWL DatatypeProperty
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
  */
  public constructor(service: RdfService, uri? : string, statement? : TypedNodeQuerySolution) { 
    super(service,uri,"http://www.w3.org/2002/07/owl#DatatypeProperty",statement)           
  }
}


//A wrapper class for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)  
export class RDFSClass extends RDFSResource {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param type - if not being created from a query, then type (e.g. rdf Property, owl ObjectProperty / DatatypeProperty) must be supplied - will add data to ontology
   * @param superClass - f not being created from a query, a superclass can optionally be specified - i.e. the new class will be a subclass of the superclass
  */
  service:OntologyService
  public constructor(service: OntologyService, uri? : string, type?: string, superClass?:RDFSClass, statement? : TypedNodeQuerySolution) {
    super(service,uri,type,statement)
    this.service = service     
    if (statement) {
      if (superClass) {
        console.warn("Do not set superClass parameter if creating class from a query")
      }
    } 
    else
    {
      if (superClass) {
        this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, superClass.uri)
      }
    }     
  }

  /**
   * @method getSubClasses
   * @remarks
   * returns the subclasses of this class as an array of RDFSClass objects
   * @param recurse - if true (default) only immediate subproperties are return otherwise the  hierarchy will be fully recursed
  */
  async getSubClasses(recurse:boolean = false):Promise<RDFSClass[]> {
    var path = ''
    if (recurse) {
      path = '*'
    }
    const query = `SELECT ?uri ?_type WHERE {?uri rdfs:subClassOf${path} <${this.uri}> . ?uri a ?_type}`
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    return this.service.wrapClasses(spOut)
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
    async getSuperClasses(ignoreSubProps = false, getInherited = false) {
      const pathOp = getInherited ? "*" : "";
  
      const query = `SELECT ?uri ?_type WHERE {<${this.uri}> <${this.service.rdfsSubClassOf}>${pathOp} ?uri . ?uri a _type .}`
      const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
      return this.service.wrapClasses(spOut)
    }

  /**
   * @method getOwnedProperties
   * @remarks
   * returns the properties which specify this class as their domain
   * @param getInherited - set to true to get all the inherited property references
  */
  async getOwnedProperties(getInherited:boolean=false):Promise<RDFProperty[]> {
    var query = `SELECT ?uri ?_type WHERE {?uri rdfs:domain <${this.uri}> }`
    if (getInherited) {
      const query = `SELECT ?uri ?_type WHERE {?uri rdfs:domain ?super . <${this.uri}> rdfs:subClassOf* ?super }.`
    }
   
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    var props = []
    return this.service.wrapPropertyList(spOut)
  }

  /**
   * @method getReferringProperties
   * @remarks
   * returns the properties which specify this class as their range
   * @param getInherited - set to true to get all the inherited property references
  */
    async getReferringProperties(getInherited:boolean=false):Promise<RDFProperty[]> {
      var query = `SELECT ?uri ?_type WHERE {?uri rdfs:range <${this.uri}> }`
      if (getInherited) {
        const query = `SELECT ?uri ?_type WHERE {?uri rdfs:range ?super . <${this.uri}> rdfs:subClassOf* ?super }.`
      }
     
      const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
      var props = []
      return this.service.wrapPropertyList(spOut)
    }

  /**
   * @method addSubClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship from this class to another
   * @param subClass - The subclass that is to be related to this using rdfs:subClassOf
  */
    addSubClass(subClass: string) {
      this.service.insertTriple(subClass, this.service.rdfsSubClassOf, this.uri)
    }

  /**
   * @method addSuperClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship from this class to another
   * @param superClass - The superclass that is to be related to the this class using rdfs:subClassOf
  */
    addSuperClass(subClass: string) {
      this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, this.uri)
    }
}

export class OWLClass extends RDFSClass {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an OWL Class
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the TypedNodeQuerySolution to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param superClass - f not being created from a query, a superclass can optionally be specified - i.e. the new class will be a subclass of the superclass
  */
  public constructor(service: OntologyService, uri? : string, superClass?:RDFSClass, statement? : TypedNodeQuerySolution) {
    super(service,uri,"http://www.w3.org/2002/07/owl#Class",superClass,statement)           
  }

}

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
  telDiagramPropertyDefinition: string
  telRouting:string
  telDisplayAs:string
  telSourceElem: string;
  telTargetElem: string;

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
    this.telDiagramPropertyDefinition = this.telicent + "DiagramPropertyDefinition"
    this.telRouting = this.telicent + "routing"
    this.telDisplayAs = this.telicent + "displayAs"
    this.telSourceElem = this.telicent + "sourceElem"
    this.telTargetElem = this.telicent + "targetElem"
    this.classLookup[this.owlClass] = OWLClass
    this.classLookup[this.owlDatatypeProperty] = OWLDatatypeProperty
    this.classLookup[this.owlObjectProperty] = OWLObjectProperty
    this.classLookup[this.rdfsClass] = RDFSClass
  }

  wrapClasses(results:QueryResponse<TypedNodeQuerySolution>) {
    var clss:RDFSClass[] = []
    results.results.bindings.forEach((statement:TypedNodeQuerySolution) => {
      var cls = this.lookupClass(statement._type.value,RDFSClass)
      var rc = new cls(this,undefined,undefined,statement)
      clss.push(rc)
    })
    return clss
  }


  /**
   * @method getAllRdfProperties 
   * @remarks
   * returns all properties in the ontology (with some filters)
   * @param includeOwlProperties - if true (default) this will return owl ObjectProperties and DatatypeProperties in addition to rdf Properties
   * @param getOnlyTopProperties - if true (default is false) this will only return those properties that are not subproperties of any others - i.e the top ones
   * @returns an array of properties
  */
  async getAllRdfProperties(includeOwlProperties: boolean = true, getOnlyTopProperties: boolean = false) {
    var filter = ''
    if (getOnlyTopProperties) {
      filter = `FILTER NOT EXISTS {
        ?uri rdfs:subPropertyOf ?parentProp
      }`
    }

    var whereClause = `WHERE {BIND (rdf:Property as ?_type . ?uri a ?_type ) . ${filter}}`
    if (includeOwlProperties) {
      whereClause = `WHERE {?uri a ?_type . FILTER (?_type IN (owl:ObjectProperty, owl:DatatypeProperty, rdf:Property)) . ${filter}}`
    }

    const query = `SELECT ?uri ?_type ${whereClause}`
    const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
    return this.wrapPropertyList(spOut)
  }

  /**
   * @method getAllClasses
   * @remarks
   * returns all classes in the ontology (with some filters)
   * @param includeOwlClasses - if true (default) this will return owl classes as well as rdfs classes
   * @param getOnlyTopClasses - if true (default is false) this will only return those classes that are not subclasses of any others - i.e the top ones
   * @returns an array of properties
  */
    async getAllClasses(includeOwlClasses: boolean = true, getOnlyTopClasses: boolean = false) {
      var filter = ''
      if (getOnlyTopClasses) {
        filter = `FILTER NOT EXISTS {
          ?uri rdfs:subClassOf ?parentClass
        }`
      }
  
      var whereClause = `WHERE {BIND (rdfs:Class as ?_type . ?uri a ?_type ) . ${filter}}`
      if (includeOwlClasses) {
        whereClause = `WHERE {?uri a ?_type . FILTER (?_type IN (owl:Class, rdfs:Class)) . ${filter}}`
      }
  
      const query = `SELECT ?uri ?_type ${whereClause}`
      const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
      return this.wrapClasses(spOut)
    }


  /**
   * @method getStyles 
   * @remarks
   * returns a dictionary object of styles for each specified class. If no classes are specified, it will get all the styles for every class it finds with style
   * pass the classes in as an array of URIs
   * @param classes - An array of URIs (strings) of the classes whose styles are required
   * @returns a dictionary keyed by the class URIs, with the values being style objects
  */
  async getStyles(classes: string[] = []):Promise<AppliedStyle[]> {
    var filter = ""

    if (classes.length > 0) {
      filter = 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )';
    }
    const query = `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`
    const spOut = await this.runQuery<StylesQuerySolution>(query)

    const statements = spOut.results.bindings

    const styles:AppliedStyle[] = []
    statements.forEach((statement:StylesQuerySolution) => {
      var appStyle = new AppliedStyle(statement.cls.value,JSON.parse(decodeURIComponent(statement.style.value)) )
        
      styles.push(appStyle)
    })
    
    return styles
  }

  /**
   * @method setStyle 
   * @remarks
   * sets the default style for a class. Deletes any previous styles
   * @param uri - The URI of the class that have the style assigned
   * @param styleObj - A style object for the class - call makeStyleObject to get one
  */
  setStyle(uri: string, styleObj: Style) {
    const styleStr = encodeURIComponent(JSON.stringify(styleObj))
    this.deleteRelationships(uri, this.telicentStyle)
    this.insertTriple(uri, this.telicentStyle, styleStr, "LITERAL")
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
    const spOut = await this.runQuery<DiagramQuerySolution>(query)

    const statements = spOut.results.bindings

    const diagrams:Diagram[] = []

    statements.forEach((statement:DiagramQuerySolution) => {
      var diag = new Diagram(this,undefined,undefined,undefined,statement)
      diagrams.push(diag)
    })

    return diagrams
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
        SELECT ?uri ?_type ?uuid ?title  WHERE {
            BIND(<${uri}> as ?uri)
            BIND(<${this.telDiagram}> as ?_type)
            ?uri a <${this.telDiagram}> . 
            OPTIONAL {<${uri}> <${this.telUUID}> ?uuid} 
            OPTIONAL {<${uri}> <${this.telTitle}> ?title } 
        }`

    const spOut = await this.runQuery<DiagramQuerySolution>(query)
    const statements = spOut.results.bindings

    if (statements.length > 1) {
      console.warn(`More than one diagram found from getDiagram query with provided URI: ${uri}`)
      return undefined
    }
    else
    {
      if (statements.length < 1) {
        console.warn(`No diagram with URI ${uri} found from getDiagram query`)
        return undefined
      }
      else
      {
        return new Diagram(this,undefined,undefined,undefined,statements[0])
      }
    }
  }


  /**
   * @method getAllObjectProperties
   * @remarks
   * get all object properties (relationships)
   */
  async getAllObjectProperties():Promise<RDFProperty[]> {
    const query = `
      SELECT
        ?uri ?_type
      WHERE {
        BIND (owl:ObjectProperty as ?_type)
        ?uri a ?_type
      }
    `

    const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
    const statements = spOut.results.bindings;
    const properties:RDFProperty[] = []
    statements.forEach((statement:TypedNodeQuerySolution) => {
      var prop = new RDFProperty(this,undefined,undefined,statement)
      properties.push(prop)
    })

    return properties
  }
}

