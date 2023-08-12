import type * as PDFJS from 'pdfjs-dist'
import type { UnPDFConfiguration } from './types'

let resolvedModule: typeof PDFJS | undefined

export async function getDocumentProxy(data: ArrayBuffer) {
  const { getDocument } = getResolvedPDFJS()
  const pdf = await getDocument({
    data,
    useWorkerFetch: false,
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise

  return pdf
}

export async function defineUnPDFConfig({ pdfjs }: UnPDFConfiguration) {
  if (pdfjs) {
    try {
      resolvedModule = await pdfjs()
    }
    catch (error) {
      throw new Error('Resolving the PDF.js module failed. Please check your configuration.')
    }
  }
}

export function getResolvedPDFJS() {
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
