import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index.web.ts", "src/index.worker", "src/index.node"],
  clean: true,
  declaration: true,
  externals: ["pdfjs-dist", "pdfjs-serverless"],
  rollup: {
    emitCJS: true,
  },
});
