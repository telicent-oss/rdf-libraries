import { shorten } from "../../utils/shorten";

export function formatDataAsArray(
  data: { s: { value: string }; p: { value: string }; o: { value: string } }[],
  maxLength?: number
): string[] {
  // Check if data is empty
  if (data.length === 0) {
    return ["Data is empty"]; // Return a meaningful message or handle as preferred
  }

  const transformToShorthand = (el: { value: string }) => {
    return maxLength ? shorten(el.value, maxLength) : el.value;
  };
  const newData = data.map((el) => ({
    s: transformToShorthand(el.s),
    p: transformToShorthand(el.p),
    o: transformToShorthand(el.o),
  }));

  // Calculate the maximum width of each column
  const maxWidth = {
    s: Math.max(...newData.map((item) => item.s.length)),
    p: Math.max(...newData.map((item) => item.p.length)),
    o: Math.max(...newData.map((item) => item.o.length)),
  };

  // Ensure minimum width of 1 for columns to avoid negative repeat count
  const widths = {
    s: Math.max(1, maxWidth.s),
    p: Math.max(1, maxWidth.p),
    o: Math.max(1, maxWidth.o),
  };

  // Construct header with column names and spaces based on maximum widths
  const header = `s${" ".repeat(widths.s - 1)} | p${" ".repeat(
    widths.p - 1
  )} | o`;

  // Map over the data to format each row according to maximum widths
  const rows = newData.map(({ s, p, o }) =>
    `${s.padEnd(widths.s)} | ${p.padEnd(widths.p)} | ${o.padEnd(
      widths.o
    )}`.trim()
  );

  // Return the header and all rows as an array of strings
  return [header, ...rows];
}
