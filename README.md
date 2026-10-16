# unpdf

Utilities for PDF extraction and rendering across all JavaScript runtimes – Node.js, Bun, the browser, and serverless environments like Cloudflare Workers. Especially useful for AI applications that need to summarize or analyze PDF documents.

Ships with a serverless build of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js), optimized for edge environments. If you're coming from [`pdf-parse`](https://www.npmjs.com/package/pdf-parse), `unpdf` is a modern, actively maintained alternative with broader runtime support.

## Features

- 🏗️ Works in Node.js 22+, Bun, browsers, and serverless environments ([Cloudflare Workers example](./examples/cloudflare))
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](#how-it-works))
- 💬 Extract [text](#extracttext), [positioned text](#extracttextitems), [links](#extractlinks), [images](#extractimages), and [metadata](#getmeta) from PDF files
- 🖼️ [Render pages as images](#renderpageasimage)
- 🧠 Perfect for AI applications and PDF summarization
- 🧱 Opt-in to a [custom PDF.js build](#custom-pdfjs-build)

## Installation

```bash
# pnpm
pnpm add unpdf

# npm
npm install unpdf
```

## Usage

```ts
import { extractText, getDocumentProxy } from 'unpdf'

// Fetch a PDF from the web or load it from the file system
const buffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  .then(res => res.arrayBuffer())

const pdf = await getDocumentProxy(new Uint8Array(buffer))
const { totalPages, text } = await extractText(pdf, { mergePages: true })

console.log(`Total pages: ${totalPages}`)
console.log(text)
```

## How It Works

> [!NOTE]
> The serverless PDF.js bundle is built from PDF.js v6.4.299. It requires the global `Iterator` constructor (Safari 18.4+); without it, importing the bundle throws.

Heart and soul of this package is the [`pdfjs.rolldown.config.ts`](./pdfjs.rolldown.config.ts) file. It uses [Rolldown](https://rolldown.rs/) to bundle PDF.js into a single file for serverless environments. The key techniques:

- **String replacements** strip browser-specific references from the PDF.js source.
- **Worker inlining** embeds the PDF.js worker directly into the main bundle, since serverless runtimes can't load separate worker files.
- **Global polyfills** fill in newer APIs like `Promise.try` and `Map.prototype.getOrInsert` for runtimes that lack them, plus `FinalizationRegistry` for Cloudflare Workers.

## API

### `definePDFJSModule`

Sets the PDF.js build every other method uses – call it before any of them. See [Custom PDF.js Build](#custom-pdfjs-build).

**Type Declaration**

```ts
function definePDFJSModule(pdfjs: () => Promise<PDFJS>): Promise<void>
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module – the serverless build, unless `definePDFJSModule` set another. Use it to call the PDF.js API directly.

**Type Declaration**

```ts
function getResolvedPDFJS(): Promise<PDFJS>
```

**Example**

```ts
import { getResolvedPDFJS } from 'unpdf'

const { version } = await getResolvedPDFJS()
```

### `getDocumentProxy`

Creates a `PDFDocumentProxy` from binary PDF data. Every extraction method accepts either raw data or an existing proxy – use this when you want to reuse one document across multiple calls.

Applies sensible defaults: `useSystemFonts: true`; in Node.js additionally `disableFontFace: true`, plus `standardFontDataUrl` and `cMapUrl`/`cMapPacked` resolved from the local `pdfjs-dist` package for standard font and CJK character map support. Without `pdfjs-dist` installed, the Node.js defaults are skipped.

**Type Declaration**

```ts
function getDocumentProxy(
  data: DocumentInitParameters['data'],
  options?: DocumentInitParameters,
): Promise<PDFDocumentProxy>
```

**Example**

Your options override the defaults:

```ts
const pdf = await getDocumentProxy(buffer, {
  disableFontFace: false,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@latest/standard_fonts/',
})
```

### `getMeta`

Extracts metadata from a PDF. If `parseDates` is set to `true`, the date properties will be parsed into `Date` objects.

**Type Declaration**

```ts
function getMeta(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options?: {
    parseDates?: boolean
  },
): Promise<{
  info: Record<string, any>
  metadata: Record<string, any>
}>
```

### `extractText`

Extracts all text from a PDF. If `mergePages` is set to `true`, the text of all pages will be merged into a single string with line breaks preserved and at most one blank line in a row. Otherwise, an array of strings for each page will be returned.

**Type Declaration**

```ts
function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options?: {
    mergePages?: boolean
  }
): Promise<{
  totalPages: number
  text: string | string[]
}>
```

### `extractTextItems`

Extracts text with layout information – one array of positioned items per page. Useful when plain text is not enough and you need coordinates, font sizes, or reading direction, e.g. for table detection or positional parsing.

**Type Declaration**

```ts
interface StructuredTextItem {
  str: string
  /** X position in PDF coordinate space (origin: bottom-left). */
  x: number
  /** Y position in PDF coordinate space (origin: bottom-left). */
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  /** Text direction: `"ltr"`, `"rtl"`, or `"ttb"`. */
  dir: string
  /** Whether the text item is followed by a line break. */
  hasEOL: boolean
}

function extractTextItems(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{
  totalPages: number
  items: StructuredTextItem[][]
}>
```

### `extractLinks`

Extracts all links from a PDF document, including hyperlinks and external URLs.

**Type Declaration**

```ts
function extractLinks(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
): Promise<{
  totalPages: number
  links: string[]
}>
```

**Example**

```ts
import { readFile } from 'node:fs/promises'
import { extractLinks, getDocumentProxy } from 'unpdf'

// Load a PDF file
const buffer = await readFile('./document.pdf')
const pdf = await getDocumentProxy(new Uint8Array(buffer))

// Extract all links from the PDF
const { totalPages, links } = await extractLinks(pdf)

console.log(`Total pages: ${totalPages}`)
console.log(`Found ${links.length} links:`)
for (const link of links) console.log(link)
```

### `extractImages`

Extracts images from a specific page of a PDF document, including necessary metadata such as width, height, and calculated color channels.

**Type Declaration**

```ts
interface ExtractedImageObject {
  data: Uint8ClampedArray
  width: number
  height: number
  channels: 1 | 3 | 4
  key: string
}

function extractImages(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
): Promise<ExtractedImageObject[]>
```

**Example**

Saves each image as PNG with [sharp](https://github.com/lovell/sharp), installed separately:

```ts
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { extractImages, getDocumentProxy } from 'unpdf'

const buffer = await readFile('./document.pdf')
const pdf = await getDocumentProxy(new Uint8Array(buffer))
const images = await extractImages(pdf, 1)

for (const [index, image] of images.entries()) {
  await sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: image.channels },
  })
    .png()
    .toFile(`image-${index + 1}.png`)
}
```

### `renderPageAsImage`

Renders a PDF page as PNG and returns its bytes as an `ArrayBuffer`, or a data URL (`string`) with `toDataURL: true`.

Rendering needs a canvas: browsers bring their own, while Node.js and Bun need the [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) package, passed as `canvasImport`. Serverless runtimes like Cloudflare Workers have neither.

**Type Declaration**

```ts
function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options?: {
    canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>
    /** @default 1.0 */
    scale?: number
    width?: number
    height?: number
    toDataURL?: boolean
  },
): Promise<ArrayBuffer | string>
```

**Example**

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { renderPageAsImage } from 'unpdf'

const buffer = await readFile('./dummy.pdf')
const image = await renderPageAsImage(new Uint8Array(buffer), 1, {
  canvasImport: () => import('@napi-rs/canvas'),
  scale: 2,
})

await writeFile('dummy-page-1.png', new Uint8Array(image))
```

## Custom PDF.js Build

`unpdf` uses its serverless build unless you define another one, e.g. to pin a different PDF.js version. Install `pdfjs-dist` and call `definePDFJSModule` before any other method:

```ts
import { definePDFJSModule, extractText, getDocumentProxy } from 'unpdf'

await definePDFJSModule(() => import('pdfjs-dist/legacy/build/pdf.mjs'))

const pdf = await getDocumentProxy(/* … */)
const { text } = await extractText(pdf)
```

In Node.js, import the legacy build as shown. The default `pdfjs-dist` entry targets current browsers – it fails on Node.js 24 and older and warns on newer versions.

## Processing Untrusted PDFs

PDF.js does not execute scripts embedded in PDFs, but resource limits are your job:

- **Image decoding:** `maxImageSize` is unlimited by default – pass e.g. `maxImageSize: 16_777_216` (~16 MP) so a single declared image can't allocate gigabytes.
- **Page fan-out:** `extractText`, `extractTextItems`, and `extractLinks` process all pages in one call – check `pdf.numPages` against a limit first.
- **Timeouts:** with the serverless build, parsing runs on your event loop (no worker) – race extraction calls against a timeout.
- The raw `getDocument` from `unpdf/pdfjs` applies none of these defaults.

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
