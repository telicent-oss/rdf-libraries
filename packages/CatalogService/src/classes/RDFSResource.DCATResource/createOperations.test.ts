import { DCATResource } from "../RDFSResource.DCATResource";
import {
  createOperations,
  CreateOperationsOptions,
  GraphData,
} from "./createOperations";

jest.mock("./createUri", () => ({
  createUri: jest.fn(({ postfix }) => {
    return `<unique-uuidu>${postfix}`;
  }),
}));

test("ditributionIdentifier", () => {
  const instance = { uri: "<uniqe-uuid>_Resource" } as unknown as DCATResource;
  const api = {} as unknown as CreateOperationsOptions["api"];

  expect(
    (
      [
        "classType",
        "identifier",
        "title",
        "description",
        "contactPoint__fn",
        "publisher__title",
        "rights__description",
        "accessRights",
        "qualifiedAttribution__agent__title",
        "distribution",
        "distribution__identifier",
        "distribution__title",
        "distribution__accessURL",
        "distribution__mediaType",
        "distribution__available",
        "contributor__title",
        "min_issued",
        "max_modified",
        "__contactPoint",
        "__publisher",
        "__rights",
        "__qualifiedAttribution",
        "__qualifiedAttribution__agent",
        "__contributor",
        "__distribution__type",
      ] as GraphData[]
    ).reduce(
      (accum, property) => ({
        [property]: createOperations({
          instance,
          newValue: "New property",
          property,
          api,
        }).map((el) => el.triple),
        ...accum,
      }),
      {}
    )
  ).toMatchInlineSnapshot(`
    {
      "__contactPoint": [],
      "__contributor": [],
      "__distribution__type": [],
      "__publisher": [],
      "__qualifiedAttribution": [],
      "__qualifiedAttribution__agent": [],
      "__rights": [],
      "accessRights": [
        {
          "o": "New property",
          "p": "dct:accessRights",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "classType": [
        {
          "o": "New property",
          "p": "rdf:type",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "contactPoint__fn": [
        {
          "o": "<unique-uuidu>_ContactPoint",
          "p": "dcat:contactPoint",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "New property",
          "p": "vcard:fn",
          "s": "<unique-uuidu>_ContactPoint",
        },
      ],
      "contributor__title": [],
      "description": [
        {
          "o": "New property",
          "p": "dct:description",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "distribution": [
        {
          "o": "<unique-uuidu>_Distribution",
          "p": "dcat:distribution",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "distribution__accessURL": [
        {
          "o": "<unique-uuidu>_Distribution",
          "p": "dcat:distribution",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "http://www.w3.org/ns/dcat#Distribution",
          "p": "rdf:type",
          "s": "<unique-uuidu>_Distribution",
        },
        {
          "o": "New property",
          "p": "dcat:accessURL",
          "s": "<unique-uuidu>_Distribution",
        },
      ],
      "distribution__available": [],
      "distribution__identifier": [
        {
          "o": "<unique-uuidu>_Distribution",
          "p": "dcat:distribution",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "http://www.w3.org/ns/dcat#Distribution",
          "p": "rdf:type",
          "s": "<unique-uuidu>_Distribution",
        },
        {
          "o": "New property",
          "p": "dct:identifier",
          "s": "<unique-uuidu>_Distribution",
        },
      ],
      "distribution__mediaType": [
        {
          "o": "<unique-uuidu>_Distribution",
          "p": "dcat:distribution",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "http://www.w3.org/ns/dcat#Distribution",
          "p": "rdf:type",
          "s": "<unique-uuidu>_Distribution",
        },
        {
          "o": "New property",
          "p": "dcat:mediaType",
          "s": "<unique-uuidu>_Distribution",
        },
      ],
      "distribution__title": [
        {
          "o": "<unique-uuidu>_Distribution",
          "p": "dcat:distribution",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "http://www.w3.org/ns/dcat#Distribution",
          "p": "rdf:type",
          "s": "<unique-uuidu>_Distribution",
        },
        {
          "o": "New property",
          "p": "dct:title",
          "s": "<unique-uuidu>_Distribution",
        },
      ],
      "identifier": [
        {
          "o": "New property",
          "p": "dct:identifier",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "max_modified": [],
      "min_issued": [
        {
          "o": "New property",
          "p": "dct:issued",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
      "publisher__title": [
        {
          "o": "<unique-uuidu>_Publisher",
          "p": "dct:publisher",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "New property",
          "p": "dct:title",
          "s": "<unique-uuidu>_Publisher",
        },
      ],
      "qualifiedAttribution__agent__title": [
        {
          "o": "<unique-uuidu>_DataOwnerAttribution",
          "p": "prov:qualifiedAttribution",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "<unique-uuidu>_DataOwner",
          "p": "prov:agent",
          "s": "<unique-uuidu>_DataOwnerAttribution",
        },
        {
          "o": "New property",
          "p": "dct:title",
          "s": "<unique-uuidu>_DataOwner",
        },
      ],
      "rights__description": [
        {
          "o": "<unique-uuidu>_DataHandlingPolicy",
          "p": "dct:rights",
          "s": "<uniqe-uuid>_Resource",
        },
        {
          "o": "New property",
          "p": "dct:description",
          "s": "<unique-uuidu>_DataHandlingPolicy",
        },
      ],
      "title": [
        {
          "o": "New property",
          "p": "dct:title",
          "s": "<uniqe-uuid>_Resource",
        },
      ],
    }
  `);
});
