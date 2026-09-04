// src/client/components/CheckinReminderBanner.jsx
// Sticky gold banner that nudges the client to fill in the weekly check-in.
// Hides automatically when:
//   - this week's check-in is already submitted
//   - the user snoozed for 24h (localStorage)
// Reappears every day until filled (intentionally persistent).

import React, { useEffect, useState } from 'react'
import { ClipboardCheck, X, ArrowRight } from 'lucide-react'
import CheckinService from '../../modules/client-checkin/CheckinService'
import { trajectLoopt } from '../../modules/client-checkin/trajectStatus'

// De coachnaam staat nergens als kolom: coach_team_members heeft alleen een
// id en auth.users is voor de client niet leesbaar. Daarom hier een kleine
// tabel op coach-id. Valt terug op "Je coach" zodra er een coach bijkomt die
// hier niet in staat — beter een neutrale zin dan een verkeerde naam.
const COACH_NAAM = {
  '5a0135ac-3188-499d-8682-ed6a179e5541': 'Kersten',
  '1ac7dbd8-1a8d-459c-8a81-62d22af5fa3b': 'Marcel',
}
const coachNaam = (client) =>
  COACH_NAAM[client?.trainer_id] || COACH_NAAM[client?.coach_id] || 'Je coach'

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
        // Nog niet begonnen, gepauzeerd of afgerond? Dan is er niets te laat.
        // Zonder deze regel kreeg iedereen met alleen een account elke week
        // te horen dat zijn check-in ontbrak.
        if (!trajectLoopt(client)) {
          if (!cancelled) setShow(false)
          return
        }
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
  }, [client, db])

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
        padding: isMobile ? '0.8rem 0.875rem' : '0.95rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.07)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.16)',
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
        background: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ClipboardCheck size={isMobile ? 16 : 18} color="#ffffff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.82rem' : '0.9rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}>
          {coachNaam(client)} wacht op je check-in!
        </div>
        {/* De actie is het grootst: dat is waar de klant op moet tikken. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: isMobile ? '1.15rem' : '1.35rem',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginTop: '0.1rem',
        }}>
          Vul direct in <ArrowRight size={isMobile ? 18 : 21} strokeWidth={2.8} />
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
          color: 'rgba(255, 255, 255, 0.5)',
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
