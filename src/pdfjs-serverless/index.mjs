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

export * from 'pdfjs-dist/build/pdf.mjs'
