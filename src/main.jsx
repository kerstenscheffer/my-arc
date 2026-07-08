// src/main.jsx
import './styles/theme.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ai-generator.css'
import './ui/tokens.css'   // design-contract tokens (goud), additief — laadt op elke pagina
import App from './App.jsx'

// Mount application
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <App />
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
