import { v4 as uuidv4 } from "uuid";

export const createUri = ({ postfix = "" }: { postfix: string }) =>
  `http://telicent.io/catalog#${uuidv4()}${postfix}`;