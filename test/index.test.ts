import { join } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { readFile, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  extractImages,
  extractText,
  getDocumentProxy,
  getMeta,
  getResolvedPDFJS,
  renderPageAsImage,
  resolvePDFJSImports,
} from "../src/index";

describe("unpdf", () => {
  it("can resolve a custom PDF.js version", async () => {
    // @ts-ignore: Dynamic import of serverless PDF.js build
    await resolvePDFJSImports(() => import("../dist/pdfjs"), {
      force: true,
    });
    const { text } = await extractText(await getPDF());

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"');
  });

  it("provides the PDF.js module", async () => {
    const PDFJS = await getResolvedPDFJS();
    const { version } = PDFJS;

    expect(version).toMatchInlineSnapshot('"4.0.189"');
  });

  it("extracts metadata from a PDF", async () => {
    const { info, metadata } = await getMeta(await getPDF());

    expect(Object.keys(metadata).length).toEqual(0);
    expect(info).toMatchInlineSnapshot(`
      {
        "Author": "Evangelos Vlachogiannis",
        "CreationDate": "D:20070223175637+02'00'",
        "Creator": "Writer",
        "EncryptFilterName": null,
        "IsAcroFormPresent": false,
        "IsCollectionPresent": false,
        "IsLinearized": false,
        "IsSignaturesPresent": false,
        "IsXFAPresent": false,
        "Language": null,
        "PDFFormatVersion": "1.4",
        "Producer": "OpenOffice.org 2.1",
      }
    `);
  });

  it("extracts text from a PDF", async () => {
    const { text, totalPages } = await extractText(await getPDF());

    expect(text[0]).toMatchInlineSnapshot('"Dummy PDF file"');
    expect(totalPages).toMatchInlineSnapshot("1");
  });

  it("extracts images from a PDF", async () => {
    const [image] = await extractImages(await getPDF("image-sample.pdf"), 1);
    const buffer = Buffer.from(image);
    expect(buffer.length).toMatchInlineSnapshot("13641540");
  });

  it("renders a PDF as image", async () => {
    await resolvePDFJSImports(() => import("pdfjs-dist"), {
      force: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const result = (await renderPageAsImage(
      await getPDF("image-sample.pdf"),
      1,
      { canvas: () => import("canvas") },
    ))!;
    // await writeFile(
    //   new URL("image-sample.png", import.meta.url),
    //   Buffer.from(result),
    // );
    expect(result.byteLength).toBeGreaterThanOrEqual(119_700);
  });

  it("supports passing PDFDocumentProxy", async () => {
    const pdf = await getDocumentProxy(await getPDF());
    const { info } = await getMeta(pdf);

    expect(info.Creator).toMatchInlineSnapshot('"Writer"');
  });
});

export async function getPDF(filename = "dummy.pdf") {
  const path = fileURLToPath(
    new URL(join("fixtures", filename), import.meta.url),
  );
  const pdf = await readFile(path);
  return new Uint8Array(pdf);
}
