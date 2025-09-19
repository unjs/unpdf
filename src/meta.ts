import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, getResolvedPDFJS, isPDFDocumentProxy } from './utils'

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
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const meta = await pdf.getMetadata()

  const info = (meta?.info || {}) as Record<string, any>

  if (options.parseDates) {
    const { PDFDateString } = await getResolvedPDFJS()

    // Primary date properties from /Info dictionary
    if (info?.CreationDate) {
      info.CreationDate = PDFDateString.toDateObject(info?.CreationDate)
    }
    if (info?.ModDate) {
      info.ModDate = PDFDateString.toDateObject(info?.ModDate)
    }

    // Override metadata getter to parse XMP date properties
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
          return target[prop as keyof typeof target]
        },
      })
    }
  }

  return {
    info,
    metadata: meta?.metadata || {},
  }
}

function parseISODateString(isoDateString: string) {
  if (!isoDateString)
    return

  const parsedDate = Date.parse(isoDateString)
  if (!Number.isNaN(parsedDate)) {
    return new Date(parsedDate)
  }
}
