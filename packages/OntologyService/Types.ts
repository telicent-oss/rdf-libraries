import { z } from "zod";

export const StyleObject = z.object({
  bgColour: z.string(),
  colour: z.string(),
  icon: z.string(),
  faIcon: z.string(),
  faUnicode: z.string(),
  faClass: z.string()
});

export interface NamedPredicate {
  [subject: string]: string[];
}
