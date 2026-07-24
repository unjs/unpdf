# Fixtures

PDF files have been added to the repository for testing purposes. These files are used to test the functionality of the `unpdf` library.

**Sources**:

- [w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)
- [github.com/py-pdf/sample-files](https://github.com/py-pdf/sample-files)
- `transparency.pdf`: handcrafted minimal PDF whose page content applies a luminosity soft mask (`/SMask` in `/ExtGState`), forcing PDF.js to request an intermediate canvas from the document-level canvas factory
