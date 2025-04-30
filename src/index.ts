import {
  extractImages as _extractImages,
  renderPageAsImage as _renderPageAsImage,
} from './image'
import { getMeta as _getMeta } from './meta'
import { extractText as _extractText } from './text'
import { resolvePDFJSImport } from './utils'

export { configureUnPDF, definePDFJSModule } from './config'

export {
  getDocumentProxy,
  getResolvedPDFJS,
  resolvePDFJSImport,
} from './utils'

export const getMeta: typeof _getMeta = async (...args) => {
  await resolvePDFJSImport()
  return await _getMeta(...args)
}

export const extractText: typeof _extractText = async (...args) => {
  await resolvePDFJSImport()
  // @ts-expect-error: TS doesn't support overloads with default values
  return await _extractText(...args)
}

export const extractImages: typeof _extractImages = async (...args) => {
  await resolvePDFJSImport()
  return await _extractImages(...args)
}

export const renderPageAsImage: typeof _renderPageAsImage = async (...args) => {
  await resolvePDFJSImport()
  return await _renderPageAsImage(...args)
}
