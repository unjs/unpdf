import type { Plugin } from 'rolldown'
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

// Raw literal substitutions applied to the PDF.js source before bundling –
// matched verbatim, every occurrence replaced. The worker anchor carries its
// exact multi-line indentation on purpose.
const patches: Record<string, string> = {
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

export function pdfjsTypes(): Plugin {
  return {
    name: 'pdfjs-serverless:types',
    async writeBundle() {
      // The explicit `.js` extension keeps the declarations resolvable under
      // `moduleResolution: "nodenext"`.
      const typeExports = `
export * from './types/src/pdf.js'
`.trimStart()

      for (const filename of ['pdfjs.d.ts', 'pdfjs.d.mts']) {
        await writeFile(`dist/${filename}`, typeExports, 'utf8')
      }
    },
  }
}
