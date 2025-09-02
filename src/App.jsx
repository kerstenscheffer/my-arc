import { useState, useEffect } from 'react'
import React from 'react'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import AIGenerator from './components/AIGenerator'
import Goals from './components/Goals'
import ClientDashboard from './client/ClientDashboard'
import Dashboard from './components/Dashboard'
import CoachHub from './coach/CoachHub'
import CoachHubV2 from './coach/CoachHubV2'
import DatabaseService from './services/DatabaseService'
import { LanguageProvider } from './contexts/LanguageContext'
import PWAInstaller from './components/PWAInstaller'

const db = DatabaseService

// iOS PWA Detection Helper
const isInStandaloneMode = () => {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator.standalone) || 
         document.referrer.includes('android-app://');
}

// Error Boundary voor iOS PWA debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 App Error:', error, errorInfo);
    this.setState({
      error: error.toString(),
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      const isStandalone = isInStandaloneMode();
      
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            background: 'rgba(17, 17, 17, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid #ef4444',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(239, 68, 68, 0.3)'
          }}>
            <h1 style={{ 
              color: '#ef4444', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              MY ARC Error
            </h1>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ 
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                color: '#10b981'
              }}>
                {isStandalone ? '📱 PWA Mode Active' : '🌐 Browser Mode'}
              </p>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem',
                wordBreak: 'break-word',
                lineHeight: '1.4'
              }}>
                {this.state.error}
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Reload App
              </button>
              
              {isStandalone && (
                <button 
                  onClick={() => {
                    // Clear cache and reload for PWA
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear Cache
                </button>
              )}
            </div>
            
            {/* Debug info voor development */}
            {process.env.NODE_ENV === 'development' && (
              <details style={{ 
                marginTop: '1.5rem',
                textAlign: 'left'
              }}>
                <summary style={{ 
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8rem'
                }}>
                  Technical Details
                </summary>
                <pre style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  overflow: 'auto',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(this.state.errorInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Debug logging voor iOS PWA
  useEffect(() => {
    console.log('🔍 APP MOUNTED');
    console.log('Standalone mode:', isInStandaloneMode());
    console.log('User Agent:', navigator.userAgent);
    console.log('Window location:', window.location.pathname);
    
    // iOS PWA specific debug
    if (isInStandaloneMode()) {
      console.log('🚀 Running as installed PWA!');
      
      // Check localStorage/sessionStorage availability
      try {
        localStorage.setItem('pwa-test', 'true');
        localStorage.removeItem('pwa-test');
        console.log('✅ localStorage available');
      } catch (e) {
        console.error('❌ localStorage error:', e);
      }
    }
  }, []);

  // DIRECT CHECK - VOOR ALLES ANDERS!
  if (window.location.pathname === '/reset-password') {
    return (
      <LanguageProvider>
        <ResetPassword />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // Check localStorage on init
  const storedMode = localStorage.getItem('isClientMode') === 'true'
  
  // V2 TOGGLE
  const useV2CoachHub = false

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isClientMode, setIsClientMode] = useState(storedMode)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  // Save to localStorage when mode changes
  useEffect(() => {
    localStorage.setItem('isClientMode', isClientMode)
  }, [isClientMode])

  const checkUser = async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // Extra check voor iOS PWA
      if (isInStandaloneMode()) {
        console.log('📱 PWA: Checking auth in standalone mode');
      }
      
      const currentUser = await db.getCurrentUser()
      
      if (currentUser) {
        console.log('✅ User found:', currentUser.email);
        setUser(currentUser)
        setAuthError(null)
      } else {
        console.log('❌ No user - showing login');
        setUser(null)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError(error.message)
      setUser(null)
      
      // iOS PWA specific error logging
      if (isInStandaloneMode()) {
        console.error('🚨 PWA Auth Error:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isClientMode')
    setIsClientMode(false)
  }

  // Enhanced loading screen with PWA indicator
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ 
            color: '#fff', 
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            Loading MY ARC...
          </div>
          {isInStandaloneMode() && (
            <div style={{ 
              color: '#10b981', 
              fontSize: '0.85rem',
              marginTop: '0.5rem'
            }}>
              PWA Mode Active
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show auth error if exists (for PWA debugging)
  if (authError && isInStandaloneMode()) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            PWA Authentication Issue
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {authError}
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear & Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Check URL for client login
  if (window.location.pathname === '/client-login') {
    if (!user) {
      return (
        <LanguageProvider>
          <Login onLogin={() => {
            setIsClientMode(true)
            localStorage.setItem('isClientMode', 'true')
            checkUser()
          }} />
          <PWAInstaller />
        </LanguageProvider>
      )
    }
  }

  // Show regular login if no user
  if (!user) {
    return (
      <LanguageProvider>
        <Login onLogin={() => {
          setIsClientMode(false)
          localStorage.setItem('isClientMode', 'false')
          checkUser()
        }} />
        <PWAInstaller />
      </LanguageProvider>
    )
  }

  // Dashboard routing based on state
  if (isClientMode) {
    return (
      <LanguageProvider>
        <ClientDashboard onLogout={handleLogout} />
        <PWAInstaller />
      </LanguageProvider>
    )
  } else {
    return (
      <LanguageProvider>
        {useV2CoachHub ? (
          <>
            <CoachHubV2 onLogout={handleLogout} />
            <PWAInstaller />
          </>
        ) : (
          <>
            <CoachHub onLogout={handleLogout} />
            <PWAInstaller />
          </>
        )}
      </LanguageProvider>
    )
  }
}

// Export met Error Boundary wrapper
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

// CSS Animation (wordt toegevoegd door index.html)
// Voeg dit toe als het nog niet bestaat:
if (!document.getElementById('app-animations')) {
  const style = document.createElement('style');
  style.id = 'app-animations';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
