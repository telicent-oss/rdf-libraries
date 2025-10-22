type TableCell = string | boolean;

interface AsTableOptions {
  header: string[];
  rows: TableCell[][];
  separator?: string;
  linePadding?: number;
  fillSeparator?: boolean;
  lineChar?: string;
}

const DEFAULT_SEPARATOR = "   ";
const DEFAULT_LINE_CHAR = "─";

const normaliseCell = (cell: TableCell): string =>
  typeof cell === "boolean" ? (cell ? "✅" : "") : cell;

export const asTable = ({
  header,
  rows,
  separator = DEFAULT_SEPARATOR,
  linePadding = 0,
  fillSeparator = false,
  lineChar = DEFAULT_LINE_CHAR,
}: AsTableOptions): string => {
  if (header.length === 0) {
    return "";
  }

  const normalisedRows = rows.map((row) => row.map(normaliseCell));
  const allRows = [header, ...normalisedRows];

  const widths = header.map((_, column) =>
    Math.max(...allRows.map((row) => (row[column] ?? "").length))
  );

  const formatRow = (row: string[]): string =>
    row.map((cell, index) => (cell ?? "").padEnd(widths[index])).join(separator);

  const separatorGap =
    fillSeparator && separator.length > 0
      ? lineChar.repeat(separator.length)
      : separator;

  const buildDivider = () =>
    widths
      .map((width) => lineChar.repeat(width + linePadding))
      .join(separatorGap);

  return [formatRow(header), buildDivider(), ...normalisedRows.map(formatRow)].join(
    "\n"
  );
};
