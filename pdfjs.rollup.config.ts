// This rollup config builds a PDF.js bundle for serverless environments

import alias from '@rollup/plugin-alias'
import inject from '@rollup/plugin-inject'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'
import * as unenv from 'unenv'
import { pdfjsTypes } from './src/pdfjs-serverless/rollup/plugins'

const env = unenv.env(unenv.nodeless)

const canvasMock = `
new Proxy(
  {},
  {
    get(target, prop) {
      return () => {
        throw new Error("@napi-rs/canvas is not available in this environment")
      }
    },
  },
)
`
  .replaceAll('\n', '')
  .trim()

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
        // Prevent unenv from injecting the `Buffer` polyfill.
        'typeof Buffer !== "undefined" && val instanceof Buffer': 'false',
        // Imitate the Node.js environment for all serverless environments, unenv will
        // take care of the remaining Node.js polyfills. Keep support for browsers.
        'const isNodeJS = typeof': 'const isNodeJS = typeof document === "undefined" // typeof',
        // Force inlining the PDF.js worker.
        'await import(/*webpackIgnore: true*/this.workerSrc)': '__pdfjsWorker__',
        // Force setting up fake PDF.js worker.
        '#isWorkerDisabled = false': '#isWorkerDisabled = true',
        // Mock the `@napi-rs/canvas` module import from the unused `NodeCanvasFactory` class.
        'require("@napi-rs/canvas")': canvasMock,
      },
    }),
    alias({ entries: env.alias }),
    nodeResolve(),
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
