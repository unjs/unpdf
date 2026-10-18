import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
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
    const meta = await pdf.getMetadata()

    const info = (meta?.info || {}) as Record<string, any>

    if (options.parseDates) {
      const { PDFDateString } = await getResolvedPDFJS()

      // Primary date properties from the `/Info` dictionary.
      if (info?.CreationDate) {
        info.CreationDate = PDFDateString.toDateObject(info?.CreationDate)
      }
      if (info?.ModDate) {
        info.ModDate = PDFDateString.toDateObject(info?.ModDate)
      }

      // Override the metadata getter so XMP date properties are parsed on access.
      if (meta.metadata) {
        meta.metadata = new Proxy(meta.metadata, {
          get(target, prop) {
            if (prop === 'get') {
              return (name: string) => {
                const value = target.get(name)

                if (XMP_DATE_PROPERTIES.includes(name) && value) {
                  return parseISODateString(value)
                }

                return value
              }
            }
            const value = target[prop as keyof typeof target]
            // `Metadata` keeps its state in private fields, so methods must run on the target.
            return typeof value === 'function' ? value.bind(target) : value
          },
        })
      }
    }

    return {
      info,
      metadata: meta?.metadata || {},
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
