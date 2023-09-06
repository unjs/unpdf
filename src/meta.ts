import type {
  BinaryData,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import { getDocumentProxy, isPDFDocumentProxy } from "./utils";

export async function getMeta(data: BinaryData | PDFDocumentProxy) {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data);
  const meta = await pdf.getMetadata();

  return {
    info: (meta?.info ?? {}) as Record<string, any>,
    metadata: (meta?.metadata?.getAll() ?? {}) as Record<string, any>,
  };
}
