import type * as PDFJS from 'pdfjs-dist'

let instance: typeof PDFJS | undefined

export async function getDocumentProxy(data: ArrayBuffer) {
  const { getDocument } = instance!
  const pdf = await getDocument({
    data,
    useWorkerFetch: false,
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise

  return pdf
}

export function getResolvedPDFJSInstance() {
  return instance!
}

export async function resolvePDFJSWebImports() {
  if (instance)
    return

  try {
    const { default: mod } = await import('pdfjs-dist')
    instance = mod
  }
  catch (error) {
    throw new Error(
      'PDF.js is not available. Please add the package as a dependency.',
    )
  }
}

export async function resolvePDFJSNodeImports() {
  if (instance)
    return

  try {
    const { default: mod } = await import('pdfjs-dist/legacy/build/pdf')
    instance = mod
  }
  catch (error) {
    throw new Error(
      'PDF.js is not available. Please add the package as a dependency.',
    )
  }
}
