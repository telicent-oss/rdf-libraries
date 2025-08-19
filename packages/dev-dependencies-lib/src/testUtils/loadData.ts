// test-utils/loadData.ts
import fs from "fs";
import path from "path";
import type { StartedDockerComposeEnvironment } from "testcontainers";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

type LoadDataArgs = {
  environment: StartedDockerComposeEnvironment;
  updateUri: string;
  dataLoc: string;
};

const buildInsert = (ntContent: string): string => {
  const triples = ntContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("<")); // mimic `grep '^<'` from bash
  if (triples.length === 0) {
    throw new Error("No triples found in input file");
  }
  return `
  INSERT DATA {
    ${triples.join("\n")}
  }
  `;
};

const normalizeUpdateUri = (u: string): string => {
  const url = new URL(u);
  // collapse multiple slashes in the PATH only
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  // drop trailing slash
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
};

export async function loadData({
  updateUri,
  dataLoc,
}: LoadDataArgs): Promise<void> {
  const filePath = path.resolve(dataLoc);

  const stat = fs.statSync(filePath);
  if ((stat && stat.isFile()) === false) {
    throw new Error(`Input file not found: ${filePath}`);
  }
  if (/^https?:\/\//.test(updateUri) === false) {
    throw new Error(`Invalid updateUri: ${updateUri}`);
  }
  const cleanedUpdateUri = normalizeUpdateUri(updateUri); // ← normalize here

  const body = buildInsert(fs.readFileSync(filePath, "utf8"));
  try {
    console.log(`cleanedUpdateUri: ${cleanedUpdateUri}`);
    const res = await fetch(cleanedUpdateUri, {
      method: "POST",
      headers: { "Content-Type": "application/sparql-update" },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        [
          "SPARQL UPDATE failed",
          `URL: ${cleanedUpdateUri.split("/").join(`${CYAN}/${RESET}`)}`,
          `HTTP ${res.status}`,
          `Response: ${text}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
  } catch (error) {
    console.error(updateUri);
    console.error(stat);
    throw error;
  }
}
