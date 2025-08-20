// tests/updateByPredicateFnFactory.jest.test.ts
import {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
  jest,
} from "@jest/globals";
import type { RdfWriteApiClientType, UpdateTriple } from ".";
import { updateByPredicateFnFactory } from ".";

// Keep the mock typing simple to avoid Jest generic/TS incompatibilities
type MockFn = ReturnType<typeof jest.fn>;
type MinimalClient = { POST: MockFn };

const PREDICATES = [
  "dct:publisher",
  "dct:title",
  "dct:description",
  "dct:issued",
  "dct:rights",
  "dcat:contactPoint",
  "dcat:mediaType",
  "prov:qualifiedAttribution",
  "dct:identifier",
  "dct:modified",
] as const;

describe("updateByPredicateFnFactory (Jest, no TS friction)", () => {
  let client: MinimalClient;
  let fns: ReturnType<typeof updateByPredicateFnFactory>;

  beforeEach(() => {
    client = {
      POST: jest.fn(async (endpoint: string, init?: unknown) => ({
        ok: true,
        endpoint,
        init,
      })),
    };
    // Cast once when passing to the factory; keep our local client strongly mock-typed
    fns = updateByPredicateFnFactory({
      client: client as unknown as RdfWriteApiClientType,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("exposes expected predicate keys", () => {
    expect(Object.keys(fns).sort()).toMatchInlineSnapshot(`
      [
        "dcat:accessURL",
        "dcat:contactPoint",
        "dcat:distribution",
        "dcat:hadRole",
        "dcat:mediaType",
        "dct:description",
        "dct:identifier",
        "dct:issued",
        "dct:modified",
        "dct:publisher",
        "dct:rights",
        "dct:title",
        "dcterms:contributor",
        "prov:agent",
        "prov:qualifiedAttribution",
        "vcard:fn",
      ]
    `);
  });

  it("routes to correct endpoints with correct bodies when prev is a string", async () => {
    const s = "http://example.org/item/1";
    const o = "http://example.org/value/1";
    const prev = "http://example.org/prev/1";

    for (const p of PREDICATES) {
      const triple: UpdateTriple = { s, p, o };
      await fns[p]({ triple, prev });
    }

    expect((client.POST as jest.Mock).mock.calls).toMatchInlineSnapshot(`
      [
        [
          "/dcterms/publisher/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_publisher_object_uri": "http://example.org/value/1",
              "old_publisher_object_uri": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/title/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_title": "http://example.org/value/1",
              "old_title": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/description/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_description": "http://example.org/value/1",
              "old_description": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/issued/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_datetime": "http://example.org/value/1",
              "old_datetime": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/rights/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_rights_object_uri": "http://example.org/value/1",
              "old_rights_object_uri": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcat/contactPoint/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_contact_point_object_uri": "http://example.org/value/1",
              "old_contact_point_object_uri": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcat/mediaType/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_media_type_object_uri": "http://example.org/value/1",
              "old_media_type_object_uri": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/prov/qualifiedAttribution/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_attribution_item_uri": "http://example.org/value/1",
              "old_attribution_item_uri": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/identifier/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_identifier": "http://example.org/value/1",
              "old_identifier": "http://example.org/prev/1",
            },
          },
        ],
        [
          "/dcterms/modified/update",
          {
            "body": {
              "item_uri": "http://example.org/item/1",
              "new_datetime": "http://example.org/value/1",
              "old_datetime": "http://example.org/prev/1",
            },
          },
        ],
      ]
    `);
  });

  it("routes with null prev when not provided", async () => {
    const s = "S";
    const o = "O";
    const prev = null;

    for (const p of PREDICATES) {
      const triple: UpdateTriple = { s, p, o };
      await fns[p]({ triple, prev });
    }

    expect((client.POST as jest.Mock).mock.calls).toMatchInlineSnapshot(`
      [
        [
          "/dcterms/publisher/update",
          {
            "body": {
              "item_uri": "S",
              "new_publisher_object_uri": "O",
              "old_publisher_object_uri": null,
            },
          },
        ],
        [
          "/dcterms/title/update",
          {
            "body": {
              "item_uri": "S",
              "new_title": "O",
              "old_title": null,
            },
          },
        ],
        [
          "/dcterms/description/update",
          {
            "body": {
              "item_uri": "S",
              "new_description": "O",
              "old_description": null,
            },
          },
        ],
        [
          "/dcterms/issued/update",
          {
            "body": {
              "item_uri": "S",
              "new_datetime": "O",
              "old_datetime": null,
            },
          },
        ],
        [
          "/dcterms/rights/update",
          {
            "body": {
              "item_uri": "S",
              "new_rights_object_uri": "O",
              "old_rights_object_uri": null,
            },
          },
        ],
        [
          "/dcat/contactPoint/update",
          {
            "body": {
              "item_uri": "S",
              "new_contact_point_object_uri": "O",
              "old_contact_point_object_uri": null,
            },
          },
        ],
        [
          "/dcat/mediaType/update",
          {
            "body": {
              "item_uri": "S",
              "new_media_type_object_uri": "O",
              "old_media_type_object_uri": null,
            },
          },
        ],
        [
          "/prov/qualifiedAttribution/update",
          {
            "body": {
              "item_uri": "S",
              "new_attribution_item_uri": "O",
              "old_attribution_item_uri": null,
            },
          },
        ],
        [
          "/dcterms/identifier/update",
          {
            "body": {
              "item_uri": "S",
              "new_identifier": "O",
              "old_identifier": null,
            },
          },
        ],
        [
          "/dcterms/modified/update",
          {
            "body": {
              "item_uri": "S",
              "new_datetime": "O",
              "old_datetime": null,
            },
          },
        ],
      ]
    `);
  });
});
