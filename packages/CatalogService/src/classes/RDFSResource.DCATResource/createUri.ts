import { COMMON_PREFIXES_MAP } from "../../constants";
import { v4 as uuidv4 } from "uuid";


export const createUri = ({ postfix = "" }: { postfix: string }) =>
  `${COMMON_PREFIXES_MAP.tcat}${uuidv4()}${postfix}`;