import type { DocumentInitParameters, PDFDocumentProxy, TextItem, TextStyle } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, isPDFDocumentProxy } from './utils'

export interface StructuredTextItem {
  /** Text content. */
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
  /** Font family name. */
  fontFamily: string
  /** Text direction: `"ltr"`, `"rtl"`, or `"ttb"`. */
  dir: string
  /** Whether the text item is followed by a line break. */
  hasEOL: boolean
}

export async function extractTextItems(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{ totalPages: number, items: StructuredTextItem[][] }> {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const items = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageTextItems(pdf, i + 1)),
  )

  return { totalPages: pdf.numPages, items }
}

async function getPageTextItems(
  document: PDFDocumentProxy,
  pageNumber: number,
): Promise<StructuredTextItem[]> {
  const page = await document.getPage(pageNumber)
  const content = await page.getTextContent()
  const styles = content.styles as Record<string, TextStyle>

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
        dir: item.dir,
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
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageText(pdf, i + 1)),
  )

  return {
    totalPages: pdf.numPages,
    // Collapse only intra-line whitespace runs so `hasEOL` line breaks survive
    text: mergePages ? texts.join('\n').replace(/[^\S\n]+/g, ' ') : texts,
  }
}

async function getPageText(document: PDFDocumentProxy, pageNumber: number) {
  const page = await document.getPage(pageNumber)
  const content = await page.getTextContent()

  return (
    (content.items as TextItem[])
      .filter(item => item.str != null)
      .map(item => item.str + (item.hasEOL ? '\n' : ''))
      .join('')
  )
}
