// src/main.jsx
import './styles/theme.css'
import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ai-generator.css'
import './ui/tokens.css'   // design-contract tokens (goud), additief — laadt op elke pagina
import App from './App.jsx'
import LaadScherm from './components/LaadScherm'
import { installeerTerugknop } from './terugknop'
import PaginaVangnet, { installeerFoutvanger } from './ui/PaginaVangnet'

// ── Service-worker kill-switch ──────────────────────────────────────────────
// De oude PWA-service-worker (public/service-worker.js) veroorzaakte spontane
// hard-refreshes: hij checkte elke 5 min op updates → stuurde NEW_VERSION_AVAILABLE
// → update-prompt → reload, én cachete HTML/JS-chunks (na een deploy = stale/
// mismatch). Registratie stond al uit, maar browsers die 'm ooit registreerden
// draaien 'm nog. Hier verwijderen we elke bestaande SW + z'n caches zodat de app
// voortaan altijd vers van het netwerk laadt. (No-op zodra er niks meer staat.)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(reg => reg.unregister()))
    .catch(() => {})
  if (window.caches?.keys) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {})
  }
}

installeerTerugknop()
// Fouten buiten het tekenen (klik, laden) ook naar app_fouten.
installeerFoutvanger()

// Live updates in de native app (zie modules/app-update/liveUpdate.js). Na de
// eerste render, zodat het opstarten er niet op wacht.
setTimeout(() => {
  Promise.all([import('./lib/supabase'), import('./modules/app-update/liveUpdate')])
    .then(([{ supabase }, { startLiveUpdate }]) => startLiveUpdate(supabase))
    .catch(e => console.warn('Live update start mislukt:', e?.message))
}, 0)

// Mount application
const container = document.getElementById('root');
const root = createRoot(container);

// Pagina's en tabbladen laden als losse stukken (React.lazy): een klant haalt
// nooit de coachcode op en andersom, en de marketingpagina's zitten niet in
// de app-bundel. LaadScherm is wat je ziet terwijl zo'n stuk binnenkomt.
root.render(
  // Buitenste vangnet: crasht iets boven de pagina's (inloggen, de schil van
  // het dashboard), dan een melding i.p.v. een wit scherm, en de fout in
  // app_fouten.
  <PaginaVangnet pagina="app">
    <Suspense fallback={<LaadScherm />}>
      <App />
    </Suspense>
  </PaginaVangnet>
);

// TIJDELIJK UITGESCHAKELD - Service worker veroorzaakt mounting issues
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available! Refresh to update.');
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}
*/
