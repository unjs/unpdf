import type { Canvas, CanvasRenderingContext2D } from '@napi-rs/canvas'
import {
  interopDefault,
} from '../utils'

interface CanvasFactoryContext {
  canvas?: HTMLCanvasElement | Canvas
  context?: CanvasRenderingContext2D | CanvasRenderingContext2D
}

let canvasModule: typeof import('@napi-rs/canvas') | undefined

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
    if (!canvasModule) {
      throw new Error('@napi-rs/canvas module is not resolved')
    }

    return canvasModule.createCanvas(width, height)
  }
}

export async function resolveCanvasModule() {
  canvasModule = await interopDefault(import('@napi-rs/canvas'))
}

/**
 * Injects the global `Path2D` and `ImageData` constructors to use the
 * `Path2D` and `ImageData` implementations from the `@napi-rs/canvas` package.
 * This is necessary because the `Path2D` and `ImageData` APIs are not available
 * in Node.js environments by default.
 *
 * @remarks
 * If the `Path2D` or `ImageData` constructors are already defined in the
 * global scope, they will not be overridden.
 */
export function injectCanvasConstructors() {
  globalThis.Path2D ??= canvasModule!.Path2D as unknown as typeof Path2D
  globalThis.ImageData ??= canvasModule!.ImageData as unknown as typeof ImageData
}
