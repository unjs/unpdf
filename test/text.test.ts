import { describe, expect, expectTypeOf, it } from 'vitest'
import { extractText, extractTextItems, getDocumentProxy, getResolvedPDFJS } from '../src/index'
import { getPDF, isWorkerd } from './utils'

describe('text', () => {
  it('extracts text from a PDF', async () => {
    const { text, totalPages } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
    expect(totalPages).toMatchInlineSnapshot('1')
  })

  it('preserves line breaks and normalizes whitespace when merging pages', async () => {
    const { text } = await extractText(await getPDF('document.pdf'), { mergePages: true })

    expect(text).toBe('Links to pages\nunpdf on GitHub\nPDF.js by Mozilla\nUnJS ecosystem\nBack to page one')
  })

  // Workers have no local `pdfjs-dist` to load the CMap data from.
  it.skipIf(isWorkerd)('extracts text encoded with a predefined CJK CMap', async () => {
    const { text } = await extractText(await getPDF('cjk-predefined-cmap.pdf'))

    expect(text[0]).toBe('日本語テキスト')
  })

  it.skipIf(isWorkerd)('loads standard font data from the local pdfjs-dist', async () => {
    const { OPS } = await getResolvedPDFJS()
    const pdf = await getDocumentProxy(await getPDF('standard-font.pdf'))
    const page = await pdf.getPage(1)
    const { fnArray, argsArray } = await page.getOperatorList()
    const [fontId] = argsArray[fnArray.indexOf(OPS.setFont)]

    expect(page.commonObjs.get(fontId).missingFile).toBe(false)
    await pdf.loadingTask.destroy()
  })

  it('extracts structured text items from a PDF', async () => {
    const { items, totalPages } = await extractTextItems(await getPDF())

    expect(totalPages).toBe(1)
    expect(items).toHaveLength(1)

    const firstItem = items[0]![0]!
    expectTypeOf(firstItem.dir).toEqualTypeOf<'ltr' | 'rtl' | 'ttb'>()
    expect(firstItem).toMatchInlineSnapshot(`
      {
        "dir": "ltr",
        "fontFamily": "sans-serif",
        "fontSize": 16.1,
        "hasEOL": false,
        "height": 16.1,
        "str": "Dummy PDF file",
        "width": 123.41130000000003,
        "x": 56.8,
        "y": 758.1,
      }
    `)
  })
})
