// PDF.js initializes a top-level constant from `DOMMatrix`,
// which is not available in serverless environments.
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {}
}

// `FinalizationRegistry` is not not available in Cloudflare Workers.
if (typeof globalThis.FinalizationRegistry === 'undefined') {
  globalThis.FinalizationRegistry = class FinalizationRegistry {
    register() {}
    unregister() {}
  }
}

// `navigator` is not available in serverless environments.
globalThis.navigator ??= {}
globalThis.navigator.platform ??= ''
globalThis.navigator.userAgent ??= ''

// Export to ensure the mocks are not removed by tree-shaking.
export const mocks = true
