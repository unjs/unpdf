// This rollup config builds a PDF.js bundle for serverless environments

import inject from '@rollup/plugin-inject'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'
import * as unenv from 'unenv'
import { pdfjsTypes } from './src/pdfjs-serverless/rollup/plugins'

const env = unenv.env(unenv.nodeless)

export default defineConfig({
  input: 'src/pdfjs-serverless/index.mjs',
  output: {
    file: 'dist/pdfjs.mjs',
    format: 'esm',
    exports: 'auto',
    inlineDynamicImports: true,
    generatedCode: {
      constBindings: true,
    },
    sourcemap: false,
  },
  external: env.external,
  plugins: [
    replace({
      delimiters: ['', ''],
      preventAssignment: true,
      values: {
        // Disable the `window` check (for requestAnimationFrame).
        'typeof window': '"undefined"',
        // Imitate the Node.js environment for all serverless environments, unenv will
        // take care of the remaining Node.js polyfills. Keep support for browsers.
        'const isNodeJS = typeof': 'const isNodeJS = typeof document === "undefined" // typeof',
        // Force inlining the PDF.js worker.
        'await import(/*webpackIgnore: true*/this.workerSrc)': '__pdfjsWorker__',
        // Tree-shake client worker initialization logic.
        'PDFWorker.#isWorkerDisabled || PDFWorker.#mainThreadWorkerMessageHandler': 'true',
      },
    }),
    inject(env.inject),
    pdfjsTypes(),
    terser({
      mangle: {
        keep_fnames: true,
        keep_classnames: true,
      },
      format: {
        comments: false,
      },
    }),
  ],
})
