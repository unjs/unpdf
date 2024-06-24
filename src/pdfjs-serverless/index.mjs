/* eslint-disable @typescript-eslint/no-unused-vars */

// These imports are needed in order to let unenv provide
// shims before variable initialization.
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import url from "node:url";

// Polyfill for `Promise.withResolvers`
Promise.withResolvers ??= function () {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

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
//   CMapCompressionType,
//   ColorPicker,
//   DOMSVGFactory,
//   DrawLayer,
//   FeatureTest,
//   GlobalWorkerOptions,
//   ImageKind,
//   InvalidPDFException,
//   MissingPDFException,
//   OPS,
//   Outliner,
//   PDFDataRangeTransport,
//   PDFDateString,
//   PDFWorker,
//   PasswordResponses,
//   PermissionFlag,
//   PixelsPerInch,
//   RenderingCancelledException,
//   TextLayer,
//   UnexpectedResponseException,
//   Util,
//   VerbosityLevel,
//   XfaLayer,
//   build,
//   createValidAbsoluteUrl,
//   fetchData,
//   getDocument,
//   getFilenameFromUrl,
//   getPdfFilenameFromUrl,
//   getXfaPageViewport,
//   isDataScheme,
//   isPdfFile,
//   noContextMenu,
//   normalizeUnicode,
//   renderTextLayer,
//   setLayerDimensions,
//   shadow,
//   updateTextLayer,
//   version,
// } from 'pdfjs-dist/build/pdf.mjs'

// Wrap PDF.js exports to circumvent Cloudflare's top-level await limitation.
import { __main__ } from "pdfjs-dist/build/pdf.mjs";
export function resolvePDFJS() {
  return __main__();
}
