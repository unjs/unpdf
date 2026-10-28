import { describe, expect, it, vi } from 'vitest'
import { getDocumentProxy, renderPageAsImage } from '../src/index'
import { getPDF } from './utils'

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const JPEG_SIGNATURE = [0xFF, 0xD8, 0xFF]

describe('renderPageAsImage', () => {
  it('renders a PDF as image', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(Array.from(result.subarray(0, 8))).toEqual(PNG_SIGNATURE)
  })

  it('encodes a lower JPEG quality into fewer bytes', async () => {
    const render = async (quality: number) => renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      format: 'jpeg',
      quality,
    })
    const [lowQuality, highQuality] = await Promise.all([render(0.1), render(0.9)])

    expect(Array.from(lowQuality.subarray(0, 3))).toEqual(JPEG_SIGNATURE)
    expect(lowQuality.length).toBeLessThan(highQuality.length / 2)
  })

  it('renders a PDF as data URL', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      toDataURL: true,
    })

    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('renders a PDF as a JPEG data URL with format jpeg', async () => {
    const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      format: 'jpeg',
      toDataURL: true,
    })

    expect(result).toMatch(/^data:image\/jpeg;base64,/)
  })

  it.each(['scale', 'width', 'height'])('rejects a %s of 0', async (option) => {
    await expect(renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
      canvasImport: () => import('@napi-rs/canvas'),
      [option]: 0,
    })).rejects.toThrow('Invalid canvas size')
  })

  it('renders with @napi-rs/canvas when a DOM shim defines `document`', async () => {
    // Forget the canvas module earlier tests shared with PDF.js.
    vi.stubGlobal(Symbol.for('unpdf.canvasModule'), undefined)
    vi.stubGlobal('document', {})

    try {
      const result = await renderPageAsImage(await getPDF('pdflatex-image.pdf'), 1, {
        canvasImport: () => import('@napi-rs/canvas'),
      })

      expect(Array.from(result.subarray(0, 8))).toEqual(PNG_SIGNATURE)
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('renders a page with a soft mask from a pre-built document proxy', async () => {
    // Intermediate canvases (soft masks, transparency groups) come from the
    // built-in PDF.js canvas factory, which must resolve `@napi-rs/canvas` once
    // `canvasImport` has been provided.
    const pdf = await getDocumentProxy(await getPDF('transparency.pdf'))
    const result = await renderPageAsImage(pdf, 1, {
      canvasImport: () => import('@napi-rs/canvas'),
    })

    expect(Array.from(result.subarray(0, 8))).toEqual(PNG_SIGNATURE)
  })
})
