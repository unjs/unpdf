import type { BinaryData, DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { UnPDFConfiguration } from './types'

let resolvedModule: typeof import('pdfjs-dist') | undefined

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `useWorkerFetch: false`
 * - `isEvalSupported: false`
 * - `useSystemFonts: true`
 */
export async function getDocumentProxy(data: BinaryData, options: DocumentInitParameters = {}) {
  const { getDocument } = await getResolvedPDFJS()
  const pdf = await getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    ...options,
  }).promise

  return pdf
}

export async function defineUnPDFConfig(options: UnPDFConfiguration) {
  const { pdfjs } = { ...options }

  if (pdfjs)
    await resolvePDFJSImports(pdfjs)
}

export async function getResolvedPDFJS() {
  if (!resolvedModule)
    await resolvePDFJSImports()

  return resolvedModule!
}

export async function resolvePDFJSImports(
  pdfjsResolver?: () => Promise<typeof import('pdfjs-dist') | typeof import('pdfjs-serverless')>,
) {
  if (resolvedModule)
    return

  if (pdfjsResolver) {
    try {
      const _import = await pdfjsResolver()
      // @ts-expect-error: Interop default export
      resolvedModule = _import.default || _import
      return
    }
    catch (error) {
      throw new Error('Resolving PDF.js failed. Please check the provided configuration.')
    }
  }

  try {
    const _import = await import('pdfjs-dist')
    resolvedModule = _import.default || _import
  }
  catch (error) {
    throw new Error('PDF.js is not available. Please add the package as a dependency.')
  }
}

export function isPDFDocumentProxy(data: unknown): data is PDFDocumentProxy {
  return typeof data === 'object' && data !== null && '_pdfInfo' in data
}
