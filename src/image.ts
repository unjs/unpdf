import { getDocumentProxy, getResolvedPDFJS } from './utils'

export async function getImagesFromPage(
  data: ArrayBuffer,
  pageNumber: number,
) {
  const pdf = await getDocumentProxy(data)
  const page = await pdf.getPage(pageNumber)
  const operatorList = await page.getOperatorList()
  const { OPS } = getResolvedPDFJS()

  const images: ArrayBuffer[] = []
  for (const op of operatorList.fnArray) {
    if (op !== OPS.paintImageXObject)
      continue

    const image = await page.objs.get(operatorList.argsArray[op][0])
    if (image.data)
      images.push(image.data.buffer)
  }

  return images
}
