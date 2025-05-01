import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'

let resolvedModule: typeof PDFJS | undefined

// eslint-disable-next-line node/prefer-global/process
export const isNode = globalThis.process?.release?.name === 'node'
export const isBrowser = typeof window !== 'undefined'

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `isEvalSupported: false`
 * - `useSystemFonts: true`
 */
export async function getDocumentProxy(
  data: DocumentInitParameters['data'],
  options: DocumentInitParameters = {},
) {
  const { getDocument } = await getResolvedPDFJS()
  const pdf = await getDocument({
    data,
    isEvalSupported: false,
    // See: https://github.com/mozilla/pdf.js/issues/4244#issuecomment-1479534301
    useSystemFonts: true,
    ...options,
  }).promise

  return pdf
}

export async function getResolvedPDFJS(): Promise<typeof PDFJS> {
  if (!resolvedModule) {
    await resolvePDFJSImport()
  }

  return resolvedModule!
}

export async function resolvePDFJSImport(
  pdfjsResolver?: () => Promise<any>,
  { reload = false } = {},
) {
  if (resolvedModule && !reload) {
    return
  }

  if (pdfjsResolver) {
    try {
      resolvedModule = await interopDefault(pdfjsResolver())
      return
    }
    catch (error) {
      throw new Error(`PDF.js could not be resolved: ${error}`)
    }
  }

  try {
    // @ts-expect-error: Type mismatch
    resolvedModule = await import('unpdf/pdfjs')
  }
  catch (error) {
    throw new Error(`Built-in PDF.js module could not be resolved: ${error}`)
  }
}

export function isPDFDocumentProxy(data: unknown): data is PDFDocumentProxy {
  return typeof data === 'object' && data !== null && '_pdfInfo' in data
}

export async function interopDefault<T>(
  m: T | Promise<T>,
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m
  return (resolved as any).default || resolved
}
