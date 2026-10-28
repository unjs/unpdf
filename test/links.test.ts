import { describe, expect, it } from 'vitest'
import { extractLinks } from '../src/index'
import { getPDF } from './utils'

describe('links', () => {
  it('extracts links per page', async () => {
    const { links, totalPages } = await extractLinks(await getPDF('links.pdf'))

    const url = 'https://www.antennahouse.com/'

    expect(totalPages).toBe(2)
    expect(links).toEqual([[url, url], [url, url]])
  })
})
