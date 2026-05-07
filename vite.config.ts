import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.VITE_APP_BASE ?? '/accent-coach/',
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['test/e2e/**', 'node_modules/**', 'docs/**', 'dist/**'],
  },
})
