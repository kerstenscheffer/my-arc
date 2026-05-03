// src/lead-magnet/7secretsfunnel/components/HeroSection.jsx
import { useState, useEffect } from 'react'
import { GOLD } from './shared'

const pp = "'Poppins', sans-serif"
const DEADLINE = new Date('2026-03-11T12:00:00').getTime()

function useCountdown() {
  const [t, setT] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      if (diff <= 0) { setT({ h: '00', m: '00', s: '00' }); return }
      const totalH = Math.floor(diff / 3600000)
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setT({ h: String(totalH).padStart(2, '0'), m, s })
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

export default function HeroSection({ isMobile, onScrollDown }) {
  const { h, m, s } = useCountdown()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      textAlign: 'center', background: '#000',
    }}>

      {/* "Secrets beschikbaar tot" */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '0.85rem' : '1rem',
        fontWeight: 700, color: '#fff', marginBottom: '0.3rem',
        animation: 'ssFadeUp 0.6s ease 0.1s both',
      }}>
        Secrets beschikbaar tot
      </div>

      {/* Countdown — big, bold */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '2.8rem' : '3.5rem',
        fontWeight: 900, color: '#fff', lineHeight: 1,
        marginBottom: '0.25rem', letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        animation: 'ssFadeUp 0.6s ease 0.2s both',
      }}>
        {h}<span style={{ color: 'rgba(255,255,255,0.3)' }}>:</span>{m}<span style={{ color: 'rgba(255,255,255,0.3)' }}>:</span>{s}
      </div>

      {/* "+ GRATIS DOWNLOAD" */}
      <div style={{
        fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.65rem',
        fontWeight: 700, color: GOLD, textTransform: 'uppercase',
        letterSpacing: '0.15em', marginBottom: isMobile ? '2rem' : '2.5rem',
        animation: 'ssFadeUp 0.6s ease 0.3s both',
      }}>
        + Gratis Download
      </div>

      {/* Main headline */}
      <h1 style={{
        fontFamily: pp, fontSize: isMobile ? '1.65rem' : '2.2rem',
        fontWeight: 900, color: '#fff', lineHeight: 1.25,
        margin: '0 0 1.75rem', maxWidth: '500px',
        animation: 'ssFadeUp 0.7s ease 0.4s both',
      }}>
        <span style={{ color: GOLD, fontStyle: 'italic' }}>7 secrets</span>{' '}
        die je nog niet wist en je gaan helpen{' '}
        <span className="ss-gold-gloss">sneller vet verliezen</span>{' '}
        en er{' '}
        <span className="ss-gold-gloss">gespierder uitzien</span>{' '}
        deze zomer
      </h1>

      {/* CTA button */}
      <button onClick={onScrollDown} style={{
        fontFamily: pp, padding: isMobile ? '1rem 2.5rem' : '1.1rem 3rem',
        border: 'none', borderRadius: '14px',
        fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900,
        color: '#000', background: 'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 4px 25px rgba(255,186,9,0.4)',
        width: isMobile ? '100%' : 'auto', maxWidth: '400px',
        animation: 'ssFadeUp 0.7s ease 0.6s both, ssPulse 2s ease-in-out 1.5s infinite',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          Bekijk De 7 Secrets
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </span>
      </button>
    </div>
  )
}
