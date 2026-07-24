import { writeFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { extractImages, getDocumentProxy, renderPageAsImage } from '../src/index'
import { getPDF } from './utils'

describe('image', () => {
  it('extracts images from a PDF', async () => {
    const [firstImage] = await extractImages(await getPDF('pdflatex-image.pdf'), 1)
    expect(firstImage!.key).toMatchInlineSnapshot('"img_p0_1"')
  })

  it('renders a PDF as image', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    await writeFile(
      new URL('artifacts/pdflatex-image.png', import.meta.url),
      new Uint8Array(result),
    )

    // Verify the buffer contains PNG header signature (first 8 bytes of a PNG file)
    const headerBytes = new Uint8Array(result, 0, 8)
    expect(Array.from(headerBytes)).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })

  it('renders a PDF as data URL', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      toDataURL: true,
    })

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDFLatex Image</title>
  </head>
  <body>
    <img alt="Image" src="${result}">
  </body>
</html>`
    await writeFile(
      new URL('artifacts/pdflatex-image.html', import.meta.url),
      html,
    )

    expect(result.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('renders a page with a soft mask from a pre-built document proxy', async () => {
    // Intermediate canvases (soft masks, transparency groups) are requested from
    // the document-level canvas factory, which for a proxy created without the
    // `CanvasFactory` option is the built-in PDF.js one — it must resolve
    // `@napi-rs/canvas` once `canvasImport` has been provided.
    // See https://github.com/unjs/unpdf/issues/53
    const pdf = await getDocumentProxy(await getPDF('transparency.pdf'))
    const result = await renderPageAsImage(pdf, 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    const headerBytes = new Uint8Array(result, 0, 8)
    expect(Array.from(headerBytes)).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})
