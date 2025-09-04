import {
  CatalogService,
  DCATDataService,
  DCATDataset,
  DCATResource,
  DcatResourceQuerySolution,
} from "../index";

export class DCATCatalog extends DCATDataset {
  className = "DCATCatalog";
  constructor(
    service: CatalogService,
    uri?: string,
    title?: string,
    type: string = "http://www.w3.org/ns/dcat#Catalog",
    catalog?: DCATCatalog,
    statement?: DcatResourceQuerySolution
  ) {
    super(service, uri, title, type, catalog, statement);
    // NOTE: catalog not called in test...perhaps service invokes with context of nodes?
  }

  addOwnedCatalog(catalog: DCATCatalog) {
    if (catalog) {
      return this.service.insertTriple(
        this.uri,
        `http://www.w3.org/ns/dcat#catalog`,
        catalog.uri
      );
    }
  }
  addOwnedDataset(dataset: DCATDataset) {
    if (dataset) {
      return this.service.insertTriple(
        this.uri,
        `http://www.w3.org/ns/dcat#dataset`,
        dataset.uri
      );
    }
  }
  addOwnedService(service: DCATDataService) {
    if (service) {
      return this.service.insertTriple(
        this.uri,
        `http://www.w3.org/ns/dcat#service`,
        service.uri
      );
    }
  }

  addOwnedResource(resource: DCATResource) {
    switch (resource.className) {
      case "DCATCatalog":
        return this.addOwnedCatalog(resource as DCATCatalog);
      case "DCATDataset":
        return this.addOwnedDataset(resource as DCATDataset);
      case "DCATDataService":
        return this.addOwnedService(resource as DCATDataService);
      default:
        console.warn(
          "addOwnedResource(): no match",
          resource.className,
          Object.prototype.toString.call(resource)
        );
        return this.service.insertTriple(
          resource.uri,
          `http://www.w3.org/ns/dcat#Resource`,
          this.uri
        );
    }
  }

  async getOwnedResources(typeOfResource?: string) {
    // REQUIREMENT 6.2 Search by dataResourceFilter: selected data-resources
    // Hm. I don't _think_ I need to differentiate owned resources by type.
    return this.service.getAllDCATResources(typeOfResource, this.uri);
  }

  async getOwnedCatalogs() {
    return await this.getOwnedResources(`${this.service.dcatCatalog}`);
  }
  async getOwnedDatasets() {
    return await this.getOwnedResources(`${this.service.dcatDataset}`);
  }
  async getOwnedServices() {
    return await this.getOwnedResources(`${this.service.dcatDataService}`);
  }
}
