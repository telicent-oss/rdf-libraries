import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "../utils/validate/types";
import { validateIfDistributionUriIsUnattached } from "../utils/validate/validateIfDistributionUriIsUnattached";

export const validateResourceCreate = async (
  validateResource: ValidateResourceParams
) => {
  let errors: ResourceOperationResults["errors"] = {};
  errors = await validateIfDistributionUriIsUnattached(
    errors,
    validateResource
  );
  if (Object.keys(errors).length > 0) {
    throw { errors };
  }
};
