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
  // _type?: SPARQLResultBinding;
  // uri: SPARQLResultBinding;
  identifier: SPARQLResultBinding;
  title: SPARQLResultBinding;
  description?: SPARQLResultBinding;
  contactPoint__fn?: SPARQLResultBinding;
  publisher__title?: SPARQLResultBinding;
  rights__description?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  qualifiedAttribution?: SPARQLResultBinding;
  qualifiedAttribution__agent__title?: SPARQLResultBinding;
  // Phase 2
  //   distribution
  distribution?: SPARQLResultBinding;
  distribution__identifier?: SPARQLResultBinding;
  distribution__title?: SPARQLResultBinding;
  distribution__accessURL?: SPARQLResultBinding;
  distribution__mediaType?: SPARQLResultBinding;
  distribution__available?: SPARQLResultBinding;
  //
  contributor__title?: SPARQLResultBinding;
  min_issued?: SPARQLResultBinding;
  max_modified?: SPARQLResultBinding;
}

export interface DcatResourceFindSolution extends DcatResourceQuerySolution {
  concatLit: SPARQLResultBinding;
}

// RULE RATIONALE:
//  Don't know/care what instantiation params of ancestors are;
//  Just care new instance inherits from DCATResource
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type DCATResourceDescendant = new (...args:any[]) => DCATResource