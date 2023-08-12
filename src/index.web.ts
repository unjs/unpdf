import { decodePDFText as _decodePDFText } from './text'
import { getImagesFromPage as _getImagesFromPage } from './image'
import { resolvePDFJSWebImports } from './utils'

export const decodePDFText: typeof _decodePDFText = async (...args) => {
  await resolvePDFJSWebImports()
  return await _decodePDFText(...args)
}

export const getImagesFromPage: typeof _getImagesFromPage = async (...args) => {
  await resolvePDFJSWebImports()
  return await _getImagesFromPage(...args)
}
