import { describe, expect, it, vi } from 'vitest'
import { getDocumentProxy, inspectPages } from '../src/index'
import { getPDF } from './utils'

describe('inspectPages', () => {
  it('measures the text, invisible text and image coverage of every page', async () => {
    const result = await inspectPages(await getPDF('scanned-pages.pdf'))

    expect(result).toEqual({
      totalPages: 4,
      pages: [
        // Four overlapping strips, the last one clipped to the page.
        { textLength: 0, invisibleTextLength: 0, imageCount: 4, imageCoverage: 1 },
        // "Hello World", "Ab", "cd", "ef" and "gh" drawn invisibly, "xyz" visibly.
        { textLength: 21, invisibleTextLength: 18, imageCount: 1, imageCoverage: 0.5 },
        { textLength: 0, invisibleTextLength: 0, imageCount: 0, imageCoverage: 0 },
        // A quarter-page image in a scaled form XObject, plus two images sharing an eighth.
        { textLength: 0, invisibleTextLength: 0, imageCount: 3, imageCoverage: 0.375 },
      ],
    })
  })

  it('releases the pages of documents it opens, but not of caller-owned proxies', async () => {
    const pdf = await getDocumentProxy(await getPDF('scanned-pages.pdf'))
    const cleanupSpy = vi.spyOn(Object.getPrototypeOf(await pdf.getPage(1)), 'cleanup')

    try {
      await inspectPages(await getPDF('scanned-pages.pdf'))
      expect(cleanupSpy).toHaveBeenCalledTimes(4)

      cleanupSpy.mockClear()
      await inspectPages(pdf)
      expect(cleanupSpy).not.toHaveBeenCalled()
    }
    finally {
      cleanupSpy.mockRestore()
      await pdf.loadingTask.destroy()
    }
  })
})
