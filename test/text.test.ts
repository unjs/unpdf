import { describe, expect, it } from 'vitest'
import { extractText, extractTextItems } from '../src/index'
import { getPDF } from './utils'

describe('text', () => {
  it('extracts text from a PDF', async () => {
    const { text, totalPages } = await extractText(await getPDF())

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"')
    expect(totalPages).toMatchInlineSnapshot('1')
  })

  it('preserves line breaks and normalizes whitespace when merging pages', async () => {
    const { text } = await extractText(await getPDF('links.pdf'), { mergePages: true })

    // Guard against blind snapshot updates re-collapsing everything to one line
    expect(text).toContain('\n')
    expect(text).toMatchSnapshot()
  })

  it('extracts structured text items from a PDF', async () => {
    const { items, totalPages } = await extractTextItems(await getPDF())

    expect(totalPages).toBe(1)
    expect(items).toHaveLength(1)
    expect(items[0]!.length).toBeGreaterThan(0)

    const firstItem = items[0]![0]!
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
