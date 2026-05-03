// src/lead-magnet/7secretsfunnel/components/FinalPage.jsx
import { useState, useEffect } from 'react'

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'
const DEADLINE = new Date('2026-03-11T12:00:00').getTime()
const CALENDLY = 'https://calendly.com/kerstenscheffer/call-met-kersten'

function useCountdown() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      if (diff <= 0) { setT('Verlopen'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setT((d > 0 ? d+'d ' : '')+h+'u '+m+'m '+s+'s')
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

const REVIEWS = [
  { name: 'Sassus', text: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren.', result: '-5,1kg' },
  { name: 'Hessel', text: 'De kennis zorgt ervoor dat ik nu zonder na te denken stabiel blijf in gewicht.', result: '-5,4kg' },
  { name: 'Indi', text: 'Helpt me iedere week en motiveert me heel erg bij het sporten.', result: '' },
  { name: 'Toon', text: 'Leuke gesprekken, altijd enthousiast, goed geholpen in mijn traject.', result: '' },
  { name: 'Consumer', text: 'Zeer professionele aanpak, waardevolle feedback en motivatie op de juiste momenten.', result: '' },
]

export default function FinalPage({ isMobile, onBack }) {
  const pp = "'Poppins', sans-serif"
  const doubled = [...REVIEWS, ...REVIEWS]
  const countdown = useCountdown()

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: pp, overflowX: 'hidden'
    }}>

      {/* Back */}
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.2)', fontSize: '0.55rem', fontWeight: 600,
        fontFamily: pp, cursor: 'pointer', padding: '1rem',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
      }}>← Terug</button>


      {/* ========== 1. GIVEAWAY BEVESTIGING — PRIMARY ========== */}
      <div style={{
        width: '100%', maxWidth: '480px', padding: '0 1.25rem',
        textAlign: 'center', marginBottom: isMobile ? '2rem' : '2.5rem'
      }}>
        {/* Big checkmark */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(255,186,9,0.1)', border: '2.5px solid rgba(255,186,9,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>

        {/* Title — BIG */}
        <h1 style={{
          fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 900,
          color: '#fff', lineHeight: 1.2, margin: '0 0 0.5rem'
        }}>
          Je doet mee aan de<br/><span className="fp-gold">Summer Shape Giveaway!</span>
        </h1>

        {/* Timer pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          background: 'rgba(255,186,9,0.06)', border: '1px solid rgba(255,186,9,0.12)',
          borderRadius: '8px', padding: '0.45rem 0.85rem', marginBottom: '1rem'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Winnaar over</span>
          <span style={{ fontSize: '0.72rem', color: GOLD, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
        </div>

        {/* Warm closing — integrated, not a separate block */}
        <p style={{
          fontSize: isMobile ? '0.78rem' : '0.82rem', color: 'rgba(255,255,255,0.4)',
          fontWeight: 400, lineHeight: 1.7, margin: '0 auto', maxWidth: '360px'
        }}>
          Ik neem binnenkort contact met je op. In de tussentijd — download de secrets hieronder.
        </p>
      </div>


      {/* ========== 2. PDF DOWNLOAD — SECONDARY ========== */}
      <div style={{
        width: '100%', maxWidth: '480px', padding: '0 1.25rem',
        marginBottom: isMobile ? '2.5rem' : '3rem'
      }}>
        <a href="/7-summer-shape-secrets-cheatsheet.pdf" download style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          width: '100%', padding: '0.85rem', borderRadius: '12px',
          background: 'linear-gradient(135deg, #ffd44d, ' + GOLD + ', ' + GOLD_DARK + ')',
          textDecoration: 'none', fontFamily: pp, boxSizing: 'border-box',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 4px 20px rgba(255,186,9,0.25)'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#000' }}>Download De 7 Secrets (PDF)</span>
        </a>
      </div>


      {/* ========== 3. €1 OFFER — TERTIARY, subtle ========== */}
      <div style={{
        width: '100%', maxWidth: '480px', padding: '0 1.25rem',
        marginBottom: isMobile ? '2rem' : '2.5rem'
      }}>
        {/* Thin divider with text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontFamily: pp, fontSize: '0.48rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>Of start direct</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px', padding: isMobile ? '1rem' : '1.15rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          {/* Left — coach photo */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden',
            flexShrink: 0, border: '2px solid rgba(255,186,9,0.2)'
          }}>
            <img src="/coach-modal.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          </div>

          {/* Right — text + link */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.76rem',
              color: 'rgba(255,255,255,0.5)', fontWeight: 500, lineHeight: 1.5, margin: '0 0 0.35rem'
            }}>
              Start je Summer Shape voor <span style={{ color: GOLD, fontWeight: 800 }}>€1</span> — voeding, training, coaching, app. Alles.
            </p>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: pp, fontSize: isMobile ? '0.68rem' : '0.72rem',
              color: GOLD, fontWeight: 700, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
            }}>
              Plan een gratis gesprek
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>


      {/* ========== 4. REVIEWS — BACKGROUND TRUST ========== */}
      <div style={{ width: '100%', position: 'relative', overflow: 'hidden', paddingBottom: '2rem' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '100%', background: 'linear-gradient(90deg, #000, transparent)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '100%', background: 'linear-gradient(270deg, #000, transparent)', zIndex: 3, pointerEvents: 'none' }} />

        <div style={{
          display: 'flex', gap: '0.6rem',
          animation: 'fpSlide 30s linear infinite',
          width: 'max-content'
        }}>
          {doubled.map((r, i) => (
            <div key={i} style={{
              width: '200px', flexShrink: 0,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px', padding: '0.7rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{r.name.charAt(0)}</span>
                  </div>
                  <span style={{ fontFamily: pp, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{r.name}</span>
                  {r.result && <span style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 800, color: GOLD }}>{r.result}</span>}
                </div>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width={9} height={9} viewBox="0 0 24 24" fill={GOLD}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
              </div>
              <p style={{ fontFamily: pp, fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400, lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .fp-gold{background:linear-gradient(135deg,#402400,#ffba09,#ffd44d,#ffba09,#402400);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;font-style:italic}
        @keyframes fpSlide{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>
    </div>
  )
}
