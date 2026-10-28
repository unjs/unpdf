# Fixtures

PDF files have been added to the repository for testing purposes. These files are used to test the functionality of the `unpdf` library.

**Sources**:

- [w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)
- [github.com/py-pdf/sample-files](https://github.com/py-pdf/sample-files)
- `transparency.pdf`: handcrafted minimal PDF whose page content applies a luminosity soft mask (`/SMask` in `/ExtGState`), forcing PDF.js to request an intermediate canvas from the document-level canvas factory
- `cjk-predefined-cmap.pdf`: handcrafted minimal PDF with a non-embedded CID font encoded via the predefined `UniJIS-UCS2-H` CMap and no `/ToUnicode`, so its text only extracts once PDF.js can load the CMap data
- `standard-font.pdf`: handcrafted minimal PDF using the non-embedded standard 14 font `Helvetica`
- `images.pdf`: handcrafted minimal PDF with one image per PDF.js paint operation – a 2×1 RGB image XObject, a 2×2 RGB inline image drawn rotated by 90°, a 3×2 image mask inside a form XObject with a translating `/Matrix`, and a 10×2 1-bit gray image XObject – each with known pixel values
