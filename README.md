# unpdf

A collection of utilities to work with PDFs.

`unpdf` takes advantage of [export conditions](https://nodejs.org/api/packages.html#packages_conditional_exports) to provide a minimal bundle size for the browser. As of now, the available methods are only supported in Node contexts.

**Why this package then?**

- To circumvent build issues in serverless environments, where the `canvas` package is used by `PDF.js` not supported.
- WIP and more to come.

## Installation

Run the following command to add `unpdf` to your project.

```bash
pnpm install unpdf # or npm or yarn
```

## Usage

```ts
import { decodePDFText } from 'unpdf'

const pdfBuffer = await fetch('https://example.com/file.pdf').then(res => res.arrayBuffer())

const { totalPages, info, metadata, text } = await decodePDFText(
  new Uint8Array(pdfBuffer), { mergePages: true }
)
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
