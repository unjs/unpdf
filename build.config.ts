import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index.node', 'src/index.web.ts'],
  clean: true,
  declaration: true,
  externals: ['pdfjs-dist'],
  rollup: {
    emitCJS: true,
  },
})
