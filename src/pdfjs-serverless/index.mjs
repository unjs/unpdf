/* eslint-disable import/first */
/* eslint-disable no-unused-vars */

// These imports are needed in order to let unenv provide
// shims before variable initialization.
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import url from 'node:url'

// Polyfill for `Promise.withResolvers`
Promise.withResolvers ??= function () {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

import { __main__ } from 'pdfjs-dist/build/pdf.mjs'

// Inline the PDF.js worker to avoid having to load it from a separate file.
import * as __pdfjsWorker__ from 'pdfjs-dist/build/pdf.worker.mjs'

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
//   ColorPicker,
//   createValidAbsoluteUrl,
//   DOMSVGFactory,
//   DrawLayer,
//   FeatureTest,
//   fetchData,
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
//   RenderingCancelledException,
//   setLayerDimensions,
//   shadow,
//   TextLayer,
//   UnexpectedResponseException,
//   Util,
//   VerbosityLevel,
//   version,
//   XfaLayer,
// } from 'pdfjs-dist/build/pdf.mjs'

// Wrap PDF.js exports to circumvent Cloudflare's top-level await limitation.
export function resolvePDFJS() {
  return __main__()
}
