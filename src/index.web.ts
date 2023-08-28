import { getPDFMeta as _getPDFMeta } from "./meta";
import { extractPDFText as _extractPDFText } from "./text";
import { getImagesFromPage as _getImagesFromPage } from "./image";
import { resolvePDFJSImports } from "./_utils";

export {
  defineUnPDFConfig,
  getDocumentProxy,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from "./_utils";

// TODO: init official PDF.js build for web?

export const getPDFMeta: typeof _getPDFMeta = async (...args) => {
  await resolvePDFJSImports();
  return await _getPDFMeta(...args);
};

export const extractPDFText: typeof _extractPDFText = async (...args) => {
  await resolvePDFJSImports();
  return await _extractPDFText(...args);
};

export const getImagesFromPage: typeof _getImagesFromPage = async (...args) => {
  await resolvePDFJSImports();
  return await _getImagesFromPage(...args);
};
