
// TODO Make more spec-compliant
// This is spec-approximate http://www.faqs.org/rfcs/rfc3987.html. Do not need, nor want the cost
// of a compliant checker (https://stackoverflow.com/q/161738)
export const permissiveUriRegex = /^[A-Za-z][A-Za-z0-9+.-]*:(?:\/\/[^\/\s]\S+|[^\/\s]\S*)$/;
export const isValidURI = (uri: string) => permissiveUriRegex.test(uri)

