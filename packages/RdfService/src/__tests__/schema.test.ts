import { URISegmentOrHashSchema } from "../schema";

test("Fail when input is not a uri", () => {
  expect(() => URISegmentOrHashSchema.parse("abd"))
    .toThrowErrorMatchingInlineSnapshot(`
    "[
      {
        "validation": "regex",
        "code": "invalid_string",
        "message": "\\n  Invalid URI format. \\n  Ensure it starts with a valid scheme and is followed by '://',\\n  then a valid resource part without spaces.",
        "path": []
      },
      {
        "code": "custom",
        "message": "URI must include either a hash or at least one URI segment.",
        "path": []
      }
    ]"
  `);
});
test("Fail when input is uri without hash or url segment", () => {
  expect(() => URISegmentOrHashSchema.parse("http://example.com"))
    .toThrowErrorMatchingInlineSnapshot(`
    "[
      {
        "code": "custom",
        "message": "URI must include either a hash or at least one URI segment.",
        "path": []
      }
    ]"
  `);
});
test("Pass when input is uri with hash", () => {
  expect(() =>
    URISegmentOrHashSchema.parse("http://example.com#blah")
  ).not.toThrow();
});
test("Pass when input is uri with url segment", () => {
  expect(() =>
    URISegmentOrHashSchema.parse("http://example.com/blah")
  ).not.toThrow();
});
