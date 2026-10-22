import { resolveInheritedStyle, StyleResponseType } from "../src/index";

const NS = "http://example.test/";
const Dog = `${NS}Dog`;
const Animal = `${NS}Animal`;
const Entity = `${NS}Entity`;
const Pet = `${NS}Pet`;
const Mammal = `${NS}Mammal`;

const makeStyle = (backgroundColor: string) => ({
  defaultIcons: { riIcon: "", faIcon: "", faUnicode: "", faClass: "" },
  defaultStyles: {
    shape: "ellipse",
    borderRadius: "0",
    borderWidth: "0",
    selectedBorderWidth: "0",
    dark: { backgroundColor, color: "#fff" },
    light: { backgroundColor, color: "#000" },
  },
});

const parentsOf = (edges: Record<string, string[]>) =>
  new Map(Object.entries(edges));

describe("resolveInheritedStyle", () => {
  it("inherits through every level (Dog → Animal → Entity)", () => {
    const ownStyles: StyleResponseType = { [Entity]: makeStyle("entity") };
    const parents = parentsOf({ [Dog]: [Animal], [Animal]: [Entity] });

    expect(resolveInheritedStyle(Dog, ownStyles, parents)).toBe(
      ownStyles[Entity]
    );
    expect(resolveInheritedStyle(Animal, ownStyles, parents)).toBe(
      ownStyles[Entity]
    );
  });

  it("prefers the class's own style over any ancestor's", () => {
    const ownStyles: StyleResponseType = {
      [Dog]: makeStyle("dog"),
      [Animal]: makeStyle("animal"),
    };
    const parents = parentsOf({ [Dog]: [Animal] });

    expect(resolveInheritedStyle(Dog, ownStyles, parents)).toBe(
      ownStyles[Dog]
    );
  });

  it("prefers the nearest styled ancestor", () => {
    const ownStyles: StyleResponseType = {
      [Animal]: makeStyle("animal"),
      [Entity]: makeStyle("entity"),
    };
    const parents = parentsOf({ [Dog]: [Animal], [Animal]: [Entity] });

    expect(resolveInheritedStyle(Dog, ownStyles, parents)).toBe(
      ownStyles[Animal]
    );
  });

  it("prefers a near ancestor on one branch over a far one on another", () => {
    // Dog → Pet → Entity (styled) and Dog → Mammal (styled)
    const ownStyles: StyleResponseType = {
      [Entity]: makeStyle("entity"),
      [Mammal]: makeStyle("mammal"),
    };
    const parents = parentsOf({ [Dog]: [Pet, Mammal], [Pet]: [Entity] });

    expect(resolveInheritedStyle(Dog, ownStyles, parents)).toBe(
      ownStyles[Mammal]
    );
  });

  it("breaks ties at the same level by URI, whatever the edge order", () => {
    const ownStyles: StyleResponseType = {
      [Pet]: makeStyle("pet"),
      [Mammal]: makeStyle("mammal"),
    };

    expect(
      resolveInheritedStyle(Dog, ownStyles, parentsOf({ [Dog]: [Pet, Mammal] }))
    ).toBe(ownStyles[Mammal]);
    expect(
      resolveInheritedStyle(Dog, ownStyles, parentsOf({ [Dog]: [Mammal, Pet] }))
    ).toBe(ownStyles[Mammal]);
  });

  it("returns undefined when no ancestor is styled", () => {
    const parents = parentsOf({ [Dog]: [Animal], [Animal]: [Entity] });

    expect(resolveInheritedStyle(Dog, {}, parents)).toBeUndefined();
  });

  it("returns undefined for a class with no parents and no style", () => {
    expect(resolveInheritedStyle(Dog, {}, new Map())).toBeUndefined();
  });

  it("terminates on cycles", () => {
    const parents = parentsOf({ [Dog]: [Animal], [Animal]: [Dog] });

    expect(resolveInheritedStyle(Dog, {}, parents)).toBeUndefined();
  });

  it("resolves through a diamond", () => {
    // Dog → Pet → Entity and Dog → Mammal → Entity
    const ownStyles: StyleResponseType = { [Entity]: makeStyle("entity") };
    const parents = parentsOf({
      [Dog]: [Pet, Mammal],
      [Pet]: [Entity],
      [Mammal]: [Entity],
    });

    expect(resolveInheritedStyle(Dog, ownStyles, parents)).toBe(
      ownStyles[Entity]
    );
  });
});
