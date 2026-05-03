// ========================================
// 📁 src/lead-magnet/components/floating-coach/FloatingCoach.jsx
// Main orchestrator - floating icon + notification + popup shell
// Imports sub-components for teaser, intake, and calendly
// ========================================
import { useState, useEffect } from 'react'
import { GOLD, CALENDLY_URL, XIcon } from './constants'
import IntakeTeaser from './IntakeTeaser'
import IntakeSteps from './IntakeSteps'
import CalendlyModal from './CalendlyModal'

export default function FloatingCoach({ isMobile, page = 'quiz' }) {
  const [open, setOpen] = useState(false)
  const [intakeStarted, setIntakeStarted] = useState(false)
  const [intakeStep, setIntakeStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [form, setForm] = useState({ name: '', phone: '' })
  const [sending, setSending] = useState(false)
  const [pulse, setPulse] = useState(true)
  const [showNotif, setShowNotif] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  // ══════ NOTIFICATION TIMER ══════
  useEffect(() => {
    if (open) return
    const interval = setInterval(() => {
      setShowNotif(true)
      setTimeout(() => setShowNotif(false), 6000)
    }, 15000)
    const initial = setTimeout(() => {
      setShowNotif(true)
      setTimeout(() => setShowNotif(false), 6000)
    }, 4000)
    return () => { clearInterval(interval); clearTimeout(initial) }
  }, [open])

  useEffect(() => {
    if (open) { setPulse(false); setShowNotif(false) }
  }, [open])

  // ══════ HANDLERS ══════
  const openPopup = () => {
    setShowNotif(false)
    setOpen(true)
  }

  const resetAndClose = () => {
    setOpen(false)
    setIntakeStarted(false)
    setIntakeStep(0)
    setAnswers({})
    setForm({ name: '', phone: '' })
  }

  const startIntake = () => {
    setIntakeStarted(true)
    setIntakeStep(0)
    setAnswers({})
  }

  const submitIntake = async () => {
    if (!form.name.trim() || !form.phone.trim()) return
    setSending(true)
    try {
      if (!window._leadSupabase) {
        const { createClient } = await import('@supabase/supabase-js')
        window._leadSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        )
      }
      await window._leadSupabase.from('intake_submissions').insert({
        contact_name: form.name.trim(),
        contact_phone: form.phone.trim(),
        goal: answers.goal || null,
        obstacle: answers.obstacle || null,
        urgency: answers.motivation || null,
        budget: answers.budget || null,
        source: 'lead_magnet_floating_coach'
      })
    } catch(e) {
      console.log('Intake save skipped:', e)
    }
    setSending(false)
    setOpen(false)
    setShowCalendly(true)
  }

  return (
    <>
      {/* ══════ NOTIFICATION BUBBLE ══════ */}
      {!open && showNotif && (
        <div
          onClick={openPopup}
          style={{
            position: 'fixed',
            bottom: isMobile ? '82px' : '92px',
            right: isMobile ? '16px' : '24px',
            maxWidth: isMobile ? '250px' : '270px',
            background: '#111',
            border: '1px solid rgba(255,186,9,0.2)',
            color: '#fff',
            padding: '0.75rem 0.95rem',
            borderRadius: '14px 14px 4px 14px',
            cursor: 'pointer',
            zIndex: 100,
            boxShadow: '0 6px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,186,9,0.08)',
            animation: 'notifSlideIn 0.4s ease'
          }}
        >
          <p style={{
            fontSize: isMobile ? '0.78rem' : '0.82rem',
            fontWeight: '600', lineHeight: 1.45, margin: 0, color: '#fff'
          }}>
            {page === 'result' ? (
              <>Hulp nodig met toepassen?<br/><span style={{ color: GOLD, fontWeight: '700' }}>Plan een gratis call</span> 👋</>
            ) : (
              <>Zeker zijn van je resultaat?<br/><span style={{ color: GOLD, fontWeight: '700' }}>Kijk of 1-op-1 bij je past</span> 👀</>
            )}
          </p>
          <button onClick={(e) => { e.stopPropagation(); setShowNotif(false) }} style={{
            position: 'absolute', top: '-8px', right: '-8px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#333', color: 'rgba(255,255,255,0.5)', border: 'none',
            fontSize: '0.55rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
      )}

      {/* ══════ FLOATING ICON ══════ */}
      {!open && (
        <button onClick={openPopup}
          style={{
            position: 'fixed',
            bottom: isMobile ? '20px' : '24px',
            right: isMobile ? '16px' : '24px',
            width: isMobile ? '52px' : '58px',
            height: isMobile ? '52px' : '58px',
            borderRadius: '50%', overflow: 'hidden',
            border: `2.5px solid ${GOLD}`,
            cursor: 'pointer', zIndex: 100,
            boxShadow: '0 4px 20px rgba(255,186,9,0.3)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            animation: pulse ? 'coachPulse 2s ease-in-out infinite' : 'none',
            padding: 0, background: 'none'
          }}
        >
          <img src="/coach-modal.png" alt="Coach"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        </button>
      )}

      {/* ══════ BLUR BACKDROP ══════ */}
      {open && (
        <div
          onClick={resetAndClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            zIndex: 100, animation: 'fadeIn 0.2s ease'
          }}
        />
      )}

      {/* ══════ POPUP ══════ */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '12px' : '24px',
          width: isMobile ? 'calc(100vw - 24px)' : '360px',
          maxHeight: '80vh', overflowY: 'auto',
          background: 'linear-gradient(180deg, #141414 0%, #0e0e0e 100%)',
          border: '1px solid rgba(255,186,9,0.08)',
          borderRadius: '16px',
          boxShadow: '0 10px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,186,9,0.05)',
          zIndex: 101,
          animation: 'coachSlideUp 0.3s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: isMobile ? '0.75rem 1rem' : '0.85rem 1.1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(255,186,9,0.2)'
            }}>
              <img src="/coach-modal.png" alt="Kersten"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>Kersten</div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>MY ARC Coach</div>
            </div>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#22c55e', marginRight: '0.25rem'
            }} />
            <button onClick={resetAndClose} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
              padding: '4px', display: 'flex'
            }}>
              <XIcon size={18} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: isMobile ? '1rem' : '1.1rem 1.25rem' }}>
            {intakeStarted ? (
              <IntakeSteps
                isMobile={isMobile}
                intakeStep={intakeStep}
                answers={answers}
                setAnswers={setAnswers}
                setIntakeStep={setIntakeStep}
                form={form}
                setForm={setForm}
                onSubmit={submitIntake}
                sending={sending}
              />
            ) : (
              <IntakeTeaser
                isMobile={isMobile}
                page={page}
                onStart={startIntake}
              />
            )}
          </div>
        </div>
      )}

      {/* ══════ CALENDLY MODAL ══════ */}
      {showCalendly && (
        <CalendlyModal
          isMobile={isMobile}
          onClose={() => setShowCalendly(false)}
          calendlyUrl={CALENDLY_URL}
          name={form.name}
        />
      )}

      {/* ══════ ANIMATIONS ══════ */}
      <style>{`
        @keyframes coachPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,186,9,0.3); }
          50% { box-shadow: 0 4px 30px rgba(255,186,9,0.6), 0 0 0 8px rgba(255,186,9,0.1); }
        }
        @keyframes coachSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes goldShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
