import { getPDFMeta as _getPDFMeta } from "./meta";
import { extractPDFText as _extractPDFText } from "./text";
import { getImagesFromPage as _getImagesFromPage } from "./image";
import { resolvePDFJSImports } from "./utils";

export {
  defineUnPDFConfig,
  getDocumentProxy,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from "./utils";

const pdfjsServerlessResolver = () => import("pdfjs-serverless");

export const getPDFMeta: typeof _getPDFMeta = async (...args) => {
  await resolvePDFJSImports(pdfjsServerlessResolver);
  return await _getPDFMeta(...args);
};

export const extractPDFText: typeof _extractPDFText = async (...args) => {
  await resolvePDFJSImports(pdfjsServerlessResolver);
  return await _extractPDFText(...args);
};

export const getImagesFromPage: typeof _getImagesFromPage = async (...args) => {
  await resolvePDFJSImports(pdfjsServerlessResolver);
  return await _getImagesFromPage(...args);
};
