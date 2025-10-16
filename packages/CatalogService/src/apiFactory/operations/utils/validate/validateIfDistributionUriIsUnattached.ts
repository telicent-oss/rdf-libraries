import { builder } from "@telicent-oss/sparql-lib";
import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "./types";
import { FieldError } from "../fieldError";
import { DISTRIBUTION_NAMESPACE } from "../../../../constants";
import { DistributionByUriResult } from "@telicent-oss/sparql-lib";
// TODO rename NAMESPACE


// TODO Make less odd -Weird way of signaling there is a noew error
// WHY Very hard to anticipate
export const validateIfDistributionUriIsUnattached = async (
  errors: ResourceOperationResults["errors"],
  { operation, catalogService, dcatResource }: ValidateResourceParams
) => {
  const distributionUriLocalName =
    typeof operation.payload?.distributionUri === "string"
      ? operation.payload.distributionUri.trim()
      : undefined;

  if (!distributionUriLocalName) {
    return errors; // no extra errors
  }

  const distributionUri = `${DISTRIBUTION_NAMESPACE}${distributionUriLocalName}` 
  const result = await catalogService.runQuery<DistributionByUriResult>(
    builder.catalog.getDistributionByUri({
      distributionUri
    })
  );
  const distribution = result.results.bindings[0];
  if (distribution.dataset?.value && distribution.dataset.value !== dcatResource?.uri) {
    const fieldError: FieldError = {
      code: "distribution.askIfDistributionUriIsUnattached",
      summary: `Distribution identifier "${distributionUriLocalName}" is already attached to another dataset`,
      context: {
        identifier: distributionUriLocalName,
        uri: distributionUri,
      },
    };
    console.log(`colliding`, fieldError);
    return {
      ...errors,
      distributionUri: [...(errors?.distributionUri || []), fieldError],
    };
  } else {
    console.log(`not colliding`, distribution, dcatResource)
  }
  return errors;
};
