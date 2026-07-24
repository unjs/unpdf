/**
 * Compile-only consumer of the built package: `tsc` resolves the shipped
 * declarations the way a `moduleResolution: "nodenext"` project does, with
 * `skipLibCheck` disabled so extensionless imports inside the declaration
 * files fail the check instead of degrading to error types.
 *
 * Requires `pnpm run build:pdfjs && pnpm run build` beforehand.
 */
import type { PDFDocumentProxy } from 'unpdf/pdfjs'
import { extractText, getDocumentProxy, getMeta } from 'unpdf'

export async function consumeBuiltDeclarations(data: Uint8Array) {
  const pdf: PDFDocumentProxy = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: true })
  const mergedText: string = text
  // A runtime boolean matches neither literal overload – requires the widened one
  const mergePages: boolean = data.length > 0
  const { text: runtimeText } = await extractText(pdf, { mergePages })
  const mixedText: string | string[] = runtimeText
  const { info } = await getMeta(pdf)

  return { pdf, mergedText, mixedText, info }
}
