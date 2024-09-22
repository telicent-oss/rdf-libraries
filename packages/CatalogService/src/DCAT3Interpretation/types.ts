import { RDFTripleType } from "@telicent-oss/rdfservice";
import { CatalogService } from "packages/CatalogService";


type Terms = { dcTitle: string };

export interface IDCAT3Interpretation {

}
export class DCAT3InterpretationByCola implements IDCAT3Interpretation {
  
  private service:CatalogService;

  constructor(service:CatalogService) {
    this.service = service;
  }

  
  dcTitleFromTriples = (id:string, triples:RDFTripleType[]) =>
    triples
      .filter(({ s }) => s.value === id)
      .find(({ p }) => p.value === this.service.dcTitle)?.o.value;
  
}