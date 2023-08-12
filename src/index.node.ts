import { decodePDFText as _decodePDFText } from './text'
import { getImagesFromPage as _getImagesFromPage } from './image'
import { resolvePDFJSNodeImports } from './utils'

export const decodePDFText: typeof _decodePDFText = async (...args) => {
  await resolvePDFJSNodeImports()
  return await _decodePDFText(...args)
}

export const getImagesFromPage: typeof _getImagesFromPage = async (...args) => {
  await resolvePDFJSNodeImports()
  return await _getImagesFromPage(...args)
}
