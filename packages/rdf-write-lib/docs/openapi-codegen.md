# Generating the API client types from OpenAPI

This package talks to the Paperback Writer HTTP API. The request/response
types are not hand-written — they are generated from the API's OpenAPI spec by
`scripts/dev_run_openapi_typescript`.

## The script

```bash
OPEN_API="./data/open-api/paperback-writer.json"
SRC="./src/open-api"

pnpm exec openapi-typescript "$OPEN_API" -o "$SRC/paperback-writer.d.ts"
pnpm exec tsc --noEmit
pnpm build
```

Four steps:

1. **Input spec** — `data/open-api/paperback-writer.json` is the API's
   OpenAPI 3.1 document, saved into the repo by hand.
2. **Generate** — `openapi-typescript` reads the spec and writes one
   declaration file, `src/open-api/paperback-writer.d.ts`, exporting `paths`,
   `operations`, and `components` interfaces that mirror the spec.
3. **Typecheck** — `tsc --noEmit` confirms the hand-written code that consumes
   the generated types still compiles against the new spec.
4. **Build** — `vite build` rebuilds `dist/`.

Run it from the package root:

```bash
./scripts/dev_run_openapi_typescript
```

## How the generated types are used

The generated `paths` type is the single seam between the spec and the code:

- `rdfWriteApiClientFactory.ts` passes `paths` to `openapi-fetch`'s
  `createClient<paths>()`. The result is a client where every call is checked
  against the spec — `client.POST("/dcterms/title", { body: {...} })` fails to
  compile if the path, or the body shape, does not match.
- `types.ts` derives `Endpoints` and `DispatchResult` from that client type.
- `createByPredicateFnFactory.ts` maps each RDF predicate (e.g.
  `dct:title`) to a typed endpoint call. It also runs a compile-time
  exhaustiveness check (`AssertNever<Missing>`): if the spec gains an endpoint
  that no predicate maps to, the build fails until the map is updated.

So a spec change flows straight into type errors at the exact call sites that
need updating — the regen step is how you pick up API changes.

## Limits of the current approach

Everything is hard-coded to one API:

- The spec path, output path, and output filename are fixed strings in the
  script — one spec only.
- The spec is a static file committed to the repo; there is no step that
  fetches it from a running server or a published URL, so it can drift from the
  live API.
- `pnpm build` is baked into the script, so it cannot be used purely to
  regenerate types without also rebuilding the package.

## Toward a first-class tool

A reusable version would take these as inputs rather than constants:

- **Source** — a file path *or* a URL to fetch the spec from (with the fetched
  spec optionally written back to `data/` so the input stays reviewable in
  diffs).
- **Output path** — so more than one API can be generated into the same
  package.
- **Post-steps** — typecheck and build as opt-in flags, not fixed steps, so the
  tool can run as a fast type-only regen in watch/dev and as a full build in CI.

The core (`openapi-typescript` → `.d.ts` → `openapi-fetch` client) stays the
same; the tool would just parameterise the four hard-coded decisions above.
