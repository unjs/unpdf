import { describe, expect, it, vi } from 'vitest'
import { extractLinks, getDocumentProxy } from '../src/index'
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

  it('releases the pages of documents it opens, but not of caller-owned proxies', async () => {
    const pdf = await getDocumentProxy(await getPDF('document.pdf'))
    const cleanupSpy = vi.spyOn(Object.getPrototypeOf(await pdf.getPage(1)), 'cleanup')

    try {
      await extractLinks(await getPDF('document.pdf'))
      expect(cleanupSpy).toHaveBeenCalledTimes(2)

      cleanupSpy.mockClear()
      await extractLinks(pdf)
      expect(cleanupSpy).not.toHaveBeenCalled()
    }
    finally {
      cleanupSpy.mockRestore()
      await pdf.loadingTask.destroy()
    }
  })
})
