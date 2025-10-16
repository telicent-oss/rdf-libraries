// Entry-point a.k.a "Barrel-file"; No code should go in here
import { getAllDCATResources } from "./getAllDCATResources/getAllDCATResources";
import { findWithOwner } from "./findWithOwner/findWithOwner";
import { findWithParams } from "./findWithParams/findWithParams";
import { askIfDistributionUriIsUnattached } from "./askIfDistributionUriIsUnattached/askIfDistributionUriIsUnattached";
import { askIfDistributionUriExists } from "./askIfDistributionUriExists/askIfDistributionUriExists";
import { askIfSubjectUriIsUniqueForType } from "./askIfSubjectUriIsUniqueForType/askIfSubjectUriIsUniqueForType";
import { askIfObjectIsUniqueForPredicate } from "./askIfObjectIsUniqueForPredicate/askIfObjectIsUniqueForPredicate";
import { getDistributionByUri } from "./getDistributionByUri/getDistributionByUri";

export const catalog = {
  getAllDCATResources,
  findWithOwner,
  findWithParams,
  askIfDistributionUriExists,
  askIfDistributionUriIsUnattached,
  askIfSubjectUriIsUniqueForType,
  askIfObjectIsUniqueForPredicate,
  getDistributionByUri,
};
