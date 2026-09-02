import type { CreateTriple, RdfWriteApiClientType } from ".";
import { createByPredicateFnFactory } from ".";

type MinimalClient = { POST: jest.Mock };

const PREDICATES: CreateTriple["p"][] = [
  "dct:publisher",
  "dct:title",
  "dct:description",
  "dct:issued",
  "dct:rights",
  "prov:qualifiedAttribution",
  "dct:identifier",
  "dcat:contactPoint",
  "dcat:mediaType",
  "dct:modified",
  "dcat:distribution",
  "dcat:hadRole",
  "dcat:accessURL",
  "dcterms:contributor",
  "vcard:fn",
  "prov:agent",
  "rdf:type",
];

const vocab = {
  mint_base: "http://mint_base",
  PROV_PREFIX: "http://PROV_PREFIX",
  XSD_DATETIME: "http://XSD_DATETIME",
};

describe("createByPredicateFnFactory", () => {
  let client: MinimalClient;
  let fns: ReturnType<typeof createByPredicateFnFactory>;

  beforeEach(() => {
    client = {
      POST: jest.fn(async (endpoint: string, init?: unknown) => ({
        ok: true,
        endpoint,
        response: { status: 200 },
        init,
      })),
    };
    fns = createByPredicateFnFactory({
      client: client as unknown as RdfWriteApiClientType,
    });
  });

  it("exposes exactly the expected 17 predicate keys", () => {
    expect(Object.keys(fns).sort()).toEqual(
      [...PREDICATES].sort()
    );
  });

  it.each(PREDICATES)("%s POSTs against the correct endpoint", async (predicate) => {
    const triple: CreateTriple = {
      s: "http://example.test/subject",
      p: predicate,
      o: "http://example.test/object",
    };
    await fns[predicate]({
      triple,
      dataset_uri: "http://example.test/dataset",
      vocab,
    });
    expect(client.POST).toHaveBeenCalledTimes(1);
  });

  it("routes each predicate to the endpoint that mirrors the predicate name", async () => {
    const expectedEndpoints: Record<CreateTriple["p"], string> = {
      "dct:publisher": "/dcterms/publisher",
      "dct:title": "/dcterms/title",
      "dct:description": "/dcterms/description",
      "dct:issued": "/dcterms/issued",
      "dct:rights": "/dcterms/rights",
      "prov:qualifiedAttribution": "/prov/qualifiedAttribution",
      "dct:identifier": "/dcterms/identifier",
      "dcat:contactPoint": "/dcat/contactPoint",
      "dcat:mediaType": "/dcat/mediaType",
      "dct:modified": "/dcterms/modified",
      "dcat:distribution": "/dcat/distribution",
      "dcat:hadRole": "/dcat/hadRole",
      "dcat:accessURL": "/dcat/accessURL",
      "dcterms:contributor": "/dcterms/contributor",
      "vcard:fn": "/vcard/fn",
      "prov:agent": "/prov/agent",
      "rdf:type": "/object-property",
    };

    for (const p of PREDICATES) {
      client.POST.mockClear();
      const triple: CreateTriple = { s: "S", p, o: "O" };
      await fns[p]({
        triple,
        dataset_uri: "http://example.test/dataset",
        vocab,
      });
      expect(client.POST).toHaveBeenCalledWith(
        expectedEndpoints[p],
        expect.objectContaining({ body: expect.any(Object) })
      );
    }
  });

  it("propagates HTTP errors thrown by throwIfHTTPError", async () => {
    client.POST.mockResolvedValueOnce({
      ok: false,
      response: { status: 500, statusText: "Server Error" },
      error: { detail: "boom" },
    });

    const triple: CreateTriple = { s: "S", p: "dct:title", o: "O" };
    await expect(
      fns["dct:title"]({
        triple,
        dataset_uri: "http://example.test/dataset",
        vocab,
      })
    ).rejects.toBe("boom");
  });

  it("rdf:type uses the /object-property endpoint with subject/predicate/object body", async () => {
    const triple: CreateTriple = { s: "S", p: "rdf:type", o: "O" };
    await fns["rdf:type"]({
      triple,
      dataset_uri: "http://example.test/dataset",
      vocab,
    });
    expect(client.POST).toHaveBeenCalledWith(
      "/object-property",
      expect.objectContaining({
        body: expect.objectContaining({
          subject: "S",
          object: "O",
          predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
          dataset: "catalog",
        }),
      })
    );
  });
});
