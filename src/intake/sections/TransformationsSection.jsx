// src/intake/sections/TransformationsSection.jsx — DARK
import { useState, useEffect, useRef } from 'react'

const G = '#C9A84C'

const TRANSFORMATIONS = [
  { name: 'Consumer', result: 'Arm transformatie', image: '/transformatie-1.png', review: 'Zeer professionele aanpak! Dankzij zijn persoonlijke begeleiding zie je echt resultaat.' },
  { name: 'Sassus', result: '-5,1 kg', image: '/transformatie-2.png', review: 'Na 100 mislukte pogingen is het mij met Kersten eindelijk gelukt!' }
]

export default function TransformationsSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 }); if (ref.current) o.observe(ref.current); return () => o.disconnect() }, [])

  return (
    <section ref={ref} style={{ background: '#2D3436', padding: isMobile ? '2.5rem 1rem' : '4rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em', color: G, display: 'inline-block', border: `1px solid ${G}`, borderRadius: '4px', padding: '0.35rem 1.25rem', marginBottom: '0.75rem' }}>TRANSFORMATIES</span>
          <h2 style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '900', color: '#fff', margin: 0, lineHeight: 1.15, textTransform: 'uppercase' }}>
            ZICHTBARE RESULTATEN IN GEMIDDELD 8 WEKEN TIJD
          </h2>
        </div>

        {/* Grid — 2 cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '1.25rem' : '2rem'
        }}>
          {TRANSFORMATIONS.map((t, i) => (
            <div key={i} style={{
              borderRadius: '14px', overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.7s ease ${0.2 + i * 0.15}s`
            }}>
              {/* Image */}
              <div style={{ width: '100%', aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={t.image}
                  alt={`${t.name} transformatie`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff' }}>{t.name}</span>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '900', color: G }}>{t.result}</span>
                </div>
                <p style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{t.review}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
