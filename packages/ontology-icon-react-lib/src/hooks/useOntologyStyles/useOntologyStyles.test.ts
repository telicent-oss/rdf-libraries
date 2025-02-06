import { renderHook, waitFor } from "@testing-library/react";
import { useOntologyStyles } from "./useOntologyStyles";
import * as ontologyIconLib from "@telicent-oss/ontology-icon-lib";

jest.mock("@telicent-oss/ontology-icon-lib", () => ({
  moduleStylesPromise: Promise.resolve([
    { id: "icon1", style: "style1" },
    { id: "icon2", style: "style2" },
  ]),
  findByClassUri: jest.fn(),
}));

describe("useOntologyStyles", () => {
  it("initially sets isLoading to true and styles to null", async () => {
    const { result } = renderHook(() => useOntologyStyles());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.styles).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.styles).toMatchInlineSnapshot(`
      [
        {
          "id": "icon1",
          "style": "style1",
        },
        {
          "id": "icon2",
          "style": "style2",
        },
      ]
    `);
    expect(ontologyIconLib.findByClassUri).not.toHaveBeenCalled();
  });
});
