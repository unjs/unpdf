# Fixtures

PDF files have been added to the repository for testing purposes. These files are used to test the functionality of the `unpdf` library.

**Sources**:

- [w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)
- [github.com/py-pdf/sample-files](https://github.com/py-pdf/sample-files)

**Handcrafted**: minimal PDFs written by [`generate-fixtures.ts`](../../scripts/generate-fixtures.ts) – regenerate them with `node scripts/generate-fixtures.ts`.

- `document.pdf`: two pages of non-embedded `Helvetica` text with runs of spaces; three link annotations with distinct URI actions and one internal link to the first page; `/Info` and XMP dates
- `transparency.pdf`: page content that applies a luminosity soft mask (`/SMask` in `/ExtGState`), forcing PDF.js to request an intermediate canvas from the document-level canvas factory
- `cjk-predefined-cmap.pdf`: a non-embedded CID font encoded via the predefined `UniJIS-UCS2-H` CMap and no `/ToUnicode`, so its text only extracts once PDF.js can load the CMap data
- `image-decoders.pdf`: a 16×4 CCITT Group 4 image and a 2×1 lossless JPEG 2000 image with known pixel values, one for each WASM module PDF.js decodes images with – JBIG2 shares the CCITT module
- `standard-font.pdf`: the non-embedded standard 14 font `Helvetica`
- `images.pdf`: one image per PDF.js paint operation – a 2×1 RGB image XObject, a 2×2 RGB inline image drawn rotated by 90°, a 3×2 image mask inside a form XObject with a translating `/Matrix`, and a 10×2 1-bit gray image XObject – each with known pixel values
- `scanned-pages.pdf`: four 200×100 pages – a scan in four overlapping strips, the last running off the page; a half-page scan under an OCR layer drawn with text render modes 3 and 7 next to visible text; a blank page; and a page-sized image inside a half-scale form XObject beside an inline image and an image mask sharing one eighth of the page
- `annotation-image.pdf`: a stamp annotation whose appearance stream, rotated by its `/Matrix`, paints a 1×1 inline image into its `/BBox [0 0 1 1]`, so the image still fills the annotation rectangle `[50 60 150 110]`
- `unpainted-images.pdf`: two 200×200 pages, each painting one 1×1 image XObject as a visible 50×50 square and again across the whole page where it never shows – inside a luminosity soft mask, which also holds the text `Mask`, and in an optional content group turned off by default, which also holds the text `Hidden`
