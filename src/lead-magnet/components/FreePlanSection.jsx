// ========================================
// 📁 src/lead-magnet/components/FreePlanSection.jsx
// CTA section — push gratis plan met coach foto
// ========================================
import { useState, useEffect, useRef } from 'react'
import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react'

const G = '#ffba09'
const GD = '#e8a800'

const BULLETS = [
  'Ontdek welk type eter jij bent',
  'Ontvang een persoonlijk 5-stappen plan',
  'Direct toepasbare tips voor jouw situatie'
]

export default function FreePlanSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true)
    }, { threshold: 0.1 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])

  return (
    <section ref={ref} style={{
      background: '#fff',
      padding: isMobile ? '0' : '0 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto'
      }}>
        {/* Photo — full width, no border radius on mobile */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: isMobile ? '0' : '16px 16px 0 0'
        }}>
          <img
            src="/coach-result.png"
            alt="Coach Kersten"
            style={{
              width: '100%',
              height: isMobile ? '360px' : '420px',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block'
            }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {/* Gradient overlay bottom */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)',
            pointerEvents: 'none'
          }} />

          {/* Badge on photo */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '16px' : '20px',
            left: isMobile ? '16px' : '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: `1px solid ${G}40`,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s ease 0.2s'
          }}>
            <BookOpen size={13} color={G} strokeWidth={2.5} />
            <span style={{
              fontSize: '0.6rem',
              fontWeight: '800',
              color: G,
              letterSpacing: '0.1em'
            }}>100% GRATIS</span>
          </div>

          {/* Text overlay on photo */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '16px' : '24px',
            left: isMobile ? '16px' : '24px',
            right: isMobile ? '16px' : '24px',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.6s ease 0.3s'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.4rem' : '1.8rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1.15,
              margin: 0
            }}>
              Jouw persoonlijke<br />
              <span style={{ color: G }}>vetverlies plan</span>
            </h2>
          </div>
        </div>

        {/* Content block */}
        <div style={{
          background: '#fff',
          borderRadius: isMobile ? '0' : '0 0 16px 16px',
          padding: isMobile ? '1.5rem 1.25rem 2rem' : '2rem 2rem 2.5rem',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.4s'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem',
            color: 'rgba(0,0,0,0.55)',
            fontWeight: '500',
            lineHeight: 1.6,
            margin: '0 0 1.25rem'
          }}>
            Doe de gratis quiz, ontdek jouw eettype en ontvang een plan dat werkt voor jouw situatie. Geen crash diëten, geen generieke schema's.
          </p>

          {/* Bullet points */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            marginBottom: '1.5rem'
          }}>
            {BULLETS.map((b, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <CheckCircle
                  size={16}
                  color={G}
                  strokeWidth={2.5}
                  style={{ flexShrink: 0 }}
                />
                <span style={{
                  fontSize: isMobile ? '0.82rem' : '0.88rem',
                  color: 'rgba(0,0,0,0.7)',
                  fontWeight: '600'
                }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <a
            href="/ontdek-jouw-route"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: isMobile ? '1rem' : '1.1rem',
              background: G,
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontSize: isMobile ? '0.92rem' : '0.95rem',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: `0 6px 24px ${G}40`,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Doe de gratis quiz
            <ArrowRight size={16} strokeWidth={2.5} />
          </a>

          <p style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            color: 'rgba(0,0,0,0.3)',
            fontWeight: '500',
            marginTop: '0.75rem'
          }}>Duurt maar 2 minuten · 100% gratis</p>
        </div>
      </div>
    </section>
  )
}
