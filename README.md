# unpdf

A collection of utilities to work with PDFs. Uses Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) under the hood and lazily initializes the library.

`unpdf` takes advantage of [export conditions](https://nodejs.org/api/packages.html#packages_conditional_exports) to circumvent build issues in serverless environments. For example, PDF.js depends on the optional `canvas` module, which [doesn't work inside worker threads](https://github.com/Automattic/node-canvas/issues/1394).

This library is also intended as a modern alternative to the unmaintained but still popular [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Conditional exports for Browser, Node and worker environments
- 💬 Extract text and images from PDFs
- 🧱 Opt-in to legacy PDF.js build

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

```ts
import { extractPDFText } from 'unpdf'

const pdfBuffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  .then(res => res.arrayBuffer())

const { totalPages, text } = await extractPDFText(
  new Uint8Array(pdfBuffer), { mergePages: true }
)
```

### Use Legacy Or Custom PDF.js Build

```ts
// Before using any other methods, define the PDF.js module
import { defineUnPDFConfig } from 'unpdf'

// Use the legacy build
defineUnPDFConfig({
  pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js')
})

// Now, you can use the other methods
// …
```

### Access the PDF.js Module

```ts
import { getResolvedPDFJS } from 'unpdf'

const { version } = await getResolvedPDFJS()
```

## Config

```ts
interface UnPDFConfiguration {
  /**
   * By default, UnPDF will use the latest version of PDF.js. If you want to
   * use an older version or the legacy build, set a promise that resolves to
   * the PDF.js module.
   *
   * @example
   * () => import('pdfjs-dist/legacy/build/pdf.js')
   */
  pdfjs?: () => typeof PDFJS
}
```

## Methods

### `defineUnPDFConfig`

Define a custom PDF.js module, like the legacy build.

```ts
function defineUnPDFConfig(config: UnPDFConfiguration): Promise<void>
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module.

```ts
function getResolvedPDFJS(): Promise<typeof import('pdfjs-dist')>
```

### `getPDFMeta`

```ts
function getPDFMeta(
  data: BinaryData | PDFDocumentProxy
): Promise<{
  info: Record<string, any>
  metadata: Record<string, any>
}>
```

### `extractPDFText`

```ts
function extractPDFText(
  data: BinaryData | PDFDocumentProxy,
  { mergePages }?: { mergePages?: boolean }
): Promise<{
  totalPages: number
  text: string | string[]
}>
```

### `getImagesFromPage`

```ts
function getImagesFromPage(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number
): Promise<ArrayBuffer[]>
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
