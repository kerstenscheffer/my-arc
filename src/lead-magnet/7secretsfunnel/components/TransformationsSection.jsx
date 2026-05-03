// ========================================
// 📁 src/lead-magnet/components/TransformationsSection.jsx
// Premium dark style with photos
// ========================================
import { useState, useEffect, useRef } from 'react'
import { Star } from 'lucide-react'

const G = '#ffba09'

const TRANSFORMATIONS = [
  {
    name: 'Consumer',
    result: 'Arm transformatie',
    image: '/transformatie-1.png',
    photo: '/review-consumer.png',
    quote: 'Zeer professionele aanpak! Dankzij zijn persoonlijke begeleiding en deskundige aanpak zie je echt resultaat.'
  },
  {
    name: 'Sassus',
    result: '-5,1 kg in 8 weken',
    image: '/transformatie-2.png',
    photo: '/review-sassus.png',
    quote: 'Na 100 mislukte pogingen is het mij met Kersten eindelijk gelukt een routine te creëren.'
  }
]

export default function TransformationsSection({ isMobile }) {
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
      background: '#111',
      padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${G}40, transparent)`
      }} />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease'
        }}>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: '800',
            letterSpacing: '0.15em',
            color: G,
            display: 'inline-block',
            marginBottom: '0.6rem'
          }}>TRANSFORMATIES</span>
          <h2 style={{
            fontSize: isMobile ? '1.35rem' : '1.7rem',
            fontWeight: '900',
            color: '#fff',
            margin: 0,
            lineHeight: 1.15
          }}>
            "Na 100 mislukte pogingen <span style={{ color: G }}>eindelijk gelukt</span>"
          </h2>
          <p style={{
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: '500',
            marginTop: '0.4rem'
          }}>Van mensen die dezelfde stap namen als jij</p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
          gap: isMobile ? '0.75rem' : '1.25rem'
        }}>
          {TRANSFORMATIONS.map((t, i) => (
            <div key={i} style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.7s ease ${0.2 + i * 0.15}s`
            }}>
              {/* Before/After foto */}
              <div style={{
                width: '100%',
                aspectRatio: '4/5',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img
                  src={t.image}
                  alt={`${t.name} transformatie`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                {/* Result badge */}
                <div style={{
                  position: 'absolute',
                  bottom: isMobile ? '10px' : '14px',
                  right: isMobile ? '10px' : '14px',
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${G}40`
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.75rem',
                    fontWeight: '900',
                    color: G
                  }}>{t.result}</span>
                </div>
              </div>

              {/* Review */}
              <div style={{
                padding: isMobile ? '0.6rem 0.5rem' : '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  {/* Persoon foto */}
                  <div style={{
                    width: isMobile ? '24px' : '36px',
                    height: isMobile ? '24px' : '36px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: `2px solid ${G}30`
                  }}>
                    <img
                      src={t.photo}
                      alt={t.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.style.background = `linear-gradient(135deg, ${G}, #D4B85A)`
                        e.target.parentElement.innerHTML = `<span style="color:#fff;font-size:0.6rem;font-weight:800;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${t.name.charAt(0)}</span>`
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: isMobile ? '0.72rem' : '0.88rem',
                    fontWeight: '800',
                    color: '#fff'
                  }}>{t.name}</span>
                  <div style={{ display: 'flex', gap: '1px', marginLeft: 'auto' }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={isMobile ? 8 : 11} fill="#FFD700" color="#FFD700" />
                    ))}
                  </div>
                </div>
                <p style={{
                  fontSize: isMobile ? '0.65rem' : '0.82rem',
                  color: 'rgba(255,255,255,0.5)',
                  fontWeight: '450',
                  lineHeight: 1.4,
                  margin: 0,
                  fontStyle: 'italic'
                }}>"{t.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
