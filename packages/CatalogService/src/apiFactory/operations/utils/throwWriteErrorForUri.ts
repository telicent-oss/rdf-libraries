import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throwWriteErrorForUri = (error: any) => {
  const errorValue = error instanceof ZodError ? error.message : `${error}`;
  throw {
    errors: { uri: [errorValue] },
  };
};
