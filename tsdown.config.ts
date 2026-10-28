import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  dts: true,
  clean: false,
  deps: {
    neverBundle: [
      'unpdf/pdfjs',
      '@napi-rs/canvas',
      // Keep type imports as `pdfjs-dist/types/...` in the declarations –
      // post-build rewrites them to `./types/...` instead of inlining them.
      /^pdfjs-dist/,
    ],
  },
})
