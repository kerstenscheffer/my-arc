// src/funnel/90days/components/CTAModal.jsx

import { useState } from 'react'
import { GOLD, CALENDLY, pp, goldGloss, goldButtonBg, shimmerOverlay } from '../colors'
import IntakeService from '../../../intake/IntakeService'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

export default function CTAModal({ isMobile, onClose }) {
  const [view, setView] = useState('choose') // 'choose', 'calendly', 'info'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmitInfo = async () => {
    if (!name || !phone) return
    setSending(true)

    const answers = {
      goal: 'Vetverlies 5-15kg in 90 dagen',
      urgency: 'Meer info aangevraagd via funnel',
      commitment: 'Ja, wil meer weten',
    }
    const contact = {
      name,
      email: email || null,
      phone,
    }

    try {
      await IntakeService.submitIntake(answers, contact)
      console.log('✅ Info request saved:', name)
    } catch (err) {
      console.error('Submit error:', err)
    }

    setSending(false)
    setSubmitted(true)
  }

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '0.75rem' : '0.85rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fff',
    fontFamily: pp,
    fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: 600,
    outline: 'none',
    WebkitAppearance: 'none',
  }

  const labelStyle = {
    fontFamily: pp, fontSize: isMobile ? '0.58rem' : '0.63rem',
    fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '0.25rem', display: 'block',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0' : '2rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '440px',
          maxHeight: isMobile ? '92vh' : '85vh',
          background: '#0a0a0a',
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(255,186,9,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: pp, fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 800, color: '#fff',
          }}>
            {view === 'choose' && 'Wat wil je doen?'}
            {view === 'calendly' && 'Plan je gesprek'}
            {view === 'info' && (submitted ? 'Gelukt!' : 'Meer informatie')}
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: isMobile ? '1.25rem' : '1.5rem',
        }}>

          {/* ── CHOOSE VIEW ── */}
          {view === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Option 1: Direct calendly */}
              <button onClick={() => setView('calendly')} style={{
                width: '100%', padding: isMobile ? '1.1rem' : '1.25rem',
                background: goldButtonBg,
                border: 'none', borderRadius: '14px',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={shimmerOverlay} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontFamily: pp, fontSize: isMobile ? '0.88rem' : '0.95rem',
                    fontWeight: 900, color: '#000', marginBottom: '0.2rem',
                  }}>Direct mijn plek claimen</div>
                  <div style={{
                    fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem',
                    fontWeight: 500, color: 'rgba(0,0,0,0.5)',
                  }}>Plan een gratis gesprek van 15 min in mijn agenda</div>
                </div>
              </button>

              {/* Option 2: Leave info */}
              <button onClick={() => setView('info')} style={{
                width: '100%', padding: isMobile ? '1.1rem' : '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  fontFamily: pp, fontSize: isMobile ? '0.88rem' : '0.95rem',
                  fontWeight: 800, color: '#fff', marginBottom: '0.2rem',
                }}>Eerst meer informatie</div>
                <div style={{
                  fontFamily: pp, fontSize: isMobile ? '0.6rem' : '0.65rem',
                  fontWeight: 500, color: 'rgba(255,255,255,0.3)',
                }}>Laat je gegevens achter — ik neem contact met je op</div>
              </button>
            </div>
          )}

          {/* ── CALENDLY EMBED ── */}
          {view === 'calendly' && (
            <div>
              <iframe
                src={`${CALENDLY}?background_color=0a0a0a&text_color=ffffff&primary_color=ffba09`}
                width="100%"
                height={isMobile ? '500' : '580'}
                frameBorder="0"
                style={{
                  border: 'none', borderRadius: '10px',
                  background: '#0a0a0a',
                }}
              />
              <button onClick={() => setView('choose')} style={{
                background: 'none', border: 'none', fontFamily: pp,
                fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)',
                cursor: 'pointer', padding: '0.5rem 0', marginTop: '0.5rem',
                touchAction: 'manipulation',
              }}>
                Terug
              </button>
            </div>
          )}

          {/* ── INFO FORM ── */}
          {view === 'info' && !submitted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p style={{
                fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: 400, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6,
                marginBottom: '0.25rem',
              }}>
                Vul je gegevens in en ik neem binnen 24 uur contact met je op om te kijken of het traject bij je past.
              </p>

              <div>
                <label style={labelStyle}>Naam *</label>
                <input type="text" placeholder="Je voornaam" value={name}
                  onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Telefoonnummer *</label>
                <input type="tel" placeholder="06 12345678" value={phone}
                  onChange={e => setPhone(e.target.value)} style={inputStyle} inputMode="tel" />
              </div>

              <div>
                <label style={labelStyle}>Email (optioneel)</label>
                <input type="email" placeholder="jouw@email.nl" value={email}
                  onChange={e => setEmail(e.target.value)} style={inputStyle} inputMode="email" />
              </div>

              <button onClick={handleSubmitInfo} disabled={!name || !phone || sending} style={{
                width: '100%', padding: isMobile ? '0.9rem' : '1rem',
                background: (name && phone && !sending) ? goldButtonBg : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '12px',
                color: (name && phone && !sending) ? '#000' : 'rgba(255,255,255,0.2)',
                fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.88rem',
                fontWeight: 900, cursor: (name && phone) ? 'pointer' : 'default',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                marginTop: '0.25rem', position: 'relative', overflow: 'hidden',
              }}>
                {(name && phone && !sending) && <div style={shimmerOverlay} />}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {sending ? 'Verzenden...' : 'Verstuur'}
                </span>
              </button>

              <button onClick={() => setView('choose')} style={{
                background: 'none', border: 'none', fontFamily: pp,
                fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)',
                cursor: 'pointer', padding: '0.25rem', marginTop: '0.15rem',
                touchAction: 'manipulation',
              }}>
                Terug
              </button>
            </div>
          )}

          {/* ── SUBMITTED ── */}
          {view === 'info' && submitted && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(255,186,9,0.1)', border: '2px solid rgba(255,186,9,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{
                fontFamily: pp, fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 800, color: '#fff', marginBottom: '0.4rem',
              }}>Bedankt, {name}!</div>
              <p style={{
                fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem',
                fontWeight: 400, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6,
              }}>
                Ik neem zo snel mogelijk contact met je op. Houd je telefoon in de gaten!
              </p>
              <button onClick={onClose} style={{
                marginTop: '1rem',
                fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: 700, color: GOLD,
                background: 'rgba(255,186,9,0.08)', border: '1px solid rgba(255,186,9,0.15)',
                borderRadius: '10px', padding: '0.6rem 1.25rem',
                cursor: 'pointer', touchAction: 'manipulation',
              }}>Sluiten</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
