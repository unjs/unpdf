import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  dts: true,
  clean: false,
  // `getDocumentProxy` probes `import.meta.resolve` inside a `try/catch`; in
  // the CJS output it collapses to a throwing expression on purpose – Node CJS
  // consumers fall back to the serverless bundle without the font defaults.
  suppressWarnings: [/EMPTY_IMPORT_META/],
  deps: {
    neverBundle: [
      'unpdf/pdfjs',
      '@napi-rs/canvas',
      // Keep type imports as `pdfjs-dist/types/...` in the declarations –
      // post-build rewrites them to `./types/...` instead of inlining them.
      /^pdfjs-dist/,
    ],
  },
})
