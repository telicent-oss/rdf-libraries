import "jest-fetch-mock";
import {
  CatalogService,
  DCATCatalog,
  DCATDataset,
  DCATResource,
  DCATDataService,
  setup,
  MockSet,
} from "../index";
import { makeStatic } from "./makeStatic";
import {
  DockerComposeEnvironment,
  Wait,
  StartedDockerComposeEnvironment,
} from "testcontainers";

async function setupContainer() {
  const environment = await new DockerComposeEnvironment(
    "./",
    "docker-compose.yml"
  )
    .withWaitStrategy(
      "telicent-jena-smart-cache",
      Wait.forLogMessage("Your service is ready")
    )
    .up();

  const cs = new CatalogService(
    "http://localhost:3030/",
    "catalog",
    true,
    undefined,
    undefined
  );

  expect(await cs.checkTripleStore()).toBeTruthy();
  return { environment, cs };
}

// QUESTION Why does order of result change when I incr. number?
const testDefaultNamespace = "http://telicent.io/data/";
const cat1 = `${testDefaultNamespace}cat1`;
const dataset1 = `${testDefaultNamespace}dataset1`;
const dataservice1 = `${testDefaultNamespace}dataservice1`;

const initialTripleCount = 11;
const initialNodeCount = 3;

const SEC = 1000;

function formatDataAsArray(
  data: { s: { value: string }; p: { value: string }; o: { value: string } }[]
): string[] {
  // Check if data is empty
  if (data.length === 0) {
    return ["Data is empty"]; // Return a meaningful message or handle as preferred
  }

  const transformToShorthand = (el: { value: string }) => {
    return {
      ...el,
      value:
        el.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
          ? "a"
          : el.value,
    };
  };
  const newData = data.map((el) => ({
    s: transformToShorthand(el.s),
    p: transformToShorthand(el.p),
    o: transformToShorthand(el.o),
  }));

  // Calculate the maximum width of each column
  const maxWidth = {
    s: Math.max(...newData.map((item) => item.s.value.length)),
    p: Math.max(...newData.map((item) => item.p.value.length)),
    o: Math.max(...newData.map((item) => item.o.value.length)),
  };

  // Ensure minimum width of 1 for columns to avoid negative repeat count
  const adjustedWidths = {
    s: Math.max(1, maxWidth.s),
    p: Math.max(1, maxWidth.p),
    o: Math.max(1, maxWidth.o),
  };

  // Construct header with column names and spaces based on maximum widths
  const header = `s${" ".repeat(adjustedWidths.s - 1)} | p${" ".repeat(
    adjustedWidths.p - 1
  )} | o`;

  // Map over the data to format each row according to maximum widths
  const rows = newData.map(({ s, p, o }) =>
    `${s.value.padEnd(adjustedWidths.s)} | ${p.value.padEnd(
      adjustedWidths.p
    )} | ${o.value.padEnd(adjustedWidths.o)}`.trim()
  );

  // Return the header and all rows as an array of strings
  return [header, ...rows];
}

describe("CatalogService", () => {
  let environment: StartedDockerComposeEnvironment;
  let cs: CatalogService;

  beforeAll(async () => {
    const result = await setupContainer();
    environment = result.environment;
    cs = result.cs;
  }, 30 * SEC);

  afterAll(async () => {
    await Promise.all(cs.workAsync);
    await environment.down();
  }, 10 * SEC);

  afterEach(async () => {
    await cs.runUpdate(["DELETE WHERE {?s ?p ?o }"]); //clear the dataset
  });

  it(`setup() should have added the expected amount of triples: ${initialTripleCount}`, async () => {
    const api = await setup({
      hostName: "http://localhost:3030/",
      mockSet: MockSet.SIMPLE,
    });
    const query = `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`;
    const data = await cs.runQuery(query);
    expect(data.results.bindings.length).toEqual(22);
    expect(formatDataAsArray(makeStatic(data.results).bindings))
      .toMatchInlineSnapshot(`
      [
        "s                                    | p                                               | o",
        "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService                                                                                                                      ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/creator                | Oleg Novak                                                                                                                                                 ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | Service: Wind Feed                                                                                                                                         ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########                                                                                                                             ",
        "http://telicent.io/data/dataservice1 | http://www.w3.org/ns/dcat#Resource              | http://telicent.io/data/catalog1                                                                                                                           ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/description            | Cornwall Wind Detector data via JSON REST API. Real-time, API-token controlled access for analysis by environmental scientists and meteorologists.         ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/rights                 | James Hardacre                                                                                                                                             ",
        "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1                                                                                                                           ",
        "http://telicent.io/data/catalog1     | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1                                                                                                                       ",
        "http://telicent.io/data/catalog1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog                                                                                                                          ",
        "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/creator                | Mario Giacomelli                                                                                                                                           ",
        "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/title                  | Catalog: Cornwall Data                                                                                                                                     ",
        "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########                                                                                                                             ",
        "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/description            | 2020 Royal Engineers’ Cornwall focused data catalog. Includes real-time IoT telemetry and historical archives for environmental and technological research.",
        "http://telicent.io/data/catalog1     | http://purl.org/dc/terms/rights                 | James Hardacre                                                                                                                                             ",
        "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset                                                                                                                          ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/creator                | Kiki Sato                                                                                                                                                  ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | Dataset: Q1 2021                                                                                                                                           ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########                                                                                                                             ",
        "http://telicent.io/data/dataset1     | http://www.w3.org/ns/dcat#Resource              | http://telicent.io/data/catalog1                                                                                                                           ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/description            | Q1 2021 Cornwall incident reports dataset in CSV format. Heavily redacted, supporting public safety analysis and policy development.                       ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/rights                 | Damir Sato                                                                                                                                                 ",
      ]
    `);
  });

  it("Should find catalog-owned items", async () => {
    const TITLES = {
      cat1: "cat1",
      dataset1: "dataset1",
      dataservice1: "dataservice1",
    };
    const cat = new DCATCatalog(cs, cat1, TITLES.cat1);
    await Promise.all(cat.workAsync); // TODO remove; Just paranoid
    expect(cat.statement).toMatchInlineSnapshot(`undefined`);
    // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
    const d1 = new DCATDataset(cs, dataset1, TITLES.dataset1);
    await Promise.all(d1.workAsync); // TODO remove; Just paranoid
    await cat.addOwnedDataset(d1);
    await Promise.all(d1.workAsync);
    await Promise.all(cat.workAsync);

    const ds1 = new DCATDataService(cs, dataservice1, TITLES.dataservice1);
    await Promise.all(ds1.workAsync); // TODO remove; Just paranoid
    await cat.addOwnedService(ds1);
    await Promise.all(cat.workAsync);
    await Promise.all(ds1.workAsync);
    new Promise((resolve) => setTimeout(resolve, 1000));

    // await new Promise(resolve => setTimeout(resolve, 1000))
    const data = await cs.runQuery(`SELECT ?s ?p ?o WHERE { ?s ?p ?o }`);
    expect(formatDataAsArray(makeStatic(data.results).bindings))
      .toMatchInlineSnapshot(`
      [
        "s                                    | p                                               | o",
        "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#Dataset               | http://telicent.io/data/dataset1     ",
        "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#DataService           | http://telicent.io/data/dataservice1 ",
        "http://telicent.io/data/cat1         | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Catalog    ",
        "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title                  | cat1                                 ",
        "http://telicent.io/data/cat1         | http://purl.org/dc/terms/published              | ######## makeStatic() ########       ",
        "http://telicent.io/data/dataservice1 | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#DataService",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title                  | dataservice1                         ",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published              | ######## makeStatic() ########       ",
        "http://telicent.io/data/dataset1     | http://www.w3.org/1999/02/22-rdf-syntax-ns#type | http://www.w3.org/ns/dcat#Dataset    ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title                  | dataset1                             ",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published              | ######## makeStatic() ########       ",
      ]
    `);
    new Promise((resolve) => setTimeout(resolve, 1000));
    const ownedResources = await cat.getOwnedResources();
    await Promise.all(cat.workAsync);
    new Promise((resolve) => setTimeout(resolve, 1000));
    expect(ownedResources.map((el) => el.uri)).toEqual([
      `http://telicent.io/data/${TITLES.dataset1}`,
      `http://telicent.io/data/${TITLES.dataservice1}`,
    ]);
  });

  it.only("Specialised getowned methods should return correct items", async () => {
    const cat = new DCATCatalog(cs, cat1, "cat1");
    await Promise.all(cat.workAsync); // TODO remove; Just paranoid
    expect(cat.statement).toMatchInlineSnapshot(`undefined`);
    // REQUIREMENT 6.1 Search by dataResourceFilter: selected data-resources
    const d1 = new DCATDataset(cs, dataset1, "dataset1");
    // await Promise.all(d1.workAsync); // TODO remove; Just paranoid
    // await cat.addOwnedDataset(d1);
    await Promise.all(d1.workAsync);
    await Promise.all(cat.workAsync);
    await Promise.all(d1.service.workAsync);

    const ds1 = new DCATDataService(cs, dataservice1, "dataservice1");
    await Promise.all(ds1.workAsync); // TODO remove; Just paranoid
    await cat.addOwnedService(ds1);
    await Promise.all(cat.workAsync);
    await Promise.all(ds1.workAsync);
    await Promise.all(ds1.service.workAsync);
    const data = await cs.runQuery(`SELECT ?s ?p ?o WHERE { ?s ?p ?o }`);
    expect(data.results).toMatchInlineSnapshot(`
      {
        "bindings": [
          {
            "o": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#DataService",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#Catalog",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "cat1",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "2024-09-04T16:21:01.155Z",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/cat1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#DataService",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "dataservice1",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "2024-09-04T16:21:01.263Z",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataservice1",
            },
          },
          {
            "o": {
              "type": "uri",
              "value": "http://www.w3.org/ns/dcat#Dataset",
            },
            "p": {
              "type": "uri",
              "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "dataset1",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/title",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
          {
            "o": {
              "type": "literal",
              "value": "2024-09-04T16:21:01.165Z",
            },
            "p": {
              "type": "uri",
              "value": "http://purl.org/dc/terms/published",
            },
            "s": {
              "type": "uri",
              "value": "http://telicent.io/data/dataset1",
            },
          },
        ],
      }
    `);
    // Data: "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#DataService | http://telicent.io/data/dataservice1",
    // RE: "http://www.w3.org/ns/dcat#DataServic" 
    //      in "p"
    //      BUT Query is checking for it in "o"
    //      So I am tempted to do 
    //        cls 
    //         ? '?catRel a ?_type.' 
    //          : '?uri a ?_type.'
    // WHY DOE MY UI CRASH OUT:
    // http://localhost:5173/data-catalog

    expect(formatDataAsArray(makeStatic(data.results).bindings))
      .toMatchInlineSnapshot(`
      [
        "s                                    | p                                     | o",
        "http://telicent.io/data/cat1         | http://www.w3.org/ns/dcat#DataService | http://telicent.io/data/dataservice1",
        "http://telicent.io/data/cat1         | a                                     | http://www.w3.org/ns/dcat#Catalog",
        "http://telicent.io/data/cat1         | http://purl.org/dc/terms/title        | cat1",
        "http://telicent.io/data/cat1         | http://purl.org/dc/terms/published    | ######## makeStatic() ########",
        "http://telicent.io/data/dataservice1 | a                                     | http://www.w3.org/ns/dcat#DataService",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/title        | dataservice1",
        "http://telicent.io/data/dataservice1 | http://purl.org/dc/terms/published    | ######## makeStatic() ########",
        "http://telicent.io/data/dataset1     | a                                     | http://www.w3.org/ns/dcat#Dataset",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/title        | dataset1",
        "http://telicent.io/data/dataset1     | http://purl.org/dc/terms/published    | ######## makeStatic() ########",
      ]
    `);

    const ownedDatasets = await cat.getOwnedDatasets();
    await Promise.all(cat.workAsync);
    expect(ownedDatasets.length).not.toBe(0);
    expect(ownedDatasets).toMatchInlineSnapshot(`
      [
        DCATDataService {
          "className": "DCATDataService",
          "service": CatalogService {
            "classLookup": {
              "http://www.w3.org/2000/01/rdf-schema#Resource": [Function],
              "http://www.w3.org/ns/dcat#Catalog": [Function],
              "http://www.w3.org/ns/dcat#DataService": [Function],
              "http://www.w3.org/ns/dcat#Dataset": [Function],
              "http://www.w3.org/ns/dcat#Resource": [Function],
            },
            "dataset": "catalog",
            "dc": "http://purl.org/dc/elements/1.1/",
            "dcCreated": "http://purl.org/dc/terms/created",
            "dcCreator": "http://purl.org/dc/terms/creator",
            "dcDescription": "http://purl.org/dc/terms/description",
            "dcPublished": "http://purl.org/dc/terms/published",
            "dcRights": "http://purl.org/dc/terms/rights",
            "dcTitle": "http://purl.org/dc/terms/title",
            "dcat": "http://www.w3.org/ns/dcat#",
            "dcatCatalog": "http://www.w3.org/ns/dcat#Catalog",
            "dcatDataService": "http://www.w3.org/ns/dcat#DataService",
            "dcatDataset": "http://www.w3.org/ns/dcat#Dataset",
            "dcatResource": "http://www.w3.org/ns/dcat#Resource",
            "dcat_dataset": "http://www.w3.org/ns/dcat#dataset",
            "dcat_service": "http://www.w3.org/ns/dcat#service",
            "dct": "http://purl.org/dc/terms/",
            "defaultSecurityLabel": "",
            "nodes": {
              "http://telicent.io/data/cat1": DCATCatalog {
                "className": "DCATCatalog",
                "service": [Circular],
                "statement": undefined,
                "types": [
                  "http://www.w3.org/ns/dcat#Catalog",
                ],
                "uri": "http://telicent.io/data/cat1",
                "workAsync": [
                  Promise {},
                ],
              },
              "http://telicent.io/data/dataservice1": [Circular],
              "http://telicent.io/data/dataset1": DCATDataset {
                "className": "DCATDataset",
                "service": [Circular],
                "statement": undefined,
                "types": [
                  "http://www.w3.org/ns/dcat#Dataset",
                ],
                "uri": "http://telicent.io/data/dataset1",
                "workAsync": [],
              },
            },
            "owl": "http://www.w3.org/2002/07/owl#",
            "prefixDict": {
              ":": "http://telicent.io/catalog/",
              "dc:": "http://purl.org/dc/elements/1.1/",
              "dcat:": "http://www.w3.org/ns/dcat#",
              "dct:": "http://purl.org/dc/terms/",
              "foaf:": "http://xmlns.com/foaf/0.1/",
              "rdf:": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "rdfs:": "http://www.w3.org/2000/01/rdf-schema#",
              "skos:": "http://www.w3.org/2004/02/skos/core#",
              "telicent:": "http://telicent.io/ontology/",
              "xsd:": "http://www.w3.org/2001/XMLSchema#",
            },
            "queryEndpoint": "http://localhost:3030/catalog/query?query=",
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "rdfType": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "rdfsComment": "http://www.w3.org/2000/01/rdf-schema#comment",
            "rdfsLabel": "http://www.w3.org/2000/01/rdf-schema#label",
            "rdfsResource": "http://www.w3.org/2000/01/rdf-schema#Resource",
            "skos": "http://www.w3.org/2004/02/skos/core#",
            "telicent": "http://telicent.io/ontology/",
            "triplestoreUri": "http://localhost:3030/",
            "updateCount": 16,
            "updateEndpoint": "http://localhost:3030/catalog/update",
            "workAsync": [
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
              Promise {},
            ],
            "xsd": "http://www.w3.org/2001/XMLSchema#",
          },
          "statement": undefined,
          "types": [
            "http://www.w3.org/ns/dcat#DataService",
          ],
          "uri": "http://telicent.io/data/dataservice1",
          "workAsync": [],
        },
      ]
    `);
    // expect(ownedDatasets[0] === d1).toBeTruthy();
    // const ownedServices = await cat.getOwnedServices();
    // await Promise.all(cat.workAsync);
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // expect(ownedServices.length).toEqual(1);
    // expect(ownedServices[0] === ds1).toBeTruthy();
  });

  it(`it should set titles propertly`, async () => {
    const cat = new DCATCatalog(cs, cat1, "cat1");
    const catTitle = await cat.getDcTitle();
    const d1 = new DCATDataset(cs, dataset1, "dataset1");
    const d1Title = await d1.getDcTitle();
    const ds1 = new DCATDataService(cs, dataservice1, "dataservice1");
    const ds1Title = await ds1.getDcTitle();
    expect(catTitle.length).toEqual(1);
    expect(catTitle[0]).toEqual("Catalog One");
    expect(d1Title.length).toEqual(1);
    expect(d1Title[0]).toEqual("Dataset One");
    expect(ds1Title.length).toEqual(1);
    expect(ds1Title[0]).toEqual("Data Service One");
  });

  it(`it should set published dates propertly`, async () => {
    const cat = new DCATCatalog(cs, cat1, "cat1");
    const catPub = await cat.getDcPublished();
    const d1 = new DCATDataset(cs, dataset1, "dataset1");
    const d1Pub = await d1.getDcPublished();
    const ds1 = new DCATDataService(cs, dataservice1, "dataservice1");
    const ds1Pub = await ds1.getDcPublished();
    expect(catPub.length).toEqual(1);
    expect(catPub[0]).toEqual("2022-01-01");
    expect(d1Pub.length).toEqual(1);
    expect(d1Pub[0]).toEqual("2022-01-02");
    expect(ds1Pub.length).toEqual(1);
  });

  it(`should not have added any more triples than: ${initialTripleCount} at this stage`, async () => {
    const data = await cs.runQuery(`SELECT ?s ?p ?o WHERE { ?s ?p ?o }`);
    expect(data.results.bindings.length).toEqual(initialTripleCount);
  });

  it(`There should be ${initialNodeCount} nodes cached in the service at this stage`, async () => {
    expect(Object.keys(cs.nodes).length).toEqual(initialNodeCount);
  });
  // const S = 1000;
  // const M = 60 * S;
  // const H = 60 * M;
  // const D = 24 * H;
  // it('wait', (done) => {
  //   expect(true).toBeTruthy();
  //   setTimeout(done, D)

  // }, D)
});
