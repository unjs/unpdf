export async function getPDFJSImports() {
  try {
    const { default: mod } = await import('pdfjs-dist/legacy/build/pdf')
    const { getDocument, version } = mod
    return { getDocument, version }
  }
  catch (e) {
    console.error(e)
    throw new Error(
      'PDF.js is not available. Please run `pnpm add -D pdfjs-dist` and try again.',
    )
  }
}
