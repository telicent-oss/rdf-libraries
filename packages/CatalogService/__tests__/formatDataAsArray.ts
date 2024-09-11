export function formatDataAsArray(
  data: { s: { value: string }; p: { value: string }; o: { value: string } }[]
): string[] {
  // Check if data is empty
  if (data.length === 0) {
    return ["Data is empty"]; // Return a meaningful message or handle as preferred
  }

  const transformToShorthand = (el: { value: string }) => {
    return {
      ...el,
    };
  };
  const newData = data.map((el) => ({
    s: transformToShorthand(el.s),
    p: transformToShorthand(el.p),
    o: transformToShorthand(el.o),
  }));

  // Calculate the maximum width of each column
  const maxWidth = {
    s: Math.max(...newData.map((item) => item.s.value.length)),
    p: Math.max(...newData.map((item) => item.p.value.length)),
    o: Math.max(...newData.map((item) => item.o.value.length)),
  };

  // Ensure minimum width of 1 for columns to avoid negative repeat count
  const adjustedWidths = {
    s: Math.max(1, maxWidth.s),
    p: Math.max(1, maxWidth.p),
    o: Math.max(1, maxWidth.o),
  };

  // Construct header with column names and spaces based on maximum widths
  const header = `s${" ".repeat(adjustedWidths.s - 1)} | p${" ".repeat(
    adjustedWidths.p - 1
  )} | o`;

  // Map over the data to format each row according to maximum widths
  const rows = newData.map(({ s, p, o }) =>
    `${s.value.padEnd(adjustedWidths.s)} | ${p.value.padEnd(
      adjustedWidths.p
    )} | ${o.value.padEnd(adjustedWidths.o)}`.trim()
  );

  // Return the header and all rows as an array of strings
  return [header, ...rows];
}
