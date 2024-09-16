import { CatalogService } from "../../../index";
import { getAllRDFTriples, ResourceSchema, ResourceType } from "./common";

export const getAllResourceTriples = async (options: {
  service: CatalogService;
  hasAccess?: boolean;
}):Promise<ResourceType[]> =>
  (await getAllRDFTriples(options)).results.bindings
    .filter(
      (el) =>
        ResourceSchema.safeParse(el).success
    );