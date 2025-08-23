// src/components/Login.jsx - UPDATED MET RESET FIX
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COACH_ACCESS_PASSWORD = 'MYARC2025'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [isClientMode, setIsClientMode] = useState(true)
  const [showCoachAccess, setShowCoachAccess] = useState(false)
  const [coachPassword, setCoachPassword] = useState('')
  const [coachAccessGranted, setCoachAccessGranted] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false

  const backgroundShapes = `
    <style>
      /* Existing styles blijven hetzelfde */
      .shape1, .shape2, .shape3 {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.3;
        animation: float 20s infinite ease-in-out;
      }
      .shape1 {
        width: 300px;
        height: 300px;
        background: linear-gradient(135deg, #10b981 0%, #064e3b 100%);
      }
      .shape2 {
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, #064e3b 0%, #10b981 100%);
        animation-delay: -7s;
      }
      .shape3 {
        width: 150px;
        height: 150px;
        background: #10b981;
        animation-delay: -14s;
      }
      @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -30px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .gradient-text {
        background: linear-gradient(135deg, #10b981 0%, #fff 50%, #10b981 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shine 3s linear infinite;
      }
      @keyframes shine {
        to { background-position: 200% center; }
      }
    </style>
  `

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const mode = localStorage.getItem('isClientMode')
      if (mode === 'true') {
        window.location.href = '/client'
      } else {
        window.location.href = '/dashboard'
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) throw error

      localStorage.setItem('isClientMode', isClientMode ? 'true' : 'false')
      
      if (isClientMode) {
        window.location.href = '/client'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const verifyCoachAccess = () => {
    if (coachPassword === COACH_ACCESS_PASSWORD) {
      setCoachAccessGranted(true)
      setIsClientMode(false)
      setShowCoachAccess(false)
      setMessage({ type: 'success', text: '✅ Coach toegang verleend!' })
    } else {
      setMessage({ type: 'error', text: '❌ Incorrect wachtwoord' })
      setCoachPassword('')
    }
  }

const handleResetPassword = async () => {
  console.log('🔴 KNOP GEKLIKT!');
  console.log('📧 Email:', resetEmail);
  
  if (!resetEmail) {
    console.log('❌ Geen email ingevuld');
    setMessage({ type: 'error', text: 'Vul je email in' })
    return
  }

  setLoading(true)
  console.log('⏳ Start reset voor:', resetEmail);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      {
        redirectTo: `https://workapp-mu.vercel.app/reset-password`
      }
    )
    
    console.log('📊 Supabase response:', { data, error });
    
    if (error) throw error
    
    setMessage({ 
      type: 'success', 
      text: '📧 Check je email voor de reset link!' 
    })
    setShowResetPassword(false)
    setResetEmail('')
  } catch (error) {
    console.error('💥 ERROR:', error);
    setMessage({ type: 'error', text: error.message })
  } finally {
    setLoading(false)
  }
}
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #064e3b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div dangerouslySetInnerHTML={{ __html: backgroundShapes }} />
      
      <div className="shape1" style={{ top: '-100px', left: '-100px' }}></div>
      <div className="shape2" style={{ bottom: '-75px', right: '-75px' }}></div>
      <div className="shape3" style={{ top: '50%', right: '10%' }}></div>

      {/* Login Card */}
      <div style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid #10b98133',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="gradient-text" style={{
            fontSize: isMobile ? '2.5rem' : '3rem',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            MY ARC
          </h1>
          <p style={{
            color: '#a0a0a0',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            {isClientMode ? '👤 Client Portal' : '🏋️‍♂️ Coach Dashboard'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: message.type === 'error' 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`,
            color: message.type === 'error' ? '#ef4444' : '#10b981'
          }}>
            {message.text}
          </div>
        )}

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem'
        }}>
          <div 
            className="coach-toggle"
            onClick={() => {
              if (!coachAccessGranted && !isClientMode) {
                setShowCoachAccess(true)
              } else {
                setIsClientMode(true)
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: isClientMode ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' : 'transparent',
              border: '1px solid #10b98133',
              borderRadius: '8px',
              color: isClientMode ? '#fff' : '#a0a0a0',
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              flex: 1,
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            Client Login
          </div>
          
          {coachAccessGranted && (
            <div 
              className="coach-toggle"
              onClick={() => setIsClientMode(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: !isClientMode ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' : 'transparent',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                color: !isClientMode ? '#fff' : '#a0a0a0',
                fontSize: '0.9rem',
                transition: 'all 0.3s',
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              Coach Login
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jouw@email.nl"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}>
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            />
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              style={{
                marginTop: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: '#10b981',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Wachtwoord vergeten?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-button"
            style={{
              width: '100%',
              padding: '1rem',
              background: loading 
                ? '#064e3b' 
                : 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              position: 'relative'
            }}
          >
            {loading ? '⏳ Inloggen...' : `🚀 ${isClientMode ? 'Client' : 'Coach'} Login`}
          </button>
        </form>

        {/* Coach Access Button */}
        {!coachAccessGranted && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center'
          }}>
            <button
              onClick={() => setShowCoachAccess(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a0a0a0',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              🔐 Coach toegang
            </button>
          </div>
        )}
      </div>

      {/* Coach Access Modal */}
      {showCoachAccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid #10b98133'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              🔐 Coach Verificatie
            </h3>
            <input
              type="password"
              value={coachPassword}
              onChange={(e) => setCoachPassword(e.target.value)}
              placeholder="Coach wachtwoord"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
              onKeyPress={(e) => e.key === 'Enter' && verifyCoachAccess()}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={verifyCoachAccess}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Verifiëren
              </button>
              <button
                onClick={() => {
                  setShowCoachAccess(false)
                  setCoachPassword('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid #10b98133',
                  borderRadius: '8px',
                  color: '#a0a0a0',
                  cursor: 'pointer'
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid #10b98133'
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              🔑 Wachtwoord Reset
            </h3>
            <p style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              Vul je email in voor een reset link
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="jouw@email.nl"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #10b98133',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? '⏳ Verzenden...' : '📧 Verstuur Reset Link'}
              </button>
              <button
                onClick={() => {
                  setShowResetPassword(false)
                  setResetEmail('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid #10b98133',
                  borderRadius: '8px',
                  color: '#a0a0a0',
                  cursor: 'pointer'
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
