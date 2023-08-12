export async function getDocumentProxy(data: ArrayBuffer) {
  const { getDocument } = await getPDFJSImports()
  const pdf = await getDocument({
    data,
    useWorkerFetch: false,
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise

  return pdf
}

export async function getPDFJSImports() {
  try {
    const { default: mod } = await import('pdfjs-dist/legacy/build/pdf')
    return mod
  }
  catch (e) {
    console.error(e)
    throw new Error(
      'PDF.js is not available. Please run `pnpm add -D pdfjs-dist` and try again.',
    )
  }
}
