import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import {
  defineUnPDFConfig,
  extractPDFText,
  getDocumentProxy,
  getPDFMeta,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from '../src/index.node'
import { getPDF } from './utils'

describe('unpdf', () => {
  it('extracts text from a PDF', async () => {
    const { text, totalPages } = await extractPDFText(await getPDF())

    strictEqual(text[0], 'Dummy PDF file')
    strictEqual(totalPages, 1)
  })

  it('extracts metadata from a PDF', async () => {
    const { info, metadata } = await getPDFMeta(await getPDF())

    strictEqual(Object.keys(metadata).length, 0)
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

  it('supports PDF passing PDFDocumentProxy', async () => {
    const pdf = await getDocumentProxy(await getPDF())
    const { info } = await getPDFMeta(pdf)

    strictEqual(info.Creator, 'Writer')
  })

  it('provides the PDF.js module', async () => {
    const PDFJS = await getResolvedPDFJS()
    const { version } = PDFJS

    strictEqual(version, '3.9.179')
  })

  it('can resolve a custom PDF.js module', async () => {
    await resolvePDFJSImports(() => import('pdfjs-dist/legacy/build/pdf.js'))
    const { text } = await extractPDFText(await getPDF())

    strictEqual(text[0], 'Dummy PDF file')
  })

  it('supports pdfjs-serverless package', async () => {
    await resolvePDFJSImports(() => import('pdfjs-serverless'))
    const { text } = await extractPDFText(await getPDF())

    strictEqual(text[0], 'Dummy PDF file')
  })

  it('can define a configuration', async () => {
    await defineUnPDFConfig({
      pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
    })
    const { text } = await extractPDFText(await getPDF())

    strictEqual(text[0], 'Dummy PDF file')
  })
})
