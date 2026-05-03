// src/lead-magnet/7secretsfunnel/components/FloatingCoach.jsx
import { useState, useEffect } from 'react'

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
const ArrowIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'
const CALENDLY = 'https://calendly.com/kerstenscheffer/call-met-kersten'

function getNextSunday() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 7 : 7 - day
  const sun = new Date(now)
  sun.setDate(now.getDate() + diff)
  sun.setHours(23,59,59,0)
  return sun
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const tick = () => {
      const target = getNextSunday()
      const diff = target - new Date()
      if (diff <= 0) { setTimeLeft('Verlopen'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setTimeLeft(d+'d '+h+'u '+m+'m')
      else setTimeLeft(h+'u '+m+'m')
    }
    tick()
    const iv = setInterval(tick, 60000)
    return () => clearInterval(iv)
  }, [])
  return timeLeft
}

export default function FloatingCoach({ isMobile }) {
  const [open, setOpen] = useState(false)
  const [pulse, setPulse] = useState(true)
  const [showNotif, setShowNotif] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)
  const [calendlyLoaded, setCalendlyLoaded] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const countdown = useCountdown()

  useEffect(() => {
    if (open) return
    const interval = setInterval(() => {
      if (!notifDismissed) {
        setShowNotif(true)
        setTimeout(() => setShowNotif(false), 6000)
      }
    }, 15000)
    const initial = setTimeout(() => {
      if (!notifDismissed) {
        setShowNotif(true)
        setTimeout(() => setShowNotif(false), 6000)
      }
    }, 4000)
    return () => { clearInterval(interval); clearTimeout(initial) }
  }, [open, notifDismissed])

  useEffect(() => {
    if (open) { setPulse(false); setShowNotif(false) }
  }, [open])

  const openFromNotif = () => { setNotifDismissed(true); setShowNotif(false); setOpen(true) }
  const dismissNotif = (e) => { e.stopPropagation(); setNotifDismissed(true); setShowNotif(false) }
  const resetAndClose = () => { setOpen(false) }

  const openCalendly = () => {
    setOpen(false)
    setShowCalendly(true)
  }

  const pp = "'Poppins', sans-serif"

  return (
    <>
      {/* Notification popup */}
      {!open && showNotif && (
        <div onClick={openFromNotif} style={{ position: 'fixed', bottom: isMobile ? '82px' : '92px', right: isMobile ? '16px' : '24px', maxWidth: isMobile ? '250px' : '270px', background: '#111', border: '1px solid rgba(255,186,9,0.2)', color: '#fff', padding: '0.75rem 0.95rem', borderRadius: '14px 14px 4px 14px', cursor: 'pointer', zIndex: 100, boxShadow: '0 6px 30px rgba(0,0,0,0.5)', animation: 'notifSlideIn 0.4s ease' }}>
          <p style={{ fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: '600', lineHeight: 1.45, margin: 0 }}>
            Start je <span style={{ color: GOLD, fontWeight: '800' }}>Summer Shape voor €1</span> — voeding, training, coaching, app. Alles. 💪
          </p>
          <button onClick={dismissNotif} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#333', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* Coach avatar button */}
      {!open && (
        <button onClick={() => { setNotifDismissed(true); setShowNotif(false); setOpen(true) }}
          style={{ position: 'fixed', bottom: isMobile ? '20px' : '24px', right: isMobile ? '16px' : '24px', width: isMobile ? '52px' : '58px', height: isMobile ? '52px' : '58px', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid '+GOLD, cursor: 'pointer', zIndex: 100, boxShadow: '0 4px 20px rgba(255,186,9,0.3)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', animation: pulse ? 'coachPulse 2s ease-in-out infinite' : 'none', padding: 0, background: 'none' }}>
          <img src="/coach-modal.png" alt="Coach" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </button>
      )}

      {/* Backdrop */}
      {open && <div onClick={resetAndClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 100, animation: 'fadeIn 0.2s ease' }} />}

      {/* Chat panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: isMobile ? '16px' : '24px', right: isMobile ? '12px' : '24px', width: isMobile ? 'calc(100vw - 24px)' : '360px', maxHeight: '80vh', overflowY: 'auto', background: 'linear-gradient(180deg, #141414 0%, #0e0e0e 100%)', border: '1px solid rgba(255,186,9,0.08)', borderRadius: '16px', boxShadow: '0 10px 50px rgba(0,0,0,0.6)', zIndex: 101, animation: 'coachSlideUp 0.3s ease' }}>
          {/* Header */}
          <div style={{ padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,186,9,0.2)' }}>
              <img src="/coach-modal.png" alt="Kersten" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff', fontFamily: pp }}>Kersten</div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500', fontFamily: pp }}>MY ARC Coach</div>
            </div>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <button onClick={resetAndClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '4px', display: 'flex', flexShrink: 0 }}><XIcon size={18} /></button>
          </div>

          {/* Content */}
          <div style={{ padding: isMobile ? '1rem' : '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {/* Chat bubble */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src="/coach-modal.png" alt="K" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px 16px 16px 4px', padding: isMobile ? '0.7rem 0.9rem' : '0.8rem 1rem' }}>
                <p style={{ fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.85rem', color: '#fff', fontWeight: '500', lineHeight: 1.5, margin: 0 }}>
                  Start je <strong style={{ color: GOLD }}>Summer Shape voor €1.</strong> Eerste maand volledige toegang: voeding, training, coaching en app. Alles inbegrepen.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0 0 2.4rem' }}>
              {[
                'Persoonlijk voedingsplan',
                'Trainingsschema op maat',
                '1-op-1 coaching',
                'Volledige app toegang',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontFamily: pp, fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ textAlign: 'center', padding: '0.3rem 0' }}>
              <span style={{ fontFamily: pp, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, textDecoration: 'line-through' }}>€149/maand</span>
              <span style={{ fontFamily: pp, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}> → </span>
              <span style={{ fontFamily: pp, fontSize: '0.95rem', color: GOLD, fontWeight: 900 }}>€1 eerste maand</span>
            </div>

            {/* CTA */}
            <button onClick={openCalendly} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: isMobile ? '0.85rem' : '0.9rem',
              background: 'linear-gradient(135deg, '+GOLD+', '+GOLD_DARK+')',
              color: '#000', border: 'none', borderRadius: '10px',
              fontFamily: pp, fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800',
              cursor: 'pointer', touchAction: 'manipulation',
              boxShadow: '0 4px 15px rgba(255,186,9,0.25)',
              animation: 'coachBtnPulse 2s ease-in-out infinite'
            }}>Plan Je Gratis Gesprek <ArrowIcon size={14} /></button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: pp, fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>100% vrijblijvend · Geen verplichtingen</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendly Modal */}
      {showCalendly && (
        <CalendlyModal isMobile={isMobile} onClose={() => { setShowCalendly(false); setCalendlyLoaded(false); setBookingComplete(false) }} calendlyLoaded={calendlyLoaded} setCalendlyLoaded={setCalendlyLoaded} bookingComplete={bookingComplete} setBookingComplete={setBookingComplete} calendlyUrl={CALENDLY} />
      )}

      <style>{`
        @keyframes coachPulse{0%,100%{box-shadow:0 4px 20px rgba(255,186,9,0.3)}50%{box-shadow:0 4px 30px rgba(255,186,9,0.6),0 0 0 8px rgba(255,186,9,0.1)}}
        @keyframes coachSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes coachBtnPulse{0%,100%{box-shadow:0 4px 15px rgba(255,186,9,0.25)}50%{box-shadow:0 4px 30px rgba(255,186,9,0.5)}}
        @keyframes notifSlideIn{from{opacity:0;transform:translateX(20px) scale(0.95)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:none}}
        @keyframes scaleIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </>
  )
}

function CalendlyModal({ isMobile, onClose, calendlyLoaded, setCalendlyLoaded, bookingComplete, setBookingComplete, calendlyUrl }) {
  const pp = "'Poppins', sans-serif"

  useEffect(() => {
    const existing = document.querySelector('script[src*="calendly.com"]')
    const init = () => {
      setTimeout(() => {
        const w = document.querySelector('.calendly-inline-widget')
        if (w && window.Calendly) {
          try { window.Calendly.initInlineWidget({ url: calendlyUrl + '?background_color=000000&text_color=ffffff&primary_color=ffba09', parentElement: w, utm: { utmSource: 'lead_magnet' } }) } catch(e) {}
        }
      }, 300)
    }
    if (existing && window.Calendly) { setCalendlyLoaded(true); init() }
    else if (!existing) {
      const s = document.createElement('script'); s.src = 'https://assets.calendly.com/assets/external/widget.js'; s.async = true
      s.onload = () => { setCalendlyLoaded(true); init() }; document.body.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const hm = (e) => { if (e.origin === 'https://calendly.com' && e.data?.event === 'calendly.event_scheduled') { setBookingComplete(true); setTimeout(() => onClose(), 2500) } }
    const he = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('message', hm); window.addEventListener('keydown', he)
    return () => { window.removeEventListener('message', hm); window.removeEventListener('keydown', he) }
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem', zIndex: 10000, animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: '#000', borderRadius: isMobile ? '20px 20px 0 0' : '16px', border: '1px solid rgba(255,186,9,0.15)', maxWidth: isMobile ? '100%' : '900px', width: '100%', height: isMobile ? '88vh' : 'auto', maxHeight: isMobile ? '88vh' : '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' : 'scaleIn 0.3s ease' }}>
        <div style={{ padding: isMobile ? '1rem 1.25rem' : '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,186,9,0.08)', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: pp, fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: '800', color: '#ffba09', margin: '0 0 0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Plan je gratis gesprek</h3>
            <p style={{ fontFamily: pp, color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '500', margin: 0 }}>Start voor €1 — Kennismaking & Doelstelling — 15 min</p>
          </div>
          <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minWidth: '44px', minHeight: '44px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0.75rem' : '1rem' }}>
          {bookingComplete && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,186,9,0.08)', border: '1px solid rgba(255,186,9,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'fadeIn 0.5s ease' }}>
              <span style={{ fontSize: '1.5rem' }}>🏆</span>
              <p style={{ fontFamily: pp, color: '#ffba09', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', margin: 0 }}>Yes! Je gesprek is gepland. Check je mail!</p>
            </div>
          )}
          <div className="calendly-inline-widget" data-url={calendlyUrl + '?background_color=000000&text_color=ffffff&primary_color=ffba09'} style={{ minWidth: '320px', height: isMobile ? '500px' : '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,186,9,0.08)', background: '#000', position: 'relative' }}>
            {!calendlyLoaded && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,186,9,0.15)', borderTopColor: '#ffba09', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ fontFamily: pp, color: 'rgba(255,255,255,0.3)', marginTop: '0.75rem', fontSize: '0.82rem' }}>Kalender laden...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
