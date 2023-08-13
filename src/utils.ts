import type PDFJS from 'pdfjs-dist'
import type { BinaryData, DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { UnPDFConfiguration } from './types'

let resolvedModule: typeof PDFJS | undefined

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `useWorkerFetch: false`
 * - `isEvalSupported: false`
 * - `useSystemFonts: true`
 */
export async function getDocumentProxy(data: BinaryData, options: DocumentInitParameters = {}) {
  const {
    useWorkerFetch = false,
    isEvalSupported = false,
    useSystemFonts = true,
    ...rest
  } = options

  const { getDocument } = await getResolvedPDFJS()
  const pdf = await getDocument({
    data,
    useWorkerFetch,
    useSystemFonts,
    isEvalSupported,
    ...rest,
  }).promise

  return pdf
}

export async function defineUnPDFConfig({ pdfjs }: UnPDFConfiguration) {
  if (pdfjs) {
    try {
      // @ts-expect-error: CJS module needs to be transformed to ESM
      const { default: mod } = await pdfjs()
      resolvedModule = mod
    }
    catch (error) {
      throw new Error('Resolving the PDF.js module failed. Please check your configuration.')
    }
  }
}

export async function getResolvedPDFJS() {
  if (!resolvedModule)
    await resolvePDFJSImports()

  return resolvedModule!
}

export async function resolvePDFJSImports() {
  if (resolvedModule)
    return

  try {
    const { default: mod } = await import('pdfjs-dist')
    resolvedModule = mod
  }
  catch (error) {
    throw new Error('PDF.js is not available. Please add the package as a dependency.')
  }
}

export function isPDFDocumentProxy(data: unknown): data is PDFDocumentProxy {
  return typeof data === 'object' && data !== null && '_pdfInfo' in data
}
