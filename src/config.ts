import type { UnPDFConfiguration } from './types'
import { resolvePDFJSImports } from './utils'

export async function configureUnPDF(options: UnPDFConfiguration) {
  if (options.pdfjs) {
    await resolvePDFJSImports(options.pdfjs, { force: true })
  }
}
