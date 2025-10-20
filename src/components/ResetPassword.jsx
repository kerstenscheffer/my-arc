// src/components/ResetPassword.jsx - UPDATED WITH NEW SERVICE
import { useState, useEffect } from 'react'
import PasswordResetService from '../services/PasswordResetService' // NEW SERVICE
import { 
  KeyRound, Lock, AlertCircle, CheckCircle, 
  Shield, ArrowRight, Loader
} from 'lucide-react'

const passwordReset = PasswordResetService

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  useEffect(() => {
    checkResetToken()
  }, [])

  const checkResetToken = async () => {
    try {
      const result = await passwordReset.verifyResetToken()
      
      if (result.valid) {
        setIsValidToken(true)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Ongeldige of verlopen reset link. Vraag een nieuwe wachtwoord reset aan.'
        })
        setIsValidToken(false)
      }
    } catch (error) {
      console.error('Token check error:', error)
      setMessage({
        type: 'error',
        text: 'Kan reset link niet verifiëren. Probeer het opnieuw.'
      })
      setIsValidToken(false)
    } finally {
      setCheckingToken(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setMessage(null)
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Wachtwoorden komen niet overeen'
      })
      return
    }
    
    // Validate minimum length
    if (newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'Wachtwoord moet minimaal 6 tekens bevatten'
      })
      return
    }
    
    setLoading(true)
    
    // Use new PasswordResetService
    const result = await passwordReset.updatePassword(newPassword)
    
    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Wachtwoord succesvol bijgewerkt! Je wordt doorgestuurd naar de login...'
      })
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Kon wachtwoord niet bijwerken'
      })
    }
    
    setLoading(false)
  }

  // Loading state
  if (checkingToken) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#10b981'
        }}>
          <Loader size={50} style={{
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
            display: 'block'
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Reset link verifiëren...</p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      position: 'relative'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 25s infinite ease-in-out',
        filter: 'blur(40px)'
      }} />

      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '2rem 1.5rem' : '3rem',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(16,185,129,0.3)'
          }}>
            <KeyRound size={28} color="#10b981" />
          </div>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            MY ARC
          </h1>
          <h2 style={{
            color: '#fff',
            fontSize: '1.25rem',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            Nieuw Wachtwoord Instellen
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.875rem'
          }}>
            Kies een sterk wachtwoord voor je account
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            background: message.type === 'error'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${message.type === 'error'
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Password form (only show if token is valid) */}
        {isValidToken && (
          <form onSubmit={handlePasswordUpdate}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Nieuw Wachtwoord
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimaal 6 tekens"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
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
                  disabled={loading}
                  minLength={6}
                  autoFocus
                />
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)'
                }} />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}>
                Gebruik een combinatie van letters, cijfers en symbolen
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Bevestig Wachtwoord
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Herhaal nieuw wachtwoord"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
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
                  disabled={loading}
                  minLength={6}
                />
                <Shield size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)'
                }} />
              </div>
            </div>

            {/* Password strength indicator */}
            {newPassword && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: '0.5rem'
                }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: 
                          newPassword.length >= level * 3
                            ? level <= 2 ? '#ef4444' : level === 3 ? '#eab308' : '#10b981'
                            : 'rgba(255, 255, 255, 0.1)',
                        transition: 'background 0.3s'
                      }}
                    />
                  ))}
                </div>
                <p style={{
                  color: 
                    newPassword.length < 6 ? '#ef4444' :
                    newPassword.length < 9 ? '#eab308' :
                    '#10b981',
                  fontSize: '0.75rem',
                  textAlign: 'center'
                }}>
                  {newPassword.length < 6 ? 'Te kort' :
                   newPassword.length < 9 ? 'Redelijk' :
                   newPassword.length < 12 ? 'Goed' :
                   'Sterk'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                opacity: loading || !newPassword || !confirmPassword ? 0.5 : 1,
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading && newPassword && confirmPassword) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)'
              }}
            >
              <Lock size={18} />
              {loading ? 'Bijwerken...' : 'Wachtwoord Bijwerken'}
            </button>
          </form>
        )}

        {/* Link to request new reset if token is invalid */}
        {!isValidToken && !checkingToken && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16,185,129,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)'
              }}
            >
              <ArrowRight size={18} />
              Terug naar Login
            </button>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              marginTop: '1rem'
            }}>
              Je kunt een nieuwe wachtwoord reset aanvragen vanaf de login pagina
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.75rem'
        }}>
          <p>MY ARC © 2025</p>
          <p style={{ marginTop: '0.25rem' }}>Beveiligde Wachtwoord Reset</p>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>
    </div>
  )
}
