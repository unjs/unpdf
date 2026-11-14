import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { isPDFDocumentProxy, withDocument } from './utils'

export async function extractLinks(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{
  totalPages: number
  links: string[][]
}> {
  return await withDocument(data, async (pdf) => {
    // Only pages of documents opened here are released, see `inspectPages`.
    const shouldReleasePages = !isPDFDocumentProxy(data)
    const links: string[][] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      links.push(await getPageLinks(pdf, pageNumber, shouldReleasePages))
    }

    return { totalPages: pdf.numPages, links }
  })
}

async function getPageLinks(
  document: PDFDocumentProxy,
  pageNumber: number,
  shouldReleasePage: boolean,
) {
  const page = await document.getPage(pageNumber)
  const annotations = await page.getAnnotations()

  if (shouldReleasePage) {
    page.cleanup()
  }
  const links: string[] = []

  for (const annotation of annotations) {
    if (annotation.subtype === 'Link' && annotation.url) {
      links.push(annotation.url)
    }
  }

  return links
}
