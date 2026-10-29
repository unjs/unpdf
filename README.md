# unpdf

Utilities for PDF extraction and rendering across all JavaScript runtimes – Node.js, Bun, the browser, and serverless environments like Cloudflare Workers. Especially useful for AI applications that need to summarize or analyze PDF documents.

Ships with a serverless build of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js), optimized for edge environments. If you're coming from [`pdf-parse`](https://www.npmjs.com/package/pdf-parse), `unpdf` is a modern, actively maintained alternative with broader runtime support.

## Features

- 🏗️ Works in Node.js 24+, Bun, browsers, and serverless environments ([Cloudflare Workers example](./examples/cloudflare))
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](#how-it-works))
- 💬 Extract [text](#extract-text), [images as PNG](#extract-images-as-png), links, and metadata – no native dependencies
- 🖼️ [Render pages as PNG, JPEG, or WebP](#render-a-page-as-an-image)
- 🔍 [Spot scanned pages](#spot-scanned-pages) before sending them to OCR
- 🧱 Opt-in to a [custom PDF.js build](#custom-pdfjs-build)

## Installation

```bash
# pnpm
pnpm add unpdf

# npm
npm install unpdf
```

## Use Cases

Every method takes binary PDF data (`Uint8Array`, `ArrayBuffer`) or a document proxy from [`getDocumentProxy`](#getdocumentproxy). Pass a proxy to run several methods on one document without parsing it again.

### Extract Text

```ts
import { extractText, getDocumentProxy } from 'unpdf'

const buffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  .then(res => res.arrayBuffer())

const pdf = await getDocumentProxy(new Uint8Array(buffer))
const { totalPages, text } = await extractText(pdf, { mergePages: true })
```

Without `mergePages`, `text` holds one string per page. For coordinates and font sizes, e.g. to detect tables, use [`extractTextItems`](#extracttextitems).

### Extract Images as PNG

PNG encoding needs no canvas and no native dependency, so it also runs in Cloudflare Workers:

```ts
import { writeFile } from 'node:fs/promises'
import { extractImages } from 'unpdf'

const images = await extractImages(pdf, 1, { format: 'png' })

for (const [index, image] of images.entries())
  await writeFile(`image-${index + 1}.png`, image.data)
```

Without `format`, `data` holds raw RGBA pixels. Each image carries its `bounds` on the page.

In browsers, a document proxy decodes some images into bitmaps, which `extractImages` skips. Pass binary data instead, or create the proxy with `isOffscreenCanvasSupported: false` and `isImageDecoderSupported: false`.

### Render a Page as an Image

Browsers render on a DOM canvas, which a Web Worker lacks. Node.js and Bun need [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas), passed as `canvasImport`. Serverless runtimes like Cloudflare Workers have no canvas.

```ts
import { renderPageAsImage } from 'unpdf'

const image = await renderPageAsImage(pdf, 1, {
  canvasImport: () => import('@napi-rs/canvas'),
  scale: 2,
  format: 'jpeg',
  quality: 0.8,
})
```

### Spot Scanned Pages

`inspectPages` measures text and images per page – where to draw the line between a text page and a scan depends on your documents:

```ts
import { inspectPages } from 'unpdf'

const { pages } = await inspectPages(pdf)

// Hidden OCR layers count as invisible text, so subtract them.
const scannedPageNumbers = pages
  .map((page, index) => ({ ...page, pageNumber: index + 1 }))
  .filter(page => page.textLength - page.invisibleTextLength < 20 && page.imageCoverage > 0.8)
  .map(page => page.pageNumber)
```

### Process Untrusted PDFs

PDF.js does not execute scripts embedded in PDFs, but resource limits are your job:

- **Image decoding:** `maxImageSize` is unlimited by default – pass e.g. `getDocumentProxy(data, { maxImageSize: 16_777_216 })` (~16 MP) so a single declared image can't allocate gigabytes.
- **Page fan-out:** `extractText`, `extractTextItems`, `extractLinks`, and `inspectPages` process all pages in one call – check `pdf.numPages` against a limit first.
- **Timeouts:** with the serverless build, parsing runs on your event loop (no worker) – race extraction calls against a timeout.

## API

`data` is binary PDF data or a `PDFDocumentProxy` throughout.

### `getDocumentProxy`

Creates a `PDFDocumentProxy` with `useSystemFonts: true`. In Node.js with `pdfjs-dist` installed, it uses that package's standard fonts instead of system fonts, and its CJK character maps (`cMapUrl`). Cloudflare Workers have no local `pdfjs-dist` – to extract text from CJK fonts without embedded mappings, pass `cMapUrl: 'https://unpkg.com/pdfjs-dist@6.4.299/cmaps/'`, `cMapPacked: true`, and `useWorkerFetch: true`. Your options override the defaults.

```ts
function getDocumentProxy(data: Uint8Array | ArrayBuffer, options?: DocumentInitParameters): Promise<PDFDocumentProxy>
```

### `extractText`

Extracts the text of every page, or one string with `mergePages: true` – line breaks kept, at most one blank line in a row.

```ts
function extractText(data, options?: { mergePages?: boolean }): Promise<{ totalPages: number, text: string | string[] }>
```

### `extractTextItems`

Extracts positioned text items per page: `str`, `x` and `y` in PDF space (origin bottom-left), `width`, `height`, `fontSize`, `fontFamily`, `dir`, `hasEOL`.

```ts
function extractTextItems(data): Promise<{ totalPages: number, items: StructuredTextItem[][] }>
```

### `extractLinks`

Extracts the URLs of link annotations per page.

```ts
function extractLinks(data): Promise<{ totalPages: number, links: string[][] }>
```

### `extractImages`

Extracts the images painted on a page – image XObjects, inline images, and image masks – as RGBA pixels or PNG bytes, each with `width`, `height`, and `bounds` in PDF space.

```ts
function extractImages(data, pageNumber: number, options?: { format?: 'rgba' | 'png' }): Promise<ExtractedImage[]>
```

### `renderPageAsImage`

Renders a page as image bytes, or as a data URL with `toDataURL: true`. `width` or `height` scale the page to that size.

```ts
function renderPageAsImage(data, pageNumber: number, options?: {
  canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>
  scale?: number // Default: 1
  width?: number
  height?: number
  format?: 'png' | 'jpeg' | 'webp' // Default: 'png'
  quality?: number // From 0 to 1, for JPEG and WebP
  toDataURL?: boolean
}): Promise<Uint8Array | string>
```

### `inspectPages`

Measures each page: `textLength`, `invisibleTextLength` (text drawn invisibly, as by OCR layers), `imageCount`, and `imageCoverage` (share of the page covered by images, from 0 to 1).

```ts
function inspectPages(data): Promise<{ totalPages: number, pages: PageInspection[] }>
```

### `getMeta`

Extracts the `/Info` dictionary and the XMP metadata (`null` without). `parseDates: true` turns the dates into `Date` objects.

```ts
function getMeta(data, options?: { parseDates?: boolean }): Promise<{ info: PDFInfo, metadata: Metadata | null }>
```

### `definePDFJSModule`

Sets the PDF.js build every other method uses. It loads on first use.

```ts
function definePDFJSModule(pdfjs: () => Promise<PDFJS>): void
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module – the serverless build, unless `definePDFJSModule` set another – to call the PDF.js API directly.

```ts
function getResolvedPDFJS(): Promise<PDFJS>
```

## Custom PDF.js Build

`unpdf` uses its serverless build unless you define another one, e.g. to pin a different PDF.js version. Install `pdfjs-dist` and call `definePDFJSModule` before any other method:

```ts
import { definePDFJSModule } from 'unpdf'

definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))
```

In Node.js, import the legacy build as shown. The default `pdfjs-dist` entry targets current browsers – it fails on Node.js 24 and warns on newer versions. `renderPageAsImage` still requires `canvasImport`, though PDF.js draws with the `@napi-rs/canvas` that `pdfjs-dist` installs as an optional dependency.

## How It Works

> [!NOTE]
> The serverless PDF.js bundle is built from PDF.js v6.4.299. It requires the global `Iterator` constructor (Safari 18.4+); without it, importing the bundle throws.

Heart and soul of this package is the [`pdfjs.rolldown.config.ts`](./pdfjs.rolldown.config.ts) file. It uses [Rolldown](https://rolldown.rs/) to bundle PDF.js for serverless environments. The key techniques:

- **String replacements** strip browser-specific references from the PDF.js source.
- **Worker inlining** embeds the PDF.js worker directly into the main bundle, since serverless runtimes can't load separate worker files.
- **Bundled image decoders** ship PDF.js' JBIG2 and OpenJPEG decoders, WASM and JS fallback, as lazy chunks, so CCITT, JBIG2, and JPEG 2000 images decode without `pdfjs-dist` or a `wasmUrl`. Bundlers that resolve the `workerd` condition, like Wrangler, ship only the JS fallbacks, since workerd can't compile WASM at runtime.
- **Global polyfills** fill in newer APIs like `Promise.try` and `Map.prototype.getOrInsert` for runtimes that lack them, plus `FinalizationRegistry` for Cloudflare Workers.

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
