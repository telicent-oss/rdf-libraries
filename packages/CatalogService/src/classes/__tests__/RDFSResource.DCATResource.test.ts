// DCATResource.min.test.ts
import { SPARQLResultBinding } from "@telicent-oss/rdfservice";
import {
  DCATResource,
  DcatResourceQuerySolution,
} from "src/classes/RDFSResource.DCATResource";
import { CatalogService } from "src/classes/RdfService.CatalogService";

const b = (value: string): SPARQLResultBinding => ({ value, type: "<type>" });

const baseStatement = (): DcatResourceQuerySolution => ({
  _type: b("http://www.w3.org/ns/dcat#Dataset"),
  uri: b("http://example.org/ds/1"),
  identifier: b("ds-1"),
  title: b("BBC Monitoring"),
  description: b("desc"),
  contactPoint__fn: b("Team X"),
  publisher__title: b("BBC"),
  rights__description: b("Copyright © 2025 BBC"),
  accessRights: b("internal"),
  qualifiedAttribution: b("http://example.org/attr/1"),
  qualifiedAttribution__agent: b("http://example.org/agent/1"),
  qualifiedAttribution__agent__title: b("Data Owner"),
  distribution: b("http://example.org/dist/1"),
  distribution__identifier: b("dist-1"),
  distribution__title: b("RSS distribution"),
  distribution__accessURL: b("https://monitoring.bbc.co.uk"),
  distribution__mediaType: b("text/xml"),
  distribution__available: b("2025-08-06T15:17:36"),
  contributor__title: b("test user | manual 1"),
  min_issued: b("2025-07-31T15:02:03.263095884"),
  max_modified: b("2025-09-16T14:51:25.951299+00:00"),
});

test("DCATResource maps a minimal statement", () => {
  // RDFSResource constructor expects a service with a `nodes` map
  const service = {
    nodes: {}, // critical to avoid "Cannot use 'in' operator ..." error
    inCache: jest.fn(() => false),
    insertTriple: jest.fn(async () => {}),
  } as unknown as CatalogService & { nodes: Record<string, unknown> };

  const r = new DCATResource(
    service,
    undefined,
    undefined,
    "http://www.w3.org/ns/dcat#Resource",
    undefined,
    baseStatement()
  );

  expect({
    uri: r.uri,
    title: r.title,
    identifier: r.identifier,
    contributor__title: r.contributor__title,
    min_issued: r.min_issued,
    max_modified: r.max_modified,
  }).toMatchInlineSnapshot(`
    {
      "contributor__title": "test user | manual 1",
      "identifier": "ds-1",
      "max_modified": "2025-09-16T14:51:25.951299+00:00",
      "min_issued": "2025-07-31T15:02:03.263095884",
      "title": "BBC Monitoring",
      "uri": "http://example.org/ds/1",
    }
  `);

  expect(r.toFindString()).toMatchInlineSnapshot(
    `"BBC Monitoring + desc + BBC + Team X + ds-1 + dist-1 + test user | manual 1 + Data Owner + 2025-07-31T15:02:03.263095884 + 2025-09-16T14:51:25.951299+00:00"`
  );
});
