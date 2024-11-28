/**
 * @module OntologyService
 * @remarks
 * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
 * @author Ian Bailey
 */

import {
  createQueryResponseSchema,
  LongURI,
  PrefixedURI,
  QueryResponse,
  RdfService,
  RDFSResource,
  ResourceDescription,
  SPARQLQuerySolution,
  SPARQLResultBinding,
  SparQLResultBinding,
  SPOQuerySolution,
  StringsDict,
  TypedNodeQuerySolution,
  XsdDataType,
} from "@telicent-oss/rdfservice";
import { z } from "zod";
import { getTypeInitials } from "./ds-helper";
export {
  type QueryResponse,
  RDFSResource,
  type SPOQuerySolution,
  type TypedNodeQuerySolution,
} from "@telicent-oss/rdfservice";


export const OntologyStyle = z.object({
  defaultIcons: z.object({
    riIcon: z.string(),
    faIcon: z.string(),
    faUnicode: z.string(),
    faClass: z.string(),
  }),
  defaultStyles: z.object({
    shape: z.string(),
    borderRadius: z.string(),
    borderWidth: z.string(),
    selectedBorderWidth: z.string(),
    dark: z.object({
      backgroundColor: z.string(),
      color: z.string(),
    }),
    light: z.object({
      backgroundColor: z.string(),
      color: z.string(),
    }),
  }),
});

export const StyleResponse = z.record(z.string(), OntologyStyle);
export type StyleResponseType = z.infer<typeof StyleResponse>;
// export type StyleResponse = Record<string, typeof OntologyStyle>;


export type OntologyStyle = {
  defaultIcons: {
    riIcon: string;
    faIcon: string;
    faUnicode: string;
    faClass: string;
  };
  defaultStyles: {
    shape: string;
    borderRadius: string;
    borderWidth: string;
    selectedBorderWidth: string;
    dark: {
      backgroundColor: string;
      color: string;
    };
    light: {
      backgroundColor: string;
      color: string;
    };
  };
};
export const StylesQuerySolution = z.object({
  cls: SparQLResultBinding,
  style: SparQLResultBinding,
});

export const FlattenedStyle = z.object({
  classUri: z.string(),
  backgroundColor: z.string(),
  color: z.string(),
  iconFallbackText: z.string(),
  alt: z.string(),
  shape: z.string(),
  faUnicode: z.string(),
  faIcon: z.string(),
});

export type FlattenedStyleType = z.infer<typeof FlattenedStyle>;

export type FlattenedStyleTypeForFindIcon = Omit<FlattenedStyleType, "shape" | "faUnicode" | "faIcon">;
export const IconStyle = z.object({
  classUri: z.string(),
  backgroundColor: z.string(),
  color: z.string(),
  iconFallbackText: z.string(),
  alt: z.string(),

  faIcon: z.string().optional(),
  faUnicode: z.string().optional(),
  shape: z.string().optional(),
});
export type IconStyleType = z.infer<typeof IconStyle>;

export const IconStyleArray = z.array(IconStyle);

export type IconStyleArrayType = z.infer<typeof IconStyleArray>;

export type ResourceDict = {
  [key: LongURI]: RDFSResource[];
};

export type ClassDescription = {
  style?: Style;
  labels: string[];
  comments: string[];
  isDomainFor: RDFSClass[];
  isRangeFor: RDFSClass[];
  outLinks: ResourceDict;
  literals: StringsDict;
  inLinks: ResourceDict;
  diagramElements: DiagramElement[];
  superClasses: RDFSClass[];
  subClasses: RDFSClass[];
};

export type PropertyDescription = {
  style?: Style;
  subProperties: RDFProperty[];
  superProperties: RDFProperty[];
  labels: string[];
  comments: string[];
  domains: RDFSClass[];
  ranges: RDFSClass[];
  diagramElements: DiagramElement[];
  inLinks: ResourceDict;
  outLinks: ResourceDict;
  literals: StringsDict;
};

export type HierarchyNodes = {
  [key: LongURI]: HierarchyNode;
};

export type HierarchyNode = {
  id: string;
  label: string;
  item: OntologyItem;
  rdfsLabels: string[];
  style?: Style;
  children: HierarchyNode[];
  parents: HierarchyNode[];
  expanded: boolean;
};

export interface InheritedDomainQuerySolution extends SPARQLQuerySolution {
  prop: SPARQLResultBinding;
  item: SPARQLResultBinding;
}

export interface SuperClassQuerySolution extends SPARQLQuerySolution {
  super: SPARQLResultBinding;
  subRel: SPARQLResultBinding;
}

export type DiagramListQuerySolution = {
  uri: SPARQLResultBinding;
  uuid: SPARQLResultBinding;
  title: SPARQLResultBinding;
};

export interface HierarchyQuerySolution extends TypedNodeQuerySolution {
  labels: SPARQLResultBinding;
  subs: SPARQLResultBinding;
  styles: SPARQLResultBinding;
  supers: SPARQLResultBinding;
}

export interface DiagramQuerySolution extends TypedNodeQuerySolution {
  uuid: SPARQLResultBinding;
  title: SPARQLResultBinding;
}

export interface DiagramElementQuerySolution extends TypedNodeQuerySolution {
  style?: SPARQLResultBinding;
  baseType?: SPARQLResultBinding;
  element: SPARQLResultBinding;
}

export interface DiagramPropertyQuerySolution
  extends DiagramElementQuerySolution {
  domain?: SPARQLResultBinding;
  range?: SPARQLResultBinding;
}

export interface DiagramRelationshipQuerySolution
  extends TypedNodeQuerySolution {
  style?: SPARQLResultBinding;
  source: SPARQLResultBinding;
  target: SPARQLResultBinding;
  rel: SPARQLResultBinding;
}

export class Style {
  bgColour: string;
  colour: string;
  icon: string;
  height: number;
  width: number;
  x: number;
  y: number;
  shape: string;
  public constructor(
    bgColour?: string,
    colour?: string,
    icon?: string,
    height?: number,
    width?: number,
    x?: number,
    y?: number,
    shape?: string,
  ) {
    this.bgColour = bgColour || "#888";
    this.colour = colour || "#000";
    this.icon = icon || "fa-solid fa-question";
    this.height = height || 0;
    this.width = width || 0;
    this.x = x || 0;
    this.y = y || 0;
    this.shape = shape || "diamond";
  }
}

export class AppliedStyle {
  cls: string;
  style: Style;
  public constructor(cls: string, style: Style) {
    this.cls = cls;
    this.style = style;
  }
}

export class Diagram extends RDFSResource {
  uuid: string;
  title: string;
  service: OntologyService;
  public constructor(
    service: OntologyService,
    uri?: string,
    uuid?: string,
    title?: string,
    statement?: DiagramQuerySolution,
  ) {
    super(service, uri, service.telDiagram, statement);
    this.service = service;
    this.uuid = "";
    this.title = "";
    if (statement) {
      if (statement.uuid) {
        this.uuid = statement.uuid.value;
      }
      if (statement.title) {
        this.title = statement.title.value;
      }
    } else {
      if (!uuid) {
        uuid = crypto.randomUUID();
      }
      this.constructorPromises.push(this.setUUID(uuid));
      if (!uri) {
        uri = this.service.mintUri();
      }
      if (title) {
        this.constructorPromises.push(this.setTitle(title))
      }
    }
  }

  async setUUID(uuid: string, securityLabel?: string) {
    return this.addLiteral(
      this.service.telUUID,
      uuid,
      securityLabel,
      "xsd:string",
      true,
    );
  }

  async getDiagramElements(): Promise<DiagramElement[]> {
    const query = `SELECT ?uri ?_type ?style ?element ?baseType
      WHERE {
        ?uri a ?_type .
        FILTER  (?_type IN (<${this.service.telDiagramElement}>,<${this.service.telDiagramPropertyDefinition}>))
        ?uri <${this.service.telInDiagram}> <${this.uri}> .
        ?uri <${this.service.telRepresents}> ?element .
        OPTIONAL {?uri <${this.service.telBaseType}> ?baseType }
        OPTIONAL {?uri <${this.service.telElementStyle}> ?style }
      }`;
    const spOut = await this.service.runQuery<DiagramElementQuerySolution>(
      query,
    );

    const elems: DiagramElement[] = [];
    spOut.results.bindings.forEach(async (statement: DiagramElementQuerySolution) => {
      let deClsUri = this.service.telDiagramElement;
      if (statement._type) {
        deClsUri = statement._type.value;
      }

      const DiagramElementClass = this.service.classLookup[deClsUri] || this.service.classLookup[this.service.telDiagramElement]
      /**
       * !!CRITICAL This lookup seems unnecessary based on assumptions about the instance below
       * 
       * ALso we should generally, map specific uris to specific classes in code
       * The classLookup broadly maps LongURI's to classes. 
       * But the code could declare specific strings to specific classes
       * This way TS inference could infer the class of an instantiated type 
       * (which would turn the elem.baseType assumption, into an static-type-inferred fact)
       * OR, there should be runtime checking
       * (which would turn the elem.baseType assumption into a runtime-validated fact)
       * 
       * I'm pretty certain there is only a minor downside - relating to wanting urls and classes to be fully controlled
       * at runtime. But that would demand some very hardcore inversion of control - and I'm pretty certain
       * the original author really just wanted a set of semantic classes that map to data spec concepts.
       */
      // 
      const elem = await DiagramElementClass.createAsync(this.service, undefined, undefined, statement)
      if (elem instanceof DiagramElement === false) {
        throw new Error(`Expected ${deClsUri} to create DiagramElement`)
      }

      if (statement.baseType) {
        elem.baseType = statement.baseType.value;
      } else {
        elem.baseType = this.service.rdfsResource;
      }
      const ElemBaseClass = this.service.classLookup[elem.baseType] || this.service.rdfsResource
      if (statement.element.value in this.service.nodes) {
        elem.element = this.service.nodes[statement.element.value];
      } else {
        const typedStatement = this.service.makeTypedStatement(statement.element.value, elem.baseType);
        elem.element = await ElemBaseClass.createAsync(this.service, undefined, undefined, typedStatement)
      }
      if (statement.style) {
        elem.style = JSON.parse(decodeURIComponent(statement.style.value));
      }
      elems.push(elem);
    });
    return elems;
  }

  async getDiagramRelations(): Promise<DiagramRelationship[]> {
    const query = `SELECT ?uri ?_type ?source ?target ?style ?rel 
      WHERE {
        BIND (<${this.service.telDiagramRelationship}> as ?_type) .
        ?uri a ?_type .
        ?uri <${this.service.telInDiagram}> <${this.uri}> .
        ?uri <${this.service.telRepresents}> ?rel .
        ?uri <${this.service.telSourceElem}> ?source .
        ?uri <${this.service.telTargetElem}> ?target .
        OPTIONAL {?uri <${this.service.telRelationshipStyle}> ?style }
      }`;

    const spOut = await this.service.runQuery<DiagramRelationshipQuerySolution>(
      query,
    );
    const rels: DiagramRelationship[] = [];
    spOut.results.bindings.forEach(
      (statement: DiagramRelationshipQuerySolution) => {
        const rel: DiagramRelationship = { uri: statement.uri.value };
        if (statement.source.value in this.service.nodes) {
          rel.source = this.service
            .nodes[statement.source.value] as DiagramElement;
        } else {
          rel.source = new DiagramElement(
            this.service,
            undefined,
            undefined,
            this.service.makeTypedStatement(
              statement.source.value,
              this.service.telDiagramElement,
            ),
          );
        }
        if (statement.target.value in this.service.nodes) {
          rel.target = this.service
            .nodes[statement.target.value] as DiagramElement;
        } else {
          rel.target = new DiagramElement(
            this.service,
            undefined,
            undefined,
            this.service.makeTypedStatement(
              statement.target.value,
              this.service.telDiagramElement,
            ),
          );
        }
        rel.relationship = statement.rel.value;

        if (statement.style) {
          rel.style = JSON.parse(decodeURIComponent(statement.style.value));
        }
        rels.push(rel);
      },
    );
    return rels;
  }
}

abstract class OntologyItem extends RDFSResource {
  /**
   * @method constructor
   * @remarks
   * Abstract class to cover items in OntologyService
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param type - if not being created from a query, provide type
   */
  service: OntologyService;
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = "http://www.w3.org/2000/01/rdf-schema#Resource",
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }

  /**
   * @method setStyle
   * @remarks
   * sets the default style for a property. Deletes any previous styles
   * @param styleObj - A style object for the class - call makeStyleObject to get
   */
  setStyle(styleObj: Style) {
    const styleStr = encodeURIComponent(JSON.stringify(styleObj))
    return this.service.insertTriple(this.uri, this.service.telicentStyle, styleStr, "LITERAL", undefined, undefined, true)
  }

  //dummy function to be overriden by subclasses
  // TODO Good chance this method could be replaced with interface or abstract class
  async describe(): Promise<any> {
    return undefined;
  }

  /**
   * @method getDiagrams
   * @remarks
   * returns all the diagrams that feature this ontology item
   */
  async getDiagrams(): Promise<Diagram[]> {
    const out: Diagram[] = [];
    const query: string =
      `SELECT ?uri (group_concat(DISTINCT ?uuids) as ?uuid) (group_concat(DISTINCT ?titles) as ?title)  (group_concat(DISTINCT ?type) as ?_type)
      WHERE {
        BIND (<${this.service.telDiagram}> as ?type) .
        ?diagramObject <${this.service.telRepresents}> <${this.uri}> .
        ?diagramObject <${this.service.telInDiagram}> ?uri .
        ?uri a ?type .
        OPTIONAL { ?uri <${this.service.dcTitle}> ?titles }
        OPTIONAL { ?uri <${this.service.telUUID}> ?uuids }
      } GROUP BY ?uri`;
    const spOut = await this.service.runQuery<DiagramQuerySolution>(query);
    spOut.results.bindings.forEach((statement: DiagramQuerySolution) => {
      out.push(
        new Diagram(this.service, undefined, undefined, undefined, statement),
      );
    });
    return out;
  }
}

export class DiagramElement extends OntologyItem {
  style?: Style;
  element?: RDFSResource;
  baseType?: LongURI;
  service: OntologyService;
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = service.telDiagramElement,
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }
}

export class DiagramProperty extends DiagramElement {
  domain?: DiagramElement;
  range?: DiagramElement;
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = service.telDiagramPropertyDefinition,
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }
}

export type DiagramRelationship = {
  uri: LongURI;
  source?: DiagramElement;
  target?: DiagramElement;
  relationship?: LongURI;
  style?: Object;
};

//A wrapper class for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)
export class RDFProperty extends OntologyItem {
  /**
   * @method constructor
   * @remarks
   * Initiate a Typescript wrapper for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)
   * @param service - a reference to the OntologyService being used
   * @param statement - if the object is being created from a query, pass in the PropertyQuery to instantiate
   * @param uri - if not being created from a query, then URI must be supplied - will add data to the ontology
   * @param type - if not being created from a query, then type (e.g. rdf Property, owl ObjectProperty / DatatypeProperty) must be supplied - will add data to ontology
   */
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property",
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }

  async getNodes(
    nodeURIs: string[],
    optionalPredicates: string[] = [],
  ): Promise<RDFSResource[]> {
    const out: RDFSResource[] = [];

    return out;
  }

  async describe(): Promise<PropertyDescription> {
    const rawDesc: ResourceDescription = await this.describeNode(
      "http://telicent.io/ontology/inDiagram",
    );
    const out: PropertyDescription = {
      style: undefined,
      labels: [],
      comments: [],
      domains: [],
      ranges: [],
      diagramElements: [],
      superProperties: [],
      subProperties: [],
      inLinks: {},
      outLinks: {},
      literals: {},
    };
    Object.keys(rawDesc.literals).forEach((predicate: string) => {
      const lits: string[] = rawDesc.literals[predicate];
      switch (predicate) {
        case this.service.rdfsComment: {
          out.comments = lits;
          break;
        }
        case this.service.rdfsLabel: {
          out.labels = lits;
          break;
        }
        case this.service.telicentStyle: {
          out.style = JSON.parse(decodeURIComponent(lits[0]));
          break;
        }
        default: {
          out.literals[predicate] = lits;
        }
      }
    });
    await Promise.all(Object.keys(rawDesc.outLinks).map((predicate: LongURI) => {
      const outLink = rawDesc.outLinks[predicate]
      switch (predicate) {
        case this.service.rdfsSubPropertyOf: {
          return this.service.processObjectLink(outLink, predicate, out.superProperties)
        }
        case this.service.rdfsRange: {
          return this.service.processObjectLink(outLink, predicate, out.ranges)
        }
        case this.service.rdfsDomain: {
          return this.service.processObjectLink(outLink, predicate, out.domains)
        }
        default: {
          out.outLinks[predicate] = []
          return this.service.processObjectLink(outLink, predicate, out.outLinks[predicate])
        }
      }
    }));
    await Promise.all(Object.keys(rawDesc.inLinks).map((predicate: LongURI) => {
      const inLink = rawDesc.inLinks[predicate]
      switch (predicate) {
        case this.service.rdfsSubPropertyOf: {
          return this.service.processObjectLink(inLink, predicate, out.subProperties)
        }
        case this.service.telRepresents: {
          return this.service.processObjectLink(inLink, predicate, out.diagramElements)
        }
        default: {
          out.inLinks[predicate] = []
          return this.service.processObjectLink(inLink, predicate, out.inLinks[predicate])
        }
      }
    }));
    return out
  }

  async setDomain(
    domain: RDFSClass,
    deletePrevious: boolean = true,
  ): Promise<string> {
    if (deletePrevious) {
      await this.service.deleteRelationships(this.uri, this.service.rdfsDomain);
    }
    return await this.service.insertTriple(
      this.uri,
      this.service.rdfsDomain,
      domain.uri,
    );
  }

  async setRange(
    range: RDFSClass | XsdDataType,
    deletePrevious: boolean = true,
  ): Promise<string> {
    let uri: LongURI = "";
    if (deletePrevious) {
      await this.service.deleteRelationships(this.uri, this.service.rdfsRange);
    }
    if (range instanceof RDFSClass) {
      uri = range.uri;
    } else {
      uri = range.replace("xsd:", this.service.xsd);
    }
    return await this.service.insertTriple(
      this.uri,
      this.service.rdfsRange,
      uri,
    );
  }

  /**
   * @method addSubProperty
   * @remarks
   * instantiates an rdfs:subPropertyOf relationship from this property to another
   * @param subProperty - The property that is to be related to this using rdfs:subPropertyOf
   * @returns the subproperty as an RDFProperty
   */
  async addSubProperty(
    subProperty: RDFProperty | LongURI,
  ): Promise<RDFProperty> {
    let uri: LongURI = "";
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
  async addSuperProperty(
    superProperty: RDFProperty | LongURI,
  ): Promise<RDFProperty> {
    let uri: LongURI = "";
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
  async getSubProperties(recurse: boolean = false): Promise<RDFProperty[]> {
    let path = "";
    if (recurse) {
      path = "*";
    }
    const query = `SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {?uri rdfs:subPropertyOf${path} <${this.uri}> . ?uri a ?type} GROUP BY ?uri`
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query)
    const props: RDFProperty[] = []
    for (const statement of spOut.results.bindings) {
      // TODO fix types to avoid `as unknown as`
      let cls:typeof RDFProperty = RDFProperty;
      if (statement._type) {
        cls = this.service.lookupClass(statement._type.value,RDFProperty) as unknown as typeof RDFProperty
      }
      if (!cls) {
        throw new TypeError(`cls needs to be defined: ${cls}`)
      }
      const prop = new cls(this.service, undefined, undefined, statement);
      props.push(prop);
    }
    return props;
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
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = "http://www.w3.org/2002/07/owl#ObjectProperty",
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }

  async setRange(
    range: RDFSClass,
    deletePrevious: boolean = true,
  ): Promise<string> {
    return super.setRange(range, deletePrevious);
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
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = "http://www.w3.org/2002/07/owl#DatatypeProperty",
    statement?: TypedNodeQuerySolution,
  ) {
    super(service, uri, type, statement);
    this.service = service;
  }

  async setRange(
    range: XsdDataType,
    deletePrevious: boolean = true,
  ): Promise<string> {
    return super.setRange(range, deletePrevious);
  }
}

//A wrapper class for an RDF Property (or an OWL ObjectProperty / DatatypeProperty)  
export class RDFSClass extends OntologyItem {

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
  service: OntologyService;
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = service.rdfsClass,
    statement?: TypedNodeQuerySolution,
    superClass?: RDFSClass,
  ) {
    super(service, uri, type, statement);
    this.service = service;
    if (statement) {
      if (superClass) {
        this.service.warn(
          "Do not set superClass parameter if creating class from a query",
        );
      }
    } else {
      if (superClass) {
        this.constructorPromises.push(
          this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, superClass.uri)
        );
      }
    }
  }


  async describe(): Promise<ClassDescription> {
    const rawDesc: ResourceDescription = await this.describeNode(
      "http://telicent.io/ontology/inDiagram",
    );
    const out: ClassDescription = {
      style: undefined,
      labels: [],
      comments: [],
      isDomainFor: [],
      isRangeFor: [],
      diagramElements: [],
      superClasses: [],
      subClasses: [],
      inLinks: {},
      outLinks: {},
      literals: {},
    };
    Object.keys(rawDesc.literals).forEach((predicate: string) => {
      const lits: string[] = rawDesc.literals[predicate];
      switch (predicate) {
        case this.service.rdfsComment: {
          out.comments = lits;
          break;
        }
        case this.service.rdfsLabel: {
          out.labels = lits;
          break;
        }
        case this.service.telicentStyle: {
          out.style = JSON.parse(decodeURIComponent(lits[0]));
          break;
        }
        default: {
          out.literals[predicate] = lits;
        }
      }
    });
    await Promise.all(Object.keys(rawDesc.outLinks).map((predicate: LongURI) => {
      const outLink = rawDesc.outLinks[predicate]
      switch (predicate) {
        case this.service.rdfsSubClassOf: {
          return this.service.processObjectLink(outLink, predicate, out.superClasses)
        }
        default: {
          out.outLinks[predicate] = []
          return this.service.processObjectLink(outLink, predicate, out.outLinks[predicate])
        }
      }
    }));
    await Promise.all(Object.keys(rawDesc.inLinks).map((predicate: LongURI) => {
      const inLink = rawDesc.inLinks[predicate]
      switch (predicate) {
        case this.service.rdfsSubClassOf: {
          return this.service.processObjectLink(inLink, predicate, out.subClasses)
        }
        case this.service.rdfsRange: {
          return this.service.processObjectLink(inLink, predicate, out.isRangeFor)
        }
        case this.service.rdfsDomain: {
          return this.service.processObjectLink(inLink, predicate, out.isDomainFor)
        }
        case this.service.telRepresents: {
          return this.service.processObjectLink(inLink, predicate, out.diagramElements)
        }
        default: {
          out.inLinks[predicate] = []
          return this.service.processObjectLink(inLink, predicate, out.inLinks[predicate])
        }
      }
    }));
    return out
  }

  /**
   * @method getSubClasses
   * @remarks
   * returns the subclasses of this class as an array of RDFSClass objects
   * @param recurse - if true (default) only immediate subproperties are return otherwise the  hierarchy will be fully recursed
   */
  async getSubClasses(recurse: boolean = false): Promise<RDFSClass[]> {
    let path = "";
    if (recurse) {
      path = "*";
    }
    const query =
      `SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {?uri rdfs:subClassOf${path} <${this.uri}> . ?uri a ?type} GROUP BY ?uri`;
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query);
    return this.service.wrapClasses(spOut, this.uri);
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

    const query =
      `SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) WHERE {<${this.uri}> <${this.service.rdfsSubClassOf}>${pathOp} ?uri . ?uri a type .} GROUP BY ?uri`;
    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query);
    return this.service.wrapClasses(spOut, this.uri);
  }

  /**
   * @method getOwnedProperties
   * @remarks
   * returns the properties which specify this class as their domain
   * @param getInherited - set to true to get all the inherited property references
   */
  async getOwnedProperties(
    getInherited: boolean = false,
  ): Promise<RDFProperty[]> {
    let query =
      `SELECT ?uri ?_type WHERE {?uri rdfs:domain <${this.uri}> . ?uri a ?_type }`;
    if (getInherited) {
      query =
        `SELECT ?uri ?_type WHERE {?uri rdfs:domain ?super . <${this.uri}> rdfs:subClassOf* ?super . ?uri a ?_type }`;
    }

    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query);
    const props: RDFProperty[] = [];
    let cls = RDFProperty;
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        // TODO fix types to avoid `as unknown as`
        cls = this.service.lookupClass(statement._type.value, RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = new cls(this.service, undefined, undefined, statement);
      props.push(prop);
    }
    return props;
  }

  /**
   * @method getReferringProperties
   * @remarks
   * returns the properties which specify this class as their range
   * @param getInherited - set to true to get all the inherited property references
   */
  async getReferringProperties(
    getInherited: boolean = false,
  ): Promise<RDFProperty[]> {
    let query =
      `SELECT ?uri ?_type WHERE {?uri rdfs:range <${this.uri}> . ?uri a ?_type }`;
    if (getInherited) {
      query =
        `SELECT ?uri ?_type WHERE {?uri rdfs:range ?super . <${this.uri}> rdfs:subClassOf* ?super . ?uri a ?_type }`;
    }

    const spOut = await this.service.runQuery<TypedNodeQuerySolution>(query);
    const props = [];
    let cls = RDFProperty;
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        // TODO fix types to avoid `as unknown as`
        cls = this.service.lookupClass(statement._type.value, RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = new cls(this.service, undefined, undefined, statement);
      props.push(prop);
    }
    return props;
  }

  /**
   * @method addSubClass
   * @remarks
   * instantiates an rdfs:subClassOf relationship from this class to another
   * @param subClass - The subclass that is to be related to this using rdfs:subClassOf
   * @returns the subclass as an RDFSClass
   */
  async addSubClass(subClass: RDFSClass | LongURI): Promise<RDFSClass> {
    let uri: LongURI = "";
    if (typeof subClass === "string") {
      uri = subClass
      await this.service.insertTriple(uri, this.service.rdfsSubClassOf, this.uri)
      const statement: TypedNodeQuerySolution = { uri: { value: uri, type: "" }, _type: { value: "", type: "" } }
      return new RDFSClass(this.service, undefined, undefined, statement)
    } else {
      uri = subClass.uri
      await this.service.insertTriple(uri, this.service.rdfsSubClassOf, this.uri)
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
  async addSuperClass(superClass: RDFSClass | LongURI): Promise<RDFSClass> {
    let uri: LongURI = "";
    if (typeof superClass === "string") {
      uri = superClass
      await this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, uri)
      const statement: TypedNodeQuerySolution = { uri: { value: uri, type: "" }, _type: { value: "", type: "" } }
      return new RDFSClass(this.service, undefined, undefined, statement)
    } else {
      uri = superClass.uri
      await this.service.insertTriple(this.uri, this.service.rdfsSubClassOf, uri)
      return superClass
    }
  }
}

export class RDFSDatatype extends RDFSClass {
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = service.rdfsDatatype,
    statement?: TypedNodeQuerySolution,
    superClass?: RDFSClass,
  ) {
    super(service, uri, type, statement, superClass);
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
  public constructor(
    service: OntologyService,
    uri?: LongURI,
    type: LongURI = service.owlClass,
    statement?: TypedNodeQuerySolution,
    superClass?: RDFSClass,
  ) {
    super(service, uri, type, statement, superClass);
  }
}

export class OntologyService extends RdfService {
  telDiagram: LongURI;
  telUUID: LongURI;
  telElementStyle: LongURI;
  telRelationshipStyle: LongURI;
  telInDiagram: LongURI;
  telRepresents: LongURI;
  telBaseType: LongURI;
  telDiagramElement: LongURI;
  telDiagramRelationship: LongURI;
  telDiagramPropertyDefinition: LongURI;
  telRouting: LongURI;
  telDisplayAs: LongURI;
  telSourceElem: LongURI;
  telTargetElem: LongURI;

  rdfsClass: LongURI;
  rdfsDatatype: LongURI;
  rdfsSubClassOf: LongURI;
  rdfsDomain: LongURI;
  rdfsRange: LongURI;
  rdfProperty: LongURI;
  rdfsSubPropertyOf: LongURI;
  owlClass: LongURI;
  owlDatatypeProperty: LongURI;
  owlObjectProperty: LongURI;
  telicentStyle: LongURI;

  /**
   * @method constructor
   * @remarks
   * An extension of RdfService for managing ontology elements (RDFS and OWL) and diagramatic / style information
   * @param triplestoreUri - The host address of the triplestore
   * @param dataset - the dataset name in the triplestore
   * @param defaultUriStub - the default stub to use when building GUID URIs
   * @param defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
   */
  constructor(
    triplestoreUri = "http://localhost:3030/",
    dataset = "ontology",
    defaultUriStub = "http://telicent.io/ontology/",
    defaultSecurityLabel = "",
    write: boolean = false,
  ) {
    super(triplestoreUri, dataset, defaultUriStub, defaultSecurityLabel, write);
    this.telDiagram = this.telicent + "Diagram";
    this.telUUID = this.telicent + "uuid";
    this.telElementStyle = this.telicent + "elementStyle";
    this.telRelationshipStyle = this.telicent + "relationshipStyle";
    this.telInDiagram = this.telicent + "inDiagram";
    this.telRepresents = this.telicent + "represents";
    this.telBaseType = this.telicent + "baseType";
    this.telDiagramElement = this.telicent + "DiagramElement";
    this.telDiagramRelationship = this.telicent + "DiagramRelationship";
    this.telDiagramPropertyDefinition = this.telicent +
      "DiagramPropertyDefinition";
    this.telRouting = this.telicent + "routing";
    this.telDisplayAs = this.telicent + "displayAs";
    this.telSourceElem = this.telicent + "sourceElem";
    this.telTargetElem = this.telicent + "targetElem";
    this.rdfsClass = `${this.rdfs}Class`;
    this.rdfsDatatype = `${this.rdfs}Datatype`;
    this.rdfsSubClassOf = `${this.rdfs}subClassOf`;
    this.rdfsDomain = `${this.rdfs}domain`;
    this.rdfsRange = `${this.rdfs}range`;
    this.rdfProperty = `${this.rdf}Property`;
    this.rdfsSubPropertyOf = `${this.rdfs}subPropertyOf`;
    this.owlClass = `${this.owl}Class`;
    this.owlDatatypeProperty = `${this.owl}DatatypeProperty`;
    this.owlObjectProperty = `${this.owl}ObjectProperty`;
    this.telicentStyle = `${this.telicent}style`;
    this.classLookup[this.rdfProperty] = RDFProperty;
    this.classLookup[this.owlClass] = OWLClass;
    this.classLookup[this.owlDatatypeProperty] = OWLDatatypeProperty;
    this.classLookup[this.owlObjectProperty] = OWLObjectProperty;
    this.classLookup[this.rdfsClass] = RDFSClass;
    this.classLookup[this.rdfsDatatype] = RDFSDatatype;
    this.classLookup[this.telDiagramElement] = DiagramElement;
    this.classLookup[this.telDiagram] = Diagram;
    this.classLookup[this.telDiagramPropertyDefinition] = DiagramProperty;
    this.addPrefix("owl:", this.owl);
  }


  async processObjectLink(input: StringsDict, predicate: LongURI, output: RDFSResource[], defaultCls = RDFSResource) {
    return Promise.all(Object.keys(input).map(async (obj: LongURI) => {
      const statement: TypedNodeQuerySolution = { uri: { value: obj, type: "uri" }, _type: { value: input[obj].join(" "), type: "uri" } }
      const Class = this.lookupClass(input[obj][0], defaultCls)
      const newItem = await Class.createAsync(this, undefined, undefined, statement)
      output.push(newItem)
    }));
  }

  async wrapClasses(results: QueryResponse<TypedNodeQuerySolution>, exclude?: LongURI) {
    const ClassArray: RDFSClass[] = []
    let Class = RDFSClass
    await Promise.all(results.results.bindings.map(async (statement: TypedNodeQuerySolution) => {

      if (statement.uri.value != exclude) {
        if (statement.uri.value in this.nodes) {
          ClassArray.push(this.nodes[statement.uri.value] as RDFSClass)
        }
        else {
          if (statement._type) {
            const types = statement._type.value.split(" ")
            Class = this.lookupClass(types[0], RDFSClass) as unknown as typeof RDFSClass
          }
          const rc = await Class.createAsync(this, undefined, undefined, statement)
          ClassArray.push(rc)
        }
      }
    }))
    // MERGE DISCUSSION: Previously this returned ClassArray without it having fully resolved its promises
    // Perhaps caused bugs?
    return ClassArray
  }

  /**
   * @method getAllRdfProperties
   * @remarks
   * returns all properties in the ontology (with some filters)
   * @param includeOwlProperties - if true (default) this will return owl ObjectProperties and DatatypeProperties in addition to rdf Properties
   * @param getOnlyTopProperties - if true (default is false) this will only return those properties that are not subproperties of any others - i.e the top ones
   * @returns an array of properties
   */
  async getAllRdfProperties(
    includeOwlProperties: boolean = true,
    getOnlyTopProperties: boolean = false,
  ): Promise<RDFProperty[]> {
    let filter = "";
    if (getOnlyTopProperties) {
      filter = `FILTER NOT EXISTS {
        ?uri rdfs:subPropertyOf ?parentProp
      }`;
    }

    let whereClause =
      `WHERE {BIND (rdf:Property as ?_type . ?uri a ?_type ) . ${filter}}`;
    if (includeOwlProperties) {
      whereClause =
        `WHERE {?uri a ?_type . FILTER (?_type IN (owl:ObjectProperty, owl:DatatypeProperty, rdf:Property)) . ${filter}}`;
    }

    const query = `SELECT ?uri ?_type ${whereClause}`
    const spOut = await this.runQuery<TypedNodeQuerySolution>(query)
    const props: RDFProperty[] = []
    let Class = RDFProperty
    for (const statement of spOut.results.bindings) {
      if (statement._type) {
        Class = this.lookupClass(statement._type.value, RDFProperty) as unknown as typeof RDFProperty
      }
      const prop = await Class.createAsync(this, undefined, undefined, statement)
      props.push(prop)
    }
    return props;
  }

  /**
   * @method getTopProperties
   * @remarks
   * returns all properties in the ontology that have no subproperties
   * @param includeOwlProperties - if true (default) this will return owl ObjectProperties and DatatypeProperties in addition to rdf Properties
   * @returns an array of properties
   */
  async getTopProperties(
    includeOwlProperties: boolean = true,
  ): Promise<RDFProperty[]> {
    return await this.getAllRdfProperties(includeOwlProperties, true);
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
    `;

    const spOut = await this.runQuery<TypedNodeQuerySolution>(query);
    const statements = spOut.results.bindings;
    const rdfPropertyPromises = statements.map(
      (statement: TypedNodeQuerySolution) =>
        RDFProperty.createAsync(this, undefined, undefined, statement)
    );

    return await Promise.all(rdfPropertyPromises);
  }

  /**
   * @method getAllClasses
   * @remarks
   * returns all classes in the ontology (with some filters)
   * @param includeOwlClasses - if true (default) this will return owl classes as well as rdfs classes
   * @param getOnlyTopClasses - if true (default is false) this will only return those classes that are not subclasses of any others - i.e the top ones
   * @returns an array of RDFSClasses
   */
  async getAllClasses(
    includeOwlClasses: boolean = true,
    getOnlyTopClasses: boolean = false,
  ): Promise<RDFSClass[]> {
    let filter = "";
    if (getOnlyTopClasses) {
      filter = `FILTER NOT EXISTS {
          ?uri rdfs:subClassOf ?parentClass
        }`;
    }

    let whereClause =
      `WHERE {BIND (rdfs:Class as ?type . ?uri a ?type ) . ${filter}}`;
    if (includeOwlClasses) {
      whereClause =
        `WHERE {?uri a ?type . FILTER (?type IN (owl:Class, rdfs:Class)) . ${filter}}`;
    }

    const query =
      `SELECT ?uri (group_concat(DISTINCT ?type) as ?_type) ${whereClause} GROUP BY ?uri`;
    const spOut = await this.runQuery<TypedNodeQuerySolution>(query);
    return this.wrapClasses(spOut);
  }

  /**
   * @method getTopClasses
   * @remarks
   * returns the classes that have no superclasses
   * @returns an array of RDFSClasses
   */
  async getTopClasses(): Promise<RDFSClass[]> {
    return await this.getAllClasses(true, true);
  }

  /**
   * @method getAppliedStyles
   * @remarks
   * returns a dictionary object of styles for each specified class. If no classes are specified, it will get all the styles for every class it finds with style
   * pass the classes in as an array of URIs
   * @param classes - An array of URIs (strings) of the classes whose styles are required
   * @returns {Promise<AppliedStyle[]>} - An array of styles
   */
  async getAppliedStyles(classes: LongURI[] = []): Promise<AppliedStyle[]> {
    let filter = "";
    const queryResponseSchema = createQueryResponseSchema(StylesQuerySolution);

    if (classes.length > 0) {
      filter = 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )';
    }
    const query =
      `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`;
    const spOut = await this.runQuery(query);

    // This is not a proper response. Need to find out how
    const result = await queryResponseSchema.spa(spOut);

    if (!result.success) {
      console.warn(
        `Applied Style response had the following error: ${result.error}`,
      );
    }

    if (!result.data) {
      console.warn("Empty applied style response");
      return [] as AppliedStyle[];
    }

    const statements = result.data.results.bindings;

    const styles: AppliedStyle[] = statements.map((statement) => {
      return new AppliedStyle(
        statement.cls.value,
        JSON.parse(decodeURIComponent(statement.style.value)),
      );
    });

    return styles;
  }

  /**
   * @method getStyles
   * @deprecated
   * @remarks
   * returns an array  styles for each specified class. If no classes are specified, it will get all the styles for every class it finds with style
   * pass the classes in as an array of URIs
   * @param classes - An array of URIs (strings) of the classes whose styles are required
   * @returns {Promise<StyleResponse>} - a dictionary keyed by the class URIs, with the values being style objects
   */
  async getStyles(classes: LongURI[]): Promise<StyleResponseType> {
    const queryResponseSchema = createQueryResponseSchema(StylesQuerySolution);
    const filter = classes.length > 0
      ? 'FILTER (str(?cls) IN ("' + classes.join('", "') + '") )'
      : "";

    const query =
      `SELECT ?cls ?style WHERE {?cls <${this.telicentStyle}> ?style . ${filter} }`;
    const spOut = await this.runQuery(query); // StylesQuerySolution
    const result = queryResponseSchema.safeParse(spOut);

    if (!result.success) {
      console.warn(`Style response had the following error: ${result.error}`);
    }

    if (!result.data) {
      console.warn("Empty style response");
      return {} as StyleResponseType;
    }

    const statements = result.data.results.bindings;
    const styles = statements.reduce((acc, statement) => {
      try {
        const styleValue = OntologyStyle.safeParse(
          JSON.parse(decodeURIComponent(statement.style.value)),
        );
        if (styleValue.success) {
          acc[statement.cls.value] = styleValue.data;
        }
      } catch (err) {
        console.warn(`Could not parse styles for ${statement.cls.value}`);
      }
      return acc;
    }, {} as StyleResponseType);

    return styles;
  }

  // DS specific methods
  async getFlattenedStyles(classes: LongURI[]) {
    const styles = await this.getStyles(classes);
    return Object.entries(styles).map(([classUri, style]) => {
      return ({
        classUri,
        backgroundColor: style.defaultStyles.dark.backgroundColor,
        color: style.defaultStyles.dark.color,
        iconFallbackText: getTypeInitials(classUri),
        alt: this.getPrefix(classUri),
        shape: style.defaultStyles.shape,
        faUnicode: style.defaultIcons.faUnicode,
        faIcon: style.defaultIcons.faIcon,
      }) as FlattenedStyleType;
    });
  }

  findIcon(styles: FlattenedStyleType[], classUri: LongURI) {
    const foundIcon = styles.find((style) => style.classUri === classUri);

    if (foundIcon) return foundIcon;

    const alt = this.getPrefix(classUri);
    const iconFallbackText = getTypeInitials(classUri);

    return {
      classUri,
      color: "#DDDDDD",
      backgroundColor: "#121212",
      iconFallbackText,
      alt,
    };
  }

  /**
   * @method setStyle
   * @remarks
   * sets the default style for a class. Deletes any previous styles
   * @param uri - The URI of the class that have the style assigned
   * @param styleObj - A style object for the class - call makeStyleObject to get one
  */
  async setStyle(uri: LongURI, styleObj: Style) {
    const styleStr = encodeURIComponent(JSON.stringify(styleObj))
    await this.deleteRelationships(uri, this.telicentStyle)
    await this.insertTriple(uri, this.telicentStyle, styleStr, "LITERAL")
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
            OPTIONAL {?uri <${this.telUUID}> ?uuid} 
            ?uri <${this.dcTitle}> ?title .
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
  async getDiagram(uri: LongURI) {
    const query = `
        SELECT ?uri ?_type ?uuid ?title  WHERE {
            BIND(<${uri}> as ?uri)
            BIND(<${this.telDiagram}> as ?_type)
            ?uri a <${this.telDiagram}> . 
            OPTIONAL {<${uri}> <${this.telUUID}> ?uuid} 
            OPTIONAL {<${uri}> <${this.dcTitle}> ?title } 
        }`;

    const spOut = await this.runQuery<DiagramQuerySolution>(query);
    const statements = spOut.results.bindings;

    if (statements.length > 1) {
      this.warn(
        `More than one diagram found from getDiagram query with provided URI: ${uri}`,
      );
      return undefined;
    } else {
      if (statements.length < 1) {
        this.warn(`No diagram with URI ${uri} found from getDiagram query`)
        return undefined
      }
      else
      {
        return await Diagram.createAsync(this, undefined, undefined, undefined, statements[0]);
      }
    }
  }

  /**
   * @method getHierarchy
   * @remarks
   * fetches a complete hierarchy model using the constraints set in the parameters - the types of the items, and the hierarchical relationship
   * @param filterString a comma separated list of the allowed node types (as prefixed URIs - prefix must be registered in the service)
   * @param subRel the type of hierarchical relationship to use (as a prefixed URI - prefix must be registered in the service)
   * @param defaultCls the default ontologyservice class to use if the correct one cannot be found
   * @returns an array of HierarchyNode objects (only the top ones are in the array, use each node's subs property to get their sub nodes)
   */
  protected async getHierarchy(
    filterString = "rdfs:Class, owl:Class",
    subRel = "rdfs:subClassOf",
  ): Promise<HierarchyNode[]> {
    const query: string = `SELECT 
    ?uri 
    (group_concat(DISTINCT ?type) as ?_type) 
    (group_concat(DISTINCT ?sub) as ?subs) 
    (group_concat(DISTINCT ?label; SEPARATOR="||") as ?labels) 
    (group_concat(DISTINCT ?style; SEPARATOR="||") as ?styles) 
    (group_concat(DISTINCT ?super) as ?supers) 
    WHERE {
      ?uri a ?type .
      FILTER (?type IN (${filterString}))
      OPTIONAL {  ?sub ${subRel} ?uri }
      OPTIONAL { ?uri ${subRel} ?super }
      OPTIONAL { ?uri rdfs:label ?label }
      OPTIONAL { ?uri telicent:style ?style }
    } GROUP BY ?uri`;
    const spOut: QueryResponse<HierarchyQuerySolution> = await this.runQuery<
      HierarchyQuerySolution
    >(query);
    const dict: HierarchyNodes = {};
    const output: HierarchyNode[] = [];

    let defaultCls = undefined;
    if (subRel == "rdfs:subPropertyOf") {
      defaultCls = RDFProperty;
    } else {
      defaultCls = RDFSClass;
    }

    if (spOut.results?.bindings.length > 0) {
      spOut.results.bindings.forEach((statement: HierarchyQuerySolution) => {
        let cls = defaultCls;
        if (statement._type) {
          const types = statement._type.value.split(" ")
          cls = this.lookupClass(types[0], defaultCls) as any
        }
        const item = new cls(this, undefined, undefined, statement);
        const node: HierarchyNode = {
          item: item,
          id: statement.uri.value,
          label: "",
          rdfsLabels: [],
          children: [],
          parents: [],
          style: undefined,
          expanded: false,
        };
        if (statement.labels) {
          node.rdfsLabels = statement.labels.value.split("||");
        }
        if (statement.styles) {
          const stArray = statement.styles.value.split("||");
          try {
            node.style = JSON.parse(decodeURIComponent(stArray[0]));
          } catch {
            this.warn(`Unable to decode style for URI ${statement.uri.value}`);
          }
        }
        if (!(statement.supers)) {
          //we've found an item at the top of its hierarchy, so add it to the output array
          output.push(node);
        }
        dict[statement.uri.value] = node;
      });
      //second pass - now add all the subs and supers for each item
      spOut.results.bindings.forEach((statement: HierarchyQuerySolution) => {
        const node: HierarchyNode = dict[statement.uri.value];
        if (node.rdfsLabels.length > 0) {
          node.label = node.rdfsLabels[0];
        } else {
          node.label = this.shorten(statement.uri.value);
        }
        if (statement.supers) {
          const supers: string[] = statement.supers.value.split(" ");
          supers.forEach((sup: string) => {
            const superNode: HierarchyNode = dict[sup];
            node.parents.push(superNode);
          });
        }
        if (statement.subs) {
          const subs: string[] = statement.subs.value.split(" ");
          subs.forEach((sub: string) => {
            const subNode: HierarchyNode = dict[sub];
            node.children.push(subNode);
          });
        }
      });
    }
    return output;
  }

  /**
   * @method getClassHierarchy
   * @remarks
   * fetches a complete hierarchy model of classes
   * @returns an array of HierarchyNode objects (only the top ones are in the array, use each node's subs property to get their sub nodes)
   */
  async getClassHierarchy(): Promise<HierarchyNode[]> {
    return await this.getHierarchy(
      "rdfs:Class, owl:Class, rdfs:Datatype",
      "rdfs:subClassOf",
    );
  }

  /**
   * @method getPropertyHierarchy
   * @remarks
   * fetches a complete hierarchy model of properties
   * @returns an array of HierarchyNode objects (only the top ones are in the array, use each node's subs property to get their sub nodes)
   */
  async getPropertyHierarchy(): Promise<HierarchyNode[]> {
    return await this.getHierarchy(
      "rdf:Property, owl:ObjectProperty, owl:DatatypeProperty, owl:AnnotationProperty, owl:AsymmetricProperty, owl:DeprecatedProperty, owl:FunctionalProperty, owl:OntologyProperty, owl:InverseFunctionalProperty, owl:IrreflexiveProperty, owl:ReflexiveProperty,owl:SymmetricProperty, owl:TransitiveProperty",
      "rdfs:subPropertyOf",
    );
  }
}
