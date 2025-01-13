import React from "react";
import { render } from "@testing-library/react";
import { OntologyIcon } from "./OntologyIcon";
import * as ontologyFindIconHelper from "@telicent-oss/ontology-icon-lib";
import { URISegmentOrHashType } from "@telicent-oss/rdfservice";
import { TeliTypeIconProps } from "@telicent-oss/ds";

jest.mock("@telicent-oss/ds", () => ({
  TeliTypeIcon: (props: TeliTypeIconProps) => (
    <pre>{`MockTeliTypeIcon: ${JSON.stringify(props, null, 2)}`}</pre>
  ),
}));

jest.mock("@telicent-oss/ontology-icon-lib", () => ({
  findByClassUri: jest.fn().mockReturnValue("some-icon"),
  moduleStylesPromise: Promise.resolve(),
}));

jest.mock("@telicent-oss/react-lib", () => ({
  use: jest.fn(),
}));

describe("OntologyIcon", () => {
  const type: URISegmentOrHashType = "http://example.com#SomeType";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with props", async () => {
    expect(ontologyFindIconHelper.findByClassUri).not.toHaveBeenCalled();
    const result = render(<OntologyIcon type={type} aria-label="test icon" />);
    expect(ontologyFindIconHelper.findByClassUri).toHaveBeenCalledWith(type);
    expect(result.asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <pre>
          MockTeliTypeIcon: {
        "icon": "some-icon",
        "aria-label": "test icon"
      }
        </pre>
      </DocumentFragment>
    `);
  });
});
