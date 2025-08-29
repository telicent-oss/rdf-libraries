import { COMMON_PREFIXES_MAP } from "../../constants";
import { v4 as uuidv4 } from "uuid";

export const createUri = ({ postfix = "" }: { postfix: string }) => {
  const uri = `${COMMON_PREFIXES_MAP.tcat}${uuidv4()}${postfix}`;
  console.log("Created uri ", uri);
  return uri;
};
