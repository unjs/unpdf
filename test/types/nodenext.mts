// Type-checks the shipped declarations as a `nodenext` consumer would – needs `build:pdfjs` and `build` first.
import type { PDFDocumentProxy } from 'unpdf/pdfjs'
import { extractText, getDocumentProxy } from 'unpdf'

export async function consumeBuiltDeclarations(data: Uint8Array): Promise<string> {
  const pdf: PDFDocumentProxy = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: true })

  return text
}
