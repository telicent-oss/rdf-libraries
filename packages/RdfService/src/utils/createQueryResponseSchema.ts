import { z } from "zod";

// zod alternatives
export const createQueryResponseSchema = <T>(bindingsSchema: z.ZodType<T>) =>
    z.object({
      head: z.object({
        vars: z.array(z.string()),
      }),
      results: z.object({
        bindings: z.array(bindingsSchema), // Use the passed in schema for T
      }),
      boolean: z.boolean().optional(),
    });