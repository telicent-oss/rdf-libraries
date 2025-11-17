// normaliseDateTimeLiteral.table.test.ts
import { normaliseDateTimeLiteral } from "../RDFSResource.DCATResource";
import { asTable } from "../../testUtils/asTable";

type Case = { label: string; value: string | null | undefined };

const show = (v: unknown): string =>
  v === undefined
    ? "undefined"
    : v === null
    ? "null"
    : v === ""
    ? `""`
    : String(v);

describe("normaliseDateTimeLiteral", () => {
  let run: (v: unknown) => string | undefined;
  let execute: (cases: Case[]) => string;

  beforeEach(() => {
    run = (v: unknown) =>
      normaliseDateTimeLiteral(v as string | null | undefined);
    execute = (cases: Case[]) =>
      asTable({
        header: ["Label", "Input", "Output", "Changed"],
        rows: cases.map(({ label, value }) => {
          const output = run(value);
          const changed = show(value) !== show(output);
          return [label, show(value), show(output), changed];
        }),
      });
  });

  afterEach(() => {});

  it("pass-through values", () => {
    const cases: Case[] = [
      { label: "undefined ▶▶▶ undefined", value: undefined },
      { label: "null ▶▶▶ undefined", value: null },
      { label: "empty string ▶▶▶ empty string", value: "" },
    ];
    expect(execute(cases)).toMatchInlineSnapshot(`
      "Label                           Input       Output      Changed
      ─────────────────────────────   ─────────   ─────────   ───────
      undefined ▶▶▶ undefined         undefined   undefined          
      null ▶▶▶ undefined              null        undefined   ✅      
      empty string ▶▶▶ empty string   ""          ""                 "
    `);
  });

  it("non-matching pattern", () => {
    const cases: Case[] = [
      { label: "date-only", value: "2024-03-10" },
      { label: "not a date", value: "not-a-date" },
      { label: "space separator", value: "2024-03-10 12:34:56Z" },
      { label: "basic form", value: "20240310T123456Z" },
      { label: "missing seconds", value: "2024-03-10T12:34Z" },
    ];
    expect(execute(cases)).toMatchInlineSnapshot(`
      "Label             Input                  Output                 Changed
      ───────────────   ────────────────────   ────────────────────   ───────
      date-only         2024-03-10             2024-03-10                    
      not a date        not-a-date             not-a-date                    
      space separator   2024-03-10 12:34:56Z   2024-03-10 12:34:56Z          
      basic form        20240310T123456Z       20240310T123456Z              
      missing seconds   2024-03-10T12:34Z      2024-03-10T12:34Z             "
    `);
  });

  it("missing timezone defaults to Z; fractional seconds trimmed to ms", () => {
    const cases: Case[] = [
      { label: "no tz, no fraction", value: "2024-03-10T12:34:56" },
      { label: "no tz, 1-digit fraction", value: "2024-03-10T12:34:56.1" },
      { label: "no tz, 2-digit fraction", value: "2024-03-10T12:34:56.12" },
      { label: "no tz, 3-digit fraction", value: "2024-03-10T12:34:56.123" },
      { label: "no tz, >3 fraction", value: "2024-03-10T12:34:56.123456" },
    ];
    expect(execute(cases)).toMatchInlineSnapshot(`
      "Label                     Input                        Output                     Changed
      ───────────────────────   ──────────────────────────   ────────────────────────   ───────
      no tz, no fraction        2024-03-10T12:34:56          2024-03-10T12:34:56.000Z   ✅      
      no tz, 1-digit fraction   2024-03-10T12:34:56.1        2024-03-10T12:34:56.100Z   ✅      
      no tz, 2-digit fraction   2024-03-10T12:34:56.12       2024-03-10T12:34:56.120Z   ✅      
      no tz, 3-digit fraction   2024-03-10T12:34:56.123      2024-03-10T12:34:56.123Z   ✅      
      no tz, >3 fraction        2024-03-10T12:34:56.123456   2024-03-10T12:34:56.123Z   ✅      "
    `);
  });

  it("zoned inputs normalised to UTC ISO", () => {
    const cases: Case[] = [
      { label: "Z", value: "2024-03-10T12:34:56Z" },
      { label: "Z with fraction", value: "2024-03-10T12:34:56.1Z" },
      { label: "+02:00", value: "2024-03-10T12:34:56+02:00" },
      {
        label: "+02:00 with >ms fraction",
        value: "2024-03-10T12:34:56.9999+02:00",
      },
      { label: "-05:30", value: "2024-03-10T12:34:56-05:30" },
    ];
    expect(execute(cases)).toMatchInlineSnapshot(`
      "Label                      Input                            Output                     Changed
      ────────────────────────   ──────────────────────────────   ────────────────────────   ───────
      Z                          2024-03-10T12:34:56Z             2024-03-10T12:34:56.000Z   ✅      
      Z with fraction            2024-03-10T12:34:56.1Z           2024-03-10T12:34:56.100Z   ✅      
      +02:00                     2024-03-10T12:34:56+02:00        2024-03-10T10:34:56.000Z   ✅      
      +02:00 with >ms fraction   2024-03-10T12:34:56.9999+02:00   2024-03-10T10:34:56.999Z   ✅      
      -05:30                     2024-03-10T12:34:56-05:30        2024-03-10T18:04:56.000Z   ✅      "
    `);
  });

  it("invalid calendar dates round-trip unchanged", () => {
    const cases: Case[] = [
      { label: "non-leap Feb 29", value: "2021-02-29T00:00:00Z" },
      { label: "month 13", value: "2024-13-10T12:34:56Z" },
      { label: "April 31", value: "2024-04-31T23:59:59Z" },
    ];
    expect(execute(cases)).toMatchInlineSnapshot(`
      "Label             Input                  Output                     Changed
      ───────────────   ────────────────────   ────────────────────────   ───────
      non-leap Feb 29   2021-02-29T00:00:00Z   2021-03-01T00:00:00.000Z   ✅      
      month 13          2024-13-10T12:34:56Z   2024-13-10T12:34:56Z              
      April 31          2024-04-31T23:59:59Z   2024-05-01T23:59:59.000Z   ✅      "
    `);
  });
});
