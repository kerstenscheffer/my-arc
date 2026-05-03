import { useState, useEffect } from 'react'

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'
const DEADLINE = new Date('2026-03-11T12:00:00').getTime()

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
      setT((d > 0 ? d + 'd ' : '') + h + 'u ' + m + 'm ' + s + 's')
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return t
}

export default function GiveawayPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState(0)
  const [motivation, setMotivation] = useState('')
  const countdown = useCountdown()
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const pp = "'Poppins', sans-serif"

  const submit = async () => {
    if (!name.trim() || !phone.trim()) return
    setSending(true)
    try {
      if (!window._leadSupabase) {
        const { createClient } = await import('@supabase/supabase-js')
        window._leadSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
      }
      const { error } = await window._leadSupabase.from('intake_submissions').insert({
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        source: 'giveaway_7secrets',
        goal: 'Summer Shape Giveaway',
        notes: motivation || null,
        status: 'new'
      })
      if (error) throw error
    } catch (e) {
      console.error('❌ Giveaway save failed:', e)
    }
    setSending(false)
    setDone(true)
  }

  const SPARKLES = [
    { left: '8%',  top: '12%', size: 2,   delay: 0,   dur: 2.5 },
    { left: '92%', top: '8%',  size: 1.5, delay: 0.8, dur: 3 },
    { left: '15%', top: '45%', size: 1.8, delay: 1.5, dur: 2.8 },
    { left: '85%', top: '35%', size: 1.2, delay: 0.3, dur: 3.2 },
    { left: '5%',  top: '70%', size: 2,   delay: 2,   dur: 2.6 },
    { left: '95%', top: '65%', size: 1,   delay: 1.2, dur: 3.5 },
    { left: '20%', top: '85%', size: 1.5, delay: 0.6, dur: 2.9 },
    { left: '80%', top: '80%', size: 1.3, delay: 1.8, dur: 3.1 },
    { left: '50%', top: '5%',  size: 1.6, delay: 0.4, dur: 3.3 },
    { left: '45%', top: '92%', size: 1.2, delay: 2.2, dur: 2.7 },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: '#030303',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1.5rem 1rem 2.5rem' : '2rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: pp,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(255,186,9,0.06) 0%, transparent 70%)',
      }} />

      {/* Global sparkles */}
      {SPARKLES.map((s, i) => (
        <div key={i} style={{
          position: 'fixed', left: s.left, top: s.top,
          width: s.size + 'px', height: s.size + 'px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff, #ffd44d)',
          boxShadow: '0 0 ' + (s.size * 4) + 'px rgba(255,186,9,0.6)',
          pointerEvents: 'none', opacity: 0,
          animation: `sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`
        }} />
      ))}

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '440px',
        background: '#0a0a0a',
        border: '1.5px solid rgba(255,186,9,0.15)',
        borderRadius: isMobile ? '20px' : '24px',
        overflow: 'hidden',
        position: 'relative',
        animation: 'scaleIn 0.4s cubic-bezier(0.23,1,0.32,1)',
        boxShadow: '0 0 80px rgba(255,186,9,0.08), 0 30px 60px rgba(0,0,0,0.6)',
      }}>

        {/* Top gold accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,186,9,0.6), transparent)',
          zIndex: 10,
        }} />

        {/* Sparkles on card */}
        {[
          { left: '62%', top: '6%',  size: 2,   delay: 0,   dur: 2.5 },
          { left: '90%', top: '14%', size: 1.5, delay: 0.8, dur: 3 },
          { left: '75%', top: '42%', size: 1.8, delay: 1.5, dur: 2.8 },
          { left: '55%', top: '68%', size: 1.2, delay: 0.3, dur: 3.2 },
          { left: '94%', top: '58%', size: 2,   delay: 2,   dur: 2.6 },
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: s.left, top: s.top,
            width: s.size + 'px', height: s.size + 'px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff, #ffd44d)',
            boxShadow: '0 0 ' + (s.size * 3) + 'px rgba(255,186,9,0.5)',
            pointerEvents: 'none', zIndex: 10, opacity: 0,
            animation: `sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`
          }} />
        ))}

        {/* Layout: photo left + content right */}
        <div style={{ display: 'flex', flexDirection: 'row', minHeight: isMobile ? '440px' : '500px' }}>

          {/* LEFT — Coach photo */}
          <div style={{
            width: isMobile ? '120px' : '150px',
            flexShrink: 0, position: 'relative', overflow: 'hidden',
          }}>
            <img src="/coach-modal.png" alt="" style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              display: 'block',
            }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 55%, #0a0a0a 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 65%, #0a0a0a 100%)' }} />
          </div>

          {/* RIGHT — Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '1rem 1rem 1rem 0.6rem' : '1.25rem 1.25rem 1.25rem 0.75rem',
            overflowY: 'auto',
          }}>

            {/* Countdown timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.6rem' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontFamily: pp, fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Eindigt 11 maart ·</span>
              <span style={{ fontFamily: pp, fontSize: '0.55rem', color: GOLD, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
            </div>

            {/* Title */}
            <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
              <div className="gm-gold" style={{
                fontFamily: "'Cinzel', serif",
                fontSize: isMobile ? '1.15rem' : '1.6rem',
                fontWeight: 900, lineHeight: 1, letterSpacing: '0.04em',
              }}>SUMMER SHAPE</div>
              <div className="gm-gold" style={{
                fontFamily: "'Cinzel', serif",
                fontSize: isMobile ? '0.8rem' : '1rem',
                fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1, marginTop: '0.2rem'
              }}>GIVEAWAY</div>
            </div>

            {/* Prize 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div>
                <div className="gm-gold" style={{ fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>6 Maanden Coaching</div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.52rem' : '0.56rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, lineHeight: 1.3, marginTop: '0.1rem' }}>Naar jouw Summer Shape</div>
              </div>
            </div>

            {/* Prize 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div>
                <div className="gm-gold" style={{ fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.2 }}>€100 Upfront Tegoed</div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.52rem' : '0.56rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, lineHeight: 1.3, marginTop: '0.1rem' }}>Supplementen & meer</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,186,9,0.15), transparent)', marginBottom: '0.75rem' }} />

            {/* Form steps */}
            {done ? (
              <div style={{ textAlign: 'center', padding: '1rem 0', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'bounceIn 0.5s ease' }}>🎉</div>
                <div style={{ fontFamily: pp, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem' }}>Je doet mee!</div>
                <div style={{ fontFamily: pp, fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Winnaar wordt 11 maart bekendgemaakt</div>
                <div style={{ marginTop: '0.75rem', width: '32px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
              </div>
            ) : step === 0 ? (
              <div style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    width: '100%', padding: isMobile ? '0.8rem' : '0.9rem',
                    border: 'none', borderRadius: '12px', cursor: 'pointer',
                    fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 800,
                    color: '#000',
                    background: `linear-gradient(135deg, #ffd44d, ${GOLD}, ${GOLD_DARK})`,
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 4px 20px rgba(255,186,9,0.3)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                  onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    Ik Doe Mee
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
                    </svg>
                  </span>
                </button>
                <div style={{ textAlign: 'center', marginTop: '0.5rem', fontFamily: pp, fontSize: '0.42rem', color: 'rgba(255,255,255,0.15)', fontWeight: 500 }}>
                  100% gratis · Winnaar wordt persoonlijk gekozen
                </div>
              </div>
            ) : step === 1 ? (
              <div style={{ marginTop: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: pp, fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Vul je gegevens in om mee te doen</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.45rem' }}>
                  <input
                    type="text"
                    placeholder="Je voornaam"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                    style={{
                      width: '100%', padding: '0.65rem', fontFamily: pp,
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.82rem',
                      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                    }}
                  />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.65rem', background: 'rgba(255,255,255,0.04)',
                    border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  }}>
                    <span style={{ fontSize: '0.75rem' }}>🇳🇱</span>
                    <span style={{ fontFamily: pp, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>+31</span>
                    <input
                      type="tel"
                      placeholder="6 12345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{
                        flex: 1, border: 'none', background: 'transparent', color: '#fff',
                        fontSize: isMobile ? '0.78rem' : '0.82rem', fontFamily: pp, outline: 'none'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => { if (name.trim() && phone.trim()) setStep(2) }}
                  style={{
                    width: '100%', padding: '0.75rem', border: 'none', borderRadius: '12px',
                    cursor: (name.trim() && phone.trim()) ? 'pointer' : 'not-allowed',
                    fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 800,
                    color: (name.trim() && phone.trim()) ? '#000' : 'rgba(255,255,255,0.2)',
                    background: (name.trim() && phone.trim()) ? `linear-gradient(135deg, #ffd44d, ${GOLD}, ${GOLD_DARK})` : 'rgba(255,255,255,0.06)',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    boxShadow: (name.trim() && phone.trim()) ? '0 4px 15px rgba(255,186,9,0.25)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >Volgende</button>
                <button onClick={() => setStep(0)} style={{
                  display: 'block', margin: '0.4rem auto 0', padding: '0.2rem',
                  background: 'none', border: 'none', fontFamily: pp,
                  color: 'rgba(255,255,255,0.2)', fontSize: '0.52rem', fontWeight: 600, cursor: 'pointer'
                }}>← Terug</button>
              </div>
            ) : (
              <div style={{ marginTop: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700, color: '#fff' }}>Waarom wil jij winnen?</div>
                </div>
                <textarea
                  placeholder="Bijv. ik wil droog de zomer in..."
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  rows={3}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  style={{
                    width: '100%', padding: '0.65rem', fontFamily: pp,
                    fontSize: isMobile ? '0.78rem' : '0.82rem',
                    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#fff', outline: 'none',
                    boxSizing: 'border-box', resize: 'none', marginBottom: '0.5rem',
                    transition: 'border-color 0.2s',
                  }}
                />
                <button
                  onClick={submit}
                  disabled={!motivation.trim() || sending}
                  style={{
                    width: '100%', padding: '0.75rem', border: 'none', borderRadius: '12px',
                    cursor: motivation.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 800,
                    color: motivation.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                    background: motivation.trim() ? `linear-gradient(135deg, #ffd44d, ${GOLD}, ${GOLD_DARK})` : 'rgba(255,255,255,0.06)',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    boxShadow: motivation.trim() ? '0 4px 15px rgba(255,186,9,0.25)' : 'none',
                    animation: motivation.trim() ? 'pulse 2s ease-in-out infinite' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sending ? 'Verzenden...' : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      Doe Mee
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
                      </svg>
                    </span>
                  )}
                </button>
                <button onClick={() => setStep(1)} style={{
                  display: 'block', margin: '0.4rem auto 0', padding: '0.2rem',
                  background: 'none', border: 'none', fontFamily: pp,
                  color: 'rgba(255,255,255,0.2)', fontSize: '0.52rem', fontWeight: 600, cursor: 'pointer'
                }}>← Terug</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@900&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@900&family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030303; padding-bottom: env(safe-area-inset-bottom); }
        .gm-gold {
          background: linear-gradient(135deg, #402400, #ffba09, #ffd44d, #ffba09, #402400);
          background-size: 100% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform:scale(0) }
          20% { opacity:0.8; transform:scale(1) }
          50% { opacity:0.2; transform:scale(0.5) }
          80% { opacity:0.6; transform:scale(0.9) }
        }
        @keyframes pulse {
          0%,100% { box-shadow:0 4px 15px rgba(255,186,9,0.25) }
          50% { box-shadow:0 4px 30px rgba(255,186,9,0.55) }
        }
        @keyframes scaleIn {
          from { transform:scale(0.95); opacity:0 }
          to   { transform:scale(1); opacity:1 }
        }
        @keyframes bounceIn {
          0%   { transform:scale(0) }
          60%  { transform:scale(1.2) }
          100% { transform:scale(1) }
        }
      `}</style>
    </div>
  )
}
