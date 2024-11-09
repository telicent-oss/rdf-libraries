/** 
  * @module OntologyService
  * @remarks
  * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
  * @author Ian Bailey
  */

import  { RdfService, SPARQLQuerySolution, SPARQLResultBinding, QueryResponse, TypedNodeQuerySolution, RDFSResource, XsdDataType } from "@telicent-oss/RdfService";

export {RDFSResource} from "@telicent-oss/RdfService"


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
      this.constructorAsync.push(this.setUUID(uuid));
      if (!uri) {
        uri = this.service.mintUri()
      }
      if (title) {
        this.constructorAsync.push(this.setTitle(title))
      }
    } 
  }

  async setUUID(uuid:string, securityLabel?:string) {
    return this.addLiteral(this.service.telUUID,uuid,securityLabel,"xsd:string",true)
  }

  async getDiagramElements() : Promise<DiagramElement[]> {
    const query = `SELECT `
    const spOut = await this.service.runQuery<DiagramElementQuerySolution>(query)
    const elemPromises = spOut.results.bindings.map(
      async (statement: DiagramElementQuerySolution) =>
        DiagramElement.createAsync(
          this.service,
          undefined,
          undefined,
          statement
        )
    );
    return await Promise.all(elemPromises);
  }

 // { uri: uri, uuid: '', title: '', diagramElements: {}, diagramRelationships: {} }

}


//A wrapper class for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)  
export class RDFProperty extends RDFSResource {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param type - if not being created from a query, then type (e.g. rdf Property, owl ObjectProperty / DatatypeProperty) must be supplied - will add data to ontology
  */
  service:OntologyService
  public constructor(service: OntologyService, uri? : string, type: string = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property", statement? : TypedNodeQuerySolution) {
    super(service,uri,type,statement)       
    this.service = service    
   
  }

  async setDomain(domain:RDFSClass,deletePrevious:boolean=true):Promise<string> {
    if (deletePrevious) {
      await this.service.deleteRelationships(this.uri,this.service.rdfsDomain)
    }
    return await this.service.insertTriple(this.uri,this.service.rdfsDomain,domain.uri)
  }

  async setRange(range:RDFSClass | XsdDataType,deletePrevious:boolean=true):Promise<string> {
    let uri = ""
    if (deletePrevious) {
      await this.service.deleteRelationships(this.uri,this.service.rdfsRange)
    }
    if (range instanceof RDFSClass) {
      uri = range.uri
    } 
    else {
      uri = range.replace("xsd:",this.service.xsd)
    }
    return await this.service.insertTriple(this.uri,this.service.rdfsRange,uri)
  }

  /**
   * @method addSubProperty
   * @remarks
   * instantiates an rdfs:subPropertyOf relationship from this property to another
   * @param subProperty - The property that is to be related to this using rdfs:subPropertyOf
   * @returns the subproperty as an RDFProperty
  */
  async addSubProperty(subProperty: RDFProperty | string):Promise<RDFProperty> {
    let uri:string = ''
    if (typeof subProperty === "string") {
      uri = subProperty
      await this.service.insertTriple(uri, this.service.rdfsSubPropertyOf, this.uri)
      const statement:TypedNodeQuerySolution = {uri:{value:uri,type:""},_type:{value:"",type:""}}
      return await RDFProperty.createAsync(this.service,undefined,undefined,statement);
    } else {
      uri = subProperty.uri
      await this.service.insertTriple(uri, this.service.rdfsSubPropertyOf, this.uri)
      return subProperty
    }
    
  }

  /**
   * @method addSuperProperty
   * @remarks
   * instantiates an rdfs:subPropertyOf relationship from this property to another
   * @param superProperty - The property that is to be related to the this class using rdfs:subPropertyOf
   * @returns the superproperty as an RDFProperty
  */
  async addSuperProperty(superProperty: RDFProperty | string):Promise<RDFProperty> {
    let uri:string = ''
    if (typeof superProperty === "string") {
      uri = superProperty
      await this.service.insertTriple(this.uri, this.service.rdfsSubPropertyOf,uri)
      const statement:TypedNodeQuerySolution = {uri:{value:uri,type:""},_type:{value:"",type:""}}
      return await RDFProperty.createAsync(this.service, undefined, undefined, statement);
    } else {
      uri = superProperty.uri
      await this.service.insertTriple(this.uri, this.service.rdfsSubPropertyOf, uri)
      return superProperty
    }
  }


  /**
   * @method getSubProperties
   * @remarks
   * returns the sub properties of this property as an array of Property objects
   * @param recurse - if true (default) only immediate subproperties are return otherwise the  hierarchy will be fully recursed
  */
  async getSubProperties(recurse:boolean = false):Promise<RDFProperty[]> {
    let path = ''
    if (recurse) {
      path = '*'
    }
    const query = `SELECT ?uri ?_type WHERE {?uri rdfs:subPropertyOf${path} <${this.uri}> . ?uri a ?_type}`
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    const props:RDFProperty[] = []
    for (const statement of spOut.results.bindings) {
      // TODO fix types to avoid `as unknown as`
      let cls:typeof RDFProperty = RDFProperty;
      if (statement._type) {
        cls = this.service.lookupClass(statement._type.value,RDFProperty) as unknown as typeof RDFProperty
      }
      if (!cls) {
        throw new TypeError(`cls needs to be defined: ${cls}`)
      }
      const prop = new cls(this.service,undefined,undefined,statement)
      props.push(prop)
    }
    return props
  }
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
  public constructor(service: OntologyService, uri? : string, statement? : TypedNodeQuerySolution) {
    super(service,uri,"http://www.w3.org/2002/07/owl#ObjectProperty",statement)           
  }

  async setRange(range:RDFSClass, deletePrevious:boolean=true):Promise<string> {
    return super.setRange(range,deletePrevious)
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
  public constructor(service: OntologyService, uri? : string, statement? : TypedNodeQuerySolution) { 
    super(service,uri,"http://www.w3.org/2002/07/owl#DatatypeProperty",statement)           
  }

  async setRange(range:XsdDataType, deletePrevious:boolean=true):Promise<string> {
    return super.setRange(range,deletePrevious)
  }
}

//A wrapper class for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)  

export class RDFSClass extends RDFSResource {
  createAsync() {

  }
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
  public constructor(service: OntologyService, uri? : string, type: string=service.rdfsClass, superClass?:RDFSClass, statement? : TypedNodeQuerySolution) {
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
        this.constructorAsync.push(
          this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, superClass.uri)
        );
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
    let path = ''
    if (recurse) {
      path = '*'
    }
    const query = `SELECT ?uri ?_type WHERE {?uri rdfs:subClassOf${path} <${this.uri}> . ?uri a ?_type}`
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    return this.service.wrapClasses(spOut,this.uri)
  }

  /**
   * @method getSuperClasses 
   * @remarks
   * Returns a list of all the superclasses of the provided class
   * If your ontology uses any subproperties of rdfs:subClassOf then it will also return those too...unless you set ignoreSubProps
   * If you want to get all the supers going all the way to the top (i.e. transitively climbing up the hierarchy) then set getAll to true
   * @param uri - The uri of the class whose subclasses are returned
   * @param getInherited - set to true to chase up the transitive hierarchy and get all the other levels of superclass (you might get a lot of these !)
   * @returns an array of superclasses
  */
    async getSuperClasses(getInherited = false) {
      const pathOp = getInherited ? "*" : "";
  
      const query = `SELECT ?uri ?_type WHERE {<${this.uri}> <${this.service.rdfsSubClassOf}>${pathOp} ?uri . ?uri a _type .}`
      const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
      return this.service.wrapClasses(spOut,this.uri)
    }

  /**
   * @method getOwnedProperties
   * @remarks
   * returns the properties which specify this class as their domain
   * @param getInherited - set to true to get all the inherited property references
  */
  async getOwnedProperties(getInherited:boolean=false):Promise<RDFProperty[]> {
    let query = `SELECT ?uri ?_type WHERE {?uri rdfs:domain <${this.uri}> }`
    if (getInherited) {
      query = `SELECT ?uri ?_type WHERE {?uri rdfs:domain ?super . <${this.uri}> rdfs:subClassOf* ?super }.`
    }
   
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    const props:RDFProperty[] = []
    let cls = RDFProperty
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        // TODO fix types to avoid `as unknown as`
        cls = this.service.lookupClass(statement._type.value, RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = new cls(this.service,undefined,undefined,statement)
      props.push(prop)
    }
    return props
  }

  /**
   * @method getReferringProperties
   * @remarks
   * returns the properties which specify this class as their range
   * @param getInherited - set to true to get all the inherited property references
  */
  async getReferringProperties(getInherited:boolean=false):Promise<RDFProperty[]> {
    let query = `SELECT ?uri ?_type WHERE {?uri rdfs:range <${this.uri}> }`
    if (getInherited) {
      query = `SELECT ?uri ?_type WHERE {?uri rdfs:range ?super . <${this.uri}> rdfs:subClassOf* ?super }.`
    }
    
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    const props = []
    let cls = RDFProperty
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        // TODO fix types to avoid `as unknown as`
        cls = this.service.lookupClass(statement._type.value,RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = new cls(this.service,undefined,undefined,statement)
      props.push(prop)
    }
    return props
  }

  /**
   * @method addSubClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship from this class to another
   * @param subClass - The subclass that is to be related to this using rdfs:subClassOf
   * @returns the subclass as an RDFSClass
  */
  async addSubClass(subClass: RDFSClass | string):Promise<RDFSClass> {
    let uri:string = ''
    if (typeof subClass === "string") {
      uri = subClass
      this.service.insertTriple(uri, this.service.rdfsSubClassOf, this.uri)
      const statement:TypedNodeQuerySolution = {uri:{value:uri,type:""},_type:{value:"",type:""}}
      return new RDFSClass(this.service,undefined,undefined,undefined,statement)
    } else {
      uri = subClass.uri
      this.service.insertTriple(uri, this.service.rdfsSubClassOf, this.uri)
      return subClass
    }
    
  }

  /**
   * @method addSuperClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship from this class to another
   * @param superClass - The superclass that is to be related to the this class using rdfs:subClassOf
   * @returns the superclass as an RDFSClass
  */
  async addSuperClass(superClass: RDFSClass | string):Promise<RDFSClass> {
    let uri:string = ''
    if (typeof superClass === "string") {
      uri = superClass
      this.service.insertTriple(this.uri, this.service.rdfsSubClassOf,uri)
      const statement:TypedNodeQuerySolution = {uri:{value:uri,type:""},_type:{value:"",type:""}}
      return new RDFSClass(this.service,undefined,undefined,undefined,statement)
    } else {
      uri = superClass.uri
      this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, uri)
      return superClass
    }
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
   * @param superClass - if not being created from a query, a superclass can optionally be specified - i.e. the new class will be a subclass of the superclass
  */
  public constructor(service: OntologyService, uri? : string, type: string=service.owlClass, superClass?:RDFSClass, statement? : TypedNodeQuerySolution) {
    super(service,uri,type,superClass,statement)     
  }

}

export class OntologyService extends RdfService {
  telDiagram: string;
  telUUID: string;
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

  rdfsClass: string;
  rdfsSubClassOf: string;
  rdfsDomain: string;
  rdfsRange: string;
  rdfProperty: string;
  rdfsSubPropertyOf: string;
  owlClass: string;
  owlDatatypeProperty: string;
  owlObjectProperty: string;
  telicentStyle: string;

  /**
   * @method constructor
   * @remarks
   * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
   * @param triplestoreUri - The host address of the triplestore
   * @param dataset - the dataset name in the triplestore
   * @param defaultUriStub - the default stub to use when building GUID URIs
   * @param defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
  */
  constructor(triplestoreUri = "http://localhost:3030/", dataset = "ontology", defaultUriStub = "http://telicent.io/ontology/", defaultSecurityLabel = "", write:boolean = false) {
    super(triplestoreUri, dataset, defaultUriStub, defaultSecurityLabel,write)
    this.telDiagram = this.telicent + "Diagram"
    this.telUUID = this.telicent + "uuid"
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
    this.rdfsClass = `${this.rdfs}Class`
    this.rdfsSubClassOf = `${this.rdfs}subClassOf`
    this.rdfsDomain = `${this.rdfs}domain`
    this.rdfsRange = `${this.rdfs}range`
    this.rdfProperty = `${this.rdf}Property`
    this.rdfsSubPropertyOf = `${this.rdfs}subPropertyOf`
    this.owlClass = `${this.owl}Class`
    this.owlDatatypeProperty = `${this.owl}DatatypeProperty`
    this.owlObjectProperty = `${this.owl}ObjectProperty`
    this.telicentStyle = `${this.telicent}style`
    this.classLookup[this.rdfProperty] = RDFProperty
    this.classLookup[this.owlClass] = OWLClass
    this.classLookup[this.owlDatatypeProperty] = OWLDatatypeProperty
    this.classLookup[this.owlObjectProperty] = OWLObjectProperty
    this.classLookup[this.rdfsClass] = RDFSClass
    this.addPrefix("owl:", this.owl)
  }


  wrapClasses(results:QueryResponse<TypedNodeQuerySolution>,exclude?:string) {
    const clss:RDFSClass[] = []
    let cls = RDFSClass
    results.results.bindings.forEach((statement:TypedNodeQuerySolution) => {
    
      if (statement.uri.value != exclude) {
        if (statement.uri.value in this.nodes) {
          clss.push(this.nodes[statement.uri.value] as RDFSClass)
        }
        else 
        {
          if (statement._type) {
            cls = this.lookupClass(statement._type.value,RDFSClass) as unknown as typeof RDFSClass
          }
          const rc = new cls(this,undefined,undefined,undefined,statement)
          clss.push(rc)
        }
      }
    
      
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
  async getAllRdfProperties(includeOwlProperties: boolean = true, getOnlyTopProperties: boolean = false):Promise<RDFProperty[]> {
    let filter = ''
    if (getOnlyTopProperties) {
      filter = `FILTER NOT EXISTS {
        ?uri rdfs:subPropertyOf ?parentProp
      }`
    }

    let whereClause = `WHERE {BIND (rdf:Property as ?_type . ?uri a ?_type ) . ${filter}}`
    if (includeOwlProperties) {
      whereClause = `WHERE {?uri a ?_type . FILTER (?_type IN (owl:ObjectProperty, owl:DatatypeProperty, rdf:Property)) . ${filter}}`
    }

    const query = `SELECT ?uri ?_type ${whereClause}`
    const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
    const props:RDFProperty[] = []
    let cls = RDFProperty
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        cls = this.lookupClass(statement._type.value,RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = new cls(this,undefined,undefined,statement)
      props.push(prop)
    }
    return props
  }

  /**
   * @method getAllClasses
   * @remarks
   * returns all classes in the ontology (with some filters)
   * @param includeOwlClasses - if true (default) this will return owl classes as well as rdfs classes
   * @param getOnlyTopClasses - if true (default is false) this will only return those classes that are not subclasses of any others - i.e the top ones
   * @returns an array of RDFSClasses
  */
    async getAllClasses(includeOwlClasses: boolean = true, getOnlyTopClasses: boolean = false):Promise<RDFSClass[]> {
      let filter = ''
      if (getOnlyTopClasses) {
        filter = `FILTER NOT EXISTS {
          ?uri rdfs:subClassOf ?parentClass
        }`
      }
  
      let whereClause = `WHERE {BIND (rdfs:Class as ?_type . ?uri a ?_type ) . ${filter}}`
      if (includeOwlClasses) {
        whereClause = `WHERE {?uri a ?_type . FILTER (?_type IN (owl:Class, rdfs:Class)) . ${filter}}`
      }
  
      const query = `SELECT ?uri ?_type ${whereClause}`
      const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
      return this.wrapClasses(spOut)
    }

  /**
   * @method getTopClasses
   * @remarks
   * returns the classes that have no superclasses
   * @returns an array of RDFSClasses
  */
    async getTopClasses():Promise<RDFSClass[]> {
      return await this.getAllClasses(true,true)
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
    let filter = ""

    if (classes.length > 0) {
      filter = 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )';
    }
    const query = `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`
    const spOut = await this.runQuery<StylesQuerySolution>(query)

    const statements = spOut.results.bindings

    const styles:AppliedStyle[] = []
    statements.forEach((statement:StylesQuerySolution) => {
      const appStyle = new AppliedStyle(statement.cls.value,JSON.parse(decodeURIComponent(statement.style.value)) )
        
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
            {?uri <${this.dcTitle}> ?title } 
        }`
    const spOut = await this.runQuery<DiagramQuerySolution>(query)

    const statements = spOut.results.bindings

    const diagrams = statements.map((statement: DiagramQuerySolution) =>
      Diagram.createAsync(this, undefined, undefined, undefined, statement)
    );

    return await Promise.all(diagrams);
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
            OPTIONAL {<${uri}> <${this.dcTitle}> ?title } 
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
        return await Diagram.createAsync(this, undefined, undefined, undefined, statements[0]);
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
    const rdfPropertyPromises = statements.map(
      (statement: TypedNodeQuerySolution) =>
        RDFProperty.createAsync(this, undefined, undefined, statement)
    );

    return await Promise.all(rdfPropertyPromises);
  }
}

