// Sales-call presentatie voor "5 Uur Per Week Back In Shape".
//
// Context: deze pagina komt in beeld NA het pijn-/droom-gesprek, zodra
// de lead zegt "vertel me meer over je aanbod". Kersten praat erbij,
// dus geen video, geen pain-digging, geen CTA — alleen wat het aanbod
// concreet IS, slide voor slide.
//
// Bediening: Enter / ↓ = volgende, ↑ = vorige, F = fullscreen.

import React, { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Check } from 'lucide-react'
import {
  BRAND, OFFER_NAME,
  BEREIKT, AANPAK_INTRO, SYSTEMEN,
  GARANTIE, INVESTERING, AFSLUITING,
} from './content'

const GOLD = '#ffba09'
const GOLD_DIM = '#d4a849'
const BG = '#0a0a0a'
const SURFACE = '#101010'
const BORDER = 'rgba(255,255,255,0.06)'

function useIsMobile() {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const onR = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [])
  return m
}

// Slide wrapper — 100dvh snap-aligned. Content centreert verticaal.
function Slide({ children, isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: isMobile ? '3.5rem 1.25rem' : '4.5rem 3.5rem',
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{
        width: '100%', maxWidth: 1180, margin: '0 auto',
      }}>
        {children}
      </div>
    </section>
  )
}

function SectionLabel({ children, isMobile, center }) {
  return (
    <div style={{
      fontSize: isMobile ? '0.7rem' : '0.82rem',
      fontWeight: 900, letterSpacing: '0.26em',
      textTransform: 'uppercase', color: GOLD_DIM,
      marginBottom: isMobile ? '1rem' : '1.4rem',
      textAlign: center ? 'center' : 'left',
    }}>
      {children}
    </div>
  )
}

function H1Big({ children, isMobile, center }) {
  return (
    <h1 style={{
      margin: 0,
      fontSize: isMobile ? 'clamp(1.85rem, 7vw, 2.4rem)' : 'clamp(2.6rem, 4.5vw, 3.8rem)',
      fontWeight: 900,
      color: '#fff',
      letterSpacing: '-0.028em',
      lineHeight: 1.08,
      textAlign: center ? 'center' : 'left',
    }}>
      {children}
    </h1>
  )
}

// Systeem-slide — herbruikbaar voor alle 5. Tweekoloms-layout op desktop
// (titel/belofte links, deliverables rechts), gestapeld op mobiel.
// `highlight` markeert "grootste waarde" — Coach Naast Je krijgt een
// gold rand zodat 'ie er visueel uitspringt zonder dat het schreeuwt.
function SystemSlide({ s, isMobile }) {
  return (
    <Slide isMobile={isMobile}>
      <SectionLabel isMobile={isMobile}>
        Systeem {s.nr}{s.highlight ? ' · grootste waarde' : ''}
      </SectionLabel>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.05fr 1fr',
        gap: isMobile ? '1.6rem' : '3rem',
        alignItems: 'start',
      }}>
        {/* Links: titel + belofte */}
        <div>
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? 'clamp(1.55rem, 6.2vw, 2.05rem)' : 'clamp(2.2rem, 3.8vw, 3rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1.08,
          }}>
            {s.title}
          </h2>
          <p style={{
            margin: isMobile ? '1.2rem 0 0' : '1.6rem 0 0',
            fontSize: isMobile ? '1rem' : '1.22rem',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.55,
            fontWeight: 500,
          }}>
            {s.belofte}
          </p>
        </div>

        {/* Rechts: deliverables */}
        <div style={{
          padding: isMobile ? '1.2rem 1.2rem' : '1.7rem 1.8rem',
          background: SURFACE,
          border: s.highlight
            ? `1px solid ${GOLD}55`
            : `1px solid ${BORDER}`,
          borderRadius: 14,
          boxShadow: s.highlight
            ? `0 0 32px rgba(255,186,9,0.08)`
            : 'none',
        }}>
          <div style={{
            fontSize: isMobile ? '0.68rem' : '0.75rem',
            fontWeight: 900, letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: s.highlight ? GOLD : GOLD_DIM,
            marginBottom: isMobile ? '0.85rem' : '1.1rem',
          }}>
            Wat zit erin
          </div>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {s.deliverables.map((d, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
                padding: isMobile ? '0.55rem 0' : '0.7rem 0',
                borderBottom: i < s.deliverables.length - 1
                  ? `1px solid ${BORDER}` : 'none',
                fontSize: isMobile ? '0.92rem' : '1.04rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.45,
              }}>
                <Check
                  size={isMobile ? 15 : 17}
                  color={s.highlight ? GOLD : GOLD_DIM}
                  strokeWidth={2.5}
                  style={{ flexShrink: 0, marginTop: 3 }}
                />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Slide>
  )
}

const SECTION_COUNT = 8

export default function SalesCallVSLPage() {
  const isMobile = useIsMobile()
  const containerRef = useRef(null)
  const pageRef = useRef(null)
  const [current, setCurrent] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pageRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        const next = Math.min(current + 1, SECTION_COUNT - 1)
        setCurrent(next)
        containerRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth' })
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        const prev = Math.max(current - 1, 0)
        setCurrent(prev)
        containerRef.current?.children[prev]?.scrollIntoView({ behavior: 'smooth' })
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(container.children).indexOf(entry.target)
          if (idx >= 0) setCurrent(idx)
        }
      })
    }, { threshold: 0.55, root: container })
    Array.from(container.children).forEach(c => obs.observe(c))
    return () => obs.disconnect()
  }, [])

  const jumpTo = (i) => {
    setCurrent(i)
    containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={pageRef} style={{ background: BG, color: '#fff' }}>
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* 1 — Wat je hieraan overhoudt (anker terug naar zijn droom) */}
        <Slide isMobile={isMobile}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.4rem' : '2rem' }}>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.78rem',
              fontWeight: 900, letterSpacing: '0.26em',
              textTransform: 'uppercase', color: GOLD,
              marginBottom: isMobile ? '1rem' : '1.4rem',
            }}>
              {BRAND} · {OFFER_NAME}
            </div>
            <H1Big isMobile={isMobile} center>{BEREIKT.title}</H1Big>
          </div>
          <ul style={{
            margin: isMobile ? '1.5rem auto 0' : '2.2rem auto 0',
            maxWidth: 820, padding: 0, listStyle: 'none',
          }}>
            {BEREIKT.bullets.map((b, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.9rem',
                padding: isMobile ? '0.7rem 0' : '0.95rem 0',
                borderBottom: i < BEREIKT.bullets.length - 1 ? `1px solid ${BORDER}` : 'none',
                fontSize: isMobile ? '1rem' : '1.2rem',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.5,
              }}>
                <Check size={isMobile ? 18 : 22} color={GOLD} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 4 }} />
                {b}
              </li>
            ))}
          </ul>
        </Slide>

        {/* 2 — De aanpak (intro op de 5 systemen) */}
        <Slide isMobile={isMobile}>
          <div style={{ textAlign: 'center' }}>
            <SectionLabel isMobile={isMobile} center>{AANPAK_INTRO.title}</SectionLabel>
            <H1Big isMobile={isMobile} center>{AANPAK_INTRO.subtitle}</H1Big>
          </div>

          <div style={{
            marginTop: isMobile ? '2.5rem' : '4rem',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem',
            maxWidth: 1100, margin: isMobile ? '2.5rem auto 0' : '4rem auto 0',
          }}>
            {SYSTEMEN.map(s => (
              <div key={s.nr} style={{
                padding: isMobile ? '0.9rem 1rem' : '1.1rem 1rem',
                background: SURFACE,
                border: s.highlight
                  ? `1px solid ${GOLD}55`
                  : `1px solid ${BORDER}`,
                borderRadius: 10,
                textAlign: isMobile ? 'left' : 'center',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'stretch',
                gap: isMobile ? '0.75rem' : '0.4rem',
              }}>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.78rem',
                  fontWeight: 900, letterSpacing: '0.14em',
                  color: s.highlight ? GOLD : GOLD_DIM,
                  flexShrink: 0,
                }}>
                  {s.nr}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '0.92rem',
                  fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}>
                  {s.title}
                </div>
              </div>
            ))}
          </div>
        </Slide>

        {/* 3-7 — De 5 systemen, elk eigen slide */}
        {SYSTEMEN.map(s => (
          <SystemSlide key={s.nr} s={s} isMobile={isMobile} />
        ))}

        {/* 8 — Close: garantie + investering + volgende stap */}
        <Slide isMobile={isMobile}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
            gap: isMobile ? '1.8rem' : '3.5rem',
            alignItems: 'start',
          }}>
            {/* Links: garantie */}
            <div>
              <SectionLabel isMobile={isMobile}>{GARANTIE.title}</SectionLabel>
              <blockquote style={{
                margin: 0,
                padding: isMobile ? '1.3rem 1.3rem' : '1.7rem 1.8rem',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${GOLD}`,
                borderRadius: 12,
                fontSize: isMobile ? '0.98rem' : '1.12rem',
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.55,
                fontWeight: 500,
              }}>
                {GARANTIE.text}
              </blockquote>
            </div>

            {/* Rechts: investering + volgende stap */}
            <div>
              <SectionLabel isMobile={isMobile}>Investering</SectionLabel>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: '0.8rem', flexWrap: 'wrap',
              }}>
                <div style={{
                  fontSize: isMobile ? 'clamp(2.5rem, 11vw, 3.5rem)' : 'clamp(3.5rem, 6vw, 5rem)',
                  fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.04em', lineHeight: 1,
                }}>
                  {INVESTERING.prijs}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.95rem' : '1.1rem',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                }}>
                  voor {INVESTERING.duur}
                </div>
              </div>
              <div style={{
                marginTop: '0.6rem',
                fontSize: isMobile ? '0.86rem' : '0.95rem',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}>
                {INVESTERING.detail}
              </div>

              {/* Volgende stap */}
              <div style={{
                marginTop: isMobile ? '2rem' : '2.6rem',
                padding: isMobile ? '1.1rem 1.1rem' : '1.4rem 1.5rem',
                background: 'rgba(255,186,9,0.06)',
                border: `1px solid ${GOLD}33`,
                borderRadius: 12,
              }}>
                <div style={{
                  fontSize: isMobile ? '0.7rem' : '0.78rem',
                  fontWeight: 900, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: GOLD,
                  marginBottom: '0.5rem',
                }}>
                  {AFSLUITING.title}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.92rem' : '1.02rem',
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}>
                  {AFSLUITING.text}
                </div>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Fullscreen knop */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Verlaat fullscreen (F)' : 'Fullscreen (F)'}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 100,
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.78)'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.55)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
        }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Sectie-counter */}
      <div style={{
        position: 'fixed', top: 18, right: 20, zIndex: 100,
        fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)',
        fontWeight: 700, letterSpacing: '0.08em',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        padding: '0.4rem 0.65rem', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {String(current + 1).padStart(2, '0')} / {String(SECTION_COUNT).padStart(2, '0')}
      </div>

      {/* Navigatie-dots */}
      <div style={{
        position: 'fixed', right: isMobile ? 10 : 22, top: '50%',
        transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column',
        gap: 10, zIndex: 100,
      }}>
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => jumpTo(i)}
            aria-label={`Ga naar slide ${i + 1}`}
            style={{
              width: current === i ? 10 : 6,
              height: current === i ? 10 : 6,
              borderRadius: '50%',
              background: current === i ? GOLD : 'rgba(255,255,255,0.3)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: current === i ? `0 0 10px ${GOLD}80` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}
