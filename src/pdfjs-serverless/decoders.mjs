// The files PDF.js would fetch from `wasmUrl`, bundled as lazy chunks so every
// runtime gets them without `pdfjs-dist` installed.
const decoderLoaders = {
  'jbig2.wasm': () => import('pdfjs-dist/wasm/jbig2.wasm'),
  'jbig2_nowasm_fallback.js': () => import('pdfjs-dist/wasm/jbig2_nowasm_fallback.js'),
  'openjpeg.wasm': () => import('pdfjs-dist/wasm/openjpeg.wasm'),
  'openjpeg_nowasm_fallback.js': () => import('pdfjs-dist/wasm/openjpeg_nowasm_fallback.js'),
}

/** Loads the WASM bytes or the JS fallback factory bundled under a PDF.js decoder file name. */
export async function loadDecoder(fileName) {
  const { default: decoder } = await decoderLoaders[fileName]()
  return decoder
}
