import { CatalogService } from "../../index";
import { StoreTripleOperation } from "./createOperations";
import { builder } from "@telicent-oss/sparql-lib";
import { FieldError } from "../../apiFactory/operations/utils/fieldError";

export const maybeGetNotUniqueError = async (
  catalogService: CatalogService,
  operation: StoreTripleOperation
): Promise<FieldError | undefined> => {
  const result = await catalogService.runQuery(
    builder.catalog.askIfUniqueIdentifierOfType(operation.triple)
  );
  if (result.boolean === true) {
    return undefined;
  }
  return {
    code: "catalog.identifier.duplicate",
    summary: `Value "${operation.triple.o}" is already used`,
    details: `NOT UNIQUE "${operation.triple.o}" already exists`,
    context: {
      value: String(operation.triple.o),
    },
  };
};
