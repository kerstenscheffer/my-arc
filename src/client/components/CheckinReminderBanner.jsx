// src/client/components/CheckinReminderBanner.jsx
// Sticky gold banner that nudges the client to fill in the weekly check-in.
// Hides automatically when:
//   - this week's check-in is already submitted
//   - the user snoozed for 24h (localStorage)
// Reappears every day until filled (intentionally persistent).

import React, { useEffect, useState } from 'react'
import { ClipboardCheck, X } from 'lucide-react'
import CheckinService from '../../modules/client-checkin/CheckinService'

const SNOOZE_KEY = 'myarc_checkin_snooze_until'
const SNOOZE_HOURS = 24

const isSnoozed = () => {
  try {
    const v = localStorage.getItem(SNOOZE_KEY)
    if (!v) return false
    return new Date(v).getTime() > Date.now()
  } catch {
    return false
  }
}

const setSnooze = () => {
  const until = new Date(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000).toISOString()
  try { localStorage.setItem(SNOOZE_KEY, until) } catch { /* ignore */ }
}

export default function CheckinReminderBanner({ client, db, onOpen, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    const check = async () => {
      try {
        if (isSnoozed()) {
          if (!cancelled) setShow(false)
          return
        }
        // CheckinService expects the DatabaseService wrapper, not the raw
        // supabase client — it reads .supabase off it internally.
        const service = new CheckinService(db)
        // Vrijdag-cyclus: reset elke vrijdag (zelfde logica als de form + popup).
        const filled = await service.hasCheckinSinceLastFriday(client.id)
        if (!cancelled) setShow(!filled)
      } catch {
        // Silently hide on error — better than yelling at the client.
        if (!cancelled) setShow(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [client?.id, db])

  if (loading || !show) return null

  const handleSnooze = (e) => {
    e.stopPropagation()
    setSnooze()
    setShow(false)
  }

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.25rem',
        background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.18) 0%, rgba(212, 175, 55, 0.12) 100%)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.35)',
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        backdropFilter: 'blur(8px)',
        animation: 'checkinBannerIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div style={{
        width: isMobile ? '32px' : '36px',
        height: isMobile ? '32px' : '36px',
        borderRadius: '8px',
        background: 'rgba(255, 215, 0, 0.25)',
        border: '1px solid rgba(255, 215, 0, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ClipboardCheck size={isMobile ? 16 : 18} color="#FFD700" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: 800,
          color: 'rgba(255, 215, 0, 0.85)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          lineHeight: 1,
          marginBottom: '0.2rem',
        }}>
          Wekelijkse check-in
        </div>
        <div style={{
          fontSize: isMobile ? '0.78rem' : '0.85rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          Vul je reflectie in →
        </div>
      </div>

      <button
        onClick={handleSnooze}
        title="24u uitstellen"
        aria-label="24 uur uitstellen"
        style={{
          width: '28px',
          height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 215, 0, 0.5)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes checkinBannerIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
