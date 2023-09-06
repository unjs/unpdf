import { getPDFMeta as _getPDFMeta } from "./meta";
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

export const getPDFMeta: typeof _getPDFMeta = async (...args) => {
  await resolvePDFJSImports();
  return await _getPDFMeta(...args);
};

export const extractText: typeof _extractText = async (...args) => {
  await resolvePDFJSImports();
  return await _extractText(...args);
};

/** @deprecated Use `extractText` instead. */
export const extractPDFText = extractText;

export const extractImages: typeof _extractImages = async (...args) => {
  await resolvePDFJSImports();
  return await _extractImages(...args);
};

export const renderPageAsImage: typeof _renderPageAsImage = async (...args) => {
  await resolvePDFJSImports();
  return await _renderPageAsImage(...args);
};
