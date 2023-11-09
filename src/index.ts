import { getMeta as _getMeta } from "./meta";
import { extractText as _extractText } from "./text";
import {
  extractImages as _extractImages,
  renderPageAsImage as _renderPageAsImage,
} from "./image";
import { resolvePDFJSImports } from "./utils";

export { defineUnPDFConfig } from "./config";
export {
  getDocumentProxy,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from "./utils";

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
