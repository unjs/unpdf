/* eslint-disable @typescript-eslint/no-unused-vars */

// These imports are needed in order to let unenv provide
// shims before variable initialization.
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import url from "node:url";

// Inline the PDF.js worker to avoid having to load it from a separate file.
import * as __pdfjsWorker__ from "pdfjs-dist/build/pdf.worker.mjs";

// Although we just need: `getDocument`, `OPS` and `version`, we export
// everything, since the bundle size doesn't change, due to PDF.js's
// bundle structure by webpack.
// TODO: Enable again when Cloudflare supports top-level await.
// export {
//   AbortException,
//   AnnotationEditorLayer,
//   AnnotationEditorParamsType,
//   AnnotationEditorType,
//   AnnotationEditorUIManager,
//   AnnotationLayer,
//   AnnotationMode,
//   build,
//   CMapCompressionType,
//   createValidAbsoluteUrl,
//   DOMSVGFactory,
//   FeatureTest,
//   getDocument,
//   getFilenameFromUrl,
//   getPdfFilenameFromUrl,
//   getXfaPageViewport,
//   GlobalWorkerOptions,
//   ImageKind,
//   InvalidPDFException,
//   isDataScheme,
//   isPdfFile,
//   MissingPDFException,
//   noContextMenu,
//   normalizeUnicode,
//   OPS,
//   PasswordResponses,
//   PDFDataRangeTransport,
//   PDFDateString,
//   PDFWorker,
//   PermissionFlag,
//   PixelsPerInch,
//   PromiseCapability,
//   RenderingCancelledException,
//   renderTextLayer,
//   setLayerDimensions,
//   shadow,
//   UnexpectedResponseException,
//   updateTextLayer,
//   Util,
//   VerbosityLevel,
//   version,
//   XfaLayer,
// } from "pdfjs-dist/build/pdf.mjs";

// Wrap PDF.js exports to circumvent Cloudflare's top-level await limitation.
import { initPDFJS } from "pdfjs-dist/build/pdf.mjs";
export function resolvePDFJS() {
  return initPDFJS();
}
