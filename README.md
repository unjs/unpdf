# unpdf

A collection of utilities to work with PDFs. Designed specifically for Deno, workers and other nodeless environments.

`unpdf` ships with a serverless build/redistribution of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) for serverless environments. Apart from some string replacements and mocks, [`unenv`](https://github.com/unjs/unenv) does the heavy lifting by converting Node.js specific code to be platform-agnostic. See [`pdfjs.rollup.config.ts`](./pdfjs.rollup.config.ts) for all the details.

This library is also intended as a modern alternative to the unmaintained but still popular [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Works in Node.js, browser and workers
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](./package.json#L34))
- 💬 Extract text and images from PDFs
- 🧱 Opt-in to legacy PDF.js build
- 💨 Zero dependencies

## PDF.js Compatibility

The serverless build of PDF.js provided by `unpdf` is based on PDF.js v4.6.82. If you need a different version, you can [use another PDF.js build](#use-official-or-legacy-pdfjs-build).

## Installation

Run the following command to add `unpdf` to your project.

```bash
# pnpm
pnpm add unpdf

# npm
npm install unpdf

# yarn
yarn add unpdf
```

## Usage

### Extract Text From PDF

```ts
import { extractText, getDocumentProxy } from 'unpdf'

// Fetch a PDF file from the web
const buffer = await fetch(
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
).then(res => res.arrayBuffer())

// Or load it from the filesystem
const buffer = await readFile('./dummy.pdf')

// Load PDF from buffer
const pdf = await getDocumentProxy(new Uint8Array(buffer))
// Extract text from PDF
const { totalPages, text } = await extractText(pdf, { mergePages: true })

console.log(`Total pages: ${totalPages}`)
console.log(text)
```

### Access the PDF.js API

This will return the resolved PDF.js module and gives full access to the PDF.js API, like:

- `getDocument`
- `version`
- … and all other methods

Especially useful for platforms like 🦕 Deno or if you want to use the PDF.js API directly. If no custom build was defined beforehand, the serverless build bundled with `unpdf` will be initialized.

```ts
import { getResolvedPDFJS } from 'unpdf'

const { getDocument } = await getResolvedPDFJS()
const data = Deno.readFileSync('dummy.pdf')
const doc = await getDocument(data).promise

console.log(await doc.getMetadata())

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i)
  const textContent = await page.getTextContent()
  const contents = textContent.items.map(item => item.str).join(' ')
  console.log(contents)
}
```

### Use Official or Legacy PDF.js Build

Generally speaking, you don't need to worry about the PDF.js build. `unpdf` ships with a serverless build of the latest PDF.js version. However, if you want to use the official PDF.js version or the legacy build, you can define a custom PDF.js module.

> [!WARNING]
> The latest PDF.js v4.6.82 uses `Promise.withResolvers`, which may not be supported in all environments, such as Node < 22. Consider to use the bundled serverless build, which includes a polyfill, or use an older version of PDF.js.

```ts
// Before using any other method, define the PDF.js module
// if you need another PDF.js build
import { configureUnPDF } from 'unpdf'

await configureUnPDF({
  // Use the official PDF.js build (make sure to install it first)
  pdfjs: () => import('pdfjs-dist'),
})

// Now, you can use the other methods
// …
```

## Config

```ts
interface UnPDFConfiguration {
  /**
   * By default, UnPDF will use the latest version of PDF.js compiled for
   * serverless environments. If you want to use a different version, you can
   * provide a custom resolver function.
   *
   * @example
   * // Use the official PDF.js build (make sure to install it first)
   * () => import('pdfjs-dist')
   */
  pdfjs?: () => Promise<PDFJS>
}
```

## Methods

### `configureUnPDF`

Define a custom PDF.js module, like the legacy build. Make sure to call this method before using any other methods.

```ts
function configureUnPDF(config: UnPDFConfiguration): Promise<void>
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module. If no build is defined, the latest version will be initialized.

```ts
function getResolvedPDFJS(): Promise<PDFJS>
```

### `getMeta`

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

```ts
function extractText(
  data: DocumentInitParameters['data'] | PDFDocumentProxy,
  { mergePages }?: { mergePages?: boolean },
): Promise<{
  totalPages: number
  text: string | string[]
}>
```

### `renderPageAsImage`

> [!NOTE]
> This method will only work in Node.js and browser environments.

To render a PDF page as an image, you can use the `renderPageAsImage` method. This method will return an `ArrayBuffer` of the rendered image.

In order to use this method, you have to meet the following requirements:

- Use the official PDF.js build
- Install the [`canvas`](https://www.npmjs.com/package/canvas) package in Node.js environments

**Example**

```ts
import { configureUnPDF, renderPageAsImage } from 'unpdf'

await configureUnPDF({
  // Use the official PDF.js build
  pdfjs: () => import('pdfjs-dist'),
})

const pdf = await readFile('./dummy.pdf')
const buffer = new Uint8Array(pdf)
const pageNumber = 1

const result = await renderPageAsImage(buffer, pageNumber, {
  canvas: () => import('canvas'),
})
await writeFile('dummy-page-1.png', result)
```

**Type Declaration**

```ts
declare function renderPageAsImage(
  data: DocumentInitParameters['data'],
  pageNumber: number,
  options?: {
    canvas?: () => Promise<typeof import('canvas')>
    /** @default 1 */
    scale?: number
    width?: number
    height?: number
  },
): Promise<ArrayBuffer>
```

## FAQ

### Why Is `canvas` An Optional Dependency?

The official PDF.js library depends on the `canvas` module for Node.js environments, which [doesn't work inside worker threads](https://github.com/Automattic/node-canvas/issues/1394). That's why `unpdf` ships with a serverless build of PDF.js that mocks the `canvas` module.

However, to render PDF pages as images in Node.js environments, you need to install the `canvas` module. That's why it is a peer dependency.

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
