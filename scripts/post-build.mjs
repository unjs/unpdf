import { relative, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import fg from "fast-glob";

const rootDir = new URL("..", import.meta.url).pathname;
const targets = await fg.async(["dist/**/*.{d.cts,d.mts,d.ts}"], {
  rootDir,
  ignore: ["types/**"],
});

for (const filename of targets) {
  await fixTypePaths(filename);
}

async function fixTypePaths(filename) {
  let content = await readFile(filename, "utf8");
  if (!content.includes("pdfjs-dist/types")) {
    return;
  }

  const relativePath = relative(
    resolve(filename, ".."),
    resolve(rootDir, "dist/types"),
  );

  // Replace `pdfjs-dist/types` import path with relative path
  content = content.replace(/pdfjs-dist\/types/g, `${relativePath}`);

  await writeFile(resolve(rootDir, filename), content, "utf8");
}
