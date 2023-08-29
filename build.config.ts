import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index"],
  clean: false,
  declaration: true,
  externals: [
    // Exclude serverless PDF.js build
    "unpdf/pdfjs",
    // Don't follow type imports
    "pdfjs-dist",
  ],
  rollup: {
    emitCJS: true,
  },
});
