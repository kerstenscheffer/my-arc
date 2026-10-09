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

// Zelfde idee voor Android: versionName uit build.gradle, de versie die in
// de Play Store staat.
function androidVersie() {
  try {
    const gradle = readFileSync('./android/app/build.gradle', 'utf8')
    const m = gradle.match(/versionName\s+"([0-9][0-9.]*)"/)
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
    __APP_VERSIE_ANDROID__: JSON.stringify(androidVersie()),
  },
  build: {
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        // Grote bibliotheken in eigen, stabiele chunks: die veranderen bij een
        // deploy niet en blijven dus in de browsercache. De pagina's en
        // tabbladen zelf splitsen via React.lazy (App.jsx, CoachHub.jsx,
        // ClientDashboard.jsx).
        //
        // React zit bewust NIET in een eigen stuk. Met 'vendor-react' apart
        // importeerden vendor en vendor-react elkaar over en weer (o.a. via de
        // CommonJS-hulpcode van Rollup), en dan is React nog niet klaar als
        // een ander stuk hem aanroept: "Cannot set properties of undefined
        // (setting 'Children')" en een wit scherm in productie (9 okt 2026).
        // Regel: alles wat React nodig heeft mag naar React wijzen, nooit
        // andersom; React + de hulpcode staan daarom in 'vendor'.
        manualChunks(id) {
          if (id.includes('commonjsHelpers') || id.startsWith('\0')) return 'vendor'
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'vendor-charts'
          if (id.includes('/jspdf') || id.includes('/html2canvas/')) return 'vendor-pdf'
          if (id.includes('@zxing')) return 'vendor-scanner'
          if (id.includes('/lucide-react/')) return 'vendor-icons'
          return 'vendor'
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
}))
