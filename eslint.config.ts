import antfu from '@antfu/eslint-config'

const config: ReturnType<typeof antfu> = antfu().append(
  {
    rules: {
      'antfu/reasonable-newline': 'off',
    },
  },
  {
    files: ['src/pdfjs-serverless/index.mjs'],
    rules: {
      'unused-imports/no-unused-imports': 'off',
    },
  },
)

export default config
