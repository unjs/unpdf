import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, getResolvedPDFJS, isPDFDocumentProxy } from './utils'

function parseISODateString(isoDateString: string) {
  if (!isoDateString)
    return null

  const date = Date.parse(isoDateString)
  if (!Number.isNaN(date)) {
    return new Date(date)
  }

  return null
}

export async function getMeta(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  opts: {
    parseDates?: boolean
  } = {},
) {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data)
  const meta = await pdf.getMetadata()

  if (opts.parseDates) {
    const { PDFDateString } = await getResolvedPDFJS()

    // primary date properties from /Info dictionary
    if (meta.info?.CreationDate) {
      meta.info.CreationDate = PDFDateString.toDateObject(meta.info?.CreationDate)
    }
    if (meta.info?.ModDate) {
      meta.info.ModDate = PDFDateString.toDateObject(meta.info?.ModDate)
    }

    if (meta.metadata) {
      const originalMetadata = meta.metadata
      meta.metadata = {
        ...originalMetadata,
        get: (name: any) => {
          // override xmp date properties
          if (name === 'xmp:createdate' && originalMetadata.get('xmp:createdate')) {
            return parseISODateString(originalMetadata.get('xmp:createdate'))
          }

          if (name === 'xmp:modifydate' && originalMetadata.get('xmp:modifydate')) {
            return parseISODateString(originalMetadata.get('xmp:modifydate'))
          }

          if (name === 'xmp:metadatadate' && originalMetadata.get('xmp:metadatadate')) {
            return parseISODateString(originalMetadata.get('xmp:metadatadate'))
          }

          // legacy xap date properties
          if (name === 'xap:createdate' && originalMetadata.get('xap:createdate')) {
            return parseISODateString(originalMetadata.get('xap:createdate'))
          }

          if (name === 'xap:modifydate' && originalMetadata.get('xap:modifydate')) {
            return parseISODateString(originalMetadata.get('xap:modifydate'))
          }

          if (name === 'xap:metadatadate' && originalMetadata.get('xap:metadatadate')) {
            return parseISODateString(originalMetadata.get('xap:metadatadate'))
          }

          return originalMetadata.get(name)
        },
      }
    }
  }

  return {
    info: (meta?.info ?? {}) as Record<string, any>,
    metadata: ({ ...meta?.metadata }) as Record<string, any>,
  }
}
