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
      fail('Expected to throw thenable, but did not');
    } catch (error) {
      expect(error).toBe(thenable);
    }
  });

  it("returns the value when status is fulfilled", () => {
    thenable.status = "fulfilled";
    thenable.value = 10;
    expect(use(thenable)).toMatchInlineSnapshot(`10`);
  });

  it("throws the reason when status is rejected", () => {
    thenable.status = "rejected";
    thenable.reason = new Error("Failed");
    expect(() => use(thenable)).toThrowErrorMatchingInlineSnapshot('"Failed"');
  });

});
