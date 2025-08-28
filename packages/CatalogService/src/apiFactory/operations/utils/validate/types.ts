import { CatalogService } from "src/classes/RdfService.CatalogService";
import { ResourceCreateParamsType } from "../../resourceCreateFactory/resourceCreateFactory";
import { DCATResource } from "src/classes/RDFSResource.DCATResource";

export type ValidateResourceParams = {
  catalogService: CatalogService;
  operation: ResourceCreateParamsType;
  dcatResource?: DCATResource;
};
