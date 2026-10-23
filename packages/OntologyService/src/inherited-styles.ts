import type { StyleResponseType } from "./index";

/**
 * @function resolveInheritedStyle
 * @remarks
 * Resolves the style for a class: its own style, else the style of its nearest
 * styled ancestor. Ancestors are searched one level at a time, so a styled
 * parent always beats a styled grandparent. Ties at the same level go to the
 * URI that sorts first, so the result is stable across query orderings.
 * @param classUri - The URI of the class to resolve
 * @param ownStyles - Styles keyed by the URI of the class that declares them
 * @param parents - Direct superclasses keyed by subclass URI
 * @returns the resolved style, or undefined when no ancestor is styled
 */
export const resolveInheritedStyle = (
  classUri: string,
  ownStyles: StyleResponseType,
  parents: Map<string, string[]>
): StyleResponseType[string] | undefined => {
  const visited = new Set<string>([classUri]);
  let level = [classUri];
  while (level.length > 0) {
    const styled = level.filter((uri) => ownStyles[uri]).sort();
    if (styled.length > 0) return ownStyles[styled[0]];
    const next = level
      .flatMap((uri) => parents.get(uri) ?? [])
      .filter((uri) => !visited.has(uri));
    next.forEach((uri) => visited.add(uri));
    level = [...new Set(next)];
  }
  return undefined;
};
