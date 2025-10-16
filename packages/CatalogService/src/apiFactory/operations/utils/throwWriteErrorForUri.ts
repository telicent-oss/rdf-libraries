import { ZodError } from "zod";
import { FieldError } from "./fieldError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const summarizeError = (error: any): string => {
  if (error instanceof ZodError) {
    // "path: message" per issue; join with "; "
    return error.issues
      .map((i) => `${(i.path && i.path.join(".")) || "(root)"}: ${i.message}`)
      .join("; ");
  }
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throwWriteErrorForUri = (error: any) => {
  const fieldError: FieldError = {
    code: "catalog.uri.invalid",
    summary: summarizeError(error),
  };
  throw {
    errors: { uri: [fieldError] },
  };
};