import { describe, expect, it, vi } from 'vitest'
import { definePDFJSModule, getResolvedPDFJS } from '../src/index'
import { isWorkerd } from './utils'

describe('pdfjs resolution', () => {
  it('provides the PDF.js module', async () => {
    const { version } = await getResolvedPDFJS()

    expect(version).toMatchInlineSnapshot(`"6.4.299"`)
  })

  it('defers loading a defined PDF.js module until first use', async () => {
    // @ts-expect-error: Dynamic import from package build.
    const loader = vi.fn(() => import('../dist/pdfjs'))
    definePDFJSModule(loader)

    expect(loader).not.toHaveBeenCalled()

    await Promise.all([getResolvedPDFJS(), getResolvedPDFJS()])
    await getResolvedPDFJS()
    expect(loader).toHaveBeenCalledOnce()
  })

  it('retries loading after a failed load', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      // @ts-expect-error: Dynamic import from package build.
      .mockImplementation(() => import('../dist/pdfjs'))
    definePDFJSModule(loader)

    await expect(getResolvedPDFJS()).rejects.toThrow('PDF.js could not be resolved')
    await expect(getResolvedPDFJS()).resolves.toHaveProperty('version')
  })

  it.runIf(isWorkerd)('leaves jbig2.wasm and openjpeg.wasm out of #pdfjs-decoders under the workerd condition', async () => {
    const { loadDecoder } = await import('#pdfjs-decoders')

    await expect(loadDecoder('jbig2.wasm')).rejects.toThrow('No bundled decoder for jbig2.wasm')
    await expect(loadDecoder('openjpeg.wasm')).rejects.toThrow('No bundled decoder for openjpeg.wasm')
  })
})
