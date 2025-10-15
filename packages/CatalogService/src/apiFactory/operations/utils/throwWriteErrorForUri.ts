import { ZodError } from "zod";
import { FieldError } from "./fieldError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throwWriteErrorForUri = (error: any) => {
  const errorValue = error instanceof ZodError ? error.message : `${error}`;
  const fieldError: FieldError = {
    code: "catalog.uri.invalid",
    summary: errorValue,
  };
  throw {
    errors: { uri: [fieldError] },
  };
};
