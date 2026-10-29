/** Creates a loader for the WASM bytes or JS fallback factories bundled under PDF.js decoder file names. */
export function createDecoderLoader(decoderLoaders) {
  return async (fileName) => {
    if (!Object.hasOwn(decoderLoaders, fileName))
      throw new Error(`No bundled decoder for ${fileName}`)

    const { default: decoder } = await decoderLoaders[fileName]()
    return decoder
  }
}
