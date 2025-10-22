import z from "zod";
import { throwWriteErrorForUri } from "./throwWriteErrorForUri";

test("throwWriteErrorForUri", () => {
  expect(
    [new Error("normal"), z.string().safeParse(1).error].map((error) => {
      try {
        throwWriteErrorForUri(error);
        expect(false).toBe(true); // should never get here
      } catch (thrownError) {
        return thrownError;
      }
    })
  ).toMatchInlineSnapshot(`
    [
      {
        "errors": {
          "uri": [
            {
              "code": "catalog.uri.invalid",
              "summary": "normal",
            },
          ],
        },
      },
      {
        "errors": {
          "uri": [
            {
              "code": "catalog.uri.invalid",
              "summary": "(root): Expected string, received number",
            },
          ],
        },
      },
    ]
  `);
});
