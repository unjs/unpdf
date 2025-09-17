import { readFile, writeFile } from 'node:fs/promises'
/* eslint-disable ts/ban-ts-comment */
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  definePDFJSModule,
  extractImages,
  extractLinks,
  extractText,
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

    expect(version).toMatchInlineSnapshot(`"5.4.54"`)
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

  it('supports passing PDFDocumentProxy', async () => {
    const pdf = await getDocumentProxy(await getPDF())
    const { info } = await getMeta(pdf)

    expect(info.Creator).toMatchInlineSnapshot('"Writer"')
  })

  it('getMeta() handles parseDates option', async () => {
    // when parseDates is enabled - should add Date objects
    const { info: infoWithDates } = await getMeta(await getPDF(), { parseDates: true })

    expect(infoWithDates.CreationDateObject).toBeInstanceOf(Date)
    expect(infoWithDates.ModDateObject).toBeNull() // ModDate is not present in sample.pdf

    // Verify the parsed date matches the expected creation date (D:20070223175637+02'00')
    expect(infoWithDates.CreationDateObject.getFullYear()).toBe(2007)
    expect(infoWithDates.CreationDateObject.getMonth()).toBe(1) // February (0-based)
    expect(infoWithDates.CreationDateObject.getDate()).toBe(23)
    expect(infoWithDates.CreationDate).toBe('D:20070223175637+02\'00\'')

    // when parseDates is disabled (default)/false - should not add Date objects
    const { info: infoDefault } = await getMeta(await getPDF())

    expect(infoDefault.CreationDateObject).toBeUndefined()
    expect(infoDefault.ModDateObject).toBeUndefined()
    expect(infoDefault.CreationDate).toBe('D:20070223175637+02\'00\'')

    // parseDates with PDFDocumentProxy and XMP metadata date parsing
    const pdf = await getDocumentProxy(await getPDF())

    const originalGetMetadata = pdf.getMetadata
    pdf.getMetadata = async () => {
      const originalMeta = await originalGetMetadata.call(pdf)
      // Create a new metadata object that preserves all original properties
      const mockMetadata = Object.create(originalMeta.metadata || {})
      // Override only the get method
      mockMetadata.get = (key: string) => {
        if (key === 'xmp:createdate')
          return '2023-01-15T10:30:45Z'
        if (key === 'xmp:modifydate')
          return '2023-03-20T14:25:30Z'
        return originalMeta.metadata?.get?.(key)
      }
      return { ...originalMeta, metadata: mockMetadata }
    }

    const { info: infoXMP } = await getMeta(pdf, { parseDates: true })

    // XMP dates should be prioritized over PDF info dates
    expect(infoXMP.CreationDateObject.getFullYear()).toBe(2023)
    expect(infoXMP.CreationDateObject.getMonth()).toBe(0) // January (0-based)
    expect(infoXMP.CreationDateObject.getDate()).toBe(15)
    expect(infoXMP.ModDateObject).toBeInstanceOf(Date)
    expect(infoXMP.ModDateObject.getFullYear()).toBe(2023)
    expect(infoXMP.ModDateObject.getMonth()).toBe(2) // March (0-based)
    expect(infoXMP.CreationDate).toBe('D:20070223175637+02\'00\'') // Original should remain
  })
})

async function getPDF(filename = 'sample.pdf') {
  const pdf = await readFile(join(fixturesDir, filename))
  return new Uint8Array(pdf)
}
