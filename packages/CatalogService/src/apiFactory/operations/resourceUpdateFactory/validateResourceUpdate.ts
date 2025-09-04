import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "../utils/validate/types";
import { validateIfDistributionIdentifierIsUnattached } from "../utils/validate/validateIfDistributionIdentifierIsUnattached";

export const validateResourceUpdate = async (
  validateResource: ValidateResourceParams,
) => {
  let  errors: ResourceOperationResults["errors"] = {};
  errors = await validateIfDistributionIdentifierIsUnattached(errors, validateResource,);
  if (Object.keys(errors).length > 0) {
    throw { errors };
  }
};
