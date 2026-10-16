import { describe, expect, it } from 'vitest'
import { getResolvedPDFJS } from '../src/index'

describe('pdfjs resolution', () => {
  it('provides the PDF.js module', async () => {
    const { version } = await getResolvedPDFJS()

    expect(version).toMatchInlineSnapshot(`"6.4.299"`)
  })
})
