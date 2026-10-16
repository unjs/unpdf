// Inlined by the `?bytes` plugin, since workerd can't read the fixtures from the host file system.
import linksPDF from './fixtures/links.pdf?bytes'
import pdflatexImagePDF from './fixtures/pdflatex-image.pdf?bytes'
import samplePDF from './fixtures/sample.pdf?bytes'
import transparencyPDF from './fixtures/transparency.pdf?bytes'

const fixtures = {
  'links.pdf': linksPDF,
  'pdflatex-image.pdf': pdflatexImagePDF,
  'sample.pdf': samplePDF,
  'transparency.pdf': transparencyPDF,
}

export async function getPDF(filename: keyof typeof fixtures = 'sample.pdf') {
  // PDF.js takes ownership of the buffer it parses, so hand out a copy.
  return fixtures[filename].slice()
}
