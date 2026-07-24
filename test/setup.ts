/* eslint-disable ts/ban-ts-comment */
import { beforeAll } from 'vitest'
import { definePDFJSModule } from '../src/index'

// Tests run with `isolate: false`, so the resolved PDF.js module persists
// across files – re-define it per file to keep them order-independent.
beforeAll(async () => {
  // @ts-ignore: Dynamic import from package build
  await definePDFJSModule(() => import('../dist/pdfjs'))
})
