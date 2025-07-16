import type { DocumentInitParameters, PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, isPDFDocumentProxy } from './utils'

export async function extractLinks(
  data: DocumentInitParameters['data'] | PDFDocumentProxy
) : Promise<{
  totalPages: number
  links: string[]
}>
{
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const links = (await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageLinks(pdf, i + 1)),
  )).flat()
  return {
    totalPages: pdf.numPages,
    links: links,
  }
}

async function getPageLinks(document: PDFDocumentProxy, pageNumber: number) {
  const page = await document.getPage(pageNumber)
  const annotations = await page.getAnnotations();
  let links = [];
  for (const a of annotations) {
    if (a.subtype === 'Link' && a.url) {
      links.push(a.url);
    }
  }

  return links;
}
