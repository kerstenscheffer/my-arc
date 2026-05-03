// src/pages/myarcinfo/components/Reviews.jsx
import { useRef, useEffect } from 'react'
import { GOLD, BORDER, MUTED, REVIEWS } from '../constants'

function Stars() {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={GOLD} stroke="none"/>
        </svg>
      ))}
    </div>
  )
}

export default function Reviews() {
  const isMobile = window.innerWidth <= 768
  const scrollRef = useRef(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId, pos = 0
    const speed = 0.5

    const animate = () => {
      if (!pausedRef.current) {
        pos += speed
        if (pos >= el.scrollWidth / 2) pos = 0
        el.scrollLeft = pos
      }
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    const pause = () => { pausedRef.current = true }
    const resume = () => { pausedRef.current = false }

    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', () => setTimeout(resume, 1000))

    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
    }
  }, [])

  const doubled = [...REVIEWS, ...REVIEWS]

  return (
    <section style={{
      padding: isMobile ? '4rem 0' : '5rem 0',
      borderBottom: `1px solid ${BORDER}`
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '0 1.5rem', marginBottom: isMobile ? '2.5rem' : '3rem' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: GOLD, marginBottom: '1rem'
        }}>
          WAT KLANTEN ZEGGEN
        </div>
        <h2 style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          textTransform: 'uppercase', lineHeight: 1,
          marginBottom: '1rem'
        }}>
          ECHTE RESULTATEN
        </h2>

        {/* Trustpilot row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#00B67A" stroke="none"/>
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: MUTED, fontWeight: '600' }}>
            4.8 · Beoordeeld op Trustpilot
          </span>
        </div>
      </div>

      {/* Scroll strip */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '1rem',
          overflow: 'hidden',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          cursor: 'grab'
        }}
      >
        {doubled.map((r, i) => (
          <div key={i} style={{
            minWidth: isMobile ? '260px' : '300px',
            maxWidth: isMobile ? '260px' : '300px',
            border: `1px solid ${BORDER}`,
            padding: isMobile ? '1.25rem' : '1.5rem',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)'
          }}>
            <Stars />
            <p style={{
              fontSize: '0.78rem',
              color: MUTED,
              lineHeight: 1.65,
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {r.text}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '30px', height: '30px',
                background: 'rgba(255,184,0,0.1)',
                border: '1px solid rgba(255,184,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: '800', color: GOLD, flexShrink: 0
              }}>
                {r.initial}
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>
                {r.name}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                {r.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
