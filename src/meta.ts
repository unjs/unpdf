import type { DocumentInitParameters, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { getDocumentProxy, getResolvedPDFJS, isPDFDocumentProxy } from './utils'

async function toJSDateObject(metadataDate: string, infoDate: string) {
  const { PDFDateString } = await getResolvedPDFJS()
  if (metadataDate) {
    const date = Date.parse(metadataDate)
    if (!Number.isNaN(date)) {
      return new Date(date)
    }
  }
  if (infoDate) {
    return PDFDateString.toDateObject(infoDate)
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
    meta.info.CreationDateObject = await toJSDateObject(meta.metadata?.get('xmp:createdate'), meta.info?.CreationDate)
    meta.info.ModDateObject = await toJSDateObject(meta.metadata?.get('xmp:modifydate'), meta.info?.ModDate)
  }

  return {
    info: (meta?.info ?? {}) as Record<string, any>,
    metadata: ({ ...meta?.metadata }) as Record<string, any>,
  }
}
