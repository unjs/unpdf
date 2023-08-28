import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  extractPDFText,
  getDocumentProxy,
  getPDFMeta,
  getResolvedPDFJS,
  resolvePDFJSImports,
} from "../src/index.node";

describe("unpdf", () => {
  it("can resolve a custom PDF.js version", async () => {
    // @ts-ignore: Dynamic import of serverless PDF.js build
    await resolvePDFJSImports(() => import("../dist/pdfjs"), {
      force: true,
    });
    const { text } = await extractPDFText(await getPDF());

    expect(text[0]).toEqual("Dummy PDF file");
  });

  it("provides the PDF.js module", async () => {
    const PDFJS = await getResolvedPDFJS();
    const { version } = PDFJS;

    expect(version).toMatchSnapshot();
  });

  it("extracts text from a PDF", async () => {
    const { text, totalPages } = await extractPDFText(await getPDF());

    expect(text[0]).toEqual("Dummy PDF file");
    expect(totalPages).toEqual(1);
  });

  it("extracts metadata from a PDF", async () => {
    const { info, metadata } = await getPDFMeta(await getPDF());

    expect(Object.keys(metadata).length).toEqual(0);
    expect(info).toMatchSnapshot();
  });

  it("supports PDF passing PDFDocumentProxy", async () => {
    const pdf = await getDocumentProxy(await getPDF());
    const { info } = await getPDFMeta(pdf);

    expect(info.Creator).toEqual("Writer");
  });
});

export async function getPDF() {
  // https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
  const pdf = await readFile(new URL("fixtures/dummy.pdf", import.meta.url));
  return new Uint8Array(pdf);
}
