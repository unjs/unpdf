import type { BinaryData, PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, isPDFDocumentProxy } from './utils'

export async function extractPDFText(
  data: BinaryData | PDFDocumentProxy,
  options: { mergePages?: boolean } = {},
) {
  const { mergePages = false } = options
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageText(pdf, i + 1)),
  )
  const filteredTexts = texts.filter(Boolean) as string[]

  return {
    totalPages: pdf.numPages,
    text: mergePages ? filteredTexts.join('\n\n') : filteredTexts,
  }
}

async function getPageText(pdf: PDFDocumentProxy, pageNumber: number) {
  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  const items = content.items as TextItem[]

  if (items.length === 0)
    return

  return items.map(({ str }) => str).join('\n')
}
