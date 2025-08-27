import { CatalogService } from "src/classes/RdfService.CatalogService";
import { ResourceCreateParamsType } from "../../resourceCreateFactory/resourceCreateFactory";

export type ValidateResourceParams = {
  catalogService: CatalogService;
  operation: ResourceCreateParamsType;
};
