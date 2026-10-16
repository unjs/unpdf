import { describe, expect, it } from 'vitest'
import { extractImages, getDocumentProxy, renderPageAsImage } from '../src/index'
import { getPDF } from './utils'

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

describe('image', () => {
  it('extracts images from a PDF', async () => {
    const [firstImage] = await extractImages(await getPDF('pdflatex-image.pdf'), 1)
    expect(firstImage!.key).toMatchInlineSnapshot('"img_p0_1"')
  })

  it('renders a PDF as image', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    expect(Array.from(new Uint8Array(result, 0, 8))).toEqual(PNG_SIGNATURE)
  })

  it('renders a PDF as data URL', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      toDataURL: true,
    })

    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('renders a page with a soft mask from a pre-built document proxy', async () => {
    // Intermediate canvases (soft masks, transparency groups) are requested from
    // the document-level canvas factory, which for a proxy created without the
    // `CanvasFactory` option is the built-in PDF.js one – it must resolve
    // `@napi-rs/canvas` once `canvasImport` has been provided.
    const pdf = await getDocumentProxy(await getPDF('transparency.pdf'))
    const result = await renderPageAsImage(pdf, 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    expect(Array.from(new Uint8Array(result, 0, 8))).toEqual(PNG_SIGNATURE)
  })
})
