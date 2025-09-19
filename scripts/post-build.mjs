// @ts-check
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const targets = await fg.async(['dist/**/*.{d.cts,d.mts,d.ts}'], {
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
  let content = await readFile(filename, 'utf8')
  if (!content.includes('pdfjs-dist/types')) {
    return
  }

  const relativePath = relative(
    resolve(filename, '..'),
    resolve(rootDir, 'dist/types'),
  )

  // Replace `pdfjs-dist/types` import path with relative path
  content = content.replace(
    /pdfjs-dist\/types/g,
    relativePath.startsWith('.') ? relativePath : `./${relativePath}`,
  )

  await writeFile(resolve(rootDir, filename), content, 'utf8')
}
