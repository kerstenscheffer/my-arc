// vite.config.js
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import apiDev from './vite-api-dev.js'

// De versie die in de bundel terechtkomt moet dezelfde zijn als de versie die
// naar de App Store gaat, anders meldt de app een update die er niet is (of
// juist niet). Daarom lezen we hem uit het Xcode-project zelf in plaats van hem
// ergens apart bij te houden: bij één bron kun je de ander niet vergeten.
function marketingVersie() {
  try {
    const pbx = readFileSync('./ios/App/App.xcodeproj/project.pbxproj', 'utf8')
    const m = pbx.match(/MARKETING_VERSION = ([0-9][0-9.]*);/)
    return m ? m[1] : '0'
  } catch {
    return '0'
  }
}

// command === 'build' → productie: strip alle console.* + debugger (scheelt
// overhead van logs die grote objecten serialiseren in hot paths en houdt de
// prod-console schoon). In dev (`vite`) blijven de logs staan om te debuggen.
export default defineConfig(({ command }) => ({
  plugins: [
    react({
      jsxRuntime: 'automatic' // Automatic JSX Transform - no React import needed
    }),
    // Draait /api/* lokaal, zoals Vercel dat in productie doet. Zonder dit
    // geeft elke fetch naar /api een 404 op localhost en lijkt de functie stuk.
    apiDev()
  ],
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
  define: {
    __APP_VERSIE__: JSON.stringify(marketingVersie()),
  },
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
