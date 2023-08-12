import type PDFJS from 'pdfjs-dist'

export interface UnPDFConfiguration {
  /**
   * By default, UnPDF will use the latest version of PDF.js. If you want to
   * use an older version or the legacy build, set a promise that resolves to
   * the PDF.js module.
   *
   * @example
   * () => import('pdfjs-dist/legacy/build/pdf.js')
   */
  pdfjs?: () => Promise<typeof PDFJS>
}
