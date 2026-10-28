/* eslint-disable ts/ban-ts-comment */
import type { MockInstance } from 'vitest'
import { afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { definePDFJSModule } from '../src/index'
import { isWorkerd } from './utils'

const MISSING_API_PATTERN = /is not a function|is not defined|is not a constructor/

let consoleWarnSpy: MockInstance<typeof console.warn>

beforeAll(() => {
  // @ts-ignore: Dynamic import from package build.
  definePDFJSModule(() => import('../dist/pdfjs'))
})

// The first load of the native `@napi-rs/canvas` binary takes seconds on
// Windows runners, so it happens here, outside of any test's timeout.
beforeAll(async () => {
  if (!isWorkerd) {
    await import('@napi-rs/canvas')
  }
}, 60_000)

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
