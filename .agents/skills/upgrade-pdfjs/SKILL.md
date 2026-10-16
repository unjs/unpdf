---
name: upgrade-pdfjs
description: Check a `pdfjs-dist` bump for breaking changes and runtime gaps in the serverless bundle.
disable-model-invocation: true
---

# Upgrade PDF.js

The previous version is the `pdfjs-dist` on the fetched `origin/main`.

1. **Read every release in between** on `mozilla/pdf.js`. Check each `[api-major]` and `[api-minor]` entry against `src/*.ts` – a value `unpdf` passes through (`getMeta` returns `info`) changes for users too. List each user-visible change for the PR.
2. **Diff the runtime APIs.** Compare `build/pdf.mjs` and `build/pdf.worker.mjs` of both versions for newly used ES2023+ and web APIs (such as `URL.parse`, iterator helpers, `Map.prototype.getOrInsert`), including code that runs at import. Count whole call tokens (`getOrInsert(` apart from `getOrInsertComputed(`).
3. **Check support** for each in MDN's browser-compat-data: Node.js at the `engines` floor, Safari, Bun, Deno, and Chrome as the stand-in for Cloudflare Workers. A gap → polyfill it in `src/pdfjs-serverless/polyfills.mjs`; too large to polyfill → name it in the README's "How It Works" note. Drop a note requirement the new build no longer has, and set the note's version.
4. **Reproduce each new polyfill's gap**: a scratch script deletes the native API, imports `dist/index.mjs`, and reaches the call site – red on a build without the polyfill, green with it.

Done when CI is green on the upgrade PR, every gap is polyfilled with a red-to-green run or named in the README note, the note names the new version, and the user-visible changes are listed.
