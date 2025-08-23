// src/auth/ResetPassword.jsx
import { useEffect, useMemo, useState } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

export default function ResetPassword() {
  const [stage, setStage] = useState('checking') // checking | ready | submitting | done | error
  const [error, setError] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : true

  // MY ARC Styling
  const scrollStyles = `
    <style>
      body { background: #010802; }
      div::-webkit-scrollbar { height: 8px; width: 8px; }
      div::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 4px; }
      div::-webkit-scrollbar-thumb { background: #10b981; border-radius: 4px; }
      div::-webkit-scrollbar-thumb:hover { background: #0ea572; }
      * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
  `

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    
    // Check for recovery token in URL
    if (hash.includes('type=recovery')) {
      setStage('ready')
      
      // Get current user to have their email
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setUserEmail(data.user.email)
        }
      })
    } else {
      // Listen for auth state changes
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setStage('ready')
          if (session?.user?.email) {
            setUserEmail(session.user.email)
          }
        }
      })
      
      // Timeout if nothing happens
      const timeout = setTimeout(() => {
        if (stage === 'checking') setStage('error')
      }, 2000)
      
      return () => {
        sub?.subscription?.unsubscribe?.()
        clearTimeout(timeout)
      }
    }
  }, [])

  // Password strength indicator
  const strength = useMemo(() => {
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[a-z]/.test(pw)) s++
    if (/\d/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }, [pw])

  async function handleSubmit(e) {
    e?.preventDefault()
    setError('')
    
    // Validations
    if (pw !== pw2) {
      setError('Wachtwoorden komen niet overeen')
      return
    }
    if (pw.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn')
      return
    }
    
    setStage('submitting')
    
    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: pw 
      })
      
      if (updateError) throw updateError
      
      // Activate client account if email available
      if (userEmail) {
        await activateClientAfterReset(userEmail)
        console.log('✅ Client account activated for:', userEmail)
      }
      
      // Clean up URL
      try { 
        window.history.replaceState({}, document.title, window.location.pathname) 
      } catch {}
      
      setStage('done')
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Er ging iets mis. Probeer het opnieuw.')
      setStage('ready')
    }
  }

  // UI Components
  const Title = ({ children }) => (
    <h2 style={{ 
      fontSize: isMobile ? '1.4rem' : '1.8rem', 
      color: '#fff', 
      marginBottom: '0.5rem',
      fontWeight: 'bold'
    }}>
      {children}
    </h2>
  )

  // CHECKING STATE
  if (stage === 'checking') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#010802',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div dangerouslySetInnerHTML={{ __html: scrollStyles }} />
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #111 100%)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <Title>Link controleren...</Title>
          <p style={{ color: '#9ca3af' }}>Even geduld aub</p>
        </div>
      </div>
    )
  }

  // ERROR STATE
  if (stage === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#010802',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div dangerouslySetInnerHTML={{ __html: scrollStyles }} />
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem' : '3rem',
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '2px solid #dc2626',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <Title>Link ongeldig of verlopen</Title>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            Deze link is niet meer geldig. Vraag een nieuwe aan.
          </p>
          <a 
            href="/login" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Terug naar Login
          </a>
        </div>
      </div>
    )
  }

  // SUCCESS STATE
  if (stage === 'done') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#010802',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        <div dangerouslySetInnerHTML={{ __html: scrollStyles }} />
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '2rem' : '3rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #0a0a0a 100%)',
          borderRadius: '12px',
          border: '2px solid #10b981',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <Title>Wachtwoord succesvol ingesteld!</Title>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
            Je kunt nu inloggen met je nieuwe wachtwoord.
            <br />
            <small>Je wordt automatisch doorgestuurd...</small>
          </p>
          <a 
            href="/login" 
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#10b981',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Direct naar Login
          </a>
        </div>
      </div>
    )
  }

  // READY STATE - FORM
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#010802',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div dangerouslySetInnerHTML={{ __html: scrollStyles }} />
      
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #111 100%)',
          borderRadius: '12px 12px 0 0',
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'center',
          borderBottom: '2px solid #10b981'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            🏋️‍♂️ MY ARC
          </div>
          <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>
            Welkom! Stel je wachtwoord in
          </p>
          {userEmail && (
            <p style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {userEmail}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#0a0a0a',
          borderRadius: '0 0 12px 12px',
          padding: isMobile ? '1.5rem' : '2rem'
        }}>
          {/* Password Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block',
              color: '#9ca3af', 
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Nieuw wachtwoord
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Minimaal 8 tekens"
                style={{
                  flex: 1,
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#10b981',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block',
              color: '#9ca3af', 
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              Bevestig wachtwoord
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Herhaal je wachtwoord"
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #333',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Strength Meter */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              color: '#9ca3af', 
              fontSize: '0.8rem', 
              marginBottom: '0.5rem' 
            }}>
              Wachtwoord sterkte:
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '4px' 
            }}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: i <= strength ? '#10b981' : '#333',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>
            <div style={{ 
              color: '#6b7280', 
              fontSize: '0.75rem', 
              marginTop: '0.5rem' 
            }}>
              Tip: Gebruik hoofdletters, cijfers en speciale tekens
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#7f1d1d',
              border: '1px solid #dc2626',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={stage === 'submitting'}
            style={{
              width: '100%',
              padding: '1rem',
              background: stage === 'submitting' ? '#6b7280' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: stage === 'submitting' ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s'
            }}
          >
            {stage === 'submitting' ? '⏳ Bezig met opslaan...' : '💪 Wachtwoord Instellen'}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem' 
          }}>
            <a 
              href="/login" 
              style={{ 
                color: '#9ca3af', 
                fontSize: '0.9rem',
                textDecoration: 'underline' 
              }}
            >
              Terug naar login
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
