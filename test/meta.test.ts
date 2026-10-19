import { describe, expect, it } from 'vitest'
import { getDocumentProxy, getMeta } from '../src/index'
import { getPDF } from './utils'

describe('meta', () => {
  it('extracts metadata from a PDF', async () => {
    const { info, metadata } = await getMeta(await getPDF())

    expect(Object.keys(metadata).length).toEqual(0)
    expect(info).toMatchInlineSnapshot(`
      {
        "Author": "Evangelos Vlachogiannis",
        "CreationDate": "D:20070223175637+02'00'",
        "Creator": "Writer",
        "EncryptFilterName": null,
        "IsAcroFormPresent": false,
        "IsCollectionPresent": false,
        "IsLinearized": false,
        "IsSignaturesPresent": false,
        "IsXFAPresent": false,
        "Language": null,
        "PDFFormatVersion": "1.4",
        "Producer": "OpenOffice.org 2.1",
      }
    `)
  })

  it('parses PDF dates when parseDates option is enabled', async () => {
    const { info: infoWithDates } = await getMeta(await getPDF(), { parseDates: true })

    expect(infoWithDates.ModDate).toBeUndefined() // `sample.pdf` carries no `ModDate`.
    expect(infoWithDates.CreationDate).toBeInstanceOf(Date)
    expect(infoWithDates.CreationDate.getFullYear()).toBe(2007)

    const { info: infoLinks, metadata: linksMetadata } = await getMeta(
      await getDocumentProxy(await getPDF('links.pdf')),
      { parseDates: true },
    )

    expect(infoLinks.CreationDate).toBeInstanceOf(Date)
    expect(infoLinks.ModDate).toBeInstanceOf(Date)
    expect(infoLinks.CreationDate.getFullYear()).toBe(2024)
    expect(infoLinks.ModDate.getFullYear()).toBe(2024)

    expect(linksMetadata.get('xmp:createdate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:modifydate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:metadatadate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:createdate').getFullYear()).toBe(2024)

    expect(linksMetadata.get('xap:createdate')).toBeNull()
    expect(linksMetadata.get('xap:modifydate')).toBeNull()
    expect(linksMetadata.get('xap:metadatadate')).toBeNull()
  })

  it('keeps getRaw working and parses dates in iteration with parseDates', async () => {
    const { metadata } = await getMeta(await getPDF('links.pdf'))
    const { metadata: metadataWithDates } = await getMeta(await getPDF('links.pdf'), { parseDates: true })

    expect(metadataWithDates.getRaw()).toBe(metadata.getRaw())
    expect(Object.fromEntries(metadataWithDates)['xmp:createdate']).toBeInstanceOf(Date)
  })

  it('leaves the cached metadata of a reused document unparsed', async () => {
    const pdf = await getDocumentProxy(await getPDF('links.pdf'))
    await getMeta(pdf, { parseDates: true })
    const { info, metadata } = await getMeta(pdf)

    expect(info.CreationDate).toBeTypeOf('string')
    expect(metadata.get('xmp:createdate')).toBeTypeOf('string')
  })
})
