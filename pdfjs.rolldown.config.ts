import { defineConfig } from 'rolldown'
import { patchPDFJSSource, pdfjsTypes } from './src/pdfjs-serverless/rolldown/plugins'

export default defineConfig({
  input: 'src/pdfjs-serverless/index.mjs',
  // The root `"sideEffects": false` would tree-shake the polyfill/mock modules
  // away – their only job is to mutate globals.
  treeshake: {
    moduleSideEffects: [
      { test: /pdfjs-serverless[\\/](mocks|polyfills)\.mjs$/, sideEffects: true },
    ],
  },
  output: {
    file: 'dist/pdfjs.mjs',
    format: 'esm',
    exports: 'auto',
    // The worker is pulled in via a static import and inlined through the
    // `__pdfjsWorker__` anchor, so everything must land in a single chunk.
    codeSplitting: false,
    sourcemap: false,
    // PDF.js relies on `Function.prototype.name`/class names at runtime – the
    // minifier must preserve them.
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
    pdfjsTypes(),
  ],
})
