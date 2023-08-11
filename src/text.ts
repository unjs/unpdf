import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy } from './utils'
import type { PDFContent } from './types'

export async function decodePDFText(
  data: ArrayBuffer,
  { mergePages = false }: { mergePages?: boolean } = {},
): Promise<PDFContent> {
  const pdf = await getDocumentProxy(data)
  const meta = await pdf.getMetadata().catch(() => null)

  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageText(pdf, i + 1)),
  )

  const filteredTexts = texts.filter(Boolean) as string[]

  return {
    totalPages: pdf.numPages,
    info: meta?.info,
    metadata: meta?.metadata?.getAll(),
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
