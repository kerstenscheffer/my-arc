// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic' // Automatic JSX Transform - no React import needed
    })
  ],
  build: {
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined // Let Vite handle chunking
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
