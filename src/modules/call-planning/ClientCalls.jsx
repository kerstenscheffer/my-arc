// src/modules/call-planning/ClientCalls.jsx
//
// Een call plannen met je coach. Twee soorten, want dat is de vraag die je
// jezelf stelt voor je een moment kiest: even bijsturen, of ergens echt
// doorheen? Die keuze staat hier vóór de agenda, niet erin verstopt.
//
// Elke soort is zijn eigen Calendly-event; de duur staat daar vast. Zet je hier
// een andere tijd neer dan in Calendly, dan wint Calendly en klopt deze pagina
// niet meer — dus de tekst hier is de omschrijving, de link is de waarheid.

import useIsMobile from '../../hooks/useIsMobile'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, X, ExternalLink, Clock, Video, ArrowRight, Zap, MessageSquare } from 'lucide-react'

const LIJN = 'rgba(255,255,255,0.08)'
const LIJN_ZACHT = 'rgba(255,255,255,0.05)'

const SOORTEN = [
  {
    id: 'kort',
    titel: 'Korte call',
    duur: '30 min',
    omschrijving: 'Snelle check-in + bijsturing',
    Icoon: Zap,
    link: 'https://calendly.com/kerstenscheffer/60m-check-in-call-clone',
  },
  {
    id: 'lang',
    titel: 'Lange call',
    duur: '60 min',
    omschrijving: 'Diepere check-in + problemen oplossen',
    Icoon: MessageSquare,
    link: 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call',
  },
]

export default function ClientCalls({ clientInfo }) {
  const [boeking, setBoeking] = useState(null)   // { soort, url }
  const isMobile = useIsMobile()

  // De pagina eronder mag niet meescrollen zolang de agenda openstaat.
  useEffect(() => {
    if (!boeking) return
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
      const bewaard = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (isMobile) {
        document.documentElement.style.overflow = ''
        document.documentElement.style.height = ''
      }
      window.scrollTo(0, parseInt(bewaard || '0') * -1)
    }
  }, [boeking, isMobile])

  useEffect(() => {
    const opToets = (e) => { if (e.key === 'Escape') setBoeking(null) }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [])

  const open = (soort) => {
    const email = encodeURIComponent(clientInfo?.email || '')
    const naam = encodeURIComponent(`${clientInfo?.first_name || ''} ${clientInfo?.last_name || ''}`.trim())
    const sep = soort.link.includes('?') ? '&' : '?'
    const url = `${soort.link}${sep}hide_landing_page_details=1&hide_gdpr_banner=1`
      + `&background_color=0a0a0a&text_color=ffffff&primary_color=ffffff`
      + `&email=${email}&name=${naam}`
    setBoeking({ soort, url })
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      <div style={{ padding: isMobile ? '0.75rem 0 1rem' : '1rem 0 1.25rem' }}>
        <h1 style={{
          fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 900, color: '#fff',
          margin: 0, letterSpacing: '-0.03em',
        }}>
          Coaching calls
        </h1>
        <p style={{
          fontSize: isMobile ? '0.74rem' : '0.8rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.35)', margin: '0.3rem 0 0',
        }}>
          Waar heb je nu wat aan?
        </p>
      </div>

      {/* Twee soorten naast elkaar op een breed scherm, onder elkaar op een
          telefoon. Even zwaar in beeld: het is een keuze, geen aanbeveling. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 10 : 12,
      }}>
        {SOORTEN.map(soort => (
          <SoortKaart key={soort.id} soort={soort} isMobile={isMobile} onKies={() => open(soort)} />
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: isMobile ? '0.9rem' : '1.1rem',
        padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 1rem',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${LIJN_ZACHT}`,
        borderRadius: 12,
      }}>
        <Video size={14} color="rgba(255,255,255,0.4)" strokeWidth={2.4} style={{ flexShrink: 0 }} />
        <span style={{
          fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.35)', lineHeight: 1.45,
        }}>
          Kies een moment dat jou uitkomt. Na het inplannen krijg je automatisch een Zoom-link via e-mail.
        </span>
      </div>

      {boeking && createPortal(
        <div
          onClick={() => setBoeking(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: isMobile
                ? 'calc(env(safe-area-inset-top, 0px) + 0.75rem) 1rem 0.75rem'
                : '1rem 1.5rem',
              borderBottom: `1px solid ${LIJN}`, flexShrink: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {boeking.soort.duur} · {boeking.soort.omschrijving}
              </div>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#fff',
                letterSpacing: '-0.02em', marginTop: 2,
              }}>
                {boeking.soort.titel}
              </div>
            </div>
            <button
              onClick={() => setBoeking(null)}
              aria-label="Sluiten"
              style={{
                width: 38, height: 38, flexShrink: 0, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${LIJN}`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>

          <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, overflow: 'hidden' }}>
            <iframe
              src={boeking.url}
              style={{ width: '100%', height: '100%', border: 'none', background: '#0a0a0a' }}
              title="Calendly"
              loading="lazy"
            />
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: isMobile
                ? '0.6rem 1rem calc(env(safe-area-inset-bottom, 0px) + 0.6rem)'
                : '0.75rem 1.5rem',
              borderTop: `1px solid ${LIJN_ZACHT}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <a
              href={boeking.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 800,
                textDecoration: 'none',
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

function SoortKaart({ soort, isMobile, onKies }) {
  const { Icoon } = soort
  return (
    <button
      onClick={onKies}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left',
        padding: isMobile ? '0.9rem 1rem' : '1.1rem 1.15rem',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${LIJN}`,
        borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.18s ease, border-color 0.18s ease',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.borderColor = LIJN
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icoon size={15} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
        <span style={{
          flex: 1, fontSize: isMobile ? '1rem' : '1.05rem', fontWeight: 900,
          color: '#fff', letterSpacing: '-0.02em',
        }}>
          {soort.titel}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '0.2rem 0.5rem', borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          fontSize: '0.64rem', fontWeight: 900, color: '#fff',
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          <Clock size={10} strokeWidth={3} />
          {soort.duur}
        </span>
      </div>

      <p style={{
        margin: '0.5rem 0 0.9rem',
        fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.45)', lineHeight: 1.45,
      }}>
        {soort.omschrijving}
      </p>

      <span style={{
        marginTop: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        minHeight: 44, borderRadius: 12,
        background: '#fff', color: '#0a0a0a',
        fontSize: '0.82rem', fontWeight: 900, letterSpacing: '-0.01em',
      }}>
        <Calendar size={14} strokeWidth={3} />
        Inplannen
        <ArrowRight size={14} strokeWidth={3} />
      </span>
    </button>
  )
}
