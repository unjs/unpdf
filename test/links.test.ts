import { describe, expect, it } from 'vitest'
import { extractLinks } from '../src/index'
import { getPDF } from './utils'

describe('links', () => {
  it('extracts the URL of each external link per page', async () => {
    const { links, totalPages } = await extractLinks(await getPDF('document.pdf'))

    expect(totalPages).toBe(2)
    expect(links).toEqual([
      ['https://github.com/unjs/unpdf', 'https://mozilla.github.io/pdf.js/'],
      ['https://unjs.io/'],
    ])
  })
})
