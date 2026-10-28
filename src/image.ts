import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { PDFCanvasFactory } from './_internal/canvas'
import { injectCanvasConstructors, resolveCanvasModule } from './_internal/canvas'
import { getResolvedPDFJS, isNode, withDocument } from './utils'

export interface ExtractedImageObject {
  data: Uint8ClampedArray
  width: number
  height: number
  channels: 1 | 3 | 4
  key: string
}

interface RequestedImageObject {
  data?: Uint8ClampedArray
  width?: number
  height?: number
}

/**
 * Extracts images from a specific page of a PDF document, including necessary metadata,
 * such as width, height, and calculated color channels.
 */
export async function extractImages(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
): Promise<ExtractedImageObject[]> {
  return await withDocument(data, async (pdf) => {
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
      // PDF.js prefixes keys of images shared across pages with `g_`.
      const image = await new Promise<RequestedImageObject | null>(
        resolve => (imageKey.startsWith('g_') ? page.commonObjs : page.objs).get(imageKey, resolve),
      )

      if (!image || !image.data || !image.width || !image.height) {
        continue
      }

      const { width, height, data } = image
      const calculatedChannels = data.length / (width * height)

      if (![1, 3, 4].includes(calculatedChannels)) {
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
  })
}

export interface RenderPageAsImageOptions {
  canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>
  /** @default 1 */
  scale?: number
  width?: number
  height?: number
  /** @default 'png' */
  format?: 'png' | 'jpeg' | 'webp'
  /** Encoder quality from 0 to 1, for `jpeg` and `webp` only. */
  quality?: number
  toDataURL?: boolean
}

export function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options?: RenderPageAsImageOptions & { toDataURL?: false },
): Promise<Uint8Array>
export function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options: RenderPageAsImageOptions & { toDataURL: true },
): Promise<string>
export async function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options: RenderPageAsImageOptions = {},
): Promise<Uint8Array | string> {
  await prepareCanvasEnvironment(options.canvasImport)

  return await withDocument(data, async (pdf) => {
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number. Must be between 1 and ${pdf.numPages}.`)
    }

    const page = await pdf.getPage(pageNumber)
    const defaultViewport = page.getViewport({ scale: 1 })

    let scale = options.scale ?? 1
    if (options.width) {
      scale = options.width / defaultViewport.width
    }
    else if (options.height) {
      scale = options.height / defaultViewport.height
    }

    const viewport = page.getViewport({ scale })
    // The document's own factory, which also serves the intermediate canvases
    // of soft masks and transparency groups while rendering.
    const canvasFactory = pdf.canvasFactory as PDFCanvasFactory
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)

    try {
      const { canvas } = canvasAndContext
      await page.render({ canvas: canvas as HTMLCanvasElement, viewport }).promise

      const { format = 'png', quality } = options
      const mimeType = `image/${format}` as const

      if (options.toDataURL) {
        return canvas.toDataURL(mimeType, quality)
      }

      if ('encode' in canvas) {
        // `@napi-rs/canvas` takes the quality from 0 to 100.
        const buffer = format === 'png'
          ? await canvas.encode(format)
          : await canvas.encode(format, quality === undefined ? undefined : quality * 100)
        return new Uint8Array(buffer)
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality)
      })

      if (!blob) {
        throw new Error(`Failed to encode canvas as ${mimeType}.`)
      }

      return new Uint8Array(await blob.arrayBuffer())
    }
    finally {
      canvasFactory.destroy(canvasAndContext)
    }
  })
}

async function prepareCanvasEnvironment(
  canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>,
) {
  if (isNode) {
    if (!canvasImport) {
      throw new Error('Parameter "canvasImport" is required in Node.js environment.')
    }

    await resolveCanvasModule(canvasImport)
    injectCanvasConstructors()
    return
  }

  // PDF.js creates its canvases through `document` outside of Node.js.
  if (typeof document === 'undefined') {
    throw new Error('Unsupported environment for canvas creation.')
  }
}
