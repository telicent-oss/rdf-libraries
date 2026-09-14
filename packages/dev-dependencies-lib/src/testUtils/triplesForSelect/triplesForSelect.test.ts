import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";
import { triplesForSelect } from "./triplesForSelect";

describe("triplesForSelectSELECT JSON-to-nTriples", () => {
  beforeEach(() => {
    // If fetch, spy else create mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (global as any).fetch === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(global as any, "fetch");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).fetch = jest.fn();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("builds CONSTRUCT for unique URIs and returns triples", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        `
      <http://data.example/ds/a>        <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>   <http://www.w3.org/ns/dcat#Dataset> .
      <http://data.example/ds/a>        <http://purl.org/dc/terms/title>                    "Coastal Flood Risk Map"@en .
      <http://data.example/ds/a>        <http://www.w3.org/ns/dcat#distribution>            <http://data.example/dist/a.csv> .
      
      <http://data.example/ds/b>        <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>   <http://www.w3.org/ns/dcat#Dataset> .
      <http://data.example/ds/b>        <http://purl.org/dc/terms/title>                    "Land Parcel Index"@en .
      <http://data.example/ds/b>        <http://www.w3.org/ns/dcat#keyword>                 "cadastre"@en .
      
      <http://data.example/dist/a.csv>  <http://www.w3.org/ns/dcat#mediaType>               "text/csv" .
      
      <http://infra.example/node/42>    <http://example.org/rel/linksTo>                    <http://data.example/ds/a> .`,
    });

    await expect(
      triplesForSelect("http://example.org/sparql", {
        head: { vars: ["r"] },
        results: {
          bindings: [
            { r: { type: "uri", value: "http://data.example/ds/a" } },
            { r: { type: "uri", value: "http://data.example/ds/b" } },
            { r: { type: "uri", value: "http://data.example/ds/a" } }, // duplicate
          ],
        },
      })
    ).resolves.toMatchInlineSnapshot(`
      "
            <http://data.example/ds/a>        <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>   <http://www.w3.org/ns/dcat#Dataset> .
            <http://data.example/ds/a>        <http://purl.org/dc/terms/title>                    "Coastal Flood Risk Map"@en .
            <http://data.example/ds/a>        <http://www.w3.org/ns/dcat#distribution>            <http://data.example/dist/a.csv> .
            
            <http://data.example/ds/b>        <http://www.w3.org/1999/02/22-rdf-syntax-ns#type>   <http://www.w3.org/ns/dcat#Dataset> .
            <http://data.example/ds/b>        <http://purl.org/dc/terms/title>                    "Land Parcel Index"@en .
            <http://data.example/ds/b>        <http://www.w3.org/ns/dcat#keyword>                 "cadastre"@en .
            
            <http://data.example/dist/a.csv>  <http://www.w3.org/ns/dcat#mediaType>               "text/csv" .
            
            <http://infra.example/node/42>    <http://example.org/rel/linksTo>                    <http://data.example/ds/a> ."
    `);

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "http://example.org/sparql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-query",
          Accept: "application/n-triples",
        },
        body: `CONSTRUCT {
  ?r ?p ?o .
  ?s ?pin ?r .
}
WHERE {
  VALUES ?r { <http://data.example/ds/a> <http://data.example/ds/b> }
  ?r ?p ?o .
  OPTIONAL { ?s ?pin ?r }
}`,
      }
    );
  });

  it("returns empty string when the SELECT result yields no URIs", async () => {
    await expect(
      triplesForSelect("http://example.org/query", {
        head: { vars: [] },
        results: { bindings: [] },
      })
    ).resolves.toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws when the endpoint looks like an /update endpoint", async () => {
    await expect(
      triplesForSelect("http://example.org/update", {
        head: { vars: [] },
        results: { bindings: [] },
      })
    ).rejects.toThrow(/UPDATE endpoint/);
  });

  it("omits the incoming OPTIONAL block when includeIncoming=false", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<a> <b> <c> .",
    });

    await triplesForSelect(
      "http://example.org/sparql",
      {
        head: { vars: ["r"] },
        results: {
          bindings: [{ r: { type: "uri", value: "http://data.example/ds/a" } }],
        },
      },
      { includeIncoming: false }
    );

    const call = (global.fetch as jest.Mock).mock.calls[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((call[1] as any).body).not.toContain("?pin");
  });

  it("runs the SELECT then the CONSTRUCT when given a query string", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          head: { vars: ["r"] },
          results: {
            bindings: [
              { r: { type: "uri", value: "http://data.example/ds/a" } },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "<a> <b> <c> .",
      });

    const out = await triplesForSelect(
      "http://example.org/query",
      "SELECT ?r WHERE { ?r a <http://x> }"
    );
    expect(out).toBe("<a> <b> <c> .");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when the SELECT round-trip fails", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "server error",
    });
    await expect(
      triplesForSelect("http://example.org/query", "SELECT ?r WHERE { }")
    ).rejects.toThrow(/SELECT failed 500/);
  });

  it("throws when the CONSTRUCT round-trip fails", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "bad gateway",
    });
    await expect(
      triplesForSelect("http://example.org/query", {
        head: { vars: ["r"] },
        results: {
          bindings: [{ r: { type: "uri", value: "http://data.example/ds/a" } }],
        },
      })
    ).rejects.toThrow(/CONSTRUCT failed 502/);
  });
});
