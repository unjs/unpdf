import type { getPDFMeta as _getPDFMeta } from './meta'
import type { extractPDFText as _extractPDFText } from './text'
import type { getImagesFromPage as _getImagesFromPage } from './image'

export { defineUnPDFConfig } from './utils'

export const getPDFMeta: typeof _getPDFMeta = async () => {
  throw new Error('Not implemented in worker context yet')
}

export const extractPDFText: typeof _extractPDFText = async () => {
  throw new Error('Not implemented in worker context yet')
}

export const getImagesFromPage: typeof _getImagesFromPage = async () => {
  throw new Error('Not implemented in worker context yet')
}
