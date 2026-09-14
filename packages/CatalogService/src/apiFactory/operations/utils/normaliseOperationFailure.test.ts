import { normaliseOperationFailure } from "./normaliseOperationFailure";
import type { FieldError } from "./fieldError";

const fallback: FieldError = {
  code: "unknown",
  message: "fallback message",
} as unknown as FieldError;

describe("normaliseOperationFailure", () => {
  it("wraps an Error message into a form field error under the fallback", () => {
    const out = normaliseOperationFailure(new Error("boom"), fallback);
    expect(out.errors.form?.[0].details).toBe("boom");
    expect(out.values).toEqual({});
    expect(out.messages).toEqual({});
    expect(out.operations).toEqual({});
    expect(out.results).toEqual({});
  });

  it("wraps a plain string error", () => {
    const out = normaliseOperationFailure("just a string", fallback);
    expect(out.errors.form?.[0].details).toBe("just a string");
  });

  it("stringifies a plain-object error", () => {
    const out = normaliseOperationFailure({ code: 500 }, fallback);
    expect(out.errors.form?.[0].details).toBe('{"code":500}');
  });

  it("falls back to String() when JSON.stringify throws (e.g. circular structure)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const circular: any = {};
    circular.self = circular;
    const out = normaliseOperationFailure(circular, fallback);
    // String({}) is "[object Object]"
    expect(out.errors.form?.[0].details).toContain("[object Object]");
  });

  it("returns the ResourceOperationResults untouched when it already has errors", () => {
    const existing = {
      values: { title: "T" },
      errors: { title: [{ code: "bad", message: "no good" } as unknown as FieldError] },
      messages: { title: ["hi"] },
      operations: {},
      results: {},
    };
    const out = normaliseOperationFailure(existing, fallback);
    expect(out).toEqual(existing);
  });

  it("uses the fallback for an object with an empty errors map", () => {
    const emptyErrors = {
      values: {},
      errors: {},
      messages: {},
      operations: {},
      results: {},
    };
    const out = normaliseOperationFailure(emptyErrors, fallback);
    expect(out.errors.form?.[0].details).toBe(JSON.stringify(emptyErrors));
  });
});
