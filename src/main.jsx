import './styles/theme.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ai-generator.css'
import App from './App.jsx'

// Wait for DOM to be fully ready (iOS PWA fix)
const mountApp = () => {
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('Root element not found!');
    return;
  }
  
  // Clear any existing content to prevent hydration issues
  container.innerHTML = '';
  
  // Create root and render
  const root = createRoot(container);
  root.render(<App />);
};

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // DOM already loaded (PWA scenario)
  mountApp();
}
