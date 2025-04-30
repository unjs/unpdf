/* eslint-disable import/first */
/* eslint-disable no-unused-vars */

// Polyfill for `Promise.withResolvers`
Promise.withResolvers ??= function () {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Inline the PDF.js worker to avoid having to load it from a separate file.
import * as __pdfjsWorker__ from 'pdfjs-dist/build/pdf.worker.mjs'

// TODO: Enable again when Cloudflare supports top-level await.
// export * from 'pdfjs-dist/build/pdf.mjs'

// eslint-disable-next-line perfectionist/sort-imports
import { __main__ } from 'pdfjs-dist/build/pdf.mjs'

// Wrap PDF.js exports to circumvent Cloudflare's top-level await limitation.
export function resolvePDFJS() {
  return __main__()
}
