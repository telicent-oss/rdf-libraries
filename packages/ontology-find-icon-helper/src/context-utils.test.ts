import { getOntologyClass, getTypeInitials } from "./context-utils";

describe("context utils - getOntologyClass()", () => {
  test("returns DoctorAppointment when uri is 'http://telicent.io/ontology/DoctorAppointment'", () => {
    const fragment = getOntologyClass(
      "http://telicent.io/ontology/DoctorAppointment"
    );
    expect(fragment).toBe("DoctorAppointment");
  });
  test("table", () => {
    const results = [
      {
        description: "URI with a fragment",
        inputURI: "http://example.com/ontology#Person",
      },
      {
        description: "URI matches a known namespace",
        inputURI: "http://telicent.io/ontology/Decision",
      },
      {
        description: "URI without a fragment and unknown prefix",
        inputURI: "http://unknown.com/data",
      },
      {
        description: "Empty URI inputs",
        inputURI: "",
      },
    ].map((el) => ({ ...el, output: getOntologyClass(el.inputURI) }));
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "description": "URI with a fragment",
          "inputURI": "http://example.com/ontology#Person",
          "output": "Person",
        },
        {
          "description": "URI matches a known namespace",
          "inputURI": "http://telicent.io/ontology/Decision",
          "output": "Decision",
        },
        {
          "description": "URI without a fragment and unknown prefix",
          "inputURI": "http://unknown.com/data",
          "output": "http://unknown.com/data",
        },
        {
          "description": "Empty URI inputs",
          "inputURI": "",
          "output": "",
        },
      ]
    `);
  });
});

describe("getTypeInitials", () => {
  const results = [
    {
      description: "Type with a fragment and a valid name",
      inputType: "http://example.com/ontology#Decision Maker",
      expected: "DM", // Assuming your function is designed to handle spaces correctly
    },
    {
      description: "Type with a fragment but no valid name",
      inputType: "http://telicent.io/ontology#",
      expected: "", // What should happen in this case depends on your getInitials implementation
    },
    {
      description: "Type without a fragment and unknown prefix",
      inputType: "http://unknown.com/data",
      expected: "http://unknown.com/data", // Depending on how you want to handle non-fragmented URIs
    },
    {
      description: "Empty type inputs",
      inputType: "",
      expected: "",
    },
  ].map((testCase) => ({
    ...testCase,
    output: getTypeInitials(testCase.inputType),
  }));
  expect(results).toMatchInlineSnapshot(`
    [
      {
        "description": "Type with a fragment and a valid name",
        "expected": "DM",
        "inputType": "http://example.com/ontology#Decision Maker",
        "output": "DM",
      },
      {
        "description": "Type with a fragment but no valid name",
        "expected": "",
        "inputType": "http://telicent.io/ontology#",
        "output": "",
      },
      {
        "description": "Type without a fragment and unknown prefix",
        "expected": "http://unknown.com/data",
        "inputType": "http://unknown.com/data",
        "output": "http://unknown.com/data",
      },
      {
        "description": "Empty type inputs",
        "expected": "",
        "inputType": "",
        "output": "",
      },
    ]
  `);
});
