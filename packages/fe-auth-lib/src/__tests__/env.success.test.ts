describe("happy path - jsdom environment", () => {
  it("exposes browser globals", () => {
    const result = {
      hasWindow: typeof window !== "undefined",
      hasDocument: typeof document !== "undefined",
      hasSessionStorage: typeof sessionStorage !== "undefined",
    };

    expect(result).toMatchInlineSnapshot(`
      {
        "hasDocument": true,
        "hasSessionStorage": true,
        "hasWindow": true,
      }
    `);
  });
});
