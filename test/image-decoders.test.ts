import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractImages, extractText, getDocumentProxy, inspectPages, registerImageDecoders, renderPageAsImage } from '../src/index'
import { getPDF, isWorkerd } from './utils'

const LOAD_IMAGE_DECODER_KEY = Symbol.for('unpdf.loadImageDecoder')

const imageFunctions: [string, (data: Uint8Array) => Promise<unknown>][] = [
  ['extractImages', data => extractImages(data, 1)],
  ['inspectPages', data => inspectPages(data)],
]
// `@napi-rs/canvas` is a native addon workerd can't load.
if (!isWorkerd)
  imageFunctions.push(['renderPageAsImage', data => renderPageAsImage(data, 1, { canvasImport: () => import('@napi-rs/canvas') })])

describe('image decoders', () => {
  beforeEach(() => {
    vi.stubGlobal(LOAD_IMAGE_DECODER_KEY, undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(imageFunctions)('%s sets unpdf.loadImageDecoder and decodes CCITT and JPEG 2000 images without warnings', async (_, imageFunction) => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    await imageFunction(await getPDF('image-decoders.pdf'))

    expect((globalThis as Record<PropertyKey, unknown>)[LOAD_IMAGE_DECODER_KEY]).toBeTypeOf('function')
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  // Node.js shares PDF.js across files and keeps the WASM bytes an earlier test
  // loaded, so only workerd decodes through the registered loader here.
  it('registerImageDecoders lets PDF.js decode CCITT and JPEG 2000 images directly', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    registerImageDecoders()
    const pdf = await getDocumentProxy(await getPDF('image-decoders.pdf'))
    const page = await pdf.getPage(1)
    await page.getOperatorList()
    const images = await Promise.all(
      ['img_p0_1', 'img_p0_2'].map(name => new Promise<{ width: number }>(resolve => page.objs.get(name, resolve))),
    )
    await pdf.loadingTask.destroy()

    expect((globalThis as Record<PropertyKey, unknown>)[LOAD_IMAGE_DECODER_KEY]).toBeTypeOf('function')
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    expect(images.map(({ width }) => width)).toEqual([16, 2])
  })

  it('extractText leaves unpdf.loadImageDecoder unset', async () => {
    await extractText(await getPDF())

    expect((globalThis as Record<PropertyKey, unknown>)[LOAD_IMAGE_DECODER_KEY]).toBeUndefined()
  })

  // Only workerd isolates this file and decodes through the JS fallbacks, which
  // PDF.js loads on every attempt instead of caching the WASM bytes.
  it.runIf(isWorkerd)('extractImages decodes CCITT and JPEG 2000 images after PDF.js tried them without unpdf.loadImageDecoder', async () => {
    const pdf = await getDocumentProxy(await getPDF('image-decoders.pdf'))
    await (await pdf.getPage(1)).getOperatorList()

    const images = await extractImages(await getPDF('image-decoders.pdf'), 1)
    await pdf.loadingTask.destroy()

    expect(images.map(({ width }) => width)).toEqual([16, 2])
  })
})
