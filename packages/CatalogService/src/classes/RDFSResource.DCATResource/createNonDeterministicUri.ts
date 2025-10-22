import { COMMON_PREFIXES_MAP } from "../../constants";
import { v4 as uuidv4 } from "uuid";

export const createNonDeterministicUri = ({
  postfix = "",
  base = COMMON_PREFIXES_MAP.tcat,
  localName,
}: {
  postfix?: string;
  base?: string;
  localName?: string;
}) => {
  const name = localName ?? `${uuidv4()}${postfix}`;
  const uri = `${base}${name}`;
  console.log("Created uri ", uri);
  return uri;
};
