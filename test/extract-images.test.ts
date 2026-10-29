import { describe, expect, it, vi } from 'vitest'
import { extractImages, getDocumentProxy } from '../src/index'
import { getPDF, isWorkerd } from './utils'

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

const COLORS: Record<string, number[]> = {
  R: [255, 0, 0, 255],
  G: [0, 255, 0, 255],
  B: [0, 0, 255, 255],
  W: [255, 255, 255, 255],
  K: [0, 0, 0, 255],
  T: [0, 0, 0, 0],
}

// The pixels `test/fixtures/images.pdf` was built from, in painting order.
const FIXTURE_IMAGES = [
  { key: 'img_p0_1', width: 2, height: 1, data: pixels('RB') },
  { key: null, width: 2, height: 2, data: pixels('RG' + 'BW') },
  { key: 'mask_p0_2', width: 3, height: 2, data: pixels('KTK' + 'TKT') },
  { key: 'img_p0_3', width: 10, height: 2, data: pixels('WWWWKKKKKW' + 'KKKKWWWWWK') },
]

describe('extractImages', () => {
  it('extracts image XObjects, inline images, image masks and 1-bit images as RGBA', async () => {
    const images = await extractImages(await getPDF('images.pdf'), 1)

    expect(images.map(({ key, width, height, data }) => ({ key, width, height, data: Array.from(data) })))
      .toEqual(FIXTURE_IMAGES)
  })

  it('returns the bounds of each image in PDF user space', async () => {
    const images = await extractImages(await getPDF('images.pdf'), 1)

    expect(images.map(image => image.bounds)).toEqual([
      { x: 10, y: 20, width: 100, height: 50 },
      { x: 110, y: 100, width: 40, height: 40 },
      { x: 200, y: 150, width: 30, height: 20 },
      { x: 20, y: 250, width: 50, height: 10 },
    ])
  })

  it('maps images of annotation appearances onto the annotation rectangle', async () => {
    const [image] = await extractImages(await getPDF('annotation-image.pdf'), 1)

    expect(image!.bounds).toEqual({ x: 50, y: 60, width: 100, height: 50 })
  })

  it('skips images in soft masks and hidden layers', async () => {
    const pdf = await getDocumentProxy(await getPDF('unpainted-images.pdf'))
    const pageImages = await Promise.all([extractImages(pdf, 1), extractImages(pdf, 2)])

    expect(pageImages.map(images => images.map(image => image.bounds))).toEqual([
      [{ x: 0, y: 0, width: 50, height: 50 }],
      [{ x: 0, y: 0, width: 50, height: 50 }],
    ])
    await pdf.loadingTask.destroy()
  })

  it('returns pixel data that later extractions from the same proxy do not share', async () => {
    const pdf = await getDocumentProxy(await getPDF('images.pdf'))
    const [, firstInlineImage] = await extractImages(pdf, 1)
    firstInlineImage!.data.fill(0)

    const [, secondInlineImage] = await extractImages(pdf, 1)
    expect(Array.from(secondInlineImage!.data)).toEqual(FIXTURE_IMAGES[1]!.data)

    await pdf.loadingTask.destroy()
  })

  it('encodes images as 8-bit RGBA PNGs with format png', async () => {
    const images = await extractImages(await getPDF('images.pdf'), 1, { format: 'png' })

    expect(images.map(({ data }) => readPNGHeader(data))).toEqual(
      FIXTURE_IMAGES.map(({ width, height }) => ({
        signature: PNG_SIGNATURE,
        width,
        height,
        bitDepth: 8,
        colorType: 6,
      })),
    )
  })

  it('extracts CCITT and JPEG 2000 images without warnings', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')
    const images = await extractImages(await getPDF('image-decoders.pdf'), 1)

    expect(consoleWarnSpy).not.toHaveBeenCalled()

    expect(images.map(({ width, height, data }) => ({ width, height, data: Array.from(data) }))).toEqual([
      { width: 16, height: 4, data: pixels('KKKKKKKKWWWWWWWW'.repeat(2) + 'WWWWWWWWKKKKKKKK'.repeat(2)) },
      { width: 2, height: 1, data: pixels('RB') },
    ])
  })

  it.skipIf(isWorkerd)('encodes PNGs that decode to the pixels of each image', async () => {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas')
    const images = await extractImages(await getPDF('images.pdf'), 1, { format: 'png' })

    const decodedImages = await Promise.all(images.map(async ({ data }) => {
      const image = await loadImage(data)
      const context = createCanvas(image.width, image.height).getContext('2d')
      context.drawImage(image, 0, 0)
      return Array.from(context.getImageData(0, 0, image.width, image.height).data)
    }))

    expect(decodedImages).toEqual(FIXTURE_IMAGES.map(({ data }) => data))
  })
})

function pixels(colorCodes: string): number[] {
  return [...colorCodes].flatMap(code => COLORS[code]!)
}

function readPNGHeader(png: Uint8Array) {
  // The IHDR chunk follows the signature, after its length and type fields.
  const view = new DataView(png.buffer, png.byteOffset + 16)
  return {
    signature: Array.from(png.subarray(0, 8)),
    width: view.getUint32(0),
    height: view.getUint32(4),
    bitDepth: view.getUint8(8),
    colorType: view.getUint8(9),
  }
}
