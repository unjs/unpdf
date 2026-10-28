# Fixtures

PDF files have been added to the repository for testing purposes. These files are used to test the functionality of the `unpdf` library.

**Sources**:

- [w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)
- [github.com/py-pdf/sample-files](https://github.com/py-pdf/sample-files)
- `transparency.pdf`: handcrafted minimal PDF whose page content applies a luminosity soft mask (`/SMask` in `/ExtGState`), forcing PDF.js to request an intermediate canvas from the document-level canvas factory
- `cjk-predefined-cmap.pdf`: handcrafted minimal PDF with a non-embedded CID font encoded via the predefined `UniJIS-UCS2-H` CMap and no `/ToUnicode`, so its text only extracts once PDF.js can load the CMap data
- `standard-font.pdf`: handcrafted minimal PDF using the non-embedded standard 14 font `Helvetica`
- `images.pdf`: handcrafted minimal PDF with one image per PDF.js paint operation – a 2×1 RGB image XObject, a 2×2 RGB inline image drawn rotated by 90°, a 3×2 image mask inside a form XObject with a translating `/Matrix`, and a 10×2 1-bit gray image XObject – each with known pixel values
- `scanned-pages.pdf`: handcrafted minimal PDF with four 200×100 pages – a scan in four overlapping strips, the last running off the page; a half-page scan under an OCR layer drawn with text render modes 3 and 7 next to visible text; a blank page; and a page-sized image inside a half-scale form XObject beside an inline image and an image mask sharing one eighth of the page
