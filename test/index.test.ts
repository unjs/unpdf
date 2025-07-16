import { readFile, writeFile } from 'node:fs/promises'
/* eslint-disable ts/ban-ts-comment */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  definePDFJSModule,
  extractImages,
  extractText,
  extractLinks,
  getDocumentProxy,
  getMeta,
  getResolvedPDFJS,
  renderPageAsImage,
} from '../src/index'

const fixturesDir = fileURLToPath(new URL('fixtures', import.meta.url))

describe('unpdf', () => {
  it('can resolve a custom PDF.js version', async () => {
    // @ts-ignore: Dynamic import from package build
    await definePDFJSModule(() => import('../dist/pdfjs'))
    const { text } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
  })

  it('provides the PDF.js module', async () => {
    const PDFJS = await getResolvedPDFJS()
    const { version } = PDFJS

    expect(version).toMatchInlineSnapshot(`"5.2.133"`)
  })

  it('extracts metadata from a PDF', async () => {
    const { info, metadata } = await getMeta(await getPDF())

    expect(Object.keys(metadata).length).toEqual(0)
    expect(info).toMatchInlineSnapshot(`
      {
        "Author": "Evangelos Vlachogiannis",
        "CreationDate": "D:20070223175637+02'00'",
        "Creator": "Writer",
        "EncryptFilterName": null,
        "IsAcroFormPresent": false,
        "IsCollectionPresent": false,
        "IsLinearized": false,
        "IsSignaturesPresent": false,
        "IsXFAPresent": false,
        "Language": null,
        "PDFFormatVersion": "1.4",
        "Producer": "OpenOffice.org 2.1",
      }
    `)
  })

  it('extracts text from a PDF', async () => {
    const { text, totalPages } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
    expect(totalPages).toMatchInlineSnapshot('1')
  })

  it('extracts links from a PDF', async () => {
    const { links, totalPages } = await extractLinks(await getPDF('links.pdf'))
    expect(links.length).toMatchInlineSnapshot('4')
    expect(links[0]).toMatchInlineSnapshot('"https://www.antennahouse.com/"')
    expect(totalPages).toMatchInlineSnapshot('2')
  })

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

  it('supports passing PDFDocumentProxy', async () => {
    const pdf = await getDocumentProxy(await getPDF())
    const { info } = await getMeta(pdf)

    expect(info.Creator).toMatchInlineSnapshot('"Writer"')
  })
})

async function getPDF(filename = 'sample.pdf') {
  const pdf = await readFile(join(fixturesDir, filename))
  return new Uint8Array(pdf)
}
