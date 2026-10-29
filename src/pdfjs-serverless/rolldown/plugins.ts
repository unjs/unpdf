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

// Anchors match verbatim, so the worker anchor carries the exact multi-line
// indentation of the PDF.js source.
const patches: Record<string, string> = {
  // Take the inlined worker from its global instead of importing it at runtime.
  'await import(\n      /*webpackIgnore: true*/\n      /*@vite-ignore*/\n      this.workerSrc)': 'globalThis.pdfjsWorker',
  // Force setting up fake PDF.js worker.
  '#isWorkerDisabled = false': '#isWorkerDisabled = true',
  'require("@napi-rs/canvas")': canvasMock,
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
      // Rolldown lists a chunk's modules in evaluation order.
      const moduleIds = Object.values(bundle)
        .flatMap(output => (output.type === 'chunk' ? output.moduleIds : []))
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
