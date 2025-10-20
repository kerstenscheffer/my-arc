// src/components/login/LoginWidget.jsx
import { useState, useEffect } from 'react'
import { 
  User, Lock, Mail, ArrowRight, 
  Loader, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react'

export default function LoginWidget({ 
  onLogin, 
  onPasswordReset,
  loginMode = 'client',
  isVisible = false
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [rememberMe, setRememberMe] = useState(false)
  
  const isMobile = window.innerWidth <= 768
  
  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail')
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    
    try {
      const result = await onLogin(email, password, rememberMe)
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Welkom terug! Je wordt doorgestuurd...'
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Onjuist email of wachtwoord'
        })
        setLoading(false)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Er ging iets mis. Probeer het opnieuw.'
      })
      setLoading(false)
    }
  }
  
  if (!isVisible) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '20px' : '50px',
      right: isMobile ? '50%' : '50px',
      transform: isMobile ? 'translateX(50%)' : 'none',
      width: isMobile ? '85%' : '360px',
      maxWidth: '360px',
      zIndex: 40,
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div style={{
        background: 'rgba(17, 17, 17, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '18px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: loginMode === 'coach' 
            ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
            : 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
        }} />
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: loginMode === 'coach'
              ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
            border: loginMode === 'coach'
              ? '1px solid rgba(59,130,246,0.3)'
              : '1px solid rgba(16,185,129,0.3)',
            marginBottom: '0.75rem'
          }}>
            <User size={20} color={loginMode === 'coach' ? '#3b82f6' : '#10b981'} />
          </div>
          
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            Welkom terug
          </h2>
          
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            {loginMode === 'coach' ? 'Coach Dashboard' : 'Client Portal'}
          </p>
        </div>
        
        {/* Message */}
        {message && (
          <div style={{
            background: message.type === 'error'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${message.type === 'error'
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '8px',
            padding: '0.625rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: message.type === 'error' ? '#ef4444' : '#10b981'
          }}>
            {message.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
            {message.text}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.375rem',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jouw@email.nl"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = loginMode === 'coach' 
                    ? 'rgba(59,130,246,0.5)' 
                    : 'rgba(16,185,129,0.5)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              />
              <Mail size={16} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)'
              }} />
            </div>
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '0.875rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.375rem',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              Wachtwoord
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.625rem 2.5rem 0.625rem 2.25rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = loginMode === 'coach' 
                    ? 'rgba(59,130,246,0.5)' 
                    : 'rgba(16,185,129,0.5)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              />
              <Lock size={16} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)'
              }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          {/* Remember & Forgot */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            fontSize: '0.75rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: loginMode === 'coach' ? '#3b82f6' : '#10b981'
                }}
              />
              Onthoud mij
            </label>
            
            <button
              type="button"
              onClick={onPasswordReset}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = loginMode === 'coach' ? '#3b82f6' : '#10b981'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              Wachtwoord vergeten?
            </button>
          </div>
          
          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loginMode === 'coach'
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !email || !password ? 0.6 : 1,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: loginMode === 'coach'
                ? '0 4px 15px rgba(59,130,246,0.3)'
                : '0 4px 15px rgba(16,185,129,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password) {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Inloggen...
              </>
            ) : (
              <>
                Inloggen
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        
        {/* Security note */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.3)'
          }}>
            🔒 Beveiligde verbinding
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: ${isMobile ? 'translateX(50%) translateY(20px)' : 'translateY(20px)'};
          }
          to {
            opacity: 1;
            transform: ${isMobile ? 'translateX(50%) translateY(0)' : 'translateY(0)'};
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
