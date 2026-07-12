import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'
import { stubBrowserGlobals } from './_internal/env'

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
 *
 * In Node.js environments, additionally applies:
 * - `disableFontFace: true`
 * - `standardFontDataUrl` resolved from the local `pdfjs-dist` package
 * - `cMapUrl` and `cMapPacked` resolved from the local `pdfjs-dist` package
 */
export async function getDocumentProxy(
  data: DocumentInitParameters['data'],
  options: DocumentInitParameters = {},
) {
  const { getDocument } = await getResolvedPDFJS()

  let nodeDefaults: Partial<DocumentInitParameters> = {}
  if (isNode) {
    try {
      const base = import.meta.resolve('pdfjs-dist/package.json')
      nodeDefaults = {
        disableFontFace: true,
        standardFontDataUrl: new URL('./standard_fonts/', base).href,
        cMapUrl: new URL('./cmaps/', base).href,
        cMapPacked: true,
      }
    }
    catch {
      // pdfjs-dist not installed (e.g. using serverless bundle), skip font defaults
    }
  }

  const pdf = await getDocument({
    data,
    isEvalSupported: false,
    // See: https://github.com/mozilla/pdf.js/issues/4244#issuecomment-1479534301
    useSystemFonts: true,
    ...nodeDefaults,
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

  stubBrowserGlobals()

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
    throw new Error(`Serverless PDF.js bundle could not be resolved: ${error}`)
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
