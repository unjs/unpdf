import { describe, expect, it } from 'vitest'
import { inspectPages } from '../src/index'
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
})
