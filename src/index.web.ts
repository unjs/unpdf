import type {
  decodePDFText as _decodePDFText,
  getImagesFromPage as _getImagesFromPage,
} from './index.node'

export const decodePDFText: typeof _decodePDFText = async () => {
  throw new Error('Not supported in browser context yet')
}

export const getImagesFromPage: typeof _getImagesFromPage = async () => {
  throw new Error('Not supported in browser context yet')
}
