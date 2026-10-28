import { describe, expect, it, vi } from 'vitest'
import { extractImages, extractText, getDocumentProxy, getMeta } from '../src/index'
import { getPDF } from './utils'

describe('document lifecycle', () => {
  it('destroys internally created document proxies', async () => {
    const probe = await getDocumentProxy(await getPDF())
    const destroySpy = vi.spyOn(Object.getPrototypeOf(probe.loadingTask), 'destroy')

    await extractText(await getPDF())

    expect(destroySpy).toHaveBeenCalled()

    destroySpy.mockRestore()
    await probe.loadingTask.destroy()
  })

  it('does not destroy caller-owned document proxies', async () => {
    const pdf = await getDocumentProxy(await getPDF())
    const destroySpy = vi.spyOn(pdf.loadingTask, 'destroy')

    const { text } = await extractText(pdf)
    expect(text[0]).toBe('Dummy PDF file')
    expect(destroySpy).not.toHaveBeenCalled()

    const { info } = await getMeta(pdf)
    expect(info.Creator).toBe('Writer')
    expect(destroySpy).not.toHaveBeenCalled()

    await pdf.loadingTask.destroy()
  })

  it('preserves extracted image data after destroying the document', async () => {
    const [jpegImage] = await extractImages(await getPDF('pdflatex-image.pdf'), 1)

    const { data, width, height } = jpegImage!
    const centerOffset = (height / 2 * width + width / 2) * 4

    expect({ width, height }).toEqual({ width: 300, height: 200 })
    expect(Array.from(data.subarray(0, 4))).toEqual([1, 0, 0, 255])
    expect(Array.from(data.subarray(centerOffset, centerOffset + 4))).toEqual([202, 158, 113, 255])
  })
})
