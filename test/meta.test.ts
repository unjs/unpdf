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
    // Test basic date parsing from /Info dictionary
    const { info: infoWithDates } = await getMeta(await getPDF(), { parseDates: true })

    expect(infoWithDates.ModDate).toBeUndefined() // ModDate not present in sample.pdf
    expect(infoWithDates.CreationDate).toBeInstanceOf(Date)
    expect(infoWithDates.CreationDate.getFullYear()).toBe(2007)

    // Test XMP metadata date parsing
    const { info: infoLinks, metadata: linksMetadata } = await getMeta(
      await getDocumentProxy(await getPDF('links.pdf')),
      { parseDates: true },
    )

    // Verify /Info dates are parsed
    expect(infoLinks.CreationDate).toBeInstanceOf(Date)
    expect(infoLinks.ModDate).toBeInstanceOf(Date)
    expect(infoLinks.CreationDate.getFullYear()).toBe(2024)
    expect(infoLinks.ModDate.getFullYear()).toBe(2024)

    // Verify XMP dates are parsed
    expect(linksMetadata.get('xmp:createdate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:modifydate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:metadatadate')).toBeInstanceOf(Date)
    expect(linksMetadata.get('xmp:createdate').getFullYear()).toBe(2024)

    expect(linksMetadata.get('xap:createdate')).toBeNull()
    expect(linksMetadata.get('xap:modifydate')).toBeNull()
    expect(linksMetadata.get('xap:metadatadate')).toBeNull()
  })
})
