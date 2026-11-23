import { version as installedPDFJSVersion } from 'pdfjs-dist/package.json'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { definePDFJSModule, getResolvedPDFJS } from '../src/index'
import { getPDF, isWorkerd } from './utils'

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

  it('stubs DOMMatrix for a defined PDF.js module that leaves it unset', async () => {
    vi.stubGlobal('DOMMatrix', undefined)
    definePDFJSModule(async () => ({ version: 'custom' }))

    try {
      await getResolvedPDFJS()

      expect(typeof globalThis.DOMMatrix).toBe('function')
    }
    finally {
      vi.unstubAllGlobals()
      // @ts-expect-error: Dynamic import from package build.
      definePDFJSModule(() => import('../dist/pdfjs'))
    }
  })

  it.runIf(isWorkerd)('leaves jbig2.wasm and openjpeg.wasm out of #pdfjs-decoders under the workerd condition', async () => {
    const { loadDecoder } = await import('#pdfjs-decoders')

    await expect(loadDecoder('jbig2.wasm')).rejects.toThrow('No bundled decoder for jbig2.wasm')
    await expect(loadDecoder('openjpeg.wasm')).rejects.toThrow('No bundled decoder for openjpeg.wasm')
  })
})

describe('ponyfills', () => {
  const builtins = [
    [Uint8Array, 'fromBase64'],
    [Uint8Array.prototype, 'toBase64'],
    [Uint8Array.prototype, 'toHex'],
    [Math, 'sumPrecise'],
  ] as const
  const descriptors = builtins.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key))
  const bytes = new Uint8Array([0, 251, 255, 254, 104, 105])
  let ponyfills: {
    fromBase64: (string: string) => Uint8Array
    toBase64: (bytes: Uint8Array) => string
    toHex: (bytes: Uint8Array) => string
    sumPrecise: (items: number[]) => number
  }

  // Each fresh module instance below evaluates without the built-ins, so the
  // fallbacks run instead of the natives.
  beforeAll(async () => {
    for (const [target, key] of builtins)
      Reflect.deleteProperty(target, key)
    // The fresh bundle instance would replace the worker the shared one runs on.
    vi.stubGlobal('pdfjsWorker', undefined)
    // @ts-expect-error: TypeScript cannot resolve the `?fallbacks` query.
    ponyfills = await import('../src/pdfjs-serverless/ponyfills.mjs?fallbacks')
  })

  afterAll(() => {
    vi.unstubAllGlobals()
    builtins.forEach(([target, key], index) => {
      if (descriptors[index])
        Object.defineProperty(target, key, descriptors[index])
    })
  })

  it('toBase64 encodes [0, 251, 255, 254, 104, 105] as APv//mhp', () => {
    expect(ponyfills.toBase64(bytes)).toBe('APv//mhp')
  })

  it('fromBase64 decodes APv//mhp to [0, 251, 255, 254, 104, 105]', () => {
    expect(ponyfills.fromBase64('APv//mhp')).toEqual(bytes)
  })

  it('toHex encodes [0, 251, 255, 254, 104, 105] as 00fbfffe6869', () => {
    expect(ponyfills.toHex(bytes)).toBe('00fbfffe6869')
  })

  it('sumPrecise sums [1, 2.5, 3] to 6.5', () => {
    expect(ponyfills.sumPrecise([1, 2.5, 3])).toBe(6.5)
  })

  it('importing the bundle leaves Uint8Array.fromBase64, Uint8Array.prototype.toBase64, Uint8Array.prototype.toHex and Math.sumPrecise unset', async () => {
    // @ts-expect-error: Dynamic import from package build.
    await import('../dist/pdfjs.mjs?ponyfills')

    expect(builtins.map(([target, key]) => Object.hasOwn(target, key))).toEqual([false, false, false, false])
  })

  it('getDocument fingerprints sample.pdf', async () => {
    // @ts-expect-error: Dynamic import from package build.
    const { getDocument } = await import('../dist/pdfjs.mjs?ponyfills')

    // PDF.js fingerprints every document through `toHex`.
    const pdf = await getDocument({ data: await getPDF('sample.pdf') }).promise
    expect(pdf.fingerprints[0]).toMatch(/^[\da-f]{32}$/)
    await pdf.loadingTask.destroy()
  })
})
