// src/modules/call-planning/ClientCalls.jsx
// v6.0 - Blue theme, full visual treatment, single booking action
// No call flow/journey — just a clean styled page to book a call with Kersten

import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ExternalLink, Phone, Clock, Video, ArrowRight } from 'lucide-react'

const BLUE = {
  primary: '#3b82f6',
  dark: '#2563eb',
  light: '#60a5fa',
  border: 'rgba(59, 130, 246, 0.15)',
  borderActive: 'rgba(59, 130, 246, 0.3)',
  bg: 'rgba(59, 130, 246, 0.06)',
  glow: 'rgba(59, 130, 246, 0.2)'
}

const CALENDLY_LINK = 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call'

export default function ClientCalls({ db, clientInfo }) {
  const [showBooking, setShowBooking] = useState(false)
  const [bookingUrl, setBookingUrl] = useState('')
  const isMobile = useIsMobile()

  // ─── Body scroll lock ───
  useEffect(() => {
    if (!showBooking) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    if (isMobile) {
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.height = '100%'
    }
    return () => {
      const saved = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (isMobile) {
        document.documentElement.style.overflow = ''
        document.documentElement.style.height = ''
      }
      window.scrollTo(0, parseInt(saved || '0') * -1)
    }
  }, [showBooking, isMobile])

  // ─── Build Calendly URL ───
  const openBooking = () => {
    const email = encodeURIComponent(clientInfo?.email || '')
    const name = encodeURIComponent(`${clientInfo?.first_name || ''} ${clientInfo?.last_name || ''}`.trim())
    const sep = CALENDLY_LINK.includes('?') ? '&' : '?'
    const url = `${CALENDLY_LINK}${sep}hide_landing_page_details=1&hide_gdpr_banner=1&background_color=1a1a1a&text_color=ffffff&primary_color=3b82f6&email=${email}&name=${name}`
    setBookingUrl(url)
    setShowBooking(true)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        padding: isMobile ? '0.75rem 0' : '1rem 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '800',
          color: '#fff',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Coaching Calls
        </h1>
        <p style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          color: 'rgba(255, 255, 255, 0.25)',
          margin: '0.15rem 0 0 0',
          fontWeight: '600'
        }}>
          Plan een call in met je coach
        </p>
      </div>

      {/* PageVideoWidget gemigreerd naar centrale WidgetSidebar in ClientDashboard. */}

      {/* ═══ CALL BOOKING CARD ═══ */}
      <div style={{
        marginTop: isMobile ? '0.25rem' : '0.5rem',
        background: '#0a0a0a',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: isMobile ? '10px' : '12px',
        overflow: 'hidden',
        transform: 'translateZ(0)'
      }}>
        {/* Top accent line */}
        <div style={{
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, ${BLUE.primary} 50%, transparent 100%)`,
          opacity: 0.4
        }} />

        {/* Card header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{
            width: isMobile ? '30px' : '34px',
            height: isMobile ? '30px' : '34px',
            borderRadius: '8px',
            background: BLUE.bg,
            border: `1px solid ${BLUE.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: isMobile ? '0.6rem' : '0.75rem',
            flexShrink: 0
          }}>
            <Phone size={isMobile ? 14 : 16} color={BLUE.primary} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              Plan een coaching call met Kersten
            </div>
          </div>
        </div>

        {/* Info rows — flush stat bar style */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <InfoCol
            icon={<Clock size={12} color={BLUE.light} />}
            label="DUUR"
            value="30 min"
            isMobile={isMobile}
            borderRight
          />
          <InfoCol
            icon={<Video size={12} color={BLUE.light} />}
            label="LOCATIE"
            value="Zoom"
            isMobile={isMobile}
            borderRight
          />
          <InfoCol
            icon={<Calendar size={12} color={BLUE.light} />}
            label="WANNEER"
            value="Jij kiest"
            isMobile={isMobile}
          />
        </div>

        {/* Description */}
        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.72rem' : '0.78rem',
            color: 'rgba(255, 255, 255, 0.35)',
            margin: 0,
            lineHeight: 1.5,
            fontWeight: '500'
          }}>
            Kies een moment dat jou uitkomt. Na het inplannen ontvang je automatisch een Zoom link via e-mail.
          </p>
        </div>

        {/* CTA button row */}
        <div style={{
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem'
        }}>
          <button
            onClick={openBooking}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: BLUE.primary,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '800',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '48px',
              transition: 'all 0.2s ease',
              transform: 'translateZ(0)'
            }}
            onTouchStart={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(0.98)' }}
            onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.transform = 'scale(1)' }}
          >
            <Calendar size={16} strokeWidth={2.5} />
            Call Inplannen
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ═══ BOOKING MODAL — Calendly embed via createPortal ═══ */}
      {showBooking && createPortal(
        <div
          onClick={() => setShowBooking(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Header */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              borderBottom: `1px solid ${BLUE.border}`,
              flexShrink: 0
            }}
          >
            <div>
              <div style={{
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                fontWeight: '700', color: BLUE.primary,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: '0.1rem'
              }}>Call inplannen</div>
              <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: '#fff' }}>
                Coaching Call met Kersten
              </div>
            </div>
            <button
              onClick={() => setShowBooking(false)}
              style={{
                width: '36px', height: '36px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '44px', minWidth: '44px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Calendly iframe — dark bg, email prefilled */}
          <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, overflow: 'hidden' }}>
            <iframe
              src={bookingUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#1a1a1a' }}
              title="Calendly Scheduling"
              loading="lazy"
            />
          </div>

          {/* Fallback link */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: 'rgba(255, 255, 255, 0.25)',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: '600', textDecoration: 'none'
              }}
            >
              <ExternalLink size={12} />
              Openen in nieuw venster
            </a>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}


// ─── INFO COLUMN (flush stat bar) ───
function InfoCol({ icon, label, value, isMobile, borderRight }) {
  return (
    <div style={{
      flex: 1,
      padding: isMobile ? '0.5rem 0.6rem' : '0.6rem 0.75rem',
      borderRight: borderRight ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.2rem'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem'
      }}>
        {icon}
        <span style={{
          fontSize: isMobile ? '0.4rem' : '0.45rem',
          fontWeight: '700',
          color: 'rgba(255, 255, 255, 0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: isMobile ? '0.8rem' : '0.88rem',
        fontWeight: '800',
        color: '#fff',
        letterSpacing: '-0.01em'
      }}>
        {value}
      </div>
    </div>
  )
}
