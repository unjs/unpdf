/* eslint-disable ts/ban-ts-comment */
import type { MockInstance } from 'vitest'
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { definePDFJSModule } from '../src/index'

const MISSING_API_PATTERN = /is not a function|is not defined|is not a constructor/

let consoleWarnSpy: MockInstance<typeof console.warn>

beforeAll(() => {
  // @ts-ignore: Dynamic import from package build.
  definePDFJSModule(() => import('../dist/pdfjs'))
})

beforeEach(() => {
  consoleWarnSpy = vi.spyOn(console, 'warn')
})

afterEach(() => {
  const missingAPIWarnings = consoleWarnSpy.mock.calls
    .map(call => call.join(' '))
    .filter(message => MISSING_API_PATTERN.test(message))

  consoleWarnSpy.mockRestore()
  expect(missingAPIWarnings).toEqual([])
})
