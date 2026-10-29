import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const fixtures: Record<string, () => Uint8Array> = {
  'annotation-image.pdf': buildAnnotationImage,
  'cjk-predefined-cmap.pdf': buildCJKPredefinedCMap,
  'document.pdf': buildDocument,
  'image-decoders.pdf': buildImageDecoders,
  'images.pdf': buildImages,
  'scanned-pages.pdf': buildScannedPages,
  'standard-font.pdf': buildStandardFont,
  'transparency.pdf': buildTransparency,
  'unpainted-images.pdf': buildUnpaintedImages,
}

for (const [fileName, build] of Object.entries(fixtures))
  await writeFile(join(import.meta.dirname, '../test/fixtures', fileName), build())

function buildAnnotationImage(): Uint8Array {
  const appearance = 'q 1 0 0 1 0 0 cm BI /W 1 /H 1 /CS /G /BPC 8 ID \x80 EI Q'

  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Annots [5 0 R] >>',
    stream('', ''),
    '<< /Type /Annot /Subtype /Stamp /Rect [50 60 150 110] /F 4 /AP << /N 6 0 R >> >>',
    stream('/Type /XObject /Subtype /Form /BBox [0 0 1 1] /Matrix [0 1 -1 0 0 0]', appearance),
  ])
}

function buildCJKPredefinedCMap(): Uint8Array {
  const text = '日本語テキスト'
  const ucs2Hex = [...text].map(char => char.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()).join('')

  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', `BT /F1 24 Tf 20 100 Td <${ucs2Hex}> Tj ET`),
    '<< /Type /Font /Subtype /Type0 /BaseFont /KozMinPro-Regular /Encoding /UniJIS-UCS2-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /KozMinPro-Regular /CIDSystemInfo << /Registry (Adobe) /Ordering (Japan1) /Supplement 4 >> /FontDescriptor 7 0 R /DW 1000 >>',
    '<< /Type /FontDescriptor /FontName /KozMinPro-Regular /Flags 4 /FontBBox [0 -200 1000 900] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>',
  ])
}

function buildDocument(): Uint8Array {
  const xmp = [
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">',
    '<xmp:CreateDate>2024-01-15T10:30:00+01:00</xmp:CreateDate>',
    '<xmp:ModifyDate>2024-02-20T12:00:00Z</xmp:ModifyDate>',
    '<xmp:MetadataDate>2024-02-21T08:15:00Z</xmp:MetadataDate>',
    '</rdf:Description>',
    '</rdf:RDF>',
    '</x:xmpmeta>',
    '<?xpacket end="w"?>',
  ].join('\n')
  // Runs of spaces between words and a wide `TJ` gap each extract as one space.
  const firstPage = [
    'BT /F1 12 Tf 20 160 Td (Links   to  pages) Tj',
    '0 -20 Td (   unpdf    on GitHub  ) Tj',
    '0 -20 Td [(PDF.js) -3000 (by Mozilla)] TJ ET',
  ].join('\n')
  const secondPage = [
    'BT /F1 12 Tf 20 160 Td (UnJS    ecosystem) Tj',
    '0 -20 Td (Back  to page one) Tj ET',
  ].join('\n')
  const page = '/Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 5 0 R >> >>'

  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R /Metadata 4 0 R >>',
    '<< /Type /Pages /Kids [6 0 R 10 0 R] /Count 2 >>',
    '<< /CreationDate (D:20240115103000+01\'00\') /ModDate (D:20240220120000Z) >>',
    stream('/Type /Metadata /Subtype /XML', xmp),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< ${page} /Contents 7 0 R /Annots [8 0 R 9 0 R] >>`,
    stream('', firstPage),
    linkAnnotation('[20 136 150 152]', '/A << /S /URI /URI (https://github.com/unjs/unpdf) >>'),
    linkAnnotation('[20 116 150 132]', '/A << /S /URI /URI (https://mozilla.github.io/pdf.js/) >>'),
    `<< ${page} /Contents 11 0 R /Annots [12 0 R 13 0 R] >>`,
    stream('', secondPage),
    linkAnnotation('[20 156 150 172]', '/A << /S /URI /URI (https://unjs.io/) >>'),
    linkAnnotation('[20 136 150 152]', '/Dest [6 0 R /Fit]'),
  ], { infoObjectNumber: 3 })

  function linkAnnotation(rectangle: string, target: string) {
    return `<< /Type /Annot /Subtype /Link /Rect ${rectangle} /Border [0 0 0] ${target} >>`
  }
}

function buildImageDecoders(): Uint8Array {
  // Black on the left in the top two rows, on the right in the bottom two – encoded by libtiff.
  const ccitt = '\x33\x17\x26\xA2\xF8\x00\x80\x08'
  // Red, blue – a lossless codestream encoded by OpenJPEG.
  const jpx = '\xFF\x4F\xFF\x51\x00\x2F\x00\x00\x00\x00\x00\x02\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00'
    + '\x00\x00\x00\x02\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03\x07\x01\x01\x07\x01\x01'
    + '\x07\x01\x01\xFF\x52\x00\x0C\x00\x00\x00\x01\x01\x00\x04\x04\x00\x01\xFF\x5C\x00\x04\x40\x40\xFF'
    + '\x90\x00\x0A\x00\x00\x00\x00\x00\x1E\x00\x01\xFF\x93\xCF\xB4\x0C\x09\x37\x1F\xDF\x80\x10\x0B\x1B'
    + '\xDF\x80\x10\x04\x27\xFF\xD9'

  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /XObject << /Fax1 5 0 R /Jpx1 6 0 R >> >> /Contents 4 0 R >>',
    stream('', 'q 64 0 0 16 10 10 cm /Fax1 Do Q\nq 20 0 0 10 10 50 cm /Jpx1 Do Q'),
    stream('/Type /XObject /Subtype /Image /Width 16 /Height 4 /ColorSpace /DeviceGray /BitsPerComponent 1 /Filter /CCITTFaxDecode /DecodeParms << /K -1 /Columns 16 /Rows 4 /BlackIs1 true >>', ccitt),
    stream('/Type /XObject /Subtype /Image /Width 2 /Height 1 /Filter /JPXDecode', jpx),
  ])
}

function buildImages(): Uint8Array {
  // Red, green / blue, white.
  const inlineRGB = '\xFF\x00\x00\x00\xFF\x00\x00\x00\xFF\xFF\xFF\xFF'
  const content = [
    'q 100 0 0 50 10 20 cm /Im1 Do Q',
    `q 0 40 -40 0 150 100 cm BI /W 2 /H 2 /CS /RGB /BPC 8 ID ${inlineRGB} EI Q`,
    '/Fm1 Do',
    'q 50 0 0 10 20 250 cm /Gray1 Do Q',
  ].join('\n')
  // Red, blue.
  const rgb = '\xFF\x00\x00\x00\x00\xFF'
  // One padded byte per row: 010 / 101, where 0 is painted.
  const mask = '\x40\xA0'
  // Two padded bytes per row: 1111000001 / 0000111110, where 0 is black.
  const gray = '\xF0\x40\x0F\x80'

  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /XObject << /Im1 5 0 R /Fm1 6 0 R /Gray1 8 0 R >> >> /Contents 4 0 R >>',
    stream('', content),
    stream('/Type /XObject /Subtype /Image /Width 2 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8', rgb),
    stream('/Type /XObject /Subtype /Form /BBox [0 0 300 300] /Matrix [1 0 0 1 0 100] /Resources << /XObject << /Mask1 7 0 R >> >>', 'q 0 0 1 rg 30 0 0 20 200 50 cm /Mask1 Do Q'),
    stream('/Type /XObject /Subtype /Image /Width 3 /Height 2 /ImageMask true', mask),
    stream('/Type /XObject /Subtype /Image /Width 10 /Height 2 /ColorSpace /DeviceGray /BitsPerComponent 1', gray),
  ])
}

function buildScannedPages(): Uint8Array {
  const objects: (string | undefined)[] = []
  const pageObjectNumbers = [10, 20, 30, 40]
  const resources = '/Resources << /XObject << /Im1 3 0 R /Fm1 5 0 R /Mask1 6 0 R >> /Font << /F1 4 0 R >> >>'

  define(1, '<< /Type /Catalog /Pages 2 0 R >>')
  define(2, `<< /Type /Pages /Kids [${pageObjectNumbers.map(number => `${number} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`)
  define(3, stream('/Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceGray /BitsPerComponent 8', '\x80'))
  define(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  define(5, stream('/Type /XObject /Subtype /Form /BBox [0 0 200 100] /Matrix [0.5 0 0 0.5 0 0] /Resources << /XObject << /Im1 3 0 R >> >>', 'q 200 0 0 100 0 0 cm /Im1 Do Q'))
  define(6, stream('/Type /XObject /Subtype /Image /Width 8 /Height 1 /ImageMask true', '\x0F'))
  definePage(10, [0, 25, 50, 75].map(y => `q 200 0 0 30 0 ${y} cm /Im1 Do Q`).join('\n'))
  // The `Q` after `3 Tr` restores visible text; `7 Tr` then runs through `TJ`, `'` and `"`.
  definePage(20, [
    'q 100 0 0 100 0 0 cm /Im1 Do Q',
    'q BT 3 Tr /F1 12 Tf 10 80 Td (Hello World) Tj ET Q',
    'BT /F1 12 Tf 10 20 Td (xyz) Tj ET',
    'BT 7 Tr /F1 12 Tf 14 TL 10 60 Td [(Ab) -200 (cd)] TJ (ef) \' 0 0 (gh) " ET',
  ].join('\n'))
  definePage(30, '')
  definePage(40, [
    '/Fm1 Do',
    'q 50 0 0 50 150 50 cm BI /W 1 /H 1 /CS /G /BPC 8 ID \x80 EI Q',
    'q 50 0 0 50 150 50 cm /Mask1 Do Q',
  ].join('\n'))

  return serializePDF(objects)

  function define(objectNumber: number, body: string) {
    objects[objectNumber - 1] = body
  }

  function definePage(objectNumber: number, content: string) {
    define(objectNumber, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] ${resources} /Contents ${objectNumber + 1} 0 R >>`)
    define(objectNumber + 1, stream('', content))
  }
}

function buildStandardFont(): Uint8Array {
  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', 'BT /F1 24 Tf 20 100 Td (Hello Helvetica) Tj ET'),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ])
}

function buildTransparency(): Uint8Array {
  return serializePDF([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /ExtGState << /GS0 << /Type /ExtGState /SMask << /Type /Mask /S /Luminosity /G 5 0 R >> >> >> >> /Contents 4 0 R >>',
    stream('', 'q /GS0 gs 1 0 0 rg 0 0 200 200 re f Q'),
    stream('/Type /XObject /Subtype /Form /BBox [0 0 200 200] /Group << /S /Transparency /CS /DeviceGray >>', '0.5 g 0 0 200 200 re f'),
  ])
}

function buildUnpaintedImages(): Uint8Array {
  const objects: string[] = []
  const catalog = add('')
  const pages = add('')
  const image = add(stream('/Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8', '\xFF\x00\x00'))
  const hiddenLayer = add('<< /Type /OCG /Name (Hidden) >>')
  const visibleLayer = add('<< /Type /OCG /Name (Visible) >>')
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const softMask = add(stream(`/Type /XObject /Subtype /Form /BBox [0 0 200 200] /Group << /S /Transparency /CS /DeviceGray >> /Resources << /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${image} 0 R >> >>`, 'q 200 0 0 200 0 0 cm /Im1 Do Q BT /F1 12 Tf 10 100 Td (Mask) Tj ET'))
  const graphicsState = add(`<< /Type /ExtGState /SMask << /Type /Mask /S /Luminosity /G ${softMask} 0 R >> >>`)
  const resources = `<< /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${image} 0 R >> /ExtGState << /G1 ${graphicsState} 0 R >> /Properties << /Off ${hiddenLayer} 0 R /On ${visibleLayer} 0 R >> >>`
  const visibleImage = 'q 50 0 0 50 0 0 cm /Im1 Do Q'
  const kids = [
    `q /G1 gs 0 0 1 rg 0 0 200 200 re f Q ${visibleImage}`,
    `/OC /Off BDC q 200 0 0 200 0 0 cm /Im1 Do Q BT /F1 12 Tf 10 100 Td (Hidden) Tj ET EMC /OC /On BDC ${visibleImage} EMC`,
  ].map((content) => {
    const contentStream = add(stream('', content))
    return add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 200 200] /Resources ${resources} /Contents ${contentStream} 0 R >>`)
  })
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R /OCProperties << /OCGs [${hiddenLayer} 0 R ${visibleLayer} 0 R] /D << /OFF [${hiddenLayer} 0 R] >> >> >>`
  objects[pages - 1] = `<< /Type /Pages /Kids [${kids.map(kid => `${kid} 0 R`).join(' ')}] /Count ${kids.length} >>`

  return serializePDF(objects)

  function add(body: string) {
    objects.push(body)
    return objects.length
  }
}

function stream(dictionary: string, data: string): string {
  return `<< ${dictionary ? `${dictionary} ` : ''}/Length ${data.length} >>\nstream\n${data}\nendstream`
}

/**
 * Serializes objects into a PDF file with a classic cross-reference table.
 * Object `n` sits at index `n - 1`, and a gap becomes a free entry.
 * Every string is one byte per character.
 */
function serializePDF(
  objects: (string | undefined)[],
  { infoObjectNumber }: { infoObjectNumber?: number } = {},
): Uint8Array {
  let pdf = '%PDF-1.7\n'
  const xrefEntries = ['0000000000 65535 f ']

  for (const [index, body] of objects.entries()) {
    if (body === undefined) {
      xrefEntries.push('0000000000 65535 f ')
      continue
    }
    xrefEntries.push(`${String(pdf.length).padStart(10, '0')} 00000 n `)
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${xrefEntries.length}\n${xrefEntries.map(entry => `${entry}\n`).join('')}`
  const info = infoObjectNumber === undefined ? '' : ` /Info ${infoObjectNumber} 0 R`
  pdf += `trailer\n<< /Size ${xrefEntries.length} /Root 1 0 R${info} >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Uint8Array.from(pdf, char => char.charCodeAt(0))
}
