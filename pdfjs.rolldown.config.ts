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
  moduleTypes: {
    '.wasm': 'binary',
  },
  output: {
    dir: 'dist',
    entryFileNames: 'pdfjs.mjs',
    chunkFileNames: 'pdfjs-[name].mjs',
    format: 'esm',
    exports: 'auto',
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
