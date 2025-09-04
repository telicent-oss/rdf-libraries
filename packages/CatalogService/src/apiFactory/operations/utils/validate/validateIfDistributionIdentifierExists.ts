import { builder } from "@telicent-oss/sparql-lib";
import { ResourceOperationResults } from "src/classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { ValidateResourceParams } from "./types";
// TODO Make less odd -Weird way of signaling there is a noew error
// WHY Very hard to anticipate
export const validateIfDistributionIdentifierExists = async (
  errors: ResourceOperationResults["errors"],
  { operation, catalogService }: ValidateResourceParams
) => {
  const distributionIdentifier = operation.payload;
  if (typeof distributionIdentifier !== "string") return errors;

  const askResult = await catalogService.runQuery(
    builder.catalog.askIfDistributionIdentifierExists({
      distributionIdentifier,
    })
  );

  if (askResult.boolean) {
    return {
      ...errors,
      distributionIdentifier: [
        ...(errors?.distributionIdentifier || []),
        {
          error: `distributionIdentifier "${distributionIdentifier}" already exists`,
        },
      ],
    };
  }
  return errors;
};
