// Inlined by the `?bytes` plugin, since workerd can't read the fixtures from the host file system.
import annotationImagePDF from './fixtures/annotation-image.pdf?bytes'
import cjkPredefinedCMapPDF from './fixtures/cjk-predefined-cmap.pdf?bytes'
import documentPDF from './fixtures/document.pdf?bytes'
import imagesPDF from './fixtures/images.pdf?bytes'
import pdflatexImagePDF from './fixtures/pdflatex-image.pdf?bytes'
import samplePDF from './fixtures/sample.pdf?bytes'
import scannedPagesPDF from './fixtures/scanned-pages.pdf?bytes'
import standardFontPDF from './fixtures/standard-font.pdf?bytes'
import transparencyPDF from './fixtures/transparency.pdf?bytes'
import unpaintedImagesPDF from './fixtures/unpainted-images.pdf?bytes'

type FixtureName
  = | 'annotation-image.pdf'
    | 'cjk-predefined-cmap.pdf'
    | 'document.pdf'
    | 'images.pdf'
    | 'pdflatex-image.pdf'
    | 'sample.pdf'
    | 'scanned-pages.pdf'
    | 'standard-font.pdf'
    | 'transparency.pdf'
    | 'unpainted-images.pdf'

const fixtures: Record<FixtureName, Uint8Array> = {
  'annotation-image.pdf': annotationImagePDF,
  'cjk-predefined-cmap.pdf': cjkPredefinedCMapPDF,
  'document.pdf': documentPDF,
  'images.pdf': imagesPDF,
  'pdflatex-image.pdf': pdflatexImagePDF,
  'sample.pdf': samplePDF,
  'scanned-pages.pdf': scannedPagesPDF,
  'standard-font.pdf': standardFontPDF,
  'transparency.pdf': transparencyPDF,
  'unpainted-images.pdf': unpaintedImagesPDF,
}

export async function getPDF(filename: FixtureName = 'sample.pdf'): Promise<Uint8Array> {
  // PDF.js takes ownership of the buffer it parses, so hand out a copy.
  return fixtures[filename].slice()
}

export const isWorkerd: boolean = globalThis.navigator?.userAgent === 'Cloudflare-Workers'
