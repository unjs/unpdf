/**
 * Registers a lazy loader for PDF.js' JBIG2 and OpenJPEG decoders under the
 * global symbol the serverless PDF.js build reads. Only the functions that
 * decode images call this, so a bundle that only extracts text leaves them out.
 */
export function registerImageDecoders(): void {
  ;(globalThis as Record<PropertyKey, unknown>)[Symbol.for('unpdf.loadImageDecoder')] ??= async (fileName: string) => {
    const { loadDecoder } = await import('#pdfjs-decoders')
    return await loadDecoder(fileName)
  }
}
