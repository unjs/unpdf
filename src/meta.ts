import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import type { Metadata as PDFMetadata } from 'pdfjs-dist/types/src/display/metadata'
import { getResolvedPDFJS, withDocument } from './utils'

const XMP_DATE_PROPERTIES = [
  'xmp:createdate',
  'xmp:modifydate',
  'xmp:metadatadate',
  'xap:createdate',
  'xap:modifydate',
  'xap:metadatadate',
]

export async function getMeta(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options: {
    parseDates?: boolean
  } = {},
) {
  return await withDocument(data, async (pdf) => {
    // PDF.js caches this result per document, so parsed dates go into copies.
    const meta = await pdf.getMetadata()
    const info = { ...meta.info } as Record<string, any>
    let metadata = meta.metadata

    if (options.parseDates) {
      const { PDFDateString } = await getResolvedPDFJS()

      // Primary date properties from the `/Info` dictionary.
      if (info.CreationDate) {
        info.CreationDate = PDFDateString.toDateObject(info.CreationDate)
      }
      if (info.ModDate) {
        info.ModDate = PDFDateString.toDateObject(info.ModDate)
      }

      if (metadata) {
        // PDF.js doesn't export `Metadata`, so the instance supplies its class.
        const Metadata = metadata.constructor as typeof PDFMetadata
        metadata = new Metadata({
          parsedData: new Map(Array.from(metadata, ([name, value]: [string, any]) => [
            name,
            XMP_DATE_PROPERTIES.includes(name) && value ? parseISODateString(value) : value,
          ])),
          rawData: metadata.getRaw(),
        })
      }
    }

    return {
      info,
      metadata: metadata || {},
    }
  })
}

function parseISODateString(isoDateString: string) {
  if (!isoDateString)
    return

  const parsedDate = Date.parse(isoDateString)
  if (!Number.isNaN(parsedDate)) {
    return new Date(parsedDate)
  }
}
