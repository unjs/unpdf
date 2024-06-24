import type {
  DocumentInitParameters,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import type { PDFJS } from "./types";

let resolvedModule: PDFJS | undefined;

export const isNode = globalThis.process?.release?.name === "node";
export const isBrowser = typeof window !== "undefined";

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `isEvalSupported: false`
 * - `useSystemFonts: true`
 */
export async function getDocumentProxy(
  data: DocumentInitParameters["data"],
  options: DocumentInitParameters = {},
) {
  const { getDocument } = await getResolvedPDFJS();
  const pdf = await getDocument({
    data,
    isEvalSupported: false,
    // See: https://github.com/mozilla/pdf.js/issues/4244#issuecomment-1479534301
    useSystemFonts: true,
    ...options,
  }).promise;

  return pdf;
}

export async function getResolvedPDFJS(): Promise<PDFJS> {
  if (!resolvedModule) {
    await resolvePDFJSImports();
  }

  return resolvedModule!;
}

export async function resolvePDFJSImports(
  pdfjsResolver?: () => Promise<any>,
  { force = false } = {},
) {
  if (resolvedModule && !force) {
    return;
  }

  if (pdfjsResolver) {
    try {
      resolvedModule = await interopDefault(pdfjsResolver());

      // Support passing `unpdf/pdfjs` as resolver target
      if (resolvedModule && "resolvePDFJS" in resolvedModule) {
        // @ts-expect-error: Return value is unknown
        resolvedModule = await resolvedModule.resolvePDFJS();
      }

      return;
    } catch {
      throw new Error(
        "Resolving failed. Please check the provided configuration.",
      );
    }
  }

  try {
    // @ts-ignore: Dynamic import of serverless PDF.js build
    const { resolvePDFJS } = await import("unpdf/pdfjs");
    // @ts-ignore: Type mismatch
    resolvedModule = await resolvePDFJS();
  } catch {
    throw new Error(
      "PDF.js is not available. Please add the package as a dependency.",
    );
  }
}

export function isPDFDocumentProxy(data: unknown): data is PDFDocumentProxy {
  return typeof data === "object" && data !== null && "_pdfInfo" in data;
}

export async function interopDefault<T>(
  m: T | Promise<T>,
): Promise<T extends { default: infer U } ? U : T> {
  const resolved = await m;
  return (resolved as any).default || resolved;
}
