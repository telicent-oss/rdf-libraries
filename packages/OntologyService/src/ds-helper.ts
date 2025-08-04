import { startCase } from "lodash";

/* Imported from DS - these were the helper funcions
 * but some of these may be handled by functions that
 * already exist. Specifically getting the prefixes.
 */
const hasFragment = (uri: string) =>
  uri && uri.startsWith("http") && uri.includes("#");

const getInitials = (value: string) => {
  if (value) {
    const REGEX_GET_FIRST_CHAR_OF_STRING = /(\b[a-zA-Z0-9])?/g; // matches any alphanumeric character (letters or digits).
    const initials = value.match(REGEX_GET_FIRST_CHAR_OF_STRING);
    if (initials) return initials.join("").slice(0, 3);
  }

  console.warn(
    `OntologyService (getInitials): Unable to get initials from "${value}"`,
  );
  return "";
};

export const getTypeInitials = (type: string) => {
  if (hasFragment(type)) {
    const uriParts = type.split("#");
    if (uriParts.length === 2) return getInitials(startCase(uriParts[1]));
  }

  return type ?? "";
};
