import { use } from "./use";
import { use as reactUse } from "react";

describe("use", () => {
  it("re-exports React's stable `use` API", () => {
    expect(typeof use).toBe("function");
    expect(use).toBe(reactUse);
  });
});
