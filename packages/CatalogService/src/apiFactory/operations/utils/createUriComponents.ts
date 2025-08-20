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
      uri: z.url(),
    })
    .superRefine((value, ctx) => {
      if (value.uri.startsWith(base) === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["uri"],
          message: `uri mismatch; expected to start with ${base} -instead  got ${value.uri}`,
        });
      }
    });

export const createUriComponents = async ({ base, postfix= '' }: {base:string; postfix:string}) => {
  const uuid = uuidv4();
  const localName = `${uuid}${postfix}`;
  const uri = `${base}${localName}`;
  IdentifierSchemaFor(base).parse({ uuid, uri });
  // TODO: ensure uniqueness in DB
  return { uuid, uri, postfix, localName };
};