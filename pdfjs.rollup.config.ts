// This rollup config is used to build PDF.js for serverless environments

import { defineConfig } from "rollup";
import alias from "@rollup/plugin-alias";
import replace from "@rollup/plugin-replace";
// eslint-disable-next-line import/no-named-as-default
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import inject from "@rollup/plugin-inject";
import terser from "@rollup/plugin-terser";
import * as unenv from "unenv";
import { resolveAliases } from "./src/_pdfjs/rollup/utils";
import { pdfjsTypes } from "./src/_pdfjs/rollup/plugins";

const env = unenv.env(unenv.nodeless);

export default defineConfig({
  input: "src/_pdfjs/index.mjs",
  output: {
    file: "dist/pdfjs.mjs",
    format: "esm",
    exports: "named",
    intro: "",
    outro: "",
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
        // Disable the `window` check (for requestAnimationFrame)
        "typeof window": '"undefined"',
        // Imitate the Node.js environment for all serverless environments, unenv will
        // take care of the remaining Node.js polyfills. Keep support for browsers.
        "const isNodeJS = typeof":
          'const isNodeJS = typeof document === "undefined" // typeof',
        // Force inlining the PDF.js worker
        '_util.isNodeJS && typeof require === "function"': "true",
        'GlobalWorkerOptions.workerSrc = ""':
          'GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.js")',
        'eval("require")(this.workerSrc)':
          'require("pdfjs-dist/build/pdf.worker.js")',
        // Tree-shake client worker initialization logic
        "!PDFWorkerUtil.isWorkerDisabled && !PDFWorker._mainThreadWorkerMessageHandler":
          "false",
      },
    }),
    alias({
      entries: resolveAliases({
        canvas: "src/_pdfjs/mock/canvas.mjs",
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
