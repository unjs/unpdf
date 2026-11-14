import type { DocumentInitParameters, PDFDocumentProxy, TextItem, TextStyle } from 'pdfjs-dist/types/src/display/api'
import { isPDFDocumentProxy, withDocument } from './utils'

export interface StructuredTextItem {
  str: string
  /** X position in PDF coordinate space (origin: bottom-left). */
  x: number
  /** Y position in PDF coordinate space (origin: bottom-left). */
  y: number
  /** Width in device space. */
  width: number
  /** Height in device space. */
  height: number
  /** Font size derived from the transformation matrix. */
  fontSize: number
  /** Font family, empty when unknown. */
  fontFamily: string
  dir: 'ltr' | 'rtl' | 'ttb'
  hasEOL: boolean
}

export async function extractTextItems(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{ totalPages: number, items: StructuredTextItem[][] }> {
  return await withDocument(data, async (pdf) => {
    // Releasing a page drops objects that concurrent work on a caller-owned
    // proxy may still wait for, so only pages of own documents are released.
    const shouldReleasePages = !isPDFDocumentProxy(data)
    const items: StructuredTextItem[][] = []

    // One page at a time, so the parsed pages of a large document opened here
    // never pile up.
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      items.push(await getPageTextItems(pdf, pageNumber, shouldReleasePages))
    }

    return { totalPages: pdf.numPages, items }
  })
}

async function getPageTextItems(
  document: PDFDocumentProxy,
  pageNumber: number,
  shouldReleasePage: boolean,
): Promise<StructuredTextItem[]> {
  const page = await document.getPage(pageNumber)
  const content = await page.getTextContent()
  const styles = content.styles as Record<string, TextStyle>

  if (shouldReleasePage) {
    page.cleanup()
  }

  return (content.items as TextItem[])
    .filter(item => item.str != null)
    .map((item) => {
      const [_a, _b, c, d, e, f] = item.transform
      return {
        str: item.str,
        x: e,
        y: f,
        width: item.width,
        height: item.height,
        fontSize: Math.hypot(c, d),
        fontFamily: styles[item.fontName]?.fontFamily ?? '',
        dir: item.dir as StructuredTextItem['dir'],
        hasEOL: item.hasEOL,
      }
    })
}

export function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options?: { mergePages?: false },
): Promise<{
  totalPages: number
  text: string[]
}>
export function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options: { mergePages: true },
): Promise<{
  totalPages: number
  text: string
}>
export function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options?: { mergePages?: boolean },
): Promise<{
  totalPages: number
  text: string | string[]
}>
export async function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options: { mergePages?: boolean } = {},
) {
  const { mergePages = false } = options
  return await withDocument(data, async (pdf) => {
    const shouldReleasePages = !isPDFDocumentProxy(data)
    const texts: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      texts.push(await getPageText(pdf, pageNumber, shouldReleasePages))
    }

    return {
      totalPages: pdf.numPages,
      text: mergePages ? normalizeMergedText(texts) : texts,
    }
  })
}

async function getPageText(
  document: PDFDocumentProxy,
  pageNumber: number,
  shouldReleasePage: boolean,
) {
  const page = await document.getPage(pageNumber)
  const content = await page.getTextContent()

  if (shouldReleasePage) {
    page.cleanup()
  }

  return (
    (content.items as TextItem[])
      .filter(item => item.str != null)
      .map(item => item.str + (item.hasEOL ? '\n' : ''))
      .join('')
  )
}

/**
 * Collapses whitespace without destroying the line structure: `hasEOL` and
 * page-join line breaks survive, but at most one blank line remains.
 */
function normalizeMergedText(texts: string[]) {
  return texts
    .join('\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}
