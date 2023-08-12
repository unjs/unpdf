import type * as PDFJS from 'pdfjs-dist'

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
    throw new Error(
      'PDF.js is not available. Please add the package as a dependency.',
    )
  }
}
