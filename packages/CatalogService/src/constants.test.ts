// regex.datetime.extended.table.test.ts
import { REGEX } from "./constants";
import { asTable } from "./testUtils/asTable";

type Case = { label: string; value: string };

describe("REGEX", () => {
  describe("YYYY-MM-DDTHH:mm:ss[.fraction][Z|±HH:MM]", () => {
    const regex = REGEX["YYYY-MM-DDTHH:mm:ss[.fraction][Z|±HH:MM]"];
    let execute: (cases: Case[]) => string;

    beforeEach(() => {
      execute = (cases: Case[]) =>
        asTable({
          header: ["Label", "Input", "Match"],
          rows: cases.map(({ label, value }) => [
            label,
            value,
            regex.test(value),
          ]),
          fillSeparator: true,
          linePadding: 2,
        });
    });

    afterEach(() => {});

    it("match matrix", () => {
      const cases: Case[] = [
        { label: "empty", value: "" },
        { label: "date-only", value: "2024-03-10" },
        { label: "space separator", value: "2024-03-10 12:34:56Z" },
        { label: "basic form", value: "20240310T123456Z" },
        { label: "missing seconds", value: "2024-03-10T12:34Z" },
        { label: "valid Z", value: "2024-03-10T12:34:56Z" },
        { label: "valid Z + .1", value: "2024-03-10T12:34:56.1Z" },
        { label: "valid Z + .123", value: "2024-03-10T12:34:56.123Z" },
        { label: "valid Z + .123456", value: "2024-03-10T12:34:56.123456Z" },
        { label: "valid +02:00", value: "2024-03-10T12:34:56+02:00" },
        { label: "valid -05:30", value: "2024-03-10T12:34:56-05:30" },
        { label: "valid no tz", value: "2024-03-10T12:34:56" },
        {
          label: "valid but out-of-range month",
          value: "2024-13-10T12:34:56Z",
        },
        { label: "garbage", value: "not-a-date" },
      ];

      expect(execute(cases)).toMatchInlineSnapshot(`
        "Label                          Input                         Match
        ────────────────────────────────────────────────────────────────────────
        empty                                                             
        date-only                      2024-03-10                         
        space separator                2024-03-10 12:34:56Z               
        basic form                     20240310T123456Z                   
        missing seconds                2024-03-10T12:34Z                  
        valid Z                        2024-03-10T12:34:56Z          ✅    
        valid Z + .1                   2024-03-10T12:34:56.1Z        ✅    
        valid Z + .123                 2024-03-10T12:34:56.123Z      ✅    
        valid Z + .123456              2024-03-10T12:34:56.123456Z   ✅    
        valid +02:00                   2024-03-10T12:34:56+02:00     ✅    
        valid -05:30                   2024-03-10T12:34:56-05:30     ✅    
        valid no tz                    2024-03-10T12:34:56           ✅    
        valid but out-of-range month   2024-13-10T12:34:56Z          ✅    
        garbage                        not-a-date                         "
      `);
    });
  });
});
