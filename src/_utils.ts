import type {
  BinaryData,
  DocumentInitParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import type { PDFJS, UnPDFConfiguration } from "./types";

let resolvedModule: PDFJS | undefined;

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `isEvalSupported: false`
 */
export async function getDocumentProxy(
  data: BinaryData,
  options: DocumentInitParameters = {},
) {
  const { getDocument } = await getResolvedPDFJS();
  const pdf = await getDocument({
    data,
    isEvalSupported: false,
    ...options,
  }).promise;

  return pdf;
}

export async function defineUnPDFConfig(options: UnPDFConfiguration) {
  const { pdfjs } = { ...options };

  if (pdfjs) {
    await resolvePDFJSImports(pdfjs, { force: true });
  }
}

export async function getResolvedPDFJS(): Promise<PDFJS> {
  if (!resolvedModule) {
    await resolvePDFJSImports();
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return resolvedModule!;
}

export async function resolvePDFJSImports(
  pdfjsResolver?: () => Promise<PDFJS>,
  { force = false } = {},
) {
  if (resolvedModule && !force) {
    return;
  }

  if (pdfjsResolver) {
    try {
      const _import = await pdfjsResolver();
      // @ts-ignore: Interop default export
      resolvedModule = _import.default || _import;
      return;
    } catch {
      throw new Error(
        "Resolving failed. Please check the provided configuration.",
      );
    }
  }

  try {
    // @ts-ignore: Dynamic import of serverless PDF.js build
    resolvedModule = await import("unpdf/pdfjs");
  } catch {
    throw new Error(
      "PDF.js is not available. Please add the package as a dependency.",
    );
  }
}

export function isPDFDocumentProxy(data: unknown): data is PDFDocumentProxy {
  return typeof data === "object" && data !== null && "_pdfInfo" in data;
}
