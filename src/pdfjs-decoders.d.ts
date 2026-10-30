declare module '#pdfjs-decoders' {
  export function loadDecoder(fileName: string): Promise<unknown>
}
