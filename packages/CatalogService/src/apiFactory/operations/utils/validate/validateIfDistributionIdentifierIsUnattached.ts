import { builder } from "@telicent-oss/sparql-lib";
import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "./types";

// TODO Make less odd -Weird way of signaling there is a noew error
// WHY Very hard to anticipate
export const validateIfDistributionIdentifierIsUnattached = async (
  errors: ResourceOperationResults["errors"],
  { operation, catalogService, dcatResource }: ValidateResourceParams
) => {
  const { distributionIdentifier } = operation.payload;
  if (typeof distributionIdentifier !== "string") {
    return errors; // no extra errors
  }
  const currentDistributionIdentifier = dcatResource?.distribution__identifier;
  if (distributionIdentifier === currentDistributionIdentifier) {
    return errors; // no change
  }
  console.log('Going to check', currentDistributionIdentifier, distributionIdentifier, { operation, dcatResource });

  const askResult = await catalogService.runQuery(
    builder.catalog.askIfDistributionIdentifierIsUnattached({
      distributionIdentifier,
    })
  );

  if (askResult.boolean === false) {
    return {
      ...errors,
      distributionIdentifier: [
        ...(errors?.distributionIdentifier || []),
        {
          error: `distributionIdentifier "${distributionIdentifier}" is used by another resource`,
        },
      ],
    };
  }
  return errors;
};
