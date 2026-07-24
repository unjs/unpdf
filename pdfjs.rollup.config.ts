import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'rollup'
import esbuild, { minify } from 'rollup-plugin-esbuild'
import { pdfjsTypes } from './src/pdfjs-serverless/rollup/plugins'

// PDF.js' built-in `NodeCanvasFactory` becomes the document-level canvas
// factory when no `CanvasFactory` option is passed to `getDocument` and is
// asked for intermediate canvases (soft masks, transparency groups, tiling
// patterns). Bridge its `@napi-rs/canvas` require to the module shared by
// `resolveCanvasModule` through a well-known global symbol; without a
// resolved module, keep the descriptive error.
const canvasMock = `
new Proxy({}, {
  get(target, prop) {
    const canvasModule = globalThis[Symbol.for("unpdf.canvasModule")];
    if (canvasModule)
      return canvasModule[prop];
    return () => {
      throw new Error("@napi-rs/canvas is not available in this environment")
    }
  },
})
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
  plugins: [
    replace({
      delimiters: ['', ''],
      preventAssignment: true,
      values: {
        // Force inlining the PDF.js worker.
        'await import(\n      /*webpackIgnore: true*/\n      /*@vite-ignore*/\n      this.workerSrc)': '__pdfjsWorker__',
        // Force setting up fake PDF.js worker.
        '#isWorkerDisabled = false': '#isWorkerDisabled = true',
        // Remove WASM code from the worker.
        'wasmExports = await createWasm': 'wasmExports = {}',
        'if (!this.#modulePromise)': 'if (false)',
        '#instantiateWasm(fallbackCallback, imports, successCallback) {': '#instantiateWasm(fallbackCallback, imports, successCallback) { return;',
        '#getJsModule(fallbackCallback) {': '#getJsModule(fallbackCallback) { return;',
        // Bridge the `@napi-rs/canvas` module import from the `NodeCanvasFactory` class.
        'require("@napi-rs/canvas")': canvasMock,
        // Remove the legacy build warning.
        'warn("Please use the `legacy` build in Node.js environments.")': '',
      },
    }),
    esbuild({ include: /\/src\/.*\.ts$/ }),
    nodeResolve(),
    pdfjsTypes(),
    minify({
      keepNames: true,
      legalComments: 'none',
      target: 'es2022',
    }),
  ],
})
