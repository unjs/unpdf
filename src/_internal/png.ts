// See: https://www.w3.org/TR/png-3/

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]

let crcTable: Uint32Array | undefined

/**
 * Encodes RGBA pixels as an unfiltered 8-bit RGBA PNG, compressed through
 * `CompressionStream`, which Node.js, Cloudflare Workers, and browsers all provide.
 */
export async function encodePNG(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const rowLength = width * 4
  // Each row leads with its filter type, 0 for none.
  const scanlines = new Uint8Array((rowLength + 1) * height)
  for (let y = 0; y < height; y++) {
    scanlines.set(rgba.subarray(y * rowLength, (y + 1) * rowLength), y * (rowLength + 1) + 1)
  }

  const header = new Uint8Array(13)
  const headerView = new DataView(header.buffer)
  headerView.setUint32(0, width)
  headerView.setUint32(4, height)
  header[8] = 8 // Bits per sample.
  header[9] = 6 // Color type truecolor with alpha.

  const chunks = [
    createChunk('IHDR', header),
    createChunk('IDAT', await deflate(scanlines)),
    createChunk('IEND', new Uint8Array(0)),
  ]

  const png = new Uint8Array(PNG_SIGNATURE.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  png.set(PNG_SIGNATURE)
  let offset = PNG_SIGNATURE.length
  for (const chunk of chunks) {
    png.set(chunk, offset)
    offset += chunk.length
  }

  return png
}

async function deflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  // PNG takes the zlib format, which `deflate` produces and `deflate-raw` doesn't.
  const stream = new CompressionStream('deflate')
  const writer = stream.writable.getWriter()
  const [compressed] = await Promise.all([
    new Response(stream.readable).arrayBuffer(),
    writer.write(data),
    writer.close(),
  ])

  return new Uint8Array(compressed)
}

/** Lays out a chunk as length, type, data, and the CRC of type and data. */
function createChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i)
  }
  chunk.set(data, 8)
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))

  return chunk
}

function crc32(bytes: Uint8Array): number {
  crcTable ??= createCRCTable()

  let crc = 0xFFFFFFFF
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xFF]! ^ (crc >>> 8)
  }

  return (crc ^ 0xFFFFFFFF) >>> 0
}

function createCRCTable(): Uint32Array {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let crc = n
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? 0xEDB88320 ^ (crc >>> 1) : crc >>> 1
    }
    table[n] = crc
  }

  return table
}
