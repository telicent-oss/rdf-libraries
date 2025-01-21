import { use } from "./use";

describe("use function", () => {
  let thenable: Promise<number> & {
    status?: "pending" | "fulfilled" | "rejected";
    value?: number;
    reason?: unknown;
  };

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    thenable = new Promise<number>((resolve, _reject) => {
      resolve(10);
    }) as Promise<number> & {
      status?: "pending" | "fulfilled" | "rejected";
      value?: number;
      reason?: unknown;
    };
  });

  it("throws the thenable when status is pending", () => {
    thenable.status = "pending";
    try {
      use(thenable);
      fail("Expected to throw thenable, but did not");
    } catch (error) {
      expect(error).toBe(thenable);
    }
  });

  it("returns the value when status is fulfilled", () => {
    thenable.status = "fulfilled";
    thenable.value = 10;
    expect(use(thenable)).toMatchInlineSnapshot(`10`);
  });

  it("returns the value when status is rejected", async () => {
    thenable.status = "rejected";
    thenable.reason = "not valid!";
    expect(() => use(thenable)).toThrowErrorMatchingInlineSnapshot(`undefined`);
  });

  it("resolves when no status", async () => {
    const resolved = Promise.resolve({ type: "resolved..." });
    expect(() => use(resolved)).toThrowErrorMatchingInlineSnapshot(`undefined`);
    expect(resolved).toMatchInlineSnapshot(`
      Promise {
        "status": "pending",
      }
    `);
    await expect(resolved).resolves.toMatchInlineSnapshot(`
      {
        "type": "resolved...",
      }
    `);
    expect(resolved).toMatchInlineSnapshot(`
      Promise {
        "status": "fulfilled",
        "value": {
          "type": "resolved...",
        },
      }
    `);
  });
  it("rejects when no status", async () => {
    const rejected = Promise.reject({ type: "rejected!" });
    expect(() => use(rejected)).toThrowErrorMatchingInlineSnapshot(`undefined`);
    expect(rejected).toMatchInlineSnapshot(`
      Promise {
        "status": "pending",
      }
    `);

    await expect(async () => rejected).rejects.toMatchInlineSnapshot(`
      {
        "type": "rejected!",
      }
    `);
    expect(rejected).toMatchInlineSnapshot(`
      Promise {
        "reason": {
          "type": "rejected!",
        },
        "status": "rejected",
      }
    `);
  });
});
