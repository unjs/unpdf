import type { RolldownOptions } from 'rolldown'
import { defineConfig } from 'rolldown'
import { assertRuntimePatchesFirst, decodersModuleSpecifier, patchPDFJSSource, pdfjsTypes } from './src/pdfjs-serverless/rolldown/plugins'

const config: RolldownOptions = defineConfig({
  input: {
    'pdfjs': 'src/pdfjs-serverless/index.mjs',
    'pdfjs-decoders': 'src/pdfjs-serverless/decoders/default.mjs',
    'pdfjs-decoders-workerd': 'src/pdfjs-serverless/decoders/workerd.mjs',
  },
  external: [decodersModuleSpecifier],
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
    entryFileNames: '[name].mjs',
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
