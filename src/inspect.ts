import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'
import type { Bounds } from './_internal/operator-list'
import { getUnitSquareBounds, walkOperatorList } from './_internal/operator-list'
import { getResolvedPDFJS, isPDFDocumentProxy, withDocument } from './utils'

const WHITESPACE_PATTERN = /\s/g

export interface PageInspection {
  /** Characters of all text on the page, visible or not, whitespace excluded. */
  textLength: number
  /**
   * Characters that paint nothing: drawn with text rendering mode 3 or 7 –
   * typically the OCR layer of a scan – or in a layer the document hides.
   * Whitespace excluded.
   */
  invisibleTextLength: number
  /** Image XObjects, inline images, and image masks painted on the page. */
  imageCount: number
  /**
   * Fraction of the page's view box covered by images, from 0 to 1. Overlapping
   * images count once, and a rotated or skewed image counts with its
   * axis-aligned bounds.
   */
  imageCoverage: number
}

/**
 * Measures the text and images of every page, such as to tell scanned pages
 * from born-digital ones. Where that line lies is left to the caller.
 */
export async function inspectPages(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{ totalPages: number, pages: PageInspection[] }> {
  return await withDocument(data, async (pdf) => {
    const { OPS } = await getResolvedPDFJS()
    const optionalContentConfig = await pdf.getOptionalContentConfig()
    // Releasing a page drops objects that concurrent work on a caller-owned
    // proxy may still wait for, so only pages of own documents are released.
    const shouldReleasePages = !isPDFDocumentProxy(data)
    const pages: PageInspection[] = []

    // One page at a time, so the decoded images of a scan in a document opened
    // here never pile up.
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      pages.push(await inspectPage(pdf, pageNumber, OPS, optionalContentConfig, shouldReleasePages))
    }

    return { totalPages: pdf.numPages, pages }
  })
}

async function inspectPage(
  document: PDFDocumentProxy,
  pageNumber: number,
  ops: typeof PDFJS.OPS,
  optionalContentConfig: OptionalContentConfig,
  shouldReleasePage: boolean,
): Promise<PageInspection> {
  const page = await document.getPage(pageNumber)
  const [textContent, operatorList] = await Promise.all([
    page.getTextContent(),
    page.getOperatorList(),
  ])

  const textLength = textContent.items.reduce(
    (sum, item) => sum + ('str' in item ? countCharacters(item.str) : 0),
    0,
  )
  let invisibleTextLength = 0
  const imageBounds: Bounds[] = []

  for (const { fn, args, transform, textRenderingMode, isVisible } of walkOperatorList(operatorList, ops, optionalContentConfig)) {
    // PDF.js turns every text-showing operator into `showText`, with glyph
    // objects and spacing numbers as its first argument.
    if (fn === ops.showText && (!isVisible || textRenderingMode === 3 || textRenderingMode === 7)) {
      for (const glyph of args[0]) {
        if (typeof glyph === 'object' && glyph?.unicode) {
          invisibleTextLength += countCharacters(glyph.unicode)
        }
      }
    }
    else if (isVisible && (
      fn === ops.paintImageXObject
      || fn === ops.paintInlineImageXObject
      || fn === ops.paintImageMaskXObject
    )) {
      imageBounds.push(getUnitSquareBounds(transform))
    }
  }

  if (shouldReleasePage) {
    page.cleanup()
  }

  return {
    textLength,
    invisibleTextLength,
    imageCount: imageBounds.length,
    imageCoverage: getCoverage(imageBounds, page.view),
  }
}

function countCharacters(text: string): number {
  return Array.from(text.replace(WHITESPACE_PATTERN, '')).length
}

/**
 * Computes the fraction of a view box the union of boxes covers, exactly: cuts
 * the view box into vertical slabs at every box edge and merges the vertical
 * extents of the boxes spanning each slab.
 */
function getCoverage(boxes: Bounds[], view: number[]): number {
  const [viewX0, viewY0, viewX1, viewY1] = view as [number, number, number, number]
  const viewArea = (viewX1 - viewX0) * (viewY1 - viewY0)
  if (viewArea <= 0) {
    return 0
  }

  const clippedBoxes = boxes
    .map(box => ({
      x0: Math.max(box.x, viewX0),
      x1: Math.min(box.x + box.width, viewX1),
      y0: Math.max(box.y, viewY0),
      y1: Math.min(box.y + box.height, viewY1),
    }))
    .filter(box => box.x0 < box.x1 && box.y0 < box.y1)
  const edges = [...new Set(clippedBoxes.flatMap(box => [box.x0, box.x1]))].sort((a, b) => a - b)

  let area = 0

  for (let i = 0; i < edges.length - 1; i++) {
    const left = edges[i]!
    const right = edges[i + 1]!
    const spans = clippedBoxes
      .filter(box => box.x0 <= left && box.x1 >= right)
      .sort((a, b) => a.y0 - b.y0)

    let coveredHeight = 0
    let coveredTop = -Infinity
    for (const { y0, y1 } of spans) {
      const start = Math.max(y0, coveredTop)
      if (y1 > start) {
        coveredHeight += y1 - start
        coveredTop = y1
      }
    }

    area += coveredHeight * (right - left)
  }

  return area / viewArea
}
