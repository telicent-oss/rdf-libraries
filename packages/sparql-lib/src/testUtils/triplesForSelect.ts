// testUtils/triplesForSelect.ts

type BindingValue =
  | { type: 'uri'; value: string }
  | { type: 'literal'; value: string; 'xml:lang'?: string; datatype?: string }
  | { type: 'bnode'; value: string };

type SparqlJSONResult = {
  head: { vars: string[] };
  results: { bindings: Record<string, BindingValue>[] };
};

type Options = {
  includeIncoming?: boolean; // also include ?s ?pin ?r
  chunkSize?: number;        // VALUES batch size
};

function normalizeQueryEndpoint(endpoint: string): string {
  const base = endpoint.replace(/\/+$/, '');
  if (base.endsWith('/query') || base.endsWith('/sparql')) return base;
  if (base.endsWith('/update')) {
    throw new Error(`Looks like an UPDATE endpoint, not a query endpoint: ${endpoint}`);
  }
  return `${base}/query`;
}

function extractIris(res: SparqlJSONResult): string[] {
  const out = new Set<string>();
  for (const row of res.results.bindings) {
    for (const v of Object.values(row)) {
      if (v.type === 'uri' && v.value) out.add(v.value);
    }
  }
  return [...out];
}

function buildConstruct(iris: string[], includeIncoming: boolean): string {
  const values = iris.map(u => `<${u}>`).join(' ');
  return `
CONSTRUCT {
  ?r ?p ?o .
  ${includeIncoming ? `?s ?pin ?r .` : ``}
}
WHERE {
  VALUES ?r { ${values} }
  ?r ?p ?o .
  ${includeIncoming ? `OPTIONAL { ?s ?pin ?r }` : ``}
}`.trim();
}

// Overloads: you can pass a query string OR a parsed SELECT result.
export async function triplesForSelect(
  endpoint: string,
  input: string,
  options?: Options
): Promise<string>;
export async function triplesForSelect(
  endpoint: string,
  input: SparqlJSONResult,
  options?: Options
): Promise<string>;

export async function triplesForSelect(
  endpoint: string,
  input: string | SparqlJSONResult,
  { includeIncoming = true, chunkSize = 200 }: Options = {}
): Promise<string> {
  const queryUrl = normalizeQueryEndpoint(endpoint);

  // If a SELECT result was provided, use it directly (no SELECT round-trip).
  let json: SparqlJSONResult;
  if (typeof input !== 'string') {
    json = input;
  } else {
    // Fallback: run the SELECT if a query was provided (not your case).
    const selResp = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json',
      },
      body: input,
    });
    if (!selResp.ok) {
      throw new Error(`SELECT failed ${selResp.status}: ${await selResp.text()}`);
    }
    json = (await selResp.json()) as SparqlJSONResult;
  }

  const iris = extractIris(json);
  if (iris.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < iris.length; i += chunkSize) {
    const chunk = iris.slice(i, i + chunkSize);
    const constructQuery = buildConstruct(chunk, includeIncoming);

    const conResp = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/n-triples',
      },
      body: constructQuery,
    });
    if (!conResp.ok) {
      throw new Error(`CONSTRUCT failed ${conResp.status}: ${await conResp.text()}`);
    }
    parts.push(await conResp.text());
  }

  return parts.join('\n');
}