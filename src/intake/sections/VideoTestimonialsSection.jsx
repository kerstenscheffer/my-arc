// src/intake/sections/VideoTestimonialsSection.jsx — DARK
import { useState, useEffect, useRef } from 'react'
import { Play } from 'lucide-react'

const G = '#C9A84C'
const TESTIMONIALS = [
  { name: 'Client A', subtitle: 'Het resultaat van drie maanden' },
  { name: 'Client B', subtitle: 'Ik ben 15 centimeter afgevallen' },
  { name: 'Client C', subtitle: 'Ik ben 53 jaar' },
  { name: 'Client D', subtitle: 'Mijn doel in minder dan 12 weken' }
]

export default function VideoTestimonialsSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.15 }); if (ref.current) o.observe(ref.current); return () => o.disconnect() }, [])

  return (
    <section ref={ref} style={{ background: '#1a1d1e', padding: isMobile ? '3.5rem 1rem' : '5rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: isMobile ? 'clamp(1.15rem, 5vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '400', color: '#fff', maxWidth: '800px', margin: '0 auto 2.5rem', lineHeight: 1.3, opacity: vis ? 1 : 0, transition: 'opacity 0.7s ease' }}>
        "Nooit gedacht dat ik anderen zou inspireren met mijn transformatie, ik straal veel meer zelfvertrouwen uit"
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '0.75rem' : '1rem', maxWidth: '1100px', margin: '0 auto' }}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.3s ease', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${0.15 + i * 0.1}s` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
            <div style={{ width: '100%', aspectRatio: '9/16', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), #151515)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: isMobile ? '48px' : '60px', height: isMobile ? '48px' : '60px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                <Play size={isMobile ? 18 : 22} color="#fff" fill="#fff" style={{ marginLeft: '3px' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '2rem 0.75rem 0.75rem' : '2.5rem 1rem 1rem', background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
                <p style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: '800', color: '#FFD700', textTransform: 'uppercase', margin: 0 }}>{t.subtitle}</p>
              </div>
            </div>
            <div style={{ padding: '0.6rem', textAlign: 'center' }}>
              <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '700', color: G }}>{t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
