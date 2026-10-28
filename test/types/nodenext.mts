import type { Metadata, RenderPageAsImageOptions } from 'unpdf'
// Type-checks the shipped declarations as a `nodenext` consumer would – needs `build:pdfjs` and `build` first.
import type { PDFDocumentProxy } from 'unpdf/pdfjs'
import { extractText, getDocumentProxy, getMeta, renderPageAsImage } from 'unpdf'

export async function consumeBuiltDeclarations(data: Uint8Array): Promise<string> {
  const pdf: PDFDocumentProxy = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: true })

  return text
}

export async function consumeExportedTypes(data: Uint8Array, options: RenderPageAsImageOptions): Promise<[Uint8Array | string, Metadata | null]> {
  const image = await renderPageAsImage(data, 1, options)
  const { metadata } = await getMeta(data)

  return [image, metadata]
}
