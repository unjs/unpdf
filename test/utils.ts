import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const fixturesDir = join(import.meta.dirname, 'fixtures')

export async function getPDF(filename = 'sample.pdf') {
  const pdf = await readFile(join(fixturesDir, filename))
  return new Uint8Array(pdf)
}
