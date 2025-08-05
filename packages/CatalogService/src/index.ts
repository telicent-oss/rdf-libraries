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
  id: SPARQLResultBinding;
  title: SPARQLResultBinding;
  description?: SPARQLResultBinding;
  creator?: SPARQLResultBinding;
  rights?: SPARQLResultBinding;
  accessRights?: SPARQLResultBinding;
  contactEmail?: SPARQLResultBinding;
  owner?: SPARQLResultBinding;
  attributionAgentStr?: SPARQLResultBinding;
  attributionRole?: SPARQLResultBinding;
}

export interface DcatResourceFindSolution extends DcatResourceQuerySolution {
  concatLit: SPARQLResultBinding;
}

// RULE RATIONALE:
//  Don't know/care what instantiation params of ancestors are;
//  Just care new instance inherits from DCATResource
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// type DCATResourceDescendant = new (...args:any[]) => DCATResource