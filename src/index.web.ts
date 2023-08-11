import type { PDFContent } from './types'
import type { decodePDFText as _decodePDFText } from './index.node'

export async function decodePDFText(
  ..._args: Parameters<typeof _decodePDFText>
): Promise<PDFContent> {
  throw new Error('Not supported in browser context yet')
}
