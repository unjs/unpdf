import { createDecoderLoader } from './loader.mjs'

// workerd refuses to compile WASM from bytes at runtime, so this variant
// bundles only the JS fallbacks.
export const loadDecoder = createDecoderLoader({
  'jbig2_nowasm_fallback.js': () => import('pdfjs-dist/wasm/jbig2_nowasm_fallback.js'),
  'openjpeg_nowasm_fallback.js': () => import('pdfjs-dist/wasm/openjpeg_nowasm_fallback.js'),
})
