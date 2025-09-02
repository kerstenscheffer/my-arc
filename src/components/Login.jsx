// src/components/Login.jsx
// ✅ NEDERLANDSE VERSIE MET LUCIDE ICONS & PREMIUM STYLING
import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
import { 
  Shield, User, Lock, Mail, ArrowRight, ChevronLeft, 
  KeyRound, Dumbbell, Activity, Star, Zap, Trophy,
  Send, AlertCircle, CheckCircle, Sparkles, Heart
} from 'lucide-react'

const db = DatabaseService

const COACH_ACCESS_PASSWORD = 'MYARC2025'

export default function Login() {
  // State management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null) // {type: 'error'|'success', text: string}
  
  // Mode selection
  const [loginMode, setLoginMode] = useState('selection') // 'selection', 'client', 'coach'
  const [coachPassword, setCoachPassword] = useState('')
  const [coachAccessVerified, setCoachAccessVerified] = useState(false)
  
  // Password reset
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  
  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  // Check existing session
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    const user = await db.getCurrentUser()
    if (user) {
      // User already logged in, redirect based on stored mode
      const isClientMode = localStorage.getItem('isClientMode') === 'true'
      window.location.href = isClientMode ? '/client' : '/dashboard'
    }
  }

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage(null)
    
    // Coach mode requires access code verification
    if (loginMode === 'coach' && !coachAccessVerified) {
      if (coachPassword !== COACH_ACCESS_PASSWORD) {
        setMessage({ type: 'error', text: 'Onjuiste coach toegangscode' })
        return
      }
      setCoachAccessVerified(true)
      setMessage({ type: 'success', text: 'Coach toegang geverifieerd! Vul nu je inloggegevens in.' })
      setCoachPassword('')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await db.signIn(email, password)
      
      if (result?.user) {
        // Store login mode for routing
        const isClientMode = loginMode === 'client'
        localStorage.setItem('isClientMode', isClientMode.toString())
        
        setMessage({ 
          type: 'success', 
          text: `Welkom terug! Je wordt doorgestuurd naar ${isClientMode ? 'je dashboard' : 'het coach portaal'}...` 
        })
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Onjuist email of wachtwoord' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setMessage(null)
    setResetLoading(true)
    
    try {
      // Use the updated DatabaseService method with redirect URL
      const result = await db.resetPassword(
        resetEmail, 
        `${window.location.origin}/reset-password`
      )
      
      if (!result.success) throw new Error('Kan reset email niet versturen')
      
      setMessage({ 
        type: 'success', 
        text: 'Wachtwoord reset email verstuurd! Check je inbox.' 
      })
      
      // Clear form after 3 seconds
      setTimeout(() => {
        setShowResetForm(false)
        setResetEmail('')
        setMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('Reset error:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Kan reset email niet versturen' 
      })
    } finally {
      setResetLoading(false)
    }
  }

  // Mode selection screen
  if (loginMode === 'selection' && !showResetForm) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 25s infinite ease-in-out',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          right: '-15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 30s infinite ease-in-out reverse',
          filter: 'blur(60px)'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.03) 50%, transparent 100%)',
          animation: 'shimmer 8s infinite'
        }} />

        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Logo and title */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <Activity size={isMobile ? 36 : 42} color="#10b981" />
              <h1 style={{
                fontSize: isMobile ? '2.5rem' : '3rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
                margin: 0
              }}>
                MY ARC
              </h1>
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginTop: '0.5rem'
            }}>
              Premium Training Software
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1rem',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Trophy size={12} /> Transform
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Zap size={12} /> Achieve
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={12} /> Excel
              </span>
            </div>
          </div>

          {/* Mode selection buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Client Login Button */}
            <button
              onClick={() => setLoginMode('client')}
              style={{
                width: '100%',
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
                border: '2px solid rgba(16,185,129,0.3)',
                borderRadius: '16px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.1) 100%)'
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(16,185,129,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                }}>
                  <User size={isMobile ? 20 : 24} color="#fff" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ 
                    fontWeight: '700',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    marginBottom: '0.25rem'
                  }}>
                    Client Portal
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    opacity: 0.7
                  }}>
                    Toegang tot je training dashboard
                  </div>
                </div>
              </div>
              <ArrowRight size={20} style={{ opacity: 0.5 }} />
            </button>

            {/* Coach Login Button */}
            <button
              onClick={() => setLoginMode('coach')}
              style={{
                width: '100%',
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)',
                border: '2px solid rgba(59,130,246,0.3)',
                borderRadius: '16px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.1) 100%)'
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(59,130,246,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
                }}>
                  <Dumbbell size={isMobile ? 20 : 24} color="#fff" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ 
                    fontWeight: '700',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    marginBottom: '0.25rem'
                  }}>
                    Coach Dashboard
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    opacity: 0.7
                  }}>
                    Beheer je cliënten & programma's
                  </div>
                </div>
              </div>
              <ArrowRight size={20} style={{ opacity: 0.5 }} />
            </button>
          </div>

          {/* Forgot password link */}
          <div style={{
            textAlign: 'center',
            marginTop: '2.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            <button
              onClick={() => setShowResetForm(true)}
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <KeyRound size={14} />
              Wachtwoord vergeten?
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.75rem'
          }}>
            <p>© 2025 MY ARC - Transform Your Fitness Journey</p>
          </div>
        </div>
      </div>
    )
  }

  // Password Reset Form
  if (showResetForm) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}>
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
            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Wachtwoord Reset
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Vul je email in voor een reset link
            </p>
          </div>

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
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Email Adres
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="jouw@email.nl"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    transition: 'all 0.3s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={resetLoading}
                />
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)'
                }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                opacity: resetLoading ? 0.7 : 1,
                marginBottom: '1rem',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={18} />
              {resetLoading ? 'Versturen...' : 'Verstuur Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetForm(false)
                setLoginMode('selection')
                setMessage(null)
              }}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
            >
              <ChevronLeft size={18} />
              Terug naar Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Login Form (Client or Coach)
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
      {/* Subtle animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: loginMode === 'coach' 
          ? 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.1) 0%, transparent 50%)' 
          : 'radial-gradient(circle at 80% 50%, rgba(16,185,129,0.1) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />

      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '2rem 1.5rem' : '3rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: loginMode === 'coach' 
              ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: loginMode === 'coach'
              ? '2px solid rgba(59,130,246,0.3)'
              : '2px solid rgba(16,185,129,0.3)'
          }}>
            {loginMode === 'coach' ? <Dumbbell size={28} color="#3b82f6" /> : <User size={28} color="#10b981" />}
          </div>
          <h1 style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '900',
            background: loginMode === 'coach'
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            MY ARC
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem'
          }}>
            {loginMode === 'coach' ? 'Coach Dashboard' : 'Client Portal'}
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

        {/* Coach access verification (if needed) */}
        {loginMode === 'coach' && !coachAccessVerified && (
          <form onSubmit={handleLogin}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.02) 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color: '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <Shield size={16} />
                Coach Toegangscode Vereist
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={coachPassword}
                  onChange={(e) => setCoachPassword(e.target.value)}
                  required
                  placeholder="Voer toegangscode in"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(59,130,246,0.5)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(59,130,246,0.2)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={loading}
                  autoFocus
                />
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(59,130,246,0.5)'
                }} />
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
                marginTop: '0.5rem'
              }}>
                Voer de coach toegangscode in om door te gaan
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <KeyRound size={18} />
              {loading ? 'Verifiëren...' : 'Verifieer Toegang'}
            </button>
          </form>
        )}

        {/* Login form (after coach verification or for clients) */}
        {(loginMode === 'client' || coachAccessVerified) && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Email Adres
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jouw@email.nl"
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
                    e.target.style.borderColor = loginMode === 'coach' ? 'rgba(59,130,246,0.5)' : 'rgba(16,185,129,0.5)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={loading}
                  autoFocus
                />
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)'
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Wachtwoord
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                    e.target.style.borderColor = loginMode === 'coach' ? 'rgba(59,130,246,0.5)' : 'rgba(16,185,129,0.5)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                  }}
                  disabled={loading}
                />
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)'
                }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loginMode === 'coach'
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: loginMode === 'coach' 
                  ? '0 4px 15px rgba(59,130,246,0.3)'
                  : '0 4px 15px rgba(16,185,129,0.3)'
              }}
            >
              <Sparkles size={18} />
              {loading ? 'Inloggen...' : 'Toegang tot Dashboard'}
            </button>
          </form>
        )}

        {/* Footer actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button
            onClick={() => {
              setLoginMode('selection')
              setCoachAccessVerified(false)
              setCoachPassword('')
              setEmail('')
              setPassword('')
              setMessage(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <ChevronLeft size={16} />
            Wissel Modus
          </button>
          
          <button
            onClick={() => setShowResetForm(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <KeyRound size={16} />
            Wachtwoord vergeten?
          </button>
        </div>
      </div>

      {/* Add CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
