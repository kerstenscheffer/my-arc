// src/components/login/LoginMain.jsx - UPDATED VERSION
import { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
import PasswordResetService from '../../services/PasswordResetService' // NEW SERVICE
import BackgroundSlideshow from './BackgroundSlideshow'
import LoginButtons from './LoginButtons'
import FeatureSlider from './FeatureSlider'
import QuoteSlider from './QuoteSlider'
import LoginWidget from './LoginWidget'
import { ChevronLeft, Mail, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react'

const db = DatabaseService
const passwordReset = PasswordResetService // NEW SERVICE INSTANCE
const COACH_ACCESS_PASSWORD = 'MYARC2025'

export default function LoginMain() {
  const [loginMode, setLoginMode] = useState(null)
  const [showFeatures, setShowFeatures] = useState(true)
  const [coachPassword, setCoachPassword] = useState('')
  const [coachAccessVerified, setCoachAccessVerified] = useState(false)
  const [message, setMessage] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)
  
  const isMobile = window.innerWidth <= 768
  
  useEffect(() => {
    checkExistingSession()
    
    // Log setup instructions in development
    if (window.location.hostname === 'localhost') {
      passwordReset.logSetupInstructions()
    }
  }, [])
  
  const checkExistingSession = async () => {
    const user = await db.getCurrentUser()
    if (user) {
      const isClientMode = localStorage.getItem('isClientMode') === 'true'
      window.location.href = '/dashboard' // FIXED: Always go to dashboard, let App.jsx handle routing
    }
  }
  
  const handleLogin = async (email, password, rememberMe) => {
    try {
      if (loginMode === 'coach' && !coachAccessVerified) {
        if (coachPassword !== COACH_ACCESS_PASSWORD) {
          return { 
            success: false, 
            error: 'Onjuiste coach toegangscode' 
          }
        }
        setCoachAccessVerified(true)
        setCoachPassword('')
        return { 
          success: false, 
          error: 'Voer nu je inloggegevens in' 
        }
      }
      
      const result = await db.signIn(email, password)
      
      if (result?.user) {
        const isClientMode = loginMode === 'client'
        localStorage.setItem('isClientMode', isClientMode.toString())
        
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email)
        } else {
          localStorage.removeItem('rememberEmail')
        }
        
        setTimeout(() => {
          window.location.href = '/dashboard' // FIXED: Redirect to dashboard instead of root
        }, 1000)
        
        return { success: true }
      }
      
      return { 
        success: false, 
        error: result?.error || 'Onjuist email of wachtwoord' 
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.message || 'Er ging iets mis bij het inloggen' 
      }
    }
  }
  
  const handlePasswordReset = () => {
    setShowResetModal(true)
    setResetMessage(null)
    setResetEmail('')
  }
  
  const sendResetEmail = async () => {
    if (!resetEmail) {
      setResetMessage({
        type: 'error',
        text: 'Vul je email adres in'
      })
      return
    }
    
    setResetLoading(true)
    setResetMessage(null)
    
    // Use new PasswordResetService
    const result = await passwordReset.sendResetEmail(resetEmail)
    
    if (result.success) {
      setResetMessage({
        type: 'success',
        text: result.message
      })
      
      // Close modal after 3 seconds on success
      setTimeout(() => {
        setShowResetModal(false)
        setResetEmail('')
        setResetMessage(null)
      }, 3000)
    } else {
      setResetMessage({
        type: 'error',
        text: result.error
      })
      
      // Show developer note if available
      if (result.developerNote && window.location.hostname === 'localhost') {
        console.log('📋 Developer Note:', result.developerNote)
      }
    }
    
    setResetLoading(false)
  }
  
  const handleModeSelect = (mode) => {
    setLoginMode(mode)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <BackgroundSlideshow />
      
      {!loginMode && (
        <LoginButtons onModeSelect={handleModeSelect} />
      )}
      
      {showFeatures && !loginMode && (
        <FeatureSlider onClose={() => setShowFeatures(false)} />
      )}
      
      <QuoteSlider />
      
      {!showFeatures && !loginMode && (
        <button
          onClick={() => setShowFeatures(true)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '0.5rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '100px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            zIndex: 25
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          Bekijk features
        </button>
      )}
      
      {/* Password Reset Modal - UPDATED */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            background: 'rgba(17, 17, 17, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '18px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}>
              Wachtwoord Reset
            </h3>
            
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Voer je email in voor een reset link
            </p>
            
            {/* Development mode info */}
            {window.location.hostname === 'localhost' && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.75rem',
                color: '#3b82f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={14} />
                  <span>Development Mode - Check console voor setup</span>
                </div>
              </div>
            )}
            
            {resetMessage && (
              <div style={{
                background: resetMessage.type === 'error'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${resetMessage.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: resetMessage.type === 'error' ? '#ef4444' : '#10b981',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {resetMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                {resetMessage.text}
              </div>
            )}
            
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="jouw@email.nl"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !resetLoading) {
                    sendResetEmail()
                  }
                }}
                disabled={resetLoading}
                autoFocus
              />
              <Mail size={18} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)'
              }} />
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={sendResetEmail}
                disabled={resetLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  opacity: resetLoading ? 0.6 : 1,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ArrowRight size={16} />
                {resetLoading ? 'Versturen...' : 'Stuur Reset Email'}
              </button>
              
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setResetEmail('')
                  setResetMessage(null)
                }}
                disabled={resetLoading}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Coach Access Code Modal */}
      {loginMode === 'coach' && !coachAccessVerified && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '85%' : '360px',
          maxWidth: '360px',
          zIndex: 40
        }}>
          <div style={{
            background: 'rgba(17, 17, 17, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '18px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Coach Verificatie
            </h3>
            
            {message && message.type === 'error' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#ef4444',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                {message.text}
              </div>
            )}
            
            <input
              type="password"
              value={coachPassword}
              onChange={(e) => setCoachPassword(e.target.value)}
              placeholder="Coach toegangscode"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  if (coachPassword === COACH_ACCESS_PASSWORD) {
                    setCoachAccessVerified(true)
                    setCoachPassword('')
                    setMessage(null)
                  } else {
                    setMessage({ type: 'error', text: 'Onjuiste toegangscode' })
                  }
                }
              }}
              autoFocus
            />
            
            <button
              onClick={() => {
                if (coachPassword === COACH_ACCESS_PASSWORD) {
                  setCoachAccessVerified(true)
                  setCoachPassword('')
                  setMessage(null)
                } else {
                  setMessage({ type: 'error', text: 'Onjuiste toegangscode' })
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Verifieer Toegang
            </button>
            
            <button
              onClick={() => {
                setLoginMode(null)
                setCoachPassword('')
                setMessage(null)
              }}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              Terug
            </button>
          </div>
        </div>
      )}
      
      {loginMode && (loginMode === 'client' || coachAccessVerified) && (
        <>
          <button
            onClick={() => {
              setLoginMode(null)
              setCoachAccessVerified(false)
              setCoachPassword('')
              setMessage(null)
            }}
            style={{
              position: 'fixed',
              top: isMobile ? '20px' : '40px',
              left: isMobile ? '20px' : '40px',
              zIndex: 45,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(17, 17, 17, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '100px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(17, 17, 17, 0.95)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
            }}
          >
            <ChevronLeft size={18} />
            Terug
          </button>
          
          <LoginWidget 
            loginMode={loginMode}
            onLogin={handleLogin}
            onPasswordReset={handlePasswordReset}
            isVisible={true}
          />
        </>
      )}
    </div>
  )
}
