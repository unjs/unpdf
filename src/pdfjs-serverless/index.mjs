/* eslint-disable import/first */
/* eslint-disable no-unused-vars */

// Import mocks & polyfills first and ensure they are not removed by tree-shaking.
import { mocks } from './mocks.mjs'
import { polyfills } from './polyfills.mjs'

void mocks
void polyfills

// Inline the PDF.js worker to avoid having to load it from a separate file.
import * as __pdfjsWorker__ from 'pdfjs-dist/build/pdf.worker.mjs'

export * from 'pdfjs-dist/build/pdf.mjs'
