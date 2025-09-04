import {
  CatalogService,
  DCATCatalog,
  DcatResourceQuerySolution,
  DCATResource,
} from "../index";

export class DCATDataset extends DCATResource {
  className = "DCATDataset";
  constructor(
    service: CatalogService,
    uri?: string,
    title?: string,
    type: string = "http://www.w3.org/ns/dcat#Dataset",
    catalog?: DCATCatalog,
    statement?: DcatResourceQuerySolution
  ) {
    super(service, uri, title, type, catalog, statement);
  }
}
