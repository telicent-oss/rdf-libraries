import {
  CatalogService,
  DCATCatalog,
  DcatResourceQuerySolution,
} from "../index";

export class DCATDataService extends DCATCatalog {
  className = "DCATDataService";
  constructor(
    service: CatalogService,
    uri?: string,
    title?: string,
    type: string = "http://www.w3.org/ns/dcat#DataService",
    catalog?: DCATCatalog,
    statement?: DcatResourceQuerySolution
  ) {
    super(service, uri, title, type, catalog, statement);
  }
}
