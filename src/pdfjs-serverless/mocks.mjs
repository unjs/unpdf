// PDF.js initializes a top-level `DOMMatrix` const, which is
// not available in serverless environments.
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {}
}

// Patch `FinalizationRegistry` constructor, since they are not available in Cloudflare Workers.
globalThis.FinalizationRegistry = class FinalizationRegistry {
  #callbacks

  constructor() {
    this.#callbacks = new WeakMap()
  }

  register(value, callback) {
    this.#callbacks.set(value, callback)
  }

  unregister(value) {
    this.#callbacks.delete(value)
  }
}

// Export to ensure the mocks are not removed by tree-shaking.
export const mocks = true
