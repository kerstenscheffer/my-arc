// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// command === 'build' → productie: strip alle console.* + debugger (scheelt
// overhead van logs die grote objecten serialiseren in hot paths en houdt de
// prod-console schoon). In dev (`vite`) blijven de logs staan om te debuggen.
export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic' // Automatic JSX Transform - no React import needed
    })
  ],
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
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
}))
