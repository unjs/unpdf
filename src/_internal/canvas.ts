import type { Canvas, SKRSContext2D } from '@napi-rs/canvas'
import { interopDefault } from '../utils'

export interface CanvasAndContext {
  canvas: HTMLCanvasElement | Canvas
  context: CanvasRenderingContext2D | SKRSContext2D
}

/** The shape of the document-level canvas factory PDF.js exposes as `canvasFactory`. */
export interface PDFCanvasFactory {
  create: (width: number, height: number) => CanvasAndContext
  destroy: (canvasAndContext: CanvasAndContext) => void
}

let resolvedCanvasModule: typeof import('@napi-rs/canvas') | undefined

export async function resolveCanvasModule(canvasImport: () => Promise<typeof import('@napi-rs/canvas')>): Promise<void> {
  resolvedCanvasModule ??= (await interopDefault(canvasImport()))

  // Share the resolved module with the serverless PDF.js build: its baked-in
  // `NodeCanvasFactory` (the default document-level factory of `getDocument`)
  // resolves `@napi-rs/canvas` through this global symbol.
  ;(globalThis as Record<PropertyKey, unknown>)[Symbol.for('unpdf.canvasModule')] = resolvedCanvasModule
}

/**
 * Injects the `DOMMatrix` and `Path2D` constructors of `@napi-rs/canvas` into
 * the global scope, which the PDF.js display layer instantiates while
 * rendering. Only the legacy `pdfjs-dist` build polyfills them itself.
 *
 * @remarks
 * `DOMMatrix` is always set because {@link polyfillDOMMatrix} may have
 * installed a minimal stub to allow PDF.js to import – the real
 * `@napi-rs/canvas` implementation must take precedence for rendering.
 */
export function injectCanvasConstructors(): void {
  if (!resolvedCanvasModule)
    return

  globalThis.DOMMatrix = resolvedCanvasModule.DOMMatrix as unknown as typeof DOMMatrix

  if (typeof globalThis.Path2D === 'undefined')
    globalThis.Path2D = resolvedCanvasModule.Path2D as unknown as typeof Path2D
}
