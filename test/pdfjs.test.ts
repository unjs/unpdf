/* eslint-disable ts/ban-ts-comment */
import { describe, expect, it } from 'vitest'
import { definePDFJSModule, extractText, getResolvedPDFJS } from '../src/index'
import { getPDF } from './utils'

describe('pdfjs resolution', () => {
  it('can resolve a custom PDF.js version', async () => {
    // @ts-ignore: Dynamic import from package build
    await definePDFJSModule(() => import('../dist/pdfjs'))
    const { text } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
  })

  it('provides the PDF.js module', async () => {
    const PDFJS = await getResolvedPDFJS()
    const { version } = PDFJS

    expect(version).toMatchInlineSnapshot(`"6.1.200"`)
  })
})
