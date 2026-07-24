import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  // Emit `.mjs`/`.cjs` and `.d.mts`/`.d.cts` regardless of the package type.
  fixedExtension: true,
  dts: true,
  // `build:pdfjs` runs first and writes `dist/pdfjs.*` and `dist/types/` – the
  // library build must not wipe them, so cleaning is disabled here.
  clean: false,
  // `getDocumentProxy` probes `import.meta.resolve` for the local `pdfjs-dist`
  // font assets, guarded by a `try/catch`. In the CJS output it collapses to a
  // throwing expression, which is intentional – Node CJS consumers fall back to
  // the serverless bundle without the font defaults, so the warning is expected.
  suppressWarnings: [/EMPTY_IMPORT_META/],
  deps: {
    neverBundle: [
      // The serverless PDF.js bundle is self-imported at runtime via `unpdf/pdfjs`.
      'unpdf/pdfjs',
      // The optional canvas peer dependency stays external.
      '@napi-rs/canvas',
      // Keep `pdfjs-dist` type imports external so the declarations reference
      // `pdfjs-dist/types/...` (rewritten to `./types/...` in post-build) instead
      // of inlining the 1.6 MB bundle.
      /^pdfjs-dist/,
    ],
  },
})
