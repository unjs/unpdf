/**
 * Registers PDF.js' JBIG2 and OpenJPEG decoders, which CCITT, JBIG2, and JPEG
 * 2000 images need, with the serverless PDF.js build. `extractImages`,
 * `renderPageAsImage`, and `inspectPages` call this themselves, so a bundle that
 * only extracts text leaves the decoders out. Call it before decoding these
 * images through PDF.js directly; the decoders load on the first such image.
 * Another build set through `definePDFJSModule`, such as `pdfjs-dist`, ignores
 * it and loads its decoders from `wasmUrl`, which `getDocumentProxy` sets in
 * Node.js.
 */
export function registerImageDecoders(): void {
  ;(globalThis as Record<PropertyKey, unknown>)[Symbol.for('unpdf.loadImageDecoder')] ??= async (fileName: string) => {
    const { loadDecoder } = await import('#pdfjs-decoders')
    return await loadDecoder(fileName)
  }
}
