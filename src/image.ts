import type {
  BinaryData,
  PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import {
  getDocumentProxy,
  getResolvedPDFJS,
  isPDFDocumentProxy,
} from "./utils";

export async function getImagesFromPage(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number,
) {
  const pdf = isPDFDocumentProxy(data) ? data : await getDocumentProxy(data);
  const page = await pdf.getPage(pageNumber);
  const operatorList = await page.getOperatorList();
  const { OPS } = await getResolvedPDFJS();

  const images: Uint8ClampedArray[] = [];

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const op = operatorList.fnArray[i];

    if (op !== OPS.paintImageXObject) {
      continue;
    }

    const imageKey = operatorList.argsArray[i][0];
    const image = await page.objs.get(imageKey);
    images.push(image.data);
  }

  return images;
}
