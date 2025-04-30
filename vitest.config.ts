import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    poolOptions: {
      forks: {
        // Disabling isolation improves performance in Node.js environments
        isolate: false,
        singleFork: true,
      },
    },
  },
})
