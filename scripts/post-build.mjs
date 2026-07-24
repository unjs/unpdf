// @ts-check
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { glob } from 'tinyglobby'

const rootDir = fileURLToPath(new URL('..', import.meta.url))

// `fixedExtension` makes tsdown emit only `index.d.mts` and `index.d.cts`, but
// the package `types` field points at `index.d.ts`. Seed it from the CJS flavor
// so it matches the `main` (`index.cjs`) entry, then let the pass below rewrite
// its type paths alongside the other declarations.
await fsp.copyFile(
  path.resolve(rootDir, 'dist/index.d.cts'),
  path.resolve(rootDir, 'dist/index.d.ts'),
)

const bundleDeclarations = await glob(['dist/**/*.{d.cts,d.mts,d.ts}'], {
  cwd: rootDir,
  ignore: ['**/types/**'],
})

for (const filename of bundleDeclarations) {
  await relativeTypePaths(filename)
}

const vendoredDeclarations = await glob(['dist/types/**/*.d.ts'], {
  cwd: rootDir,
})

for (const filename of vendoredDeclarations) {
  await explicitImportExtensions(filename)
}

/**
 * @param {string} filename
 */
async function relativeTypePaths(filename) {
  let content = await fsp.readFile(path.resolve(rootDir, filename), 'utf8')
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

/**
 * The type declarations copied from `pdfjs-dist` are generated from JSDoc and
 * partly reference sibling modules without file extensions. Under
 * `moduleResolution: "nodenext"`, extensionless relative imports resolve to
 * error types, so append the missing `.js` extensions.
 *
 * @param {string} filename
 */
async function explicitImportExtensions(filename) {
  const content = await fsp.readFile(path.resolve(rootDir, filename), 'utf8')

  const patchedContent = content
    .replace(/(from\s+)(["'])(\.[^"']+)\2/g, (_, importFrom, quote, specifier) =>
      `${importFrom}${quote}${appendJsExtension(specifier)}${quote}`)
    .replace(/(import\()(["'])(\.[^"']+)\2/g, (_, importCall, quote, specifier) =>
      `${importCall}${quote}${appendJsExtension(specifier)}${quote}`)

  if (patchedContent !== content)
    await fsp.writeFile(path.resolve(rootDir, filename), patchedContent, 'utf8')
}

/**
 * @param {string} specifier
 */
function appendJsExtension(specifier) {
  return specifier.endsWith('.js') ? specifier : `${specifier}.js`
}
