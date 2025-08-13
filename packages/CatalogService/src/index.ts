/**
 * @module CatalogService
 * @remarks
 * An extension of RdfService for managing DCAT data
 * @author Ian Bailey
 */

export { formatDataAsArray } from "./__tests__/utils/formatDataAsArray";
export * from "./classes/RDFSResource.DCATResource";
export { COMMON_PREFIXES, DEBUG, version } from "./constants";
export { DCATDataset } from "./classes/RDFSResource.DCATResource.DCATDataset";
export { DCATCatalog } from "./classes/RDFSResource.DCATResource.DCATDataset.DCATCatalog";
export { DCATDataService } from "./classes/RDFSResource.DCATResource.DCATDataset.DCATCatalog.DCATDataService";
export { CatalogService } from "./classes/RdfService.CatalogService";

export * from "./setup/setup";
export * from "./setup/constants";
export * from "./apiFactory/operations/utils/common";

export { vcardKind } from "./classes/RDFSResource.vcardKind";

import {
  SPARQLResultBinding,
  TypedNodeQuerySolution,
} from "@telicent-oss/rdfservice";
import { DCATResource } from "./classes/RDFSResource.DCATResource";

export type DCATRankWrapper = {
  score?: number;
  item: DCATResource;
};

export interface DcatResourceQuerySolution extends TypedNodeQuerySolution {
  identifier: SPARQLResultBinding;
  title: SPARQLResultBinding;
  description?: SPARQLResultBinding;
  publisher__name?: SPARQLResultBinding;
  publisher__email?: SPARQLResultBinding;
  rights__description?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  owner?: SPARQLResultBinding;
  qualifiedAttribution__agent?: SPARQLResultBinding;
  qualifiedAttribution__hadRole?: SPARQLResultBinding;
  // Phase 2
  distribution?: SPARQLResultBinding;
  distribution__title?: SPARQLResultBinding;
  distribution__downloadURL?: SPARQLResultBinding;
  distribution__mediaType?: SPARQLResultBinding;
  distribution__identifier?: SPARQLResultBinding;
}

export interface DcatResourceFindSolution extends DcatResourceQuerySolution {
  concatLit: SPARQLResultBinding;
}

// RULE RATIONALE:
//  Don't know/care what instantiation params of ancestors are;
//  Just care new instance inherits from DCATResource
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type DCATResourceDescendant = new (...args:any[]) => DCATResource