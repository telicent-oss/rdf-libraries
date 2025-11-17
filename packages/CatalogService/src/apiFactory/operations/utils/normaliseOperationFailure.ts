import { ResourceOperationResults } from "../../../classes/RDFSResource.DCATResource/storeTripleResultsToValueObject";
import { FieldError } from "./fieldError";

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const hasErrors = (
  errors: ResourceOperationResults["errors"] | undefined
): boolean =>
  !!errors &&
  Object.values(errors).some((fieldErrors) => (fieldErrors?.length ?? 0) > 0);

export const normaliseOperationFailure = (
  error: unknown,
  fallback: FieldError
): ResourceOperationResults => {
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    hasErrors((error as ResourceOperationResults).errors)
  ) {
    const result = error as ResourceOperationResults;
    return {
      values: result.values ?? {},
      errors: result.errors ?? {},
      messages: result.messages ?? {},
      operations: result.operations ?? {},
      results: result.results ?? {},
    };
  }

  return {
    values: {},
    errors: {
      
      form: [
        {
          ...fallback,
          details: toMessage(error),
        },
      ],
    },
    messages: {},
    operations: {},
    results: {},
  };
};
