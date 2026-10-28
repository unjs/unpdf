import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'
import { stubBrowserGlobals } from './_internal/env'

let resolvedModule: typeof PDFJS | undefined

// eslint-disable-next-line node/prefer-global/process
export const isNode = globalThis.process?.release?.name === 'node'
export const isBrowser = typeof window !== 'undefined'

/**
 * Creates a `PDFDocumentProxy` from binary PDF data.
 *
 * Applies the following defaults:
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
      // PDF.js reads these with `fs.readFile`, which takes strings as paths,
      // not as `file:` URLs. PDF.js also appends file names without a separator
      // and rejects a value without a trailing `/` – a separator Windows accepts.
      // eslint-disable-next-line node/prefer-global/process
      const nodeProcess = globalThis.process
      const { dirname, join } = nodeProcess.getBuiltinModule('node:path')
      const { fileURLToPath } = nodeProcess.getBuiltinModule('node:url')
      const pdfjsDir = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')))
      nodeDefaults = {
        disableFontFace: true,
        standardFontDataUrl: `${join(pdfjsDir, 'standard_fonts')}/`,
        cMapUrl: `${join(pdfjsDir, 'cmaps')}/`,
        cMapPacked: true,
      }
    }
    catch {
      // `pdfjs-dist` is not installed (e.g. when using the serverless
      // bundle), so skip the font defaults.
    }
  }

  const pdf = await getDocument({
    data,
    // See: https://github.com/mozilla/pdf.js/issues/4244#issuecomment-1479534301
    useSystemFonts: true,
    ...nodeDefaults,
    ...options,
  }).promise

  return pdf
}

/**
 * Runs an operation on a `PDFDocumentProxy` resolved from either binary data
 * or an existing proxy. Documents created here are destroyed once the
 * operation settles – caller-supplied proxies keep their lifecycle with the
 * caller.
 */
export async function withDocument<T>(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  operation: (pdf: PDFDocumentProxy) => Promise<T>,
  options?: DocumentInitParameters,
): Promise<T> {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data, options)

  try {
    return await operation(pdf)
  }
  finally {
    if (pdf !== data)
      await pdf.loadingTask.destroy()
  }
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
    // @ts-expect-error: Type mismatch.
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
