# unpdf

A collection of utilities to work with PDFs. Designed specifically for Deno, workers and other nodeless environments.

`unpdf` ships with a serverless build/redistribution of Mozilla's [PDF.js](https://github.com/mozilla/pdf.js) for serverless environments. Apart from some string replacements and mocks, [`unenv`](https://github.com/unjs/unenv) does the heavy lifting by converting Node.js specific code to be platform-agnostic. See [`pdfjs.rollup.config.ts`](./pdfjs.rollup.config.ts) for all the details.

This library is also intended as a modern alternative to the unmaintained but still popular [`pdf-parse`](https://www.npmjs.com/package/pdf-parse).

## Features

- 🏗️ Works in Node.js, browser and workers
- 🪭 Includes serverless build of PDF.js ([`unpdf/pdfjs`](./package.json#L45))
- 💬 Extract text and images from PDFs
- 🧱 Opt-in to legacy PDF.js build
- 💨 Zero dependencies

## PDF.js Compatibility

> [!NOTE]
> This package is currently using PDF.js v4.0.189.

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
import { extractText, getDocumentProxy } from "unpdf";

// Fetch a PDF file from the web
const buffer = await fetch(
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
).then((res) => res.arrayBuffer());

// Or load it from the filesystem
const buffer = await readFile("./dummy.pdf");

// Load PDF from buffer
const pdf = await getDocumentProxy(new Uint8Array(pdf));
// Extract text from PDF
const { totalPages, text } = await extractText(pdf, { mergePages: true });
```

### Use Legacy Or Custom PDF.js Build

Generally, you don't need to worry about the PDF.js build. `unpdf` ships with a serverless build of the latest PDF.js version. However, if you want to use the official PDF.js version or the legacy build, you can define a custom PDF.js module.

```ts
// Before using any other methods, define the PDF.js module
import { defineUnPDFConfig } from "unpdf";

defineUnPDFConfig({
  // Use the legacy build
  pdfjs: () => import("pdfjs-dist/legacy/build/pdf.js"),
});

// Now, you can use the other methods
// …
```

### Access the PDF.js Module

This will return the resolved PDF.js module. If no build is defined, the serverless build bundled with `unpdf` will be initialized.

```ts
import { getResolvedPDFJS } from "unpdf";

const { version } = await getResolvedPDFJS();
```

### Use Serverless PDF.js Build In 🦕 Deno

Instead of using the methods provided by `unpdf`, you can directly import the serverless PDF.js build in Deno. This is useful if you want to use the PDF.js API directly.

```ts
import { getDocument } from "https://esm.sh/unpdf/pdfjs";

const data = Deno.readFileSync("dummy.pdf");
const doc = await getDocument(data).promise;

console.log(await doc.getMetadata());

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const textContent = await page.getTextContent();
  const contents = textContent.items.map((item) => item.str).join(" ");
  console.log(contents);
}
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
   * // Use the legacy build
   * () => import('pdfjs-dist/legacy/build/pdf.js')
   */
  pdfjs?: () => Promise<PDFJS>;
}
```

## Methods

### `defineUnPDFConfig`

Define a custom PDF.js module, like the legacy build. Make sure to call this method before using any other methods.

```ts
function defineUnPDFConfig(config: UnPDFConfiguration): Promise<void>;
```

### `getResolvedPDFJS`

Returns the resolved PDF.js module. If no build is defined, the latest version will be initialized.

```ts
function getResolvedPDFJS(): Promise<PDFJS>;
```

### `getMeta`

```ts
function getMeta(data: BinaryData | PDFDocumentProxy): Promise<{
  info: Record<string, any>;
  metadata: Record<string, any>;
}>;
```

### `extractText`

Extracts all text from a PDF. If `mergePages` is set to `true`, the text of all pages will be merged into a single string. Otherwise, an array of strings for each page will be returned.

```ts
function extractText(
  data: BinaryData | PDFDocumentProxy,
  { mergePages }?: { mergePages?: boolean },
): Promise<{
  totalPages: number;
  text: string | string[];
}>;
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
import { defineUnPDFConfig, renderPageAsImage } from "unpdf";

defineUnPDFConfig({
  // Use the official PDF.js build
  pdfjs: () => import("pdfjs-dist"),
});

const pdf = await readFile("./dummy.pdf");
const buffer = new Uint8Array(pdf);
const pageNumber = 1;

const result = await renderPageAsImage(buffer, pageNumber, {
  canvas: () => import("canvas"),
});
await writeFile("dummy-page-1.png", Buffer.from(result));
```

**Type Declaration**

```ts
declare function renderPageAsImage(
  data: BinaryData | PDFDocumentProxy,
  pageNumber: number,
  options?: {
    canvas?: () => Promise<typeof import("canvas")>;
    /** @default 1 */
    scale?: number;
    width?: number;
    height?: number;
  },
): Promise<ArrayBuffer>;
```

## FAQ

### Why Is `canvas` An Optional Dependency?

The official PDF.js library depends on the `canvas` module for Node.js environments, which [doesn't work inside worker threads](https://github.com/Automattic/node-canvas/issues/1394). That's why `unpdf` ships with a serverless build of PDF.js that mocks the `canvas` module.

However, to render PDF pages as images in Node.js environments, you need to install the `canvas` module. That's why it is a peer dependency.

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
