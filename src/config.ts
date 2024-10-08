import type { UnPDFConfiguration } from './types'
import { resolvePDFJSImports } from './utils'

export async function configureUnPDF(options: UnPDFConfiguration) {
  const { pdfjs } = { ...options }

  if (pdfjs) {
    await resolvePDFJSImports(pdfjs, { force: true })
  }
}
