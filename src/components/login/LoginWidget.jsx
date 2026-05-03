// src/components/login/LoginWidget.jsx - FIXED VERSION THAT USES ONLOGIN CALLBACK
import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Crown, Shield } from 'lucide-react'

export default function LoginWidget({ loginMode, onLogin, onPasswordReset }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const isMobile = window.innerWidth <= 768
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    console.log('🔥 LoginWidget handleSubmit called')
    console.log('🔥 Email:', email)
    console.log('🔥 Calling onLogin callback...')
    
    try {
      // Call the onLogin callback from LoginMain
      const result = await onLogin(email, password, rememberMe)
      
      console.log('🔥 onLogin result:', result)
      
      if (!result.success) {
        setError(result.error || 'Login mislukt')
      }
      // If success, LoginMain handles redirect
    } catch (error) {
      console.error('❌ LoginWidget error:', error)
      setError(error.message || 'Er ging iets mis')
    } finally {
      setIsLoading(false)
    }
  }
  
  const isCoach = loginMode === 'coach'
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '8%' : '12%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '380px',
      zIndex: 40,
      animation: 'fadeInUp 0.5s ease-out'
    }}>
      {/* Main Card - Golden Premium */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.92) 0%, rgba(17, 17, 17, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.25)',
        borderRadius: '18px',
        padding: isMobile ? '1.5rem' : '1.75rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
          opacity: 0.6,
          zIndex: 2
        }} />
        
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Icon Container */}
        <div style={{
          width: isMobile ? '56px' : '60px',
          height: isMobile ? '56px' : '60px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.125rem',
          boxShadow: '0 6px 20px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
            borderRadius: '14px 14px 0 0',
            pointerEvents: 'none'
          }} />
          {isCoach ? (
            <Crown size={isMobile ? 26 : 28} color="#000" strokeWidth={2.5} />
          ) : (
            <Sparkles size={isMobile ? 26 : 28} color="#000" strokeWidth={2.5} />
          )}
        </div>
        
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.35rem' : '1.5rem',
            fontWeight: '800',
            marginBottom: '0.375rem',
            backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#FFD700',
            letterSpacing: '-0.01em'
          }}>
            Welkom Terug
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '500'
          }}>
            {isCoach ? 'Coach Portal' : 'Cliënt Dashboard'}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2 }}>
          {/* Email Input */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                <Mail size={18} color="rgba(255, 215, 0, 0.5)" strokeWidth={2.5} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="je@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.75rem',
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                  e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                  e.target.style.background = 'rgba(255, 215, 0, 0.05)'
                }}
              />
            </div>
          </div>
          
          {/* Password Input */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute',
                left: '1rem',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                <Lock size={18} color="rgba(255, 215, 0, 0.5)" strokeWidth={2.5} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.4)'
                  e.target.style.background = 'rgba(255, 215, 0, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.2)'
                  e.target.style.background = 'rgba(255, 215, 0, 0.05)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255, 215, 0, 0.5)',
                  transition: 'color 0.3s',
                  zIndex: 2,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFD700'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 215, 0, 0.5)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.8rem'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  cursor: 'pointer',
                  accentColor: '#FFD700'
                }}
              />
              Onthoud mij
            </label>
            
            <button
              type="button"
              onClick={onPasswordReset}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 0, 0.7)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'none',
                transition: 'color 0.3s',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFD700'
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 215, 0, 0.7)'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Wachtwoord vergeten?
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.95rem',
              background: isLoading 
                ? 'rgba(255, 215, 0, 0.3)' 
                : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              position: 'relative',
              overflow: 'hidden',
              opacity: isLoading ? 0.7 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateZ(0)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 215, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
              }
            }}
            onTouchStart={(e) => {
              if (isMobile && !isLoading) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && !isLoading) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {/* Top gloss */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
              borderRadius: '12px 12px 0 0',
              pointerEvents: 'none'
            }} />
            
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Bezig met inloggen...
              </>
            ) : (
              <>
                Inloggen
                <LogIn size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
        
        {/* Security Note */}
        <div style={{
          marginTop: '1.25rem',
          padding: '0.75rem',
          background: 'rgba(255, 215, 0, 0.05)',
          border: '1px solid rgba(255, 215, 0, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          <Shield size={14} color="rgba(255, 215, 0, 0.6)" />
          <p style={{
            color: 'rgba(255, 215, 0, 0.6)',
            fontSize: '0.7rem',
            margin: 0,
            fontWeight: '500'
          }}>
            Beveiligde Verbinding
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
