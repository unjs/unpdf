import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { decodePDFText, defineUnPDFConfig } from '../src/index.node'
import DummyPDFDataUri from './fixtures/dummy'

describe('unpdf', () => {
  it('extracts text from a PDF', async () => {
    const pdf = await fetch(DummyPDFDataUri).then(res => res.arrayBuffer())
    const { text, info, totalPages } = await decodePDFText(pdf)

    strictEqual(text[0], 'Dummy PDF file')
    strictEqual(totalPages, 1)
    deepStrictEqual(info, {
      PDFFormatVersion: '1.4',
      Language: null,
      EncryptFilterName: null,
      IsLinearized: false,
      IsAcroFormPresent: false,
      IsXFAPresent: false,
      IsCollectionPresent: false,
      IsSignaturesPresent: false,
      Author: 'Evangelos Vlachogiannis',
      Creator: 'Writer',
      Producer: 'OpenOffice.org 2.1',
      CreationDate: 'D:20070223175637+02\'00\'',
    })
  })

  it('can use a custom PDF.js module', async () => {
    await defineUnPDFConfig({
      pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
    })
    const pdf = await fetch(DummyPDFDataUri).then(res => res.arrayBuffer())
    const { text } = await decodePDFText(pdf)

    strictEqual(text[0], 'Dummy PDF file')
  })
})
