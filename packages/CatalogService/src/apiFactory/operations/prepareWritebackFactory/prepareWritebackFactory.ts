import { DCATResource } from "../../../index";
import { CatalogService } from "../../../classes/RdfService.CatalogService";
import { ApiFactoryConfigType } from "../type";
import { UIDataResourceType } from "../utils/common";

export type PrepareWritebackParamsType = {
  resourceUri: string;
};

export const prepareWritebackFactory =
  (service: CatalogService, config: ApiFactoryConfigType = {}) =>
  /**
   *
   * @param config
   */
  async (
    params: PrepareWritebackParamsType
  ): Promise<Array<Partial<UIDataResourceType>>> =>
    Promise.all(
      ((await service.getDCATResource(params)) as DCATResource[]).map(
        async (resource) => {
          const uiRepresentation = await resource.toUIRepresentation();
          if (!config.FF_CATALOG_UPDATE) {
            return uiRepresentation;
          }
          return uiRepresentation;
        }
      )
    );
