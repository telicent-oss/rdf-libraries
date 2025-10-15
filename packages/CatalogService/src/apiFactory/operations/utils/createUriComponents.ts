import { v4 as uuidv4 } from "uuid";

type CreateUriComponentsOptions = {
  base: string;
  postfix?: string;
  identifier?: string;
};

type CreateUriComponentsResult = {
  uuid?: string;
  uri: string;
  postfix: string;
  localName: string;
};

export const createUriComponents = async ({
  base,
  postfix = "",
  identifier,
}: CreateUriComponentsOptions): Promise<CreateUriComponentsResult> => {
  if (identifier) {
    const trimmedIdentifier = identifier.trim();
    const uri = `${base}${trimmedIdentifier}`;
    return {
      uri,
      postfix,
      localName: trimmedIdentifier,
    };
  }

  const uuid = uuidv4();
  const localName = `${uuid}${postfix}`;
  const uri = `${base}${localName}`;
  return { uuid, uri, postfix, localName };
};
