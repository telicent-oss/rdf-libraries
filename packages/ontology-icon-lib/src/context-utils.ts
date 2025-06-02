// Moved from telicent-oss/telicent-ds/src/contexts/context-utils.ts
// WARNING: Likely deprecated

import startCase from "lodash.startcase";
import {
  IconStyleType,
  StyleResponseType,
} from "@telicent-oss/ontologyservice";

const PREFIX_LOOKUP: Record<string, string> = {
  "http://telicent.io/ontology/": "telicent:",
};

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
const hasFragment = (uri: string) =>
  uri && uri.startsWith("http") && uri.includes("#");

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
export const getOntologyClass = (uri: string) => {
  if (hasFragment(uri)) {
    const uriParts = uri.split("#");
    return uriParts.length > 1 ? uriParts[1] : uri;
  }

  const foundNamespace = Object.keys(PREFIX_LOOKUP).find((namespace) => {
    return uri.startsWith(namespace);
  });

  if (foundNamespace) {
    return uri.replace(foundNamespace, "");
  }

  return uri;
};

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
const getInitials = (value: string) => {
  if (value) {
    const REGEX_GET_FIRST_CHAR_OF_STRING = /(\b[a-zA-Z0-9])?/g; // matches any alphanumeric character (letters or digits).
    const initials = value.match(REGEX_GET_FIRST_CHAR_OF_STRING);
    if (initials) return initials.join("").slice(0, 3);
  }

  console.warn(
    `Telicent DS (getInitials): Unable to get initials from "${value}"`
  );
  return "";
};

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
export const getTypeInitials = (type: string) => {
  if (hasFragment(type)) {
    const uriParts = type.split("#");
    if (uriParts.length === 2) return getInitials(startCase(uriParts[1]));
  }

  return type ?? "";
};

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
export const flattenStyles = (data: StyleResponseType): IconStyleType[] => {
  return Object.entries(data).map(([classUri, style]) => ({
    classUri,
    backgroundColor: style.defaultStyles.dark.backgroundColor,
    color: style.defaultStyles.dark.color,
    iconFallbackText: getTypeInitials(classUri),
    alt: getOntologyClass(classUri),
    shape: style.defaultStyles.shape,
    faUnicode: style.defaultIcons.faUnicode,
    faIcon: style.defaultIcons.faIcon,
  }));
};

/**
 * @deprecated copied over from \@telicent-oss/ds
 */
export const findIcon = (styles: IconStyleType[], classUri: string) => {
  const foundIcon = styles?.find((style) => style?.classUri === classUri);

  if (classUri && foundIcon) {
    return foundIcon;
  }

  const alt = getOntologyClass(classUri);
  const iconFallbackText = getTypeInitials(classUri);

  return {
    classUri,
    color: "#DDDDDD",
    backgroundColor: "#121212",
    iconFallbackText,
    alt,
  };
};
