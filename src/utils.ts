import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type * as PDFJS from 'pdfjs-dist/types/src/pdf'
import { stubBrowserGlobals } from './_internal/env'

let pdfjsLoader: (() => Promise<any>) | undefined
let resolvedModule: Promise<typeof PDFJS> | undefined

// eslint-disable-next-line node/prefer-global/process
export const isNode = globalThis.process?.release?.name === 'node'

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

/**
 * Sets the PDF.js build every other method uses. The build loads on first use,
 * so call this before any other method. Without it, the serverless build is
 * used.
 *
 * @example
 * // In Node.js, the legacy build of `pdfjs-dist` (install it first)
 * import { definePDFJSModule } from 'unpdf'
 *
 * definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
 */
export function definePDFJSModule(pdfjs: () => Promise<any>): void {
  pdfjsLoader = pdfjs
  resolvedModule = undefined
}

export function getResolvedPDFJS(): Promise<typeof PDFJS> {
  resolvedModule ??= loadPDFJS(pdfjsLoader).catch((error) => {
    // Let the next call retry instead of caching the failure.
    resolvedModule = undefined
    throw error
  })

  return resolvedModule
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

async function loadPDFJS(loader?: () => Promise<any>): Promise<typeof PDFJS> {
  stubBrowserGlobals()

  try {
    return await interopDefault(loader ? loader() : import('unpdf/pdfjs'))
  }
  catch (error) {
    throw new Error(`PDF.js could not be resolved: ${error}`, { cause: error })
  }
}
