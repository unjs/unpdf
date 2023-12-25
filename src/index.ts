import { getMeta as _getMeta } from "./meta";
import { extractText as _extractText } from "./text";
import {
  extractImages as _extractImages,
  renderPageAsImage as _renderPageAsImage,
} from "./image";
import { resolvePDFJSImports } from "./utils";
import { configureUnPDF } from "./config";

export { createIsomorphicCanvasFactory } from "./image";
export {
  getDocumentProxy,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from "./utils";

export { configureUnPDF } from "./config";
/** @deprecated Use `configureUnPDF` instead */
const defineUnPDFConfig = configureUnPDF;
export { defineUnPDFConfig };

export const getMeta: typeof _getMeta = async (...args) => {
  await resolvePDFJSImports();
  return await _getMeta(...args);
};

export const extractText: typeof _extractText = async (...args) => {
  await resolvePDFJSImports();
  return await _extractText(...args);
};

export const extractImages: typeof _extractImages = async (...args) => {
  await resolvePDFJSImports();
  return await _extractImages(...args);
};

export const renderPageAsImage: typeof _renderPageAsImage = async (...args) => {
  await resolvePDFJSImports();
  return await _renderPageAsImage(...args);
};
