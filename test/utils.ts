// Inlined by the `?bytes` plugin, since workerd can't read the fixtures from the host file system.
import cjkPredefinedCMapPDF from './fixtures/cjk-predefined-cmap.pdf?bytes'
import linksPDF from './fixtures/links.pdf?bytes'
import pdflatexImagePDF from './fixtures/pdflatex-image.pdf?bytes'
import samplePDF from './fixtures/sample.pdf?bytes'
import standardFontPDF from './fixtures/standard-font.pdf?bytes'
import transparencyPDF from './fixtures/transparency.pdf?bytes'

const fixtures = {
  'cjk-predefined-cmap.pdf': cjkPredefinedCMapPDF,
  'links.pdf': linksPDF,
  'pdflatex-image.pdf': pdflatexImagePDF,
  'sample.pdf': samplePDF,
  'standard-font.pdf': standardFontPDF,
  'transparency.pdf': transparencyPDF,
}

export async function getPDF(filename: keyof typeof fixtures = 'sample.pdf') {
  // PDF.js takes ownership of the buffer it parses, so hand out a copy.
  return fixtures[filename].slice()
}

// workerd reports itself through the user agent, even with `nodejs_compat`.
export const isWorkerd = globalThis.navigator?.userAgent === 'Cloudflare-Workers'
