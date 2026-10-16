import { resolvePDFJSImport } from './utils'

/**
 * Sets the PDF.js build every other method uses – call it before any of them.
 * Without it, the serverless build is used.
 *
 * @example
 * // In Node.js, the legacy build of `pdfjs-dist` (install it first)
 * import { definePDFJSModule } from 'unpdf'
 *
 * await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
 */
export async function definePDFJSModule(pdfjs: () => Promise<any>) {
  await resolvePDFJSImport(pdfjs, { reload: true })
}

/** @deprecated Use `definePDFJSModule` instead. Will be removed in v2. */
export async function configureUnPDF(options: { pdfjs?: () => Promise<any> }) {
  await resolvePDFJSImport(options.pdfjs, { reload: true })
}
