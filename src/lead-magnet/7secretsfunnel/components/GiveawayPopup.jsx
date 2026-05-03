// src/lead-magnet/7secretsfunnel/components/GiveawayPopup.jsx
import { useState, useEffect } from 'react'
import { GOLD } from './shared'

const pp = "'Poppins', sans-serif"
const DEADLINE = new Date('2026-03-11T12:00:00').getTime()

function useCountdown() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = DEADLINE - Date.now()
      if (diff <= 0) { setT('Verlopen'); return }
      const d = Math.floor(diff / 86400000)
      const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setT(d + 'd ' + h + ':' + m + ':' + s)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

export default function GiveawayPopup({ isMobile, show, onClose, onSubmitted }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [motivation, setMotivation] = useState('')
  const [sending, setSending] = useState(false)
  const [shakeError, setShakeError] = useState(false)
  const [step, setStep] = useState(1)
  const countdown = useCountdown()

  if (!show) return null

  const handlePhone = (e) => {
    setPhone(e.target.value.replace(/[^\d\s]/g, ''))
  }

  const phoneDigits = phone.replace(/\D/g, '')
  const phoneValid = phoneDigits.length >= 8
  const formReady = name.trim().length >= 2 && phoneValid

  const submit = async () => {
    if (!formReady) {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 600)
      return
    }
    setSending(true)
    try {
      if (!window._leadSupabase) {
        const { createClient } = await import('@supabase/supabase-js')
        window._leadSupabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      }
      await window._leadSupabase.from('intake_submissions').insert({
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        source: 'giveaway_7secrets',
        goal: 'Summer Shape Giveaway',
        notes: motivation.trim() || null,
        status: 'new'
      })
    } catch(e) { console.error('Save failed:', e) }
    setSending(false)
    if (onSubmitted) onSubmitted()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        zIndex: 200, animation: 'gpFadeIn 0.2s ease'
      }} />

      {/* Modal — clean, centered, no photo */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: isMobile ? 'calc(100vw - 32px)' : '380px',
        background: '#0a0a0a', border: '1.5px solid rgba(255,186,9,0.15)',
        borderRadius: '20px',
        padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
        zIndex: 201, animation: 'gpScaleIn 0.3s ease',
        boxShadow: '0 0 60px rgba(255,186,9,0.08), 0 20px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}>✕</button>

        {/* Timer + Title + Prizes — only on step 1 */}
        {step === 1 && (
          <>
            {/* Timer */}
            <div style={{ textAlign: 'center', marginBottom: '0.7rem' }}>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.55rem' : '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: '0.15rem' }}>Winnaar wordt bekendgemaakt op</div>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.95rem', color: '#fff', fontWeight: 800, marginBottom: '0.1rem' }}>11 Maart</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontFamily: pp, fontSize: isMobile ? '0.65rem' : '0.7rem', color: GOLD, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '1.2rem' : '1.35rem', fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>
                Win <span className="gp-gold">6 Maanden Personal Training</span> Naar Jouw Summer Shape
              </div>
            </div>

            {/* Prizes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>6 maanden personal training</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Voeding + training op maat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>€100 upfront tegoed</span>
              </div>
            </div>
          </>
        )}

        {/* STEP 1: Name + Phone */}
        {step === 1 && (
          <>
            <div className={shakeError ? 'gp-shake' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <input type="text" placeholder="Je voornaam" value={name} onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', fontFamily: pp, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,186,9,0.25)', borderRadius: '10px', color: '#fff', fontSize: isMobile ? '0.88rem' : '0.92rem', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,186,9,0.25)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.8rem' }}>🇳🇱</span>
                <span style={{ fontFamily: pp, fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>+31</span>
                <input type="tel" placeholder="6 12345678" value={phone} onChange={handlePhone}
                  style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: isMobile ? '0.88rem' : '0.92rem', fontFamily: pp, outline: 'none' }} />
              </div>
              {shakeError && <div style={{ fontFamily: pp, fontSize: '0.5rem', color: '#ef4444', fontWeight: 600, textAlign: 'center' }}>Vul je naam en nummer in (min. 8 cijfers)</div>}
            </div>

            <button onClick={() => {
              if (!formReady) { setShakeError(true); setTimeout(() => setShakeError(false), 600); return }
              setStep(2)
            }} style={{
              width: '100%', padding: isMobile ? '0.8rem' : '0.85rem', border: 'none', borderRadius: '12px',
              fontFamily: pp, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 900,
              color: '#000', background: 'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 25px rgba(255,186,9,0.4)',
              animation: 'gpPulse 2s ease-in-out infinite',
            }}>Volgende</button>
          </>
        )}

        {/* STEP 2: Motivation */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>
                Waarom wil jij winnen, {name.trim().split(' ')[0]}?
              </div>
              <div style={{ fontFamily: pp, fontSize: '0.52rem', color: GOLD, fontWeight: 600 }}>Vergroot je kans door te vertellen waarom jij het verdient</div>
            </div>

            <textarea
              placeholder="Bijv. ik wil eindelijk droog de zomer in..."
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '0.75rem', fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.88rem',
                background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,186,9,0.25)',
                borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box',
                resize: 'none', marginBottom: '0.5rem',
              }}
            />

            <button onClick={submit} disabled={sending} style={{
              width: '100%', padding: isMobile ? '0.8rem' : '0.85rem', border: 'none', borderRadius: '12px',
              fontFamily: pp, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 900,
              color: '#000', background: 'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              boxShadow: '0 4px 25px rgba(255,186,9,0.4)',
              animation: 'gpPulse 2s ease-in-out infinite',
            }}>{sending ? 'Laden...' : 'Doe Gratis Mee'}</button>

            <button onClick={() => setStep(1)} style={{
              display: 'block', margin: '0.4rem auto 0', background: 'none', border: 'none',
              fontFamily: pp, fontSize: '0.48rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
            }}>← Terug</button>
          </>
        )}

      </div>

      <style>{`
        .gp-gold{background:linear-gradient(135deg,#b8860b,#ffba09,#ffd44d,#ffba09,#b8860b);background-size:100% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;font-style:italic}
        .gp-shake{animation:gpFormShake 0.5s ease!important}
        @keyframes gpFormShake{0%,100%{transform:translateX(0)}10%{transform:translateX(-6px)}20%{transform:translateX(6px)}30%{transform:translateX(-4px)}40%{transform:translateX(4px)}50%{transform:translateX(-2px)}60%{transform:translateX(0)}}
        @keyframes gpPulse{0%,100%{box-shadow:0 4px 20px rgba(255,186,9,0.35)}50%{box-shadow:0 4px 35px rgba(255,186,9,0.6)}}
        @keyframes gpFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes gpScaleIn{from{transform:translate(-50%,-50%) scale(0.93);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
      `}</style>
    </>
  )
}
