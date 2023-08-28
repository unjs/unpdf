import { writeFile } from "node:fs/promises";
import type { Plugin } from "rollup";

export function pdfjsTypes(): Plugin {
  return {
    name: "pdfjs:types",
    async writeBundle() {
      const data = "export * from './types/src/pdf.d.ts'\n";

      for (const filename of ["pdfjs.d.ts", "pdfjs.d.mts"]) {
        await writeFile(`dist/${filename}`, data, "utf8");
      }
    },
  };
}
