import { version as installedPDFJSVersion } from 'pdfjs-dist/package.json'
import { describe, expect, it, vi } from 'vitest'
import { definePDFJSModule, getResolvedPDFJS } from '../src/index'
import { isWorkerd } from './utils'

describe('pdfjs resolution', () => {
  it('resolves the bundled build of the installed pdfjs-dist', async () => {
    const { version } = await getResolvedPDFJS()

    expect(version).toBe(installedPDFJSVersion)
  })

  it('defers loading a defined PDF.js module until first use', async () => {
    // @ts-expect-error: Dynamic import from package build.
    const loader = vi.fn(() => import('../dist/pdfjs'))
    definePDFJSModule(loader)

    expect(loader).not.toHaveBeenCalled()

    await Promise.all([getResolvedPDFJS(), getResolvedPDFJS()])
    await getResolvedPDFJS()
    expect(loader).toHaveBeenCalledOnce()
  })

  it('retries loading after a failed load', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      // @ts-expect-error: Dynamic import from package build.
      .mockImplementation(() => import('../dist/pdfjs'))
    definePDFJSModule(loader)

    await expect(getResolvedPDFJS()).rejects.toThrow('PDF.js could not be resolved')
    await expect(getResolvedPDFJS()).resolves.toHaveProperty('version')
  })

  it.runIf(isWorkerd)('leaves jbig2.wasm and openjpeg.wasm out of #pdfjs-decoders under the workerd condition', async () => {
    const { loadDecoder } = await import('#pdfjs-decoders')

    await expect(loadDecoder('jbig2.wasm')).rejects.toThrow('No bundled decoder for jbig2.wasm')
    await expect(loadDecoder('openjpeg.wasm')).rejects.toThrow('No bundled decoder for openjpeg.wasm')
  })
})

describe('base64 polyfills', () => {
  it('toBase64 encodes [104, 105] as aGk= and fromBase64 decodes it back where the runtime lacks both', async () => {
    const fromBase64 = Object.getOwnPropertyDescriptor(Uint8Array, 'fromBase64')
    const toBase64 = Object.getOwnPropertyDescriptor(Uint8Array.prototype, 'toBase64')
    // @ts-expect-error: The lib types declare it as required.
    delete Uint8Array.fromBase64
    // @ts-expect-error: The lib types declare it as required.
    delete Uint8Array.prototype.toBase64

    try {
      // @ts-expect-error: TypeScript cannot resolve the `?base64` query.
      await import('../src/pdfjs-serverless/polyfills.mjs?base64')

      expect(new Uint8Array([104, 105]).toBase64()).toBe('aGk=')
      expect(Uint8Array.fromBase64('aGk=')).toEqual(new Uint8Array([104, 105]))
    }
    finally {
      if (fromBase64)
        Object.defineProperty(Uint8Array, 'fromBase64', fromBase64)
      if (toBase64)
        // eslint-disable-next-line no-extend-native
        Object.defineProperty(Uint8Array.prototype, 'toBase64', toBase64)
    }
  })
})
