import type {
  BinaryData,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import {
  getDocumentProxy,
  getResolvedPDFJS,
  isPDFDocumentProxy,
} from "./_utils";

export async function getImagesFromPage(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number,
) {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data);
  const page = await pdf.getPage(pageNumber);
  const operatorList = await page.getOperatorList();
  const { OPS } = await getResolvedPDFJS();

  const images: ArrayBuffer[] = [];
  for (const op of operatorList.fnArray) {
    if (op !== OPS.paintImageXObject) {
      continue;
    }

    const image = await page.objs.get(operatorList.argsArray[op][0]);
    if (image.data) {
      images.push(image.data.buffer);
    }
  }

  return images;
}
