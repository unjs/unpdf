import type { DocumentInitParameters, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'
import type { PDFCanvasFactory } from './_internal/canvas'
import type { Bounds } from './_internal/operator-list'
import { injectCanvasConstructors, resolveCanvasModule } from './_internal/canvas'
import { getUnitSquareBounds, walkOperatorList } from './_internal/operator-list'
import { encodePNG } from './_internal/png'
import { getResolvedPDFJS, isNode, withDocument } from './utils'

export interface ExtractImagesOptions {
  /**
   * Encoding of each image's `data`: raw RGBA pixels, or a PNG file.
   *
   * @default 'rgba'
   */
  format?: 'rgba' | 'png'
}

export interface ExtractedImage {
  /** RGBA pixels, four bytes per pixel, row by row from the top – or PNG bytes with `format: 'png'`. */
  data: Uint8Array
  width: number
  height: number
  /** PDF.js object ID of the image, `null` for an inline image. */
  key: string | null
  /** Box the image covers on the page, in PDF user space with the origin at the bottom left. */
  bounds: Bounds
}

interface PDFJSImageData {
  data: Uint8Array | Uint8ClampedArray | null
  width: number
  height: number
  /** PDF.js `ImageKind`, absent on image masks. */
  kind?: number
}

/**
 * Extracts the images painted on a page – image XObjects, inline images, and
 * image masks – as RGBA pixels. Image masks come out opaque black where they
 * paint and transparent elsewhere, since their color is the fill color at the
 * time of painting. A 1×1 image mask that paints its pixel, which PDF.js
 * turns into a solid fill, is skipped.
 *
 * @remarks
 * A caller-supplied document proxy created with `isOffscreenCanvasSupported`
 * or `isImageDecoderSupported` (both on by default outside of Node.js) hands
 * some images out as bitmaps instead of pixels, which are skipped.
 */
export async function extractImages(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options: ExtractImagesOptions = {},
): Promise<ExtractedImage[]> {
  return await withDocument(data, async (pdf) => {
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number. Must be between 1 and ${pdf.numPages}.`)
    }

    const page = await pdf.getPage(pageNumber)
    const operatorList = await page.getOperatorList()
    const { ImageKind, OPS } = await getResolvedPDFJS()

    const images: ExtractedImage[] = []

    for (const { fn, args, transform } of walkOperatorList(operatorList, OPS)) {
      let key: string | null = null
      let image: PDFJSImageData | null

      if (fn === OPS.paintImageXObject) {
        key = args[0] as string
        image = await getPageObject(page, key)
      }
      else if (fn === OPS.paintInlineImageXObject) {
        image = args[0]
      }
      else if (fn === OPS.paintImageMaskXObject) {
        key = args[0].data as string
        image = await getPageObject(page, key)
      }
      else {
        continue
      }

      // PDF.js resolves images it failed to decode with `null`.
      if (!image) {
        continue
      }

      const pixels = toRGBA(image, fn === OPS.paintImageMaskXObject, ImageKind)
      if (!pixels) {
        continue
      }

      images.push({
        data: options.format === 'png' ? await encodePNG(pixels, image.width, image.height) : pixels,
        width: image.width,
        height: image.height,
        key,
        bounds: getUnitSquareBounds(transform),
      })
    }

    return images
  }, {
    // Keep PDF.js from decoding images into bitmaps, which hold no readable pixels.
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
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
    if (options.width !== undefined) {
      scale = options.width / defaultViewport.width
    }
    else if (options.height !== undefined) {
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
        const dataURL = canvas.toDataURL(mimeType, quality)
        assertEncodedType(dataURL.slice('data:'.length, dataURL.indexOf(';')), mimeType)
        return dataURL
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
      assertEncodedType(blob.type, mimeType)

      return new Uint8Array(await blob.arrayBuffer())
    }
    finally {
      canvasFactory.destroy(canvasAndContext)
    }
  })
}

function getPageObject(page: PDFPageProxy, objectId: string): Promise<PDFJSImageData | null> {
  // PDF.js prefixes the IDs of objects shared across pages with `g_`.
  const objects = objectId.startsWith('g_') ? page.commonObjs : page.objs
  return new Promise(resolve => objects.get(objectId, resolve))
}

/**
 * Converts PDF.js image data into a fresh RGBA buffer, so the result never
 * aliases a buffer PDF.js keeps cached.
 */
function toRGBA(
  image: PDFJSImageData,
  isMask: boolean,
  imageKind: typeof PDFJS.ImageKind,
): Uint8Array | undefined {
  const { data, width, height, kind } = image

  // Images decoded into bitmaps carry no `data`.
  if (!data) {
    return
  }

  const rgba = new Uint8Array(width * height * 4)

  if (kind === imageKind.RGBA_32BPP) {
    rgba.set(data.subarray(0, rgba.length))
    return rgba
  }

  if (kind === imageKind.RGB_24BPP) {
    for (let source = 0, target = 0; target < rgba.length; source += 3, target += 4) {
      rgba[target] = data[source]!
      rgba[target + 1] = data[source + 1]!
      rgba[target + 2] = data[source + 2]!
      rgba[target + 3] = 255
    }
    return rgba
  }

  if (!isMask && kind !== imageKind.GRAYSCALE_1BPP) {
    return
  }

  // 1-bit samples, each row starting on a new byte. A 0 bit is black in a
  // grayscale image and painted in an image mask.
  const bytesPerRow = Math.ceil(width / 8)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bit = (data[y * bytesPerRow + (x >> 3)]! >> (7 - (x & 7))) & 1
      const target = (y * width + x) * 4

      if (isMask) {
        rgba[target + 3] = bit === 0 ? 255 : 0
      }
      else {
        rgba.fill(bit === 0 ? 0 : 255, target, target + 3)
        rgba[target + 3] = 255
      }
    }
  }

  return rgba
}

async function prepareCanvasEnvironment(
  canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>,
): Promise<void> {
  if (isNode) {
    if (!canvasImport) {
      throw new Error('Parameter "canvasImport" is required in Node.js environment.')
    }

    await resolveCanvasModule(canvasImport)
    injectCanvasConstructors()
    return
  }

  if (typeof document === 'undefined') {
    throw new Error('Unsupported environment for canvas creation.')
  }
}

function assertEncodedType(encodedType: string, mimeType: string): void {
  // Browsers fall back to PNG for types they can't encode, such as WebP in Safari.
  if (encodedType !== mimeType) {
    throw new Error(`This environment can't encode ${mimeType}, only ${encodedType}.`)
  }
}
