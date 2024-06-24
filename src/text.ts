import type {
  BinaryData,
  PDFDocumentProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";
import { getDocumentProxy, isPDFDocumentProxy } from "./utils";

export function extractText(
  data: BinaryData | PDFDocumentProxy,
  options?: { mergePages?: false }
): Promise<{
  totalPages: number;
  text: string[];
}>;
export function extractText(
  data: BinaryData | PDFDocumentProxy,
  options: { mergePages: true }
): Promise<{
  totalPages: number;
  text: string;
}>
export async function extractText(
  data: BinaryData | PDFDocumentProxy,
  options: { mergePages?: boolean } = {},
) {
  const { mergePages = false } = { ...options };
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data);
  const texts = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => getPageText(pdf, i + 1)),
  );

  return {
    totalPages: pdf.numPages,
    text: mergePages ? texts.join("\n").replace(/\s+/g, " ") : texts,
  };
}

async function getPageText(document: PDFDocumentProxy, pageNumber: number) {
  const page = await document.getPage(pageNumber);
  const content = await page.getTextContent();

  return (
    (content.items as TextItem[])
      // eslint-disable-next-line unicorn/no-null
      .filter((item) => item.str != null)
      .map((item) => item.str + (item.hasEOL ? "\n" : ""))
      .join("")
  );
}
