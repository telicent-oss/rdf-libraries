/** @jest-environment node */
import { resetCookies, resetSessionStorage, setCookies } from "./test-utils";

describe("happy path - test utils in node", () => {
  it("handles missing document and sessionStorage safely", () => {
    resetSessionStorage();
    resetCookies();
    setCookies("XSRF-TOKEN=abc123");

    expect({ ok: true }).toMatchInlineSnapshot(`
      {
        "ok": true,
      }
    `);
  });
});
