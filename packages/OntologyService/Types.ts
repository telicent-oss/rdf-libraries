import { z } from "zod";

export const StyleObject = z.object({
  bgColour: z.string(),
  colour: z.string(),
  borderColour: z.string().optional(),
  height: z.number(),
  width: z.number(),
  icon: z.string(),
  shape: z.enum(["roundrectangle", "parallelogram", "diamond"]),
  x: z.number(),
  y: z.number()
});

export interface NamedPredicate {
  [subject: string]: string[];
}
