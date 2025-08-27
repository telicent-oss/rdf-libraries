export const escapeLiteral = (s: string) =>
  s.replace(/["\\\n\r]/g, (m) =>
    m === '"' ? '\\"' : m === "\\" ? "\\\\" : m === "\n" ? "\\n" : "\\r"
  );
