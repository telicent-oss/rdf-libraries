// Entry-point a.k.a "Barrel-file"; No code should go in here
import { getAllDCATResources } from "./getAllDCATResources/getAllDCATResources";
import { findWithOwner } from "./findWithOwner/findWithOwner";
import { findWithParams } from "./findWithParams/findWithParams";
import { askIfDistributionIdentifierIsUnattached } from "./askIfDistributionIdentifierIsUnattached/askIfDistributionIdentifierIsUnattached";
import { askIfDistributionIdentifierExists } from "./askIfDistributionIdentifierExists/askIfDistributionIdentifierExists";
import { askIfUniqueIdentifierOfType } from "./askIfUniqueIdentifierOfType/askIfUniqueIdentifierOfType";

export const catalog = {
  getAllDCATResources,
  findWithOwner,
  findWithParams,
  askIfDistributionIdentifierExists,
  askIfDistributionIdentifierIsUnattached,
  askIfUniqueIdentifierOfType,
};
