import type { decodePDFText as _decodePDFText } from './text'
import type { getImagesFromPage as _getImagesFromPage } from './image'

export const decodePDFText: typeof _decodePDFText = async () => {
  throw new Error('Not implemented in worker context yet')
}

export const getImagesFromPage: typeof _getImagesFromPage = async () => {
  throw new Error('Not implemented in worker context yet')
}
