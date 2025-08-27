import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "../utils/validate/types";
import { validateIfDistributionIdentifierExists } from "../utils/validate/validateIfDistributionIdentifierExists";

export const validateResourceCreate = async (
  validateResource: ValidateResourceParams
) => {
  let errors: ResourceOperationResults["errors"] = {};
  errors = await validateIfDistributionIdentifierExists(errors, validateResource);
  if (Object.keys(errors).length > 0) {
    throw { errors };
  }
};
