import { readFile } from 'node:fs/promises'

const fileCache = new Map<string, Uint8Array>()

export async function getPDF(filename = 'dummy.pdf') {
  if (fileCache.has(filename))
    return new Uint8Array(fileCache.get(filename)!)

  // https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
  const pdf = await readFile(new URL(`./fixtures/${filename}`, import.meta.url))

  fileCache.set(filename, pdf)
  return new Uint8Array(pdf)
}
