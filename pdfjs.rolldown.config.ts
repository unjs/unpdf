import type { RolldownOptions } from 'rolldown'
import { defineConfig } from 'rolldown'
import { assertRuntimePatchesFirst, patchPDFJSSource, pdfjsTypes } from './src/pdfjs-serverless/rolldown/plugins'

const config: RolldownOptions = defineConfig({
  input: 'src/pdfjs-serverless/index.mjs',
  // The root `"sideEffects": false` applies to the sources read here too, which
  // would drop the mock and polyfill modules whose only job is to mutate
  // globals. Only an explicit rule outranks the manifest – a blanket
  // `moduleSideEffects: true` does not.
  treeshake: {
    moduleSideEffects: [
      { test: /[\\/]src[\\/]pdfjs-serverless[\\/]/, sideEffects: true },
    ],
  },
  output: {
    file: 'dist/pdfjs.mjs',
    format: 'esm',
    exports: 'auto',
    // The worker is pulled in via a static import and has to end up in the same
    // file as PDF.js itself, so everything must land in a single chunk.
    codeSplitting: false,
    sourcemap: false,
    // PDF.js reads function and class names at runtime.
    minify: {
      compress: {
        target: 'es2022',
        keepNames: { function: true, class: true },
      },
      mangle: {
        keepNames: { function: true, class: true },
      },
      codegen: {
        legalComments: 'none',
      },
    },
  },
  plugins: [
    patchPDFJSSource(),
    assertRuntimePatchesFirst(),
    pdfjsTypes(),
  ],
})

export default config
