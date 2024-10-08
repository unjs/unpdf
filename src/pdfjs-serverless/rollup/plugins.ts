import type { Plugin } from 'rollup'
import { writeFile } from 'node:fs/promises'

export function pdfjsTypes(): Plugin {
  return {
    name: 'pdfjs-serverless:types',
    async writeBundle() {
      const data = `
import * as PDFJS from './types/src/pdf'
declare function resolvePDFJS(): Promise<typeof PDFJS>
export { resolvePDFJS }
export * from './types/src/pdf'
`.trimStart()

      for (const filename of ['pdfjs.d.ts', 'pdfjs.d.mts']) {
        await writeFile(`dist/${filename}`, data, 'utf8')
      }
    },
  }
}
