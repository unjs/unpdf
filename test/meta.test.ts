import { describe, expect, expectTypeOf, it } from 'vitest'
import { getDocumentProxy, getMeta } from '../src/index'
import { getPDF } from './utils'

describe('meta', () => {
  it('extracts metadata from a PDF', async () => {
    const { info, metadata } = await getMeta(await getPDF())

    expect(metadata).toBeNull()
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

    expect(infoWithDates.ModDate).toBeUndefined()
    expect(infoWithDates.CreationDate).toBeInstanceOf(Date)
    expect(infoWithDates.CreationDate!.getFullYear()).toBe(2007)

    const { info: documentInfo, metadata: documentMetadata } = await getMeta(
      await getDocumentProxy(await getPDF('document.pdf')),
      { parseDates: true },
    )

    expect(documentInfo.CreationDate).toEqual(new Date('2024-01-15T09:30:00Z'))
    expect(documentInfo.ModDate).toEqual(new Date('2024-02-20T12:00:00Z'))

    expect(documentMetadata!.get('xmp:createdate')).toEqual(new Date('2024-01-15T09:30:00Z'))
    expect(documentMetadata!.get('xmp:modifydate')).toEqual(new Date('2024-02-20T12:00:00Z'))
    expect(documentMetadata!.get('xmp:metadatadate')).toEqual(new Date('2024-02-21T08:15:00Z'))

    expect(documentMetadata!.get('xap:createdate')).toBeNull()
    expect(documentMetadata!.get('xap:modifydate')).toBeNull()
    expect(documentMetadata!.get('xap:metadatadate')).toBeNull()
  })

  it('types the date fields of info by the parseDates option', async () => {
    const { info } = await getMeta(await getPDF())
    const { info: infoWithDates } = await getMeta(await getPDF(), { parseDates: true })

    expectTypeOf(info.CreationDate).toEqualTypeOf<string | undefined>()
    expectTypeOf(infoWithDates.CreationDate).toEqualTypeOf<Date | null | undefined>()
  })

  it('keeps getRaw working and parses dates in iteration with parseDates', async () => {
    const { metadata } = await getMeta(await getPDF('document.pdf'))
    const { metadata: metadataWithDates } = await getMeta(await getPDF('document.pdf'), { parseDates: true })

    expect(metadataWithDates!.getRaw()).toBe(metadata!.getRaw())
    expect(Object.fromEntries(metadataWithDates!)['xmp:createdate']).toEqual(new Date('2024-01-15T09:30:00Z'))
  })

  it('leaves the cached metadata of a reused document unparsed', async () => {
    const pdf = await getDocumentProxy(await getPDF('document.pdf'))
    await getMeta(pdf, { parseDates: true })
    const { info, metadata } = await getMeta(pdf)

    expect(info.CreationDate).toBe('D:20240115103000+01\'00\'')
    expect(metadata!.get('xmp:createdate')).toBe('2024-01-15T10:30:00+01:00')
  })
})
