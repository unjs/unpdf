// This rollup config is used to build PDF.js for serverless environments

import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "rollup";
import alias from "@rollup/plugin-alias";
import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import terser from "@rollup/plugin-terser";
import * as unenv from "unenv";
import { resolveAliases } from "./src/pdfjs-serverless/rollup/utils";
import { pdfjsTypes } from "./src/pdfjs-serverless/rollup/plugins";

const mockDir = fileURLToPath(
  new URL("src/pdfjs-serverless/mocks", import.meta.url),
);
const env = unenv.env(unenv.nodeless);

export default defineConfig({
  input: "src/pdfjs-serverless/index.mjs",
  output: {
    file: "dist/pdfjs.mjs",
    format: "esm",
    exports: "auto",
    inlineDynamicImports: true,
    generatedCode: {
      constBindings: true,
    },
    sourcemap: false,
  },
  external: env.external,
  plugins: [
    replace({
      delimiters: ["", ""],
      preventAssignment: true,
      values: {
        // Disable the `window` check (for requestAnimationFrame).
        "typeof window": '"undefined"',
        // Imitate the Node.js environment for all serverless environments, unenv will
        // take care of the remaining Node.js polyfills. Keep support for browsers.
        "const isNodeJS = typeof":
          'const isNodeJS = typeof document === "undefined" // typeof',
        // Force inlining the PDF.js worker.
        "await import(/* webpackIgnore: true */ this.workerSrc)":
          "__pdfjsWorker__",
        // Tree-shake client worker initialization logic.
        "!PDFWorkerUtil.isWorkerDisabled && !PDFWorker.#mainThreadWorkerMessageHandler":
          "false",
      },
    }),
    alias({
      entries: resolveAliases({
        canvas: join(mockDir, "canvas.mjs"),
        "path2d-polyfill": join(mockDir, "path2d-polyfill.mjs"),
        ...env.alias,
      }),
    }),
    nodeResolve(),
    commonjs({
      esmExternals: (id) => !id.startsWith("unenv/"),
      requireReturnsDefault: "auto",
    }),
    inject(env.inject),
    pdfjsTypes(),
    terser({
      mangle: {
        keep_fnames: true,
        keep_classnames: true,
      },
      format: {
        comments: false,
      },
    }),
  ],
});
