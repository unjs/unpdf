import { describe, expect, it } from 'vitest'
import { extractLinks } from '../src/index'
import { getPDF } from './utils'

describe('links', () => {
  it('extracts links from a PDF', async () => {
    const { links, totalPages } = await extractLinks(await getPDF('links.pdf'))
    expect(links.length).toMatchInlineSnapshot('4')
    expect(links[0]).toMatchInlineSnapshot('"https://www.antennahouse.com/"')
    expect(totalPages).toMatchInlineSnapshot('2')
  })
})
