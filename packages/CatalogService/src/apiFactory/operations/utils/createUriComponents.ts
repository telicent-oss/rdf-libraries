import { z } from "zod/v4";
import { v4 as uuidv4 } from "uuid";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const IdentifierSchemaFor = (base: string) =>
  z
    .object({
      uuid: z.string().regex(
        UUID_V4_RE,
        "uuid must start with uuid v4"
      ),
      uri: z.string().url(),
    })
    .superRefine((v, ctx) => {
      const expectedUri = `${base}${v.uuid}`;
      if (v.uri !== expectedUri) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["uri"],
          message: `uri mismatch; expected ${expectedUri}`,
        });
      }
    });

export const createUriComponents = async ({ base, postfix= '' }: {base:string; postfix:string}) => {
  const uuid = uuidv4(); // just UUID, no postfix
  const localName = `${uuid}${postfix}`;
  const uri = `${base}${localName}`;
  IdentifierSchemaFor(base).parse({ uuid, uri });
  // TODO: ensure uniqueness in DB
  return { uuid, uri, postfix, localName };
};