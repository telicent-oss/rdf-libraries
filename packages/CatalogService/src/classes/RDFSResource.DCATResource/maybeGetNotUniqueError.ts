import { CatalogService } from "../../index";
import { StoreTripleOperation } from "./createOperations";
import { builder } from "@telicent-oss/sparql-lib";

export const maybeGetNotUniqueError = async (
  catalogService: CatalogService,
  operation: StoreTripleOperation
): Promise<undefined | string> => {
  const result = await catalogService.runQuery(
    builder.catalog.askIfUniqueIdentifierOfType(operation.triple)
  );
  if (result.boolean === true) {
    return undefined;
  }
  return `NOT UNIQUE "${operation.triple.o}" already exists`;
};
