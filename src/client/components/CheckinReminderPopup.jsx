// src/client/components/CheckinReminderPopup.jsx
// Center-screen nudge that pushes the client to the weekly check-in.
//
// Shows when:
//   • Today is Friday and no check-in yet → "It's Friday"
//   • Today is Sat/Sun/Mon/Tue and last Friday's check-in is missing →
//     "You missed Friday — fill it in anyway"
//   • All other days OR snoozed (24h) → nothing
//
// The 24h snooze (localStorage) prevents the popup from re-firing on every
// pageload; it reappears the next day until the check-in is filled.

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardCheck, X, ArrowRight, Clock } from 'lucide-react'
import CheckinService from '../../modules/client-checkin/CheckinService'

const SNOOZE_KEY = 'myarc_checkin_popup_snooze_until'
const SNOOZE_HOURS = 24

const isSnoozed = () => {
  try {
    const v = localStorage.getItem(SNOOZE_KEY)
    if (!v) return false
    return new Date(v).getTime() > Date.now()
  } catch { return false }
}
const setSnooze = () => {
  try {
    const until = new Date(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000).toISOString()
    localStorage.setItem(SNOOZE_KEY, until)
  } catch { /* ignore */ }
}

export default function CheckinReminderPopup({ client, db, onOpen, isMobile: propMobile }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  // 'friday'  → today IS Friday and not yet filled
  // 'missed'  → it's after Friday in the same window and Friday is missing
  // null      → no popup
  const [mode, setMode] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false

    const evaluate = async () => {
      if (isSnoozed()) return
      const day = new Date().getDay() // 0=Sun..6=Sat
      const isFriday = day === 5
      const isPostFridayWindow = [6, 0, 1, 2].includes(day) // Sat, Sun, Mon, Tue
      if (!isFriday && !isPostFridayWindow) return

      try {
        const service = new CheckinService(db)
        const filled = await service.hasCheckinSinceLastFriday(client.id)
        if (cancelled) return
        if (filled) return
        setMode(isFriday ? 'friday' : 'missed')
        setShow(true)
      } catch {
        // Stay invisible on failure — coach can still chase via other means.
      }
    }
    evaluate()
    return () => { cancelled = true }
  }, [client?.id, db])

  if (!show || !mode) return null

  const handleSnooze = () => { setSnooze(); setShow(false) }
  const handleOpen = () => { setShow(false); onOpen?.() }

  const title = mode === 'friday'
    ? 'Het is vrijdag — tijd voor je check-in'
    : 'Vrijdag check-in gemist'
  const body = mode === 'friday'
    ? 'Vul nu je wekelijkse check-in in zodat je coach kan reageren op je week.'
    : 'Je hebt afgelopen vrijdag de check-in niet ingevuld. Vul ‘m alsnog in — je coach wil graag weten hoe het gaat.'

  const overlay = (
    <div
      onClick={handleSnooze}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483400,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'checkinPopFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: '#0a0a0a',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 16,
          padding: isMobile ? '1.1rem 1.1rem 1rem' : '1.4rem 1.4rem 1.2rem',
          color: '#fff',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.06)',
          animation: 'checkinPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
        }}
      >
        <button
          onClick={handleSnooze}
          aria-label="Later"
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: mode === 'missed' ? 'rgba(245,158,11,0.18)' : 'rgba(255,215,0,0.18)',
          border: `1px solid ${mode === 'missed' ? 'rgba(245,158,11,0.45)' : 'rgba(255,215,0,0.45)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '0.85rem',
        }}>
          <ClipboardCheck size={26} color={mode === 'missed' ? '#f59e0b' : '#FFD700'} />
        </div>

        <div style={{
          fontSize: isMobile ? '1.05rem' : '1.15rem',
          fontWeight: 800, color: '#fff', lineHeight: 1.25,
          marginBottom: '0.45rem', paddingRight: 30,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
          marginBottom: '1.15rem',
        }}>
          {body}
        </div>

        <button
          onClick={handleOpen}
          style={{
            width: '100%', minHeight: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none', borderRadius: 10,
            color: '#000', fontWeight: 800, fontSize: '0.95rem',
            cursor: 'pointer', touchAction: 'manipulation',
            letterSpacing: '0.01em',
          }}
        >
          Vul check-in in <ArrowRight size={16} strokeWidth={2.6} />
        </button>

        <button
          onClick={handleSnooze}
          style={{
            width: '100%', minHeight: 40, marginTop: '0.55rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.45)', fontWeight: 600,
            fontSize: '0.78rem', cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <Clock size={13} /> Herinner me later
        </button>

        <style>{`
          @keyframes checkinPopFade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes checkinPopIn {
            from { opacity: 0; transform: scale(0.92); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
