# unpdf

A collection of utilities to work with PDFs. Uses Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) under the hood.

`unpdf` takes advantage of [export conditions](https://nodejs.org/api/packages.html#packages_conditional_exports) to circumvent build issues in serverless environments. PDF.js depends on the optional `canvas` module, which [doesn't work inside worker threads](https://github.com/Automattic/node-canvas/issues/1394).

This library is also intended as a modern alternative to the unmaintained [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Conditional exports for Browser, Node and worker environments
- 💬 Extract text from PDFs

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

const pdfBuffer = await fetch('https://example.com/file.pdf').then(res => res.arrayBuffer())

const { totalPages, info, metadata, text } = await decodePDFText(
  new Uint8Array(pdfBuffer), { mergePages: true }
)
```

## Methods

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
