import antfu from '@antfu/eslint-config'

const config: ReturnType<typeof antfu> = antfu().append({
  files: ['src/pdfjs-serverless/index.mjs'],
  rules: {
    'unused-imports/no-unused-imports': 'off',
  },
})

export default config
