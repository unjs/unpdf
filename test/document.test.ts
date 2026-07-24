import { describe, expect, it, vi } from 'vitest'
import { extractImages, extractText, getDocumentProxy, getMeta } from '../src/index'
import { getPDF } from './utils'

describe('document lifecycle', () => {
  it('supports passing PDFDocumentProxy', async () => {
    const pdf = await getDocumentProxy(await getPDF())
    const { info } = await getMeta(pdf)

    expect(info.Creator).toMatchInlineSnapshot('"Writer"')
  })

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

    // The proxy must still be usable after a helper returns
    const { info } = await getMeta(pdf)
    expect(info.Creator).toBe('Writer')
    expect(destroySpy).not.toHaveBeenCalled()

    await pdf.loadingTask.destroy()
  })

  it('preserves extracted image data after destroying the document', async () => {
    const [firstImage] = await extractImages(await getPDF('pdflatex-image.pdf'), 1)

    expect(firstImage!.data.length).toBeGreaterThan(0)
    expect(firstImage!.data.length).toBe(
      firstImage!.width * firstImage!.height * firstImage!.channels,
    )
  })
})
