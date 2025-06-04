import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { DOMCanvasFactory, injectCanvasConstructors, NodeCanvasFactory, resolveCanvasModule } from './_internal/canvas'
import { getDocumentProxy, getResolvedPDFJS, isBrowser, isNode, isPDFDocumentProxy } from './utils'

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
 *
 * @example
 * const imagesData = await extractImages(pdf, pageNum)
 *
 * for (const imgData of imagesData) {
 *   const imageIndex = totalImagesProcessed + 1
 *   await sharp(imgData.data, {
 *     raw: { width: imgData.width, height: imgData.height, channels: imgData.channels }
 *   })
 *     .png()
 *     .toFile(`${imageIndex}.png`)
 * }
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
    // Resolve global image keys
    const image = imageKey.startsWith('g_')
      ? await new Promise<RequestedImageObject | null>(resolve => page.commonObjs.get(imageKey, (resolvedImage: RequestedImageObject | null) => resolve(resolvedImage)))
      : await new Promise<RequestedImageObject | null>(resolve => page.objs.get(imageKey, (resolvedImage: RequestedImageObject | null) => resolve(resolvedImage)))

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
    canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>
    /** @default 1.0 */
    scale?: number
    width?: number
    height?: number
  } = {},
) {
  const CanvasFactory = await createIsomorphicCanvasFactory(options.canvasImport)
  const pdf = isPDFDocumentProxy(data)
    ? data
    : await getDocumentProxy(data, { CanvasFactory })
  const page = await pdf.getPage(pageNumber)

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number. Must be between 1 and ${pdf.numPages}.`)
  }

  // Create viewport of the page at default scale (1.0)
  const defaultViewport = page.getViewport({ scale: 1.0 })

  // Calculate appropriate scale based on provided options
  let scale = options.scale || 1.0

  if (options.width) {
    scale = options.width / defaultViewport.width
  }
  else if (options.height) {
    scale = options.height / defaultViewport.height
  }

  // Create the correctly scaled viewport
  const viewport = page.getViewport({ scale: Math.max(0, scale) })
  const drawingContext = (new CanvasFactory()).create(viewport.width, viewport.height)

  await page.render({
    canvasContext: drawingContext.context as CanvasRenderingContext2D,
    viewport,
  }).promise

  const dataUrl = drawingContext.canvas.toDataURL()
  const response = await fetch(dataUrl)

  return await response.arrayBuffer()
}

async function createIsomorphicCanvasFactory(
  canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>,
) {
  if (isBrowser)
    return DOMCanvasFactory

  if (isNode) {
    if (!canvasImport) {
      throw new Error('Parameter "canvasImport" is required in Node.js environment.')
    }

    await resolveCanvasModule(canvasImport)
    injectCanvasConstructors()
    return NodeCanvasFactory
  }

  throw new Error('Unsupported environment for canvas creation.')
}
