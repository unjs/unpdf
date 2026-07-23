# unpdf

Utilities for PDF extraction and rendering across all JavaScript runtimes – Node.js, Deno, Bun, the browser, and serverless environments like Cloudflare Workers. Especially useful for AI applications that need to summarize or analyze PDF documents.

Ships with a serverless build of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js), optimized for edge environments. If you're coming from [`pdf-parse`](https://www.npmjs.com/package/pdf-parse), `unpdf` is a modern, actively maintained alternative with broader runtime support.

## Features

- 🏗️ Works in Node.js, browser and serverless environments
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](./package.json))
- 💬 Extract [text](#extract-text-from-pdf), [links](#extractlinks), and [images](#extractimages) from PDF files
- 🧠 Perfect for AI applications and PDF summarization
- 🧱 Opt-in to official or legacy PDF.js build

## Installation

```bash
# pnpm
pnpm add unpdf

# npm
npm install unpdf
```

## Usage

### Extract Text From PDF

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

### Official or Legacy PDF.js Build

Usually you don't need to worry about the PDF.js build. `unpdf` ships with a serverless build of the latest PDF.js version. However, if you want to use the official PDF.js version or the legacy build, you can define a custom PDF.js module.

> [!WARNING]
> PDF.js v5.x uses `Promise.withResolvers`, which may not be supported in all environments, such as Node < 22. Consider using the bundled serverless build, which includes a polyfill, or use an older version of PDF.js.

For example, if you want to use the official PDF.js build:

```ts
import { definePDFJSModule, extractText, getDocumentProxy } from 'unpdf'

// Define the PDF.js build before using any other unpdf method
await definePDFJSModule(() => import('pdfjs-dist'))

// Now, you can use all unpdf methods with the official PDF.js build
const pdf = await getDocumentProxy(/* … */)
const { text } = await extractText(pdf)
```

### PDF.js API

`unpdf` provides helpful [methods](#api) to work with PDF files, such as `extractText` and `extractImages`, which should cover most use cases. However, if you need more control over the PDF.js API, you can use the `getResolvedPDFJS` method to get the resolved PDF.js module.

Access the PDF.js API directly by calling `getResolvedPDFJS`:

```ts
import { getResolvedPDFJS } from 'unpdf'

const { version } = await getResolvedPDFJS()
```

> [!NOTE]
> If no other PDF.js build was defined, the serverless build will always be used.

For example, you can use the `getDocument` method to load a PDF file and then use the `getMetadata` method to get the metadata of the PDF file:

```ts
import { readFile } from 'node:fs/promises'
import { getResolvedPDFJS } from 'unpdf'

const { getDocument } = await getResolvedPDFJS()
const data = await readFile('./dummy.pdf')
const document = await getDocument(new Uint8Array(data)).promise

console.log(await document.getMetadata())
```

## How It Works

> [!NOTE]
> The serverless PDF.js bundle is built from PDF.js v5.6.205.

Heart and soul of this package is the [`pdfjs.rollup.config.ts`](./pdfjs.rollup.config.ts) file. It uses [Rollup](https://rollupjs.org/) to bundle PDF.js into a single file for serverless environments. The key techniques:

- **String replacements** strip browser-specific references from the PDF.js source.
- **Worker inlining** embeds the PDF.js worker directly into the main bundle, since serverless runtimes can't load separate worker files.
- **Global polyfills** provide missing APIs like `Promise.withResolvers` and `FinalizationRegistry` (unavailable in Node.js < 22 and Cloudflare Workers, respectively).

## API

### `definePDFJSModule`

Allows to define a custom PDF.js build. This method should be called before using any other method. If no custom build is defined, the serverless build will be used.

**Type Declaration**

```ts
function definePDFJSModule(pdfjs: () => Promise<PDFJS>): Promise<void>
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module. If no other PDF.js build was defined, the serverless build will be used. This method is useful if you want to use the PDF.js API directly.

**Type Declaration**

```ts
function getResolvedPDFJS(): Promise<PDFJS>
```

### `getDocumentProxy`

Creates a `PDFDocumentProxy` from binary PDF data. Every extraction method accepts either raw data or an existing proxy – use this when you want to reuse one document across multiple calls.

Applies sensible defaults: `isEvalSupported: false` and `useSystemFonts: true`; in Node.js additionally `disableFontFace: true` and `standardFontDataUrl` resolved from the local `pdfjs-dist` package (see the font rendering tip in [`renderPageAsImage`](#renderpageasimage)).

**Type Declaration**

```ts
function getDocumentProxy(
  data: DocumentInitParameters['data'],
  options?: DocumentInitParameters,
): Promise<PDFDocumentProxy>
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

Extracts all text from a PDF. If `mergePages` is set to `true`, the text of all pages will be merged into a single string. Otherwise, an array of strings for each page will be returned.

**Type Declaration**

```ts
function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options?: {
    mergePages?: false
  }
): Promise<{
  totalPages: number
  text: string[]
}>
function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  options: {
    mergePages: true
  }
): Promise<{
  totalPages: number
  text: string
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

Extracts images from a specific page of a PDF document, including necessary metadata such as width, height, and calculated color channels. Works with both the serverless and official PDF.js build.

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

> [!NOTE]
> The following example uses the [sharp](https://github.com/lovell/sharp) library to process and save the extracted images. You will need to install it with your preferred package manager.

```ts
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { extractImages, getDocumentProxy } from 'unpdf'

async function extractPdfImages() {
  const buffer = await readFile('./document.pdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))

  // Extract images from page 1
  const imagesData = await extractImages(pdf, 1)
  console.log(`Found ${imagesData.length} images on page 1`)

  // Process each image with sharp (optional)
  let totalImagesProcessed = 0
  for (const imgData of imagesData) {
    const imageIndex = ++totalImagesProcessed

    await sharp(imgData.data, {
      raw: {
        width: imgData.width,
        height: imgData.height,
        channels: imgData.channels
      }
    })
      .png()
      .toFile(`image-${imageIndex}.png`)

    console.log(`Saved image ${imageIndex} (${imgData.width}x${imgData.height}, ${imgData.channels} channels)`)
  }
}

extractPdfImages().catch(console.error)
```

### `renderPageAsImage`

To render a PDF page as an image, you can use the `renderPageAsImage` method. This method will return an `ArrayBuffer` of the rendered image. It can also return a data URL (`string`) if `toDataURL` option is set to `true`.

> [!NOTE]
> This method will only work in Node.js and browser environments.

In order to use this method, make sure to meet the following requirements:

- Use the official PDF.js build (see [Official or Legacy PDF.js Build](#official-or-legacy-pdfjs-build)).
- Install the [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) package if you are using Node.js. This package is required to render the PDF page as an image.

> [!TIP]
> In Node.js, `getDocumentProxy` automatically sets `disableFontFace: true` and resolves `standardFontDataUrl` from your local `pdfjs-dist` package for correct font rendering. To customize this behavior, pass your own options:
>
> ```ts
> const pdf = await getDocumentProxy(buffer, {
>   disableFontFace: false,
>   standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@latest/standard_fonts/',
> })
> ```

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
    toDataURL?: false
  },
): Promise<ArrayBuffer>
function renderPageAsImage(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  pageNumber: number,
  options: {
    canvasImport?: () => Promise<typeof import('@napi-rs/canvas')>
    /** @default 1.0 */
    scale?: number
    width?: number
    height?: number
    toDataURL: true
  },
): Promise<string>
```

**Examples**

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { definePDFJSModule, renderPageAsImage } from 'unpdf'

// Use the official PDF.js build
await definePDFJSModule(() => import('pdfjs-dist'))

const pdf = await readFile('./dummy.pdf')
const buffer = new Uint8Array(pdf)
const pageNumber = 1

const result = await renderPageAsImage(buffer, pageNumber, {
  canvasImport: () => import('@napi-rs/canvas'),
  scale: 2,
})
await writeFile('dummy-page-1.png', new Uint8Array(result))
```

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { definePDFJSModule, renderPageAsImage } from 'unpdf'

await definePDFJSModule(() => import('pdfjs-dist'))

const pdf = await readFile('./dummy.pdf')
const buffer = new Uint8Array(pdf)
const pageNumber = 1

const result = await renderPageAsImage(buffer, pageNumber, {
  canvasImport: () => import('@napi-rs/canvas'),
  scale: 2,
  toDataURL: true,
})

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dummy Page</title>
  </head>
  <body>
    <img alt="Example Page" src="${result}">
  </body>
</html>`

await writeFile('dummy-page-1.html', html)
```

## Processing Untrusted PDFs

The `getDocumentProxy` defaults are safe against script execution (`isEvalSupported: false`), but resource limits are your job:

- **Image decoding:** `maxImageSize` is unlimited by default – pass e.g. `maxImageSize: 16_777_216` (~16 MP) so a single declared image can't allocate gigabytes.
- **Page fan-out:** `extractText`, `extractTextItems`, and `extractLinks` process all pages in one call – check `pdf.numPages` against a limit first.
- **Timeouts:** with the serverless build, parsing runs on your event loop (no worker) – race extraction calls against a timeout.
- The raw `getDocument` from `unpdf/pdfjs` applies none of these defaults.

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
