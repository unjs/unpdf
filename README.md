# unpdf

A collection of utilities for PDF extraction and rendering. Designed specifically for serverless environments, but it also works in Node.js, Deno, Bun and the browser. `unpdf` is particularly useful for serverless AI applications, especially for summarizing PDF documents in document analysis workflows.

This library ships with a serverless build/redistribution of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) that is optimized for edge environments. Some string replacements, global mocks and inlining the PDF.js worker allow the browser code to become platform agnostic. See [`pdfjs.rollup.config.ts`](./pdfjs.rollup.config.ts) for the details.

This library is also intended as a modern alternative to the unmaintained but still popular [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Made for Node.js, browser and serverless environments
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](./package.json#L34))
- 💬 Extract [text](#extract-text-from-pdf), [links](#extractlinks), and [images](#extractimages) from PDF files
- 🧠 Perfect for AI applications and PDF summarization
- 🧱 Opt-in to legacy PDF.js build
- 💨 Zero dependencies

## PDF.js Compatibility

> [!Tip]
> The serverless PDF.js bundle provided by `unpdf` is built from PDF.js v5.4.149.

You can use an [official PDF.js build](#official-or-legacy-pdfjs-build) by using the [`definePDFJSModule`](#definepdfjsmodule) method. This is useful if you want to use a specific version or a custom build of PDF.js.

## Installation

Run the following command to add `unpdf` to your project.

```bash
# pnpm
pnpm add -D unpdf

# npm
npm install -D unpdf

# yarn
yarn add -D unpdf
```

## Usage

### Extract Text From PDF

```ts
import { extractText, getDocumentProxy } from 'unpdf'

// Either fetch a PDF file from the web or load it from the file system
const buffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  .then(res => res.arrayBuffer())
const buffer = await readFile('./dummy.pdf')

// Then, load the PDF file into a PDF.js document
const pdf = await getDocumentProxy(new Uint8Array(buffer))

// Finally, extract the text from the PDF file
const { totalPages, text } = await extractText(pdf, { mergePages: true })

console.log(`Total pages: ${totalPages}`)
console.log(text)
```

### Official or Legacy PDF.js Build

Usually you don't need to worry about the PDF.js build. `unpdf` ships with a serverless build of the latest PDF.js version. However, if you want to use the official PDF.js version or the legacy build, you can define a custom PDF.js module.

> [!WARNING]
> PDF.js v5.x uses `Promise.withResolvers`, which may not be supported in all environments, such as Node < 22. Consider to use the bundled serverless build, which includes a polyfill, or use an older version of PDF.js.

For example, if you want to use the official PDF.js build, you can do the following:

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

### `getMeta`

**Type Declaration**

```ts
function getMeta(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
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

> [!NOTE]
> This method will only work in Node.js and browser environments.

In order to use this method, make sure to meet the following requirements:

- Use the official PDF.js build (see below for details).
- Install the [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) package if you are using Node.js. This package is required to render the PDF page as an image.

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

- Use the official PDF.js build (see below for details).
- Install the [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas) package if you are using Node.js. This package is required to render the PDF page as an image.

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

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
