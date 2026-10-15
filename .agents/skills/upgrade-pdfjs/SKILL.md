---
name: upgrade-pdfjs
description: Upgrade the bundled PDF.js to a new `pdfjs-dist` version.
argument-hint: "a pdfjs-dist version (6.5.100) or a Dependabot PR number"
disable-model-invocation: true
---

# Upgrade PDF.js

CI catches **source drift** (`patchPDFJSSource` fails on a stale anchor) and APIs missing in its own Node on tested paths; steps 3–4 find the rest.

## Steps

1. **Start.** A Dependabot PR number → read the target version from its `pdfjs-dist` range and leave the PR as it is. Branch `feat/pdfjs-v<major>.<minor>` from the fetched `origin/main` with `--no-track`. The bundled version is the `pdfjs-dist` range in `git show origin/main:package.json`.
2. **Read every release in between.** `gh release view v<version> --repo mozilla/pdf.js` for each release after the bundled one, up to the target. Collect the `[api-major]` and `[api-minor]` entries. Check each one against `src/*.ts`: a return value that `unpdf` hands back as PDF.js shapes it (`getMeta` passes `info` through) changes for users too, even when no `unpdf` code breaks.
3. **Diff the runtime APIs.** `npm pack pdfjs-dist@<old> pdfjs-dist@<new> --pack-destination <dir>` into an empty dir under `$TMPDIR`, each tarball extracted into its own subdir, nothing run inside. In `build/pdf.mjs` and `build/pdf.worker.mjs`, compare occurrence counts of the exact token (`getOrInsert(`, since a bare `getOrInsert` also matches `getOrInsertComputed`) for every API `polyfills.mjs` guards or the README note names, and for each ES2023+ built-in or newer web API, such as `URL.parse`, `DecompressionStream`, iterator helpers (`.values().map(`, `.toArray()`), `Array.fromAsync`, `RegExp.escape`, `Error.isError`, `Float16Array`, Set methods, and `using` declarations. Also grep for code that runs at module load (a top-level `if (typeof X.prototype.y` shim): a missing global there fails the import itself.
4. **Check support** for each API from step 3 that is new or whose count grew, in `@mdn/browser-compat-data` (`curl -sL https://unpkg.com/@mdn/browser-compat-data/data.json`): Node.js at the `engines` floor, Safari, Bun, Deno, and Chrome as the proxy for Workers. A gap in a supported runtime → polyfill it in `src/pdfjs-serverless/polyfills.mjs`. An API too large to polyfill (a whole global with its helpers) → name the requirement in the README note.
5. **Bump.** Raise the `@napi-rs/canvas` devDependency to the `optionalDependencies` range of the new `pdfjs-dist`, `pnpm install`, and commit it alone (`` chore: upgrade `@napi-rs/canvas` ``) once `build:pdfjs`, `build`, and the tests pass. Then bump the `pdfjs-dist` tilde range and `pnpm install`. The peer range stays.
6. **Build from a clean `dist`.** `rm -rf dist` first – `build:pdfjs` merges the types in with `cp -R`, so files removed upstream stay behind. A drifted anchor → find the new source in the extracted tarball and update the anchor in `plugins.ts`. Then run every check from `.github/workflows/ci.yml`, on the Node version CI uses and on the newest Node. Update the version inline snapshot in `test/pdfjs.test.ts`.
7. **Reproduce each polyfill's gap.** A scratch script in `$TMPDIR` deletes the native API (`delete Map.prototype.getOrInsert`), then imports `dist/index.mjs` and reaches the call site: red on a build without the polyfill, green with it. When no fixture reaches the call site, hand-build a minimal PDF in the scratch dir.
8. **Update the README note.** The `[!NOTE]` under "How It Works" names the new version; drop any requirement the new build no longer has.
9. **Commit** each polyfill (``fix: polyfill `<API>` for PDF.js``), then `feat: upgrade to PDF.js v<major>.<minor>`. List every user-visible shape change from step 2 for the PR description and the release notes.

Done when the bundle builds against the new version, every check is green on both Node versions, every gap from step 4 is polyfilled with a red-to-green run or named in the README note, the note names the new version, and the shape-change list is written.
