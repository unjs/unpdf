// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu().append({
  files: ['src/pdfjs-serverless/index.mjs'],
  rules: {
    'unused-imports/no-unused-imports': 'off',
  },
})
