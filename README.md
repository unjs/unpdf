# unpdf

A collection of utilities to work with PDFs. Uses Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) under the hood.

`unpdf` takes advantage of [export conditions](https://nodejs.org/api/packages.html#packages_conditional_exports) to circumvent build issues in serverless environments. PDF.js depends on the optional `canvas` module, which [doesn't work inside worker threads](https://github.com/Automattic/node-canvas/issues/1394).

This library is also intended as a modern alternative to the unmaintained [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Conditional exports for Browser, Node and worker environments
- 💬 Extract text from PDFs
- 🧱 Opt-in to legacy PDF.js build

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

```ts
import { decodePDFText } from 'unpdf'

const pdfBuffer = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  .then(res => res.arrayBuffer())

const { totalPages, info, metadata, text } = await decodePDFText(
  new Uint8Array(pdfBuffer), { mergePages: true }
)
```

### Use Legacy Or Custom PDF.js Build

```ts
// Before using any other methods, define the PDF.js module
import { decodePDFText, defineUnPDFConfig } from 'unpdf'

// Use the legacy build
defineUnPDFConfig({
  pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js')
})

// Now, you can use the other methods
// …
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

```ts
function defineUnPDFConfig({ pdfjs }: UnPDFConfiguration): Promise<void>
```

### `decodePDFText`

```ts
interface PDFContent {
  totalPages: number
  info?: Record<string, any>
  metadata?: any
  text: string | string[]
}

function decodePDFText(
  data: ArrayBuffer,
  { mergePages }?: { mergePages?: boolean }
): Promise<PDFContent>
```

### `getImagesFromPage`

```ts
function getImagesFromPage(
  data: ArrayBuffer,
  pageNumber: number
): Promise<ArrayBuffer[]>
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
