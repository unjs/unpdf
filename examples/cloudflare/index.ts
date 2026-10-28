import { extractText, getDocumentProxy } from 'unpdf'

export default {
  async fetch(): Promise<Response> {
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
