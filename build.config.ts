import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index.web", "src/index.worker", "src/index.node"],
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
