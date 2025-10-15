import { builder } from "@telicent-oss/sparql-lib";
import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "./types";
import { buildDistributionUri } from "../../../../constants";
import { FieldError } from "../fieldError";

// TODO Make less odd -Weird way of signaling there is a noew error
// WHY Very hard to anticipate
export const validateIfDistributionIdentifierIsUnattached = async (
  errors: ResourceOperationResults["errors"],
  { operation, catalogService, dcatResource }: ValidateResourceParams
) => {
  const distributionIdentifier =
    typeof operation.payload?.distributionIdentifier === "string"
      ? operation.payload.distributionIdentifier.trim()
      : undefined;

  if (!distributionIdentifier) {
    return errors; // no extra errors
  }
  const currentDistributionIdentifier = dcatResource?.distribution__identifier;
  if (distributionIdentifier === currentDistributionIdentifier) {
    return errors; // no change
  }
  if (currentDistributionIdentifier) {
    const fieldError: FieldError = {
      code: "distribution.identifier.locked",
      summary: "Distribution identifier cannot be changed once it has been set",
    };
    return {
      ...errors,
      distributionIdentifier: [
        ...(errors?.distributionIdentifier || []),
        fieldError,
      ],
    };
  }
  console.log(
    "Going to check",
    `currentDistributionIdentifier: ${currentDistributionIdentifier}`,
    `distributionIdentifier:${distributionIdentifier}`,
    { operation, dcatResource }
  );

  const askResult = await catalogService.runQuery(
    builder.catalog.askIfDistributionIdentifierIsUnattached({
      distributionIdentifier,
      datasetUri: dcatResource?.uri,
    })
  );

  if (askResult.boolean === false) {
    const distributionUri = buildDistributionUri(distributionIdentifier);
    const fieldError: FieldError = {
      code: "distribution.identifier.duplicate",
      summary: `Distribution identifier "${distributionIdentifier}" is already attached to another dataset`,
      context: {
        identifier: distributionIdentifier,
        uri: distributionUri,
      },
    };
    return {
      ...errors,
      distributionIdentifier: [
        ...(errors?.distributionIdentifier || []),
        fieldError,
      ],
    };
  }
  return errors;
};
