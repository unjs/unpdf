import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { withDocument } from './utils'

export async function extractLinks(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{
  totalPages: number
  links: string[]
}> {
  return await withDocument(data, async (pdf) => {
    const pageLinks = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) => getPageLinks(pdf, i + 1)),
    )

    return {
      totalPages: pdf.numPages,
      links: pageLinks.flat(),
    }
  })
}

async function getPageLinks(document: PDFDocumentProxy, pageNumber: number) {
  const page = await document.getPage(pageNumber)
  const annotations = await page.getAnnotations()
  const links: string[] = []

  for (const annotation of annotations) {
    if (annotation.subtype === 'Link' && annotation.url) {
      links.push(annotation.url)
    }
  }

  return links
}
