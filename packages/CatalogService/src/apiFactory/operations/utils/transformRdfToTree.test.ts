import { transformRdfToTree } from "./transformRdfToTree";
import type { ResourceQueryType } from "./common";

const t = (value: string, type = "uri") => ({ value, type });

const row = (
  s: string,
  p: string,
  o: string,
  extra: Partial<ResourceQueryType> = {}
): ResourceQueryType => ({
  s: t(s),
  p: t(p),
  o: t(o),
  ...extra,
});

describe("transformRdfToTree", () => {
  it("throws when no root can be found (every subject also appears as an object)", () => {
    const resources: ResourceQueryType[] = [
      row("http://example.test/A", "p", "o", {
        relationship: t("rel"),
        partner: t("http://example.test/B"),
      }),
      row("http://example.test/B", "p", "o", {
        relationship: t("rel"),
        partner: t("http://example.test/A"),
      }),
    ];

    expect(() => transformRdfToTree({ resources })).toThrow(/Root node\(s\) not found/);
  });

  it("returns each subject as its own root when there are no relationships", () => {
    const resources: ResourceQueryType[] = [
      row("http://example.test/A", "type", "Cls", {
        resourceTitle: t("Alpha", "literal"),
      }),
      row("http://example.test/B", "type", "Cls", {
        resourceTitle: t("Beta", "literal"),
      }),
    ];

    const tree = transformRdfToTree({ resources });
    expect(tree).toHaveLength(2);
    const labels = tree.map((n) => n.label).sort();
    expect(labels).toEqual(["Alpha", "Beta"]);
    tree.forEach((n) => expect(n.children).toEqual([]));
  });

  it("nests partners under their parent when relationship+partner are present", () => {
    const resources: ResourceQueryType[] = [
      // A → B (via relationship)
      row("http://example.test/A", "type", "Cls", {
        resourceTitle: t("Root", "literal"),
        relationship: t("rel"),
        partner: t("http://example.test/B"),
      }),
      // B row exists so `find` in buildTree can label B
      row("http://example.test/B", "type", "Cls", {
        resourceTitle: t("Child", "literal"),
      }),
    ];

    const tree = transformRdfToTree({ resources });
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("http://example.test/A");
    expect(tree[0].label).toBe("Root");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("http://example.test/B");
    expect(tree[0].children[0].label).toBe("Child");
  });

  it("uses the node id as the label when no resourceTitle is present", () => {
    const resources: ResourceQueryType[] = [
      row("http://example.test/A", "type", "Cls"),
    ];

    const tree = transformRdfToTree({ resources });
    expect(tree[0].label).toBe("http://example.test/A");
  });
});
