// src/components/Login.jsx
import { useState, useEffect } from 'react'
import DatabaseService from '../services/DatabaseService'
const db = DatabaseService

const COACH_ACCESS_PASSWORD = 'MYARC2025'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCoachMode, setIsCoachMode] = useState(false)
  const [coachPassword, setCoachPassword] = useState('')
  const [coachPasswordError, setCoachPasswordError] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  // Check if coach mode is stored
  useEffect(() => {
    const storedMode = localStorage.getItem('isClientMode')
    if (storedMode === 'false') {
      setIsCoachMode(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // If coach mode, verify coach password
    if (isCoachMode && coachPassword !== COACH_ACCESS_PASSWORD) {
      setCoachPasswordError('Invalid coach access password')
      return
    }
    
    setLoading(true)
    
    try {
      const { data, error } = await db.signIn(email, password)
      
      if (error) throw error
      
      // Store mode and reload to trigger App.jsx routing
      localStorage.setItem('isClientMode', isCoachMode ? 'false' : 'true')
      
      setSuccess('Login successful! Redirecting...')
      
      // Force reload which will trigger App.jsx to check auth
      setTimeout(() => {
        window.location.href = '/'  // Go to root and let App.jsx handle routing
      }, 1000)
      
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetLoading(true)
    
    try {
      const { data, error } = await db.resetPassword(resetEmail)
      
      if (error) throw error
      
      setResetSuccess('Password reset email sent! Check your inbox.')
      setTimeout(() => {
        setShowResetForm(false)
        setResetEmail('')
        setResetSuccess('')
      }, 3000)
      
    } catch (error) {
      console.error('Reset error:', error)
      setResetError(error.message || 'Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  const toggleMode = () => {
    setIsCoachMode(!isCoachMode)
    setCoachPassword('')
    setCoachPasswordError('')
    setError('')
  }

  // Password Reset Form
  if (showResetForm) {
    return (
      <div className="myarc-app" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        background: '#010802'
      }}>
        <div className="myarc-card" style={{
          maxWidth: '450px',
          width: '100%',
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <h1 className="myarc-logo" style={{fontSize: isMobile ? '2.5rem' : '3rem'}}>
              MY ARC
            </h1>
            <p style={{color: '#9ca3af', marginTop: '0.5rem', fontSize: isMobile ? '0.875rem' : '1rem'}}>
              Password Reset
            </p>
          </div>

          {resetError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#ef4444'
            }}>
              {resetError}
            </div>
          )}

          {resetSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#10b981'
            }}>
              {resetSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordReset}>
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem'}}>
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="myarc-input"
                placeholder="Enter your email"
                style={{width: '100%'}}
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="myarc-btn myarc-btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: isMobile ? '1rem' : '1.125rem',
                marginBottom: '1rem'
              }}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>

            <button
              type="button"
              onClick={() => setShowResetForm(false)}
              className="myarc-btn myarc-btn-ghost"
              style={{width: '100%', padding: '1rem'}}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Main Login Form
  return (
    <div className="myarc-app" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      background: '#010802'
    }}>
      <div className="myarc-card" style={{
        maxWidth: '450px',
        width: '100%',
        background: 'rgba(17, 17, 17, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: isMobile ? '2rem 1.5rem' : '3rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 className="myarc-logo" style={{fontSize: isMobile ? '2.5rem' : '3rem'}}>
            MY ARC
          </h1>
          <p style={{color: '#9ca3af', marginTop: '0.5rem', fontSize: isMobile ? '0.875rem' : '1rem'}}>
            {isCoachMode ? 'Coach Dashboard Login' : 'Client Portal Login'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#10b981'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem'}}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="myarc-input"
              placeholder="Enter your email"
              style={{width: '100%'}}
              disabled={loading}
            />
          </div>

          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.875rem'}}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="myarc-input"
              placeholder="Enter your password"
              style={{width: '100%'}}
              disabled={loading}
            />
          </div>

          {isCoachMode && (
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', color: '#10b981', fontSize: '0.875rem'}}>
                🔐 Coach Access Code
              </label>
              <input
                type="password"
                value={coachPassword}
                onChange={(e) => {
                  setCoachPassword(e.target.value)
                  setCoachPasswordError('')
                }}
                required
                className="myarc-input"
                placeholder="Enter coach access code"
                style={{
                  width: '100%',
                  borderColor: coachPasswordError ? '#ef4444' : undefined
                }}
                disabled={loading}
              />
              {coachPasswordError && (
                <p style={{color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem'}}>
                  {coachPasswordError}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="myarc-btn myarc-btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: isMobile ? '1rem' : '1.125rem',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Logging in...' : (isCoachMode ? '🚀 Access Coach Dashboard' : '💪 Enter Client Portal')}
          </button>
        </form>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <button
            onClick={toggleMode}
            className="myarc-btn myarc-btn-ghost"
            style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}
          >
            {isCoachMode ? '👤 Switch to Client' : '🏋️ Switch to Coach'}
          </button>
          
          <button
            onClick={() => setShowResetForm(true)}
            className="myarc-btn myarc-btn-ghost"
            style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}
          >
            Forgot Password?
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)',
          color: '#6b7280',
          fontSize: '0.75rem'
        }}>
          <p>MY ARC © 2025</p>
          <p style={{marginTop: '0.25rem'}}>Premium Personal Training Software</p>
        </div>
      </div>
    </div>
  )
}
