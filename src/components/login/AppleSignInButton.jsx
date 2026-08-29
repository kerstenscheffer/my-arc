// src/components/login/AppleSignInButton.jsx
// Sign in with Apple — native iOS only.
// Plugin: @capacitor-community/apple-sign-in
// Auth:   supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })
//
// Prereqs (handled outside this file):
//   - Apple Developer App ID for com.myarcfitness.app has Sign In with Apple capability
//   - Xcode: target App → Signing & Capabilities → + Sign In with Apple
//   - Supabase: Authentication → Providers → Apple enabled with Team/Key/Service IDs + .p8

import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'
import DatabaseService from '../../services/DatabaseService'

const db = DatabaseService

const APPLE_BUNDLE_ID = 'com.myarcfitness.app'

// Apple requires the hashed nonce; Supabase verifies against the raw nonce.
const generateRawNonce = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

const sha256Hex = async (str) => {
  const buf = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function AppleSignInButton({ onError }) {
  const [loading, setLoading] = useState(false)

  // Hide on web — feature only works inside the native iOS app
  if (!Capacitor.isNativePlatform()) return null

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const rawNonce = generateRawNonce()
      const hashedNonce = await sha256Hex(rawNonce)

      const result = await SignInWithApple.authorize({
        clientId: APPLE_BUNDLE_ID,
        redirectURI: '',
        scopes: 'email name',
        state: 'login',
        nonce: hashedNonce,
      })

      const identityToken = result?.response?.identityToken
      if (!identityToken) throw new Error('Geen identity token van Apple ontvangen')

      const { error } = await db.supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
        nonce: rawNonce,
      })
      if (error) throw error

      // Net als bij de e-mail-inlog: geen portaalvlag zetten. De root-route
      // haalt de gebruiker opnieuw op en bepaalt via get_my_portal_role() of
      // dit ClientDashboard of CoachHub wordt.
      window.location.href = '/'
    } catch (err) {
      // User cancelled the Apple sheet → silent
      const code = err?.code || err?.error
      const msg = (err?.message || '').toLowerCase()
      const cancelled =
        code === '1001' || code === 'ERR_CANCELED' ||
        msg.includes('cancel') || msg.includes('canceled')
      if (!cancelled) {
        console.error('Apple sign-in failed:', err)
        if (onError) onError(err.message || 'Apple inloggen mislukt')
      }
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        minHeight: '44px',
        padding: '0.7rem 1rem',
        background: '#0a0a0a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontWeight: '600',
        letterSpacing: '0.01em',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.55rem',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'opacity 0.15s, border-color 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {loading ? (
        'Bezig...'
      ) : (
        <>
          {/* Official Apple logo (vector) */}
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
            <path d="M13.06 9.55c-.02-2.13 1.74-3.15 1.82-3.2-.99-1.45-2.54-1.65-3.09-1.67-1.32-.13-2.57.77-3.24.77-.67 0-1.7-.75-2.79-.73-1.44.02-2.76.83-3.5 2.11-1.49 2.59-.38 6.42 1.07 8.52.71 1.03 1.55 2.18 2.66 2.13 1.07-.04 1.47-.69 2.76-.69 1.29 0 1.65.69 2.79.67 1.15-.02 1.88-1.04 2.59-2.07.81-1.19 1.15-2.34 1.17-2.4-.03-.01-2.24-.86-2.27-3.41M10.96 3.27c.59-.71 1-1.71.89-2.7-.86.03-1.9.57-2.51 1.28-.55.63-1.03 1.64-.9 2.62.96.07 1.93-.49 2.52-1.2"/>
          </svg>
          <span>Inloggen met Apple</span>
        </>
      )}
    </button>
  )
}
