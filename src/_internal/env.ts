import { polyfillDOMMatrix } from './dommatrix-polyfill'

/**
 * Stubs the browser globals PDF.js reads while its modules evaluate, so it must
 * run before any PDF.js module is imported.
 */
export function stubBrowserGlobals(): void {
  polyfillDOMMatrix()
}
