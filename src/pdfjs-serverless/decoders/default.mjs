import { createDecoderLoader } from './loader.mjs'

// The files PDF.js would fetch from `wasmUrl`, bundled as lazy chunks so they
// load without `pdfjs-dist` installed.
export const loadDecoder = createDecoderLoader({
  'jbig2.wasm': () => import('pdfjs-dist/wasm/jbig2.wasm'),
  'jbig2_nowasm_fallback.js': () => import('pdfjs-dist/wasm/jbig2_nowasm_fallback.js'),
  'openjpeg.wasm': () => import('pdfjs-dist/wasm/openjpeg.wasm'),
  'openjpeg_nowasm_fallback.js': () => import('pdfjs-dist/wasm/openjpeg_nowasm_fallback.js'),
})
