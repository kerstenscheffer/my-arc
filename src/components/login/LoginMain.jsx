// src/components/login/LoginMain.jsx
//
// Eén inlogscherm voor coach én klant. Waar je terechtkomt bepaalt de server:
// App.jsx roept na het inloggen get_my_portal_role() aan en zet `isClientMode`
// op basis daarvan. Het loginscherm hoeft dat niet te weten.
//
// Er stond hier een tussenstap: knop "Coach toegang" → toegangscode MYARC2025 →
// pas dán een coach-formulier. Die code beschermde niets: hij stond in de
// frontend-bundel en zette alleen een vlag die App.jsx bij de eerstvolgende
// laadbeurt tóch overschreef met het serverantwoord.
//
// Alles staat op één as in het midden — logo, kop, velden, knoppen. Het was een
// linkse kolom met een regel die links begon en een rij die uit elkaar geduwd
// stond; op een telefoon leest dat als drie losse blokjes in plaats van één
// formulier.

import { LaadLogo } from '../LaadScherm'
import { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import DatabaseService from '../../services/DatabaseService'
import PasswordResetService from '../../services/PasswordResetService'
import AppleSignInButton from './AppleSignInButton'
import { abonnementMogelijk } from '../../lib/appAbonnement'

const db = DatabaseService
const passwordReset = PasswordResetService

const SLIDES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
  'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
]

export default function LoginMain() {
  // slideshow
  const [slide, setSlide] = useState(0)
  const timer = useRef(null)
  useEffect(() => {
    timer.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer.current)
  }, [])

  // form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // reset
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('rememberEmail')
    if (stored) { setEmail(stored); setRememberMe(true) }
    checkSession()
    if (window.location.hostname === 'localhost') passwordReset.logSetupInstructions?.()
  }, [])

  const checkSession = async () => {
    const user = await db.getCurrentUser()
    if (user) naarStart()
  }

  // Na het inloggen herladen op /, mét de hash: een deeplink (bv.
  // #business-os:content=<id> uit Gino's chat) opent dan alsnog. Staan we al op
  // /, dan zou href alleen de hash zetten zonder herladen, dus reload.
  const naarStart = () => {
    if (window.location.pathname === '/') window.location.reload()
    else window.location.href = `/${window.location.hash}`
  }

  // ── login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!email || !password) { setError('Vul je gegevens in'); return }
    setLoading(true); setError(null)
    try {
      const result = await db.signIn(email, password)
      if (result?.user) {
        // Bewust geen `isClientMode` meer zetten: dat zette iedereen op
        // 'klant' en werd daarna alsnog door de rolcheck overschreven.
        if (rememberMe) localStorage.setItem('rememberEmail', email)
        else localStorage.removeItem('rememberEmail')
        naarStart()
      } else {
        setError('Onjuist email of wachtwoord')
      }
    } catch (err) {
      setError(err.message || 'Er ging iets mis')
    }
    setLoading(false)
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e?.preventDefault()
    if (!resetEmail) { setResetMsg({ ok: false, text: 'Vul je email in' }); return }
    setResetLoading(true); setResetMsg(null)
    const result = await passwordReset.sendResetEmail(resetEmail)
    // Supabase meldt "gelukt" ook als er geen account met dit adres is (en
    // stuurt dan niets). Daarom geen "verstuurd!" maar een eerlijke tekst die
    // ook zegt wat je doet als er geen mail komt (25 nov 2026).
    const geenAccountTip = abonnementMogelijk() ? ' Nog geen account? Tik op Maak je plan.' : ''
    setResetMsg({ ok: result.success, text: result.success
      ? `Heb je een account met ${resetEmail.trim()}? Dan krijg je zo een mail. Geen mail? Kijk in je spam en check of het adres klopt.${geenAccountTip}`
      : result.error })
    if (result.success) setTimeout(() => { setShowReset(false); setResetEmail(''); setResetMsg(null) }, 12000)
    setResetLoading(false)
  }

  return (
    <Wrapper slide={slide}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>

        {/* Zelfde logo met glans als het laadscherm, zonder de boog
            (18 nov 2026, Kersten). */}
        <div role="img" aria-label="MY ARC Coaching" style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 1.6rem' }}>
          <LaadLogo boog={false} />
        </div>

        <h1 style={{
          fontSize: '1.65rem', fontWeight: 900, color: '#fff',
          margin: '0 0 1.4rem', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          Welkom terug
        </h1>

        {error && <ErrorBox>{error}</ErrorBox>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Veld
            type="email" placeholder="E-mailadres" value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email" autoCapitalize="none"
          />

          <div style={{ position: 'relative' }}>
            <Veld
              type={showPw ? 'text' : 'password'} placeholder="Wachtwoord" value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ paddingRight: '3.75rem' }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontSize: '0.58rem', fontWeight: 900, letterSpacing: '0.1em',
              cursor: 'pointer', padding: 0,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {showPw ? 'VERBERG' : 'TOON'}
            </button>
          </div>

          <WitteKnop type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Inloggen…' : 'Inloggen'}
          </WitteKnop>
        </form>

        {/* Onthouden en vergeten staan onder elkaar op één as in plaats van uit
            elkaar geduwd langs de randen. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginTop: '1rem',
          fontSize: '0.72rem', fontWeight: 700,
        }}>
          <button type="button" onClick={() => setRememberMe(!rememberMe)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: rememberMe ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
            fontSize: '0.72rem', fontWeight: 700, fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{
              width: 16, height: 16, flexShrink: 0, borderRadius: 5,
              background: rememberMe ? '#fff' : 'transparent',
              border: `1px solid ${rememberMe ? '#fff' : 'rgba(255,255,255,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {rememberMe && <span style={{ fontSize: 10, color: '#000', fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </span>
            Onthoud mij
          </button>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetMsg(null) }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 700,
              fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            Wachtwoord vergeten?
          </button>
        </div>

        {/* Apple Sign-In — alleen in de iOS-app. */}
        {Capacitor.isNativePlatform() && (
          <div style={{ marginTop: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.9rem' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{
                fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>
                of
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <AppleSignInButton onError={(msg) => setError(msg)} />
          </div>
        )}

        {/* Nieuw in de app (24 nov 2026): zelf een account en plan maken via de
            onboarding. Alleen in de app; Apple eist dat je daar zelf een account
            kunt maken. Op het web blijft dit weg (daar is geen betaalmuur), en op
            Android ook zolang RevenueCat daar nog niet is ingesteld. */}
        {abonnementMogelijk() && (<>
          {/* Coachingklanten hebben al een account uit de intake. Zonder deze
              regel tikken ze soms op "Maak je plan" en maken ze een betaald
              app-account aan (25 nov 2026). */}
          <div style={{
            marginTop: '1.4rem', padding: '0.8rem 0.9rem', borderRadius: 12,
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.35)',
            color: '#fff', fontSize: '1rem', fontWeight: 900, lineHeight: 1.4, textAlign: 'center',
          }}>
            Coaching bij Kersten? Log hierboven in met de mail die je van ons kreeg.
          </div>
          <button type="button" onClick={() => { window.location.href = '/aanmelden' }} style={{
            marginTop: '0.8rem', width: '100%', minHeight: 46, borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
            fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Nog geen account? Maak je plan
          </button>
        </>)}

      </div>

      {showReset && (
        <div onClick={() => setShowReset(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1.5rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '1.5rem',
            width: '100%', maxWidth: 360, textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>
              Wachtwoord resetten
            </h3>
            <p style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', margin: '0 0 1.25rem' }}>
              Je ontvangt een e-mail met een resetlink.
            </p>
            {resetMsg && (
              <div style={{
                padding: '0.8rem 0.9rem', borderRadius: 10, fontSize: '1rem', fontWeight: 900, lineHeight: 1.4, marginBottom: '0.9rem',
                background: resetMsg.ok ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${resetMsg.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: '#fff',
              }}>
                {resetMsg.text}
              </div>
            )}
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Veld type="email" placeholder="E-mailadres" value={resetEmail}
                onChange={e => setResetEmail(e.target.value)} autoFocus />
              <WitteKnop type="submit" disabled={resetLoading}>
                {resetLoading ? 'Versturen…' : 'Reset sturen'}
              </WitteKnop>
              <button type="button" onClick={() => setShowReset(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: '0.25rem',
                fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                Annuleren
              </button>
            </form>
          </div>
        </div>
      )}
    </Wrapper>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Veld({ style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', minHeight: 44, padding: '0 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
        color: '#fff', fontSize: '1rem', fontWeight: 600,
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        WebkitAppearance: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.45)'
        e.target.style.background = 'rgba(255,255,255,0.07)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,255,255,0.09)'
        e.target.style.background = 'rgba(255,255,255,0.05)'
      }}
    />
  )
}

function Wrapper({ children, slide }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', overflow: 'hidden',
    }}>
      {SLIDES.map((src, i) => (
        <div key={src} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === slide ? 0.24 : 0, // was 0,14; iets lichter (18 nov 2026, Kersten) transition: 'opacity 1.8s ease', zIndex: 0,
          transform: 'scale(1.04)',
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.95) 100%)',
      }} />

      {/* Scrollen mag, maar pas als het moet.
          Het formulier stond midden in een vast vlak; paste het er niet in —
          een kleiner toestel, of de Apple-knop erbij — dan viel de onderkant
          achter de Support/Privacy-knoppen. Nu is deze laag zelf de scroller en
          centreert het blok erbinnen alleen zolang er ruimte is. Onderin staat
          ruimte gereserveerd voor die twee knoppen, zodat ze nooit meer over de
          inhoud vallen.

          Let op: centreren met align-items op een scrollende laag knipt de
          bovenkant af zodra de inhoud te hoog wordt (je kunt er dan niet meer
          bij scrollen). Vandaar de tussenlaag met minHeight: 100%. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          minHeight: '100%', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // Onderin meer ruimte dan bovenin: het blok staat zo iets boven het
          // midden (18 nov 2026, Kersten: "alles iets hoger").
          padding: `calc(env(safe-area-inset-top, 0px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 0px) + 9rem)`,
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Wit is de primaire knop in de rest van de app; het gouden blok hoorde nog bij
// de oude verkooppagina's.
function WitteKnop({ children, disabled, style, ...props }) {
  return (
    <button disabled={disabled} style={{
      width: '100%', minHeight: 46, padding: '0 1rem',
      background: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
      border: 'none', borderRadius: 12,
      color: '#0a0a0a', fontSize: '0.95rem', fontWeight: 900,
      letterSpacing: '-0.01em', fontFamily: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'opacity 0.15s, transform 0.15s',
      ...style,
    }} {...props}>
      {children}
    </button>
  )
}

function ErrorBox({ children }) {
  return (
    <div style={{
      padding: '0.7rem 1rem', marginBottom: '0.9rem',
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10, color: '#ef4444', fontSize: '0.78rem', fontWeight: 800,
    }}>
      {children}
    </div>
  )
}
