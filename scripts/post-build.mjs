// @ts-check
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'tinyglobby'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const targets = await glob(['dist/**/*.{d.cts,d.mts,d.ts}'], {
  cwd: rootDir,
  ignore: ['**/types/**'],
})

for (const filename of targets) {
  await relativeTypePaths(filename)
}

/**
 * @param {string} filename
 */
async function relativeTypePaths(filename) {
  let content = await fsp.readFile(filename, 'utf8')
  if (!content.includes('pdfjs-dist/types'))
    return

  const relativePath = path.relative(
    path.resolve(filename, '..'),
    path.resolve(rootDir, 'dist/types'),
  )

  // Replace `pdfjs-dist/types` import path with relative path and add `.js` extension
  const base = relativePath.startsWith('.') ? relativePath : `./${relativePath}`
  content = content.replace(/pdfjs-dist\/types(\/[^'";\s]+?)(?:\.js)?(?=['"])/g, `${base}$1.js`)
  content = content.replace(/pdfjs-dist\/types/g, base)

  await fsp.writeFile(path.resolve(rootDir, filename), content, 'utf8')
}
