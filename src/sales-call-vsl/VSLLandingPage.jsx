// Publieke VSL-landing voor "5 Uur Per Week Back In Shape Systeem".
// Bedoeld voor Instagram link in bio — koud bezoek dat de video bekijkt
// en een call plant. Mobile-first, klassiek scroll, premium-rustig.

import React, { useEffect, useState } from 'react'
import { ArrowRight, Check, Calendar } from 'lucide-react'
import {
  BRAND, OFFER_NAME, TAGLINE, VSL_VIDEO, CALENDLY_URL,
  VOOR_WIE, BEREIKT, SYSTEMEN, GARANTIE, INVESTERING, AFSLUITING,
} from './content'
import VSLPlayer from './VSLPlayer'

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

function CTAButton({ isMobile, label = 'Plan een call' }) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.55rem',
        padding: isMobile ? '0.95rem 1.4rem' : '1.05rem 1.8rem',
        background: GOLD,
        color: '#000',
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: 800,
        letterSpacing: '-0.005em',
        borderRadius: 12,
        textDecoration: 'none',
        boxShadow: '0 12px 36px rgba(255,186,9,0.25)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 16px 44px rgba(255,186,9,0.32)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(255,186,9,0.25)'
      }}
    >
      <Calendar size={isMobile ? 16 : 18} />
      {label}
      <ArrowRight size={isMobile ? 16 : 18} />
    </a>
  )
}

function SectionWrap({ children, isMobile, maxWidth = 900, paddingY }) {
  return (
    <section style={{
      padding: `${paddingY ?? (isMobile ? '3.5rem' : '5rem')} ${isMobile ? '1.25rem' : '2rem'}`,
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

function SectionLabel({ children, isMobile }) {
  return (
    <div style={{
      fontSize: isMobile ? '0.65rem' : '0.72rem',
      fontWeight: 800,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: GOLD_DIM,
      marginBottom: isMobile ? '0.9rem' : '1.1rem',
    }}>
      {children}
    </div>
  )
}

function H2({ children, isMobile }) {
  return (
    <h2 style={{
      margin: 0,
      fontSize: isMobile ? 'clamp(1.55rem, 6vw, 2rem)' : 'clamp(2rem, 3.3vw, 2.65rem)',
      fontWeight: 900,
      color: '#fff',
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
    }}>
      {children}
    </h2>
  )
}

export default function VSLLandingPage() {
  const isMobile = useIsMobile()

  return (
    <div style={{
      background: BG, color: '#fff',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      minHeight: '100vh',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ═══ HERO ═══ */}
      <section style={{
        padding: isMobile ? '3rem 1.25rem 2.25rem' : '5rem 2rem 3rem',
        borderBottom: `1px solid ${BORDER}`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{
            fontSize: isMobile ? '0.65rem' : '0.75rem',
            fontWeight: 900, letterSpacing: '0.24em', textTransform: 'uppercase',
            color: GOLD, marginBottom: isMobile ? '1.1rem' : '1.5rem',
          }}>
            {BRAND}
          </div>

          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 'clamp(1.85rem, 7vw, 2.4rem)' : 'clamp(2.6rem, 4.3vw, 3.6rem)',
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.07,
            color: '#fff',
          }}>
            {OFFER_NAME}
          </h1>

          <p style={{
            margin: isMobile ? '1.1rem auto 0' : '1.6rem auto 0',
            maxWidth: 720,
            fontSize: isMobile ? '0.92rem' : '1.05rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.55,
            fontWeight: 500,
          }}>
            {TAGLINE}
          </p>

          <div style={{ marginTop: isMobile ? '1.6rem' : '2.2rem' }}>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.78rem',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              Bekijk de video hieronder ↓
            </span>
          </div>
        </div>
      </section>

      {/* ═══ VIDEO ═══ */}
      <section style={{
        padding: isMobile ? '2.5rem 1rem' : '3.5rem 2rem',
        borderBottom: `1px solid ${BORDER}`,
        background:
          'radial-gradient(circle at 50% 0%, rgba(255,186,9,0.04) 0%, transparent 60%)',
      }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <VSLPlayer video={VSL_VIDEO} isMobile={isMobile} />
          <div style={{ textAlign: 'center', marginTop: isMobile ? '1.6rem' : '2rem' }}>
            <CTAButton isMobile={isMobile} label="Plan een call" />
            <div style={{
              marginTop: '0.7rem',
              fontSize: isMobile ? '0.7rem' : '0.78rem',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 500,
            }}>
              Vrijblijvend — we kijken samen of dit bij jou past.
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VOOR WIE ═══ */}
      <SectionWrap isMobile={isMobile}>
        <SectionLabel isMobile={isMobile}>Voor wie</SectionLabel>
        <H2 isMobile={isMobile}>{VOOR_WIE.title}</H2>
        <ul style={{
          marginTop: isMobile ? '1.5rem' : '2rem',
          padding: 0, listStyle: 'none',
        }}>
          {VOOR_WIE.bullets.map((b, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
              padding: isMobile ? '0.7rem 0' : '0.85rem 0',
              borderBottom: i < VOOR_WIE.bullets.length - 1 ? `1px solid ${BORDER}` : 'none',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
            }}>
              <span style={{
                color: GOLD_DIM, fontWeight: 800,
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                lineHeight: 1.7, flexShrink: 0,
              }}>—</span>
              {b}
            </li>
          ))}
        </ul>
      </SectionWrap>

      {/* ═══ WAT JE BEREIKT ═══ */}
      <SectionWrap isMobile={isMobile}>
        <SectionLabel isMobile={isMobile}>Resultaat</SectionLabel>
        <H2 isMobile={isMobile}>{BEREIKT.title}</H2>
        <ul style={{
          marginTop: isMobile ? '1.5rem' : '2rem',
          padding: 0, listStyle: 'none',
        }}>
          {BEREIKT.bullets.map((b, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
              padding: isMobile ? '0.7rem 0' : '0.85rem 0',
              borderBottom: i < BEREIKT.bullets.length - 1 ? `1px solid ${BORDER}` : 'none',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
            }}>
              <Check size={isMobile ? 16 : 18} color={GOLD} style={{ flexShrink: 0, marginTop: 3 }} />
              {b}
            </li>
          ))}
        </ul>
      </SectionWrap>

      {/* ═══ 5 SYSTEMEN ═══ */}
      <SectionWrap isMobile={isMobile} maxWidth={1000}>
        <SectionLabel isMobile={isMobile}>De aanpak</SectionLabel>
        <H2 isMobile={isMobile}>De 5 systemen</H2>
        <div style={{
          marginTop: isMobile ? '1.8rem' : '2.5rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.25rem',
        }}>
          {SYSTEMEN.map(s => (
            <div key={s.nr} style={{
              padding: isMobile ? '1.2rem 1.15rem' : '1.6rem 1.6rem',
              background: SURFACE,
              border: s.highlight ? `1px solid ${GOLD}55` : `1px solid ${BORDER}`,
              borderRadius: 12,
              boxShadow: s.highlight ? `0 0 28px rgba(255,186,9,0.07)` : 'none',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                marginBottom: '0.65rem',
              }}>
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.78rem',
                  fontWeight: 900, letterSpacing: '0.12em',
                  color: s.highlight ? GOLD : GOLD_DIM,
                }}>
                  {s.nr}
                </span>
                {s.highlight && (
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.16em',
                    textTransform: 'uppercase', color: GOLD,
                    padding: '0.18rem 0.45rem',
                    background: 'rgba(255,186,9,0.1)',
                    border: `1px solid ${GOLD}40`,
                    borderRadius: 4,
                  }}>
                    Grootste waarde
                  </span>
                )}
              </div>
              <div style={{
                fontSize: isMobile ? '1.08rem' : '1.22rem',
                fontWeight: 800, color: '#fff',
                letterSpacing: '-0.015em',
                marginBottom: '0.6rem',
                lineHeight: 1.2,
              }}>
                {s.title}
              </div>
              <div style={{
                fontSize: isMobile ? '0.88rem' : '0.95rem',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.5,
                marginBottom: '0.95rem',
              }}>
                {s.belofte}
              </div>
              <ul style={{
                padding: 0, margin: 0, listStyle: 'none',
                borderTop: `1px solid ${BORDER}`,
                paddingTop: '0.7rem',
              }}>
                {s.deliverables.map((d, i) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.55rem',
                    padding: '0.35rem 0',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    color: 'rgba(255,255,255,0.78)',
                    lineHeight: 1.4,
                  }}>
                    <Check size={13} color={s.highlight ? GOLD : GOLD_DIM} style={{ flexShrink: 0, marginTop: 3 }} />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionWrap>

      {/* ═══ GARANTIE ═══ */}
      <SectionWrap isMobile={isMobile} maxWidth={780}>
        <SectionLabel isMobile={isMobile}>Garantie</SectionLabel>
        <H2 isMobile={isMobile}>{GARANTIE.title}</H2>
        <blockquote style={{
          margin: isMobile ? '1.5rem 0 0' : '2rem 0 0',
          padding: isMobile ? '1.3rem 1.2rem' : '1.8rem 1.8rem',
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderLeft: `3px solid ${GOLD}`,
          borderRadius: 10,
          fontSize: isMobile ? '1rem' : '1.12rem',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.55,
          fontWeight: 500,
          fontStyle: 'normal',
        }}>
          {GARANTIE.text}
        </blockquote>
      </SectionWrap>

      {/* ═══ INVESTERING ═══ */}
      <SectionWrap isMobile={isMobile} maxWidth={700}>
        <SectionLabel isMobile={isMobile}>Investering</SectionLabel>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'baseline',
          gap: isMobile ? '0.4rem' : '1rem',
          marginTop: isMobile ? '1rem' : '1.5rem',
        }}>
          <div style={{
            fontSize: isMobile ? 'clamp(2.5rem, 11vw, 3.5rem)' : 'clamp(3.5rem, 6vw, 5rem)',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.035em', lineHeight: 1,
          }}>
            {INVESTERING.prijs}
          </div>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 600,
            paddingBottom: isMobile ? 0 : '0.5rem',
          }}>
            voor {INVESTERING.duur}
          </div>
        </div>
        <div style={{
          marginTop: '1rem',
          fontSize: isMobile ? '0.88rem' : '0.95rem',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.5,
        }}>
          {INVESTERING.detail}
        </div>
      </SectionWrap>

      {/* ═══ AFSLUITING + GROTE CTA ═══ */}
      <section style={{
        padding: isMobile ? '4rem 1.25rem 5rem' : '6rem 2rem 7rem',
        textAlign: 'center',
        background:
          'radial-gradient(circle at 50% 100%, rgba(255,186,9,0.06) 0%, transparent 65%)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <H2 isMobile={isMobile}>{AFSLUITING.title}</H2>
          <p style={{
            margin: isMobile ? '1.1rem auto 0' : '1.4rem auto 0',
            maxWidth: 560,
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.55,
          }}>
            {AFSLUITING.text}
          </p>
          <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
            <CTAButton isMobile={isMobile} label="Plan een call" />
          </div>
        </div>
      </section>

      {/* Footer-strookje */}
      <div style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        © {new Date().getFullYear()} {BRAND}
      </div>
    </div>
  )
}
