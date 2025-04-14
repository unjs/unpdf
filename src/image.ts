import type { Canvas } from 'canvas'
import type {
  DocumentInitParameters,
  PDFDocumentProxy,
} from 'pdfjs-dist/types/src/display/api'
import {
  getDocumentProxy,
  getResolvedPDFJS,
  interopDefault,
  isBrowser,
  isNode,
  isPDFDocumentProxy,
} from './utils'

export interface ExtractedImageObject {
  data: Uint8ClampedArray
  width: number
  height: number
  channels: 1 | 3 | 4
  key: string
}

/**
 * Extracts images from a specific page of a PDF document, including necessary metadata,
 * such as width, height, and calculated color channels.
 *
 * This version calculates channels based on image data length, width, and height,
 * as the `kind` property provided by PDF.js might not reliably indicate the actual
 * channel count of the raw pixel data (e.g., returning RGBA data even when kind is 3).
 */
export async function extractImages(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
): Promise<ExtractedImageObject[]> {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number. Must be between 1 and ${pdf.numPages}.`)
  }

  const page = await pdf.getPage(pageNumber)
  const operatorList = await page.getOperatorList()
  const { OPS } = await getResolvedPDFJS()

  const images: ExtractedImageObject[] = []

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const op = operatorList.fnArray[i]

    if (op !== OPS.paintImageXObject) {
      continue
    }

    const imageKey = operatorList.argsArray[i][0]
    const image = await page.objs.get(imageKey)

    if (!image || !image.data || !image.width || !image.height) {
      // Missing required properties
      continue
    }

    const { width, height, data } = image
    const calculatedChannels = data.length / (width * height)

    if (![1, 3, 4].includes(calculatedChannels)) {
        // Unexpected channel count
        continue
    }

    const channels = calculatedChannels as ExtractedImageObject['channels']

    images.push({
      data,
      width,
      height,
      channels,
      key: imageKey,
    })
  }

  return images
}

export async function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options: {
    canvas?: () => Promise<typeof import('canvas')>
    /** @default 1 */
    scale?: number
    width?: number
    height?: number
  } = {},
) {
  const canvasFactory = await createIsomorphicCanvasFactory(options.canvas)
  const pdf = isPDFDocumentProxy(data)
    ? data
    : await getDocumentProxy(data, { canvasFactory })
  const page = await pdf.getPage(pageNumber)

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number. Must be between 1 and ${pdf.numPages}.`)
  }

  // Create viewport of the page at required scale
  let outputScale = options.scale || 1
  let viewport = page.getViewport({ scale: outputScale })

  // Scale it up/down depending on the custom width/height passed
  if (options.width) {
    outputScale = options.width / viewport.width
  }
  else if (options.height) {
    outputScale = options.height / viewport.height
  }
  if (outputScale !== 1 && outputScale > 0) {
    viewport = page.getViewport({ scale: outputScale })
  }

  const ctx = canvasFactory.create(viewport.width, viewport.height)

  await page.render({
    canvasContext: ctx.context,
    viewport,
  }).promise

  const dataUrl = isBrowser
    ? ctx.canvas.toDataURL()
    : (ctx.canvas as Canvas).toDataURL()

  const response = await fetch(dataUrl)
  return await response.arrayBuffer()
}

export async function createIsomorphicCanvasFactory(
  canvas?: () => Promise<typeof import('canvas')>,
) {
  const _canvas = canvas ? await interopDefault(canvas()) : undefined

  return {
    _createCanvas(width: number, height: number) {
      if (isBrowser) {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        return canvas
      }

      if (isNode) {
        if (!_canvas) {
          throw new Error('Failed to resolve "canvas" package.')
        }

        return _canvas.createCanvas(width, height)
      }

      throw new Error('Unsupported environment for canvas creation.')
    },
    create(width: number, height: number) {
      const _canvas = this._createCanvas(width, height)
      const context = _canvas.getContext(
        '2d',
      ) as unknown as CanvasRenderingContext2D
      return {
        canvas: _canvas,
        context,
      }
    },
    reset(
      ctx: { canvas?: Canvas, context?: CanvasRenderingContext2D },
      width: number,
      height: number,
    ) {
      if (ctx.canvas) {
        ctx.canvas.width = width
        ctx.canvas.height = height
      }
    },
    destroy(ctx: { canvas?: Canvas, context?: CanvasRenderingContext2D }) {
      if (ctx.canvas) {
        ctx.canvas.width = 0
        ctx.canvas.height = 0
      }
      ctx.canvas = undefined
      ctx.context = undefined
    },
  }
}
