import { resolvePDFJSImports } from "./utils";
import type { UnPDFConfiguration } from "./types";

export async function configureUnPDF(options: UnPDFConfiguration) {
  const { pdfjs } = { ...options };

  if (pdfjs) {
    await resolvePDFJSImports(pdfjs, { force: true });
  }
}
