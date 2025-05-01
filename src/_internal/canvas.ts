import type { Canvas, CanvasRenderingContext2D } from '@napi-rs/canvas'
import { interopDefault } from '../utils'

interface CanvasFactoryContext {
  canvas?: HTMLCanvasElement | Canvas
  context?: CanvasRenderingContext2D | CanvasRenderingContext2D
}

let resolvedCanvasModule: typeof import('@napi-rs/canvas') | undefined

/**
 * Derived from the PDF.js project by the Mozilla Foundation.
 * @see https://github.com/mozilla/pdf.js/blob/b8de9a372f9bbf7e33adb362eeae5ef1919dba73/src/display/canvas_factory.js#L18
 * @license Apache-2.0
 */
class BaseCanvasFactory {
  #enableHWA = false

  constructor({ enableHWA = false } = {}) {
    this.#enableHWA = enableHWA
  }

  create(width: number, height: number) {
    const canvas = this._createCanvas(width, height)

    return {
      canvas,
      context: canvas.getContext('2d', {
        willReadFrequently: !this.#enableHWA,
      }),
    }
  }

  reset({ canvas }: CanvasFactoryContext, width: number, height: number) {
    if (!canvas) {
      throw new Error('Canvas is not specified')
    }

    canvas.width = width
    canvas.height = height
  }

  destroy(context: CanvasFactoryContext) {
    if (!context.canvas) {
      throw new Error('Canvas is not specified')
    }

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    context.canvas.width = 0
    context.canvas.height = 0
    context.canvas = undefined
    context.context = undefined
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  _createCanvas(width: number, height: number): HTMLCanvasElement | Canvas {
    throw new Error('Not implemented')
  }
}

/**
 * Derived from the PDF.js project by the Mozilla Foundation.
 * @see https://github.com/mozilla/pdf.js/blob/b8de9a372f9bbf7e33adb362eeae5ef1919dba73/src/display/canvas_factory.js#L18
 * @license Apache-2.0
 */
export class DOMCanvasFactory extends BaseCanvasFactory {
  _document: Document

  constructor({ ownerDocument = globalThis.document, enableHWA = false } = {}) {
    super({ enableHWA })
    this._document = ownerDocument
  }

  _createCanvas(width: number, height: number) {
    const canvas = this._document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }
}

export class NodeCanvasFactory extends BaseCanvasFactory {
  constructor({ enableHWA = false } = {}) {
    super({ enableHWA })
  }

  _createCanvas(width: number, height: number) {
    if (!resolvedCanvasModule) {
      throw new Error('@napi-rs/canvas module is not resolved')
    }

    return resolvedCanvasModule.createCanvas(width, height)
  }
}

export async function resolveCanvasModule(canvasImport: () => Promise<typeof import('@napi-rs/canvas')>) {
  resolvedCanvasModule ??= (await interopDefault(canvasImport()))
}

/**
 * Injects `DOMMatrix`, `ImageData` and `Path2D` constructors from the
 * `@napi-rs/canvas` package into the global scope. This is necessary for
 * Node.js environments that do not support these constructors natively.
 *
 * @remarks
 * If a constructor is already defined in the global scope,
 * it will not be overridden.
 */
export function injectCanvasConstructors() {
  if (!resolvedCanvasModule)
    return

  if (typeof globalThis.DOMMatrix === 'undefined')
    globalThis.DOMMatrix = resolvedCanvasModule.DOMMatrix as unknown as typeof DOMMatrix

  if (typeof globalThis.ImageData === 'undefined')
    globalThis.ImageData = resolvedCanvasModule.ImageData as unknown as typeof ImageData

  if (typeof globalThis.Path2D === 'undefined')
    globalThis.Path2D = resolvedCanvasModule.Path2D as unknown as typeof Path2D
}
