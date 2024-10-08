import type * as _PDFJS from 'pdfjs-dist/types/src/pdf'

export type PDFJS = typeof _PDFJS

export interface UnPDFConfiguration {
  /**
   * By default, UnPDF will use the latest version of PDF.js compiled for
   * serverless environments. If you want to use a different version, you can
   * provide a custom resolver function.
   *
   * @example
   * // Use the official PDF.js build (make sure to install it first)
   * () => import('pdfjs-dist')
   */
  pdfjs?: () => Promise<any>
}
