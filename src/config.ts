import { resolvePDFJSImport } from './utils'

/**
 * By default, unpdf will use the latest version of PDF.js compiled for
 * serverless environments. If you want to use a different version, you can
 * provide a custom resolver function.
 *
 * @example
 * // Use the official PDF.js build (make sure to install it first)
 * import { definePDFJSModule } from 'unpdf'
 *
 * await definePDFJSModule(() => import('pdfjs-dist'))
 */
export async function definePDFJSModule(pdfjs: () => Promise<any>) {
  await resolvePDFJSImport(pdfjs, { reload: true })
}

/** @deprecated Use `definePDFJSModule` instead. */
export async function configureUnPDF(options: { pdfjs?: () => Promise<any> }) {
  await resolvePDFJSImport(options.pdfjs, { reload: true })
}
