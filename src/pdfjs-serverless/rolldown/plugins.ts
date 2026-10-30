import type { OutputBundle, OutputChunk, Plugin } from 'rolldown'
import { writeFile } from 'node:fs/promises'

// PDF.js' built-in `NodeCanvasFactory` becomes the document-level canvas
// factory when no `CanvasFactory` option is passed to `getDocument` and is
// asked for intermediate canvases (soft masks, transparency groups, tiling
// patterns). Bridge its `@napi-rs/canvas` require to the module shared by
// `resolveCanvasModule` through a well-known global symbol; without a
// resolved module, keep the descriptive error.
const canvasMock = `
new Proxy({}, {
  get(target, prop) {
    const canvasModule = globalThis[Symbol.for("unpdf.canvasModule")]
    if (canvasModule)
      return canvasModule[prop]
    return () => {
      throw new Error("@napi-rs/canvas is not available in this environment")
    }
  },
})
`.trim()

// `registerImageDecoders` sets the loader under this symbol; until it runs, the
// fallback throws and PDF.js skips the image with a warning.
const loadImageDecoder = `(globalThis[Symbol.for("unpdf.loadImageDecoder")] ?? (fileName => { throw new Error(\`No image decoder registered for \${fileName}: call extractImages, renderPageAsImage, or inspectPages first\`) }))`

// Anchors match verbatim, so multi-line anchors carry the exact indentation of
// the PDF.js source.
const patches: Record<string, string> = {
  // Take the inlined worker from its global instead of importing it at runtime.
  'await import(\n      /*webpackIgnore: true*/\n      /*@vite-ignore*/\n      this.workerSrc)': 'globalThis.pdfjsWorker',
  // Force setting up fake PDF.js worker.
  '#isWorkerDisabled = false': '#isWorkerDisabled = true',
  'require("@napi-rs/canvas")': canvasMock,
  // Load the image decoders through the registered loader instead of `wasmUrl`.
  // PDF.js still falls back to the JS decoders when a WASM decoder fails to load
  // or compile, as in workerd.
  /* eslint-disable no-template-curly-in-string -- The anchors match template literals in the PDF.js source. */
  'if (WasmImage.#useWorkerFetch) {\n          this.#buffer = await fetchBinaryData(`${WasmImage.#wasmUrl}${this._filename}`);\n        } else {\n          this.#buffer = await WasmImage.#handler.sendWithPromise("FetchBinaryData", {\n            kind: "wasmUrl",\n            filename: this._filename\n          });\n        }': `this.#buffer = await ${loadImageDecoder}(this._filename);`,
  'await import(\n      /*webpackIgnore: true*/\n      /*@vite-ignore*/\n      `${WasmImage.#wasmUrl}${this._noWasmFilename}`)': `{ default: await ${loadImageDecoder}(this._noWasmFilename) }`,
  /* eslint-enable no-template-curly-in-string */
  // Forget a decoder that failed to load for lack of a registered loader, so
  // images decoded after registration don't wait for the next `cleanup` to get
  // it. A newer module promise or a loader that failed for real stays cached.
  'this.#modulePromise = Promise.race(promises);': `{ const modulePromise = Promise.race(promises).then(module => { if (!module && this.#modulePromise === modulePromise && !globalThis[Symbol.for("unpdf.loadImageDecoder")]) this.#modulePromise = null; return module; }); this.#modulePromise = modulePromise; }`,
  'warn("Please use the `legacy` build in Node.js environments.")': '',
}

/**
 * Applies the PDF.js source patches as raw literal substitutions and asserts
 * that every anchor matched at least once. A missed anchor means the upstream
 * PDF.js source drifted, so the build fails loudly instead of silently
 * shipping an unpatched bundle.
 */
export function patchPDFJSSource(): Plugin {
  const hitCounts = new Map<string, number>(
    Object.keys(patches).map(anchor => [anchor, 0]),
  )

  return {
    name: 'pdfjs-serverless:patch-source',
    transform(code) {
      let patched = code
      let hasChanged = false

      for (const [anchor, replacement] of Object.entries(patches)) {
        const occurrences = code.split(anchor).length - 1
        if (occurrences === 0)
          continue

        hitCounts.set(anchor, hitCounts.get(anchor)! + occurrences)
        patched = patched.replaceAll(anchor, replacement)
        hasChanged = true
      }

      return hasChanged ? { code: patched, map: null } : null
    },
    buildEnd() {
      const missedAnchors = [...hitCounts]
        .filter(([, count]) => count === 0)
        .map(([anchor]) => anchor)

      if (missedAnchors.length > 0) {
        throw new Error(
          `[pdfjs-serverless] The following source anchors never matched, `
          + `so the PDF.js source has likely drifted:\n${
            missedAnchors.map(anchor => `  - ${JSON.stringify(anchor)}`).join('\n')}`,
        )
      }
    },
  }
}

/**
 * Asserts that the modules patching the runtime are bundled and evaluated
 * before the first PDF.js module. They export nothing, so tree-shaking drops
 * them as soon as the side-effect rule stops matching, and their position in
 * the entry file is a convention nothing else enforces. Either failure leaves
 * PDF.js reaching for globals that are not there, so the build fails loudly
 * instead.
 */
export function assertRuntimePatchesFirst(): Plugin {
  const runtimePatches = ['mocks.mjs', 'polyfills.mjs']

  return {
    name: 'pdfjs-serverless:assert-runtime-patches-first',
    generateBundle(_options, bundle) {
      // Rolldown lists a chunk's modules in evaluation order, and the chunks
      // a chunk imports statically evaluate before it. The lazy decoder chunks
      // hold `pdfjs-dist` modules too, but never evaluate eagerly.
      const entryChunk = Object.values(bundle).find((output): output is OutputChunk => output.type === 'chunk' && output.isEntry && output.name === 'pdfjs')
      if (!entryChunk)
        throw new Error(`[pdfjs-serverless] The bundle has no \`pdfjs\` entry chunk to check.`)

      const moduleIds = collectStaticChunks(entryChunk, bundle)
        .flatMap(chunk => chunk.moduleIds)
        .map(id => id.replaceAll('\\', '/'))
      const firstPDFJSIndex = moduleIds.findIndex(id => id.includes('/pdfjs-dist/'))

      for (const filename of runtimePatches) {
        const index = moduleIds.findIndex(id => id.endsWith(`/pdfjs-serverless/${filename}`))

        if (index === -1) {
          throw new Error(
            `[pdfjs-serverless] ${filename} was tree-shaken out of the bundle, `
            + `so PDF.js runs against an unpatched runtime.`,
          )
        }

        if (firstPDFJSIndex !== -1 && index > firstPDFJSIndex) {
          throw new Error(
            `[pdfjs-serverless] ${filename} is evaluated after PDF.js, `
            + `so its globals land too late.`,
          )
        }
      }
    },
  }
}

export function pdfjsTypes(): Plugin {
  return {
    name: 'pdfjs-serverless:types',
    async writeBundle() {
      // The explicit `.js` extension keeps the declarations resolvable under
      // `moduleResolution: "nodenext"`.
      const typeExports = `
export * from './types/src/pdf.js'
`.trimStart()

      await writeFile('dist/pdfjs.d.mts', typeExports, 'utf8')
    },
  }
}

/**
 * Collects a chunk and every chunk it reaches through static imports, in
 * evaluation order. External imports have no chunk in the bundle and are
 * skipped.
 */
function collectStaticChunks(entryChunk: OutputChunk, bundle: OutputBundle): OutputChunk[] {
  const visitedChunks = new Set<OutputChunk>()
  const orderedChunks: OutputChunk[] = []

  const visit = (chunk: OutputChunk) => {
    visitedChunks.add(chunk)
    for (const fileName of chunk.imports) {
      const importedChunk = bundle[fileName]
      if (importedChunk?.type === 'chunk' && !visitedChunks.has(importedChunk))
        visit(importedChunk)
    }
    orderedChunks.push(chunk)
  }

  visit(entryChunk)
  return orderedChunks
}
