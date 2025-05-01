/* eslint-disable antfu/no-import-dist */

// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore: Dynamic import from package build
import { definePDFJSModule, extractText, getDocumentProxy } from '../../dist/index.mjs'

export default {
  async fetch() {
    // Remove this line for production. Only needed to test local PDF.js builds.
    await definePDFJSModule(() => import('../../dist/pdfjs.mjs'))

    const buffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
      .then(res => res.arrayBuffer())
    const document = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(document, { mergePages: true })

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
      },
    })
  },
}
