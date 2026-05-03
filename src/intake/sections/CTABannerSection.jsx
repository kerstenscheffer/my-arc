// src/intake/sections/CTABannerSection.jsx — DARK
import { useState, useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const G = '#C9A84C'

export default function CTABannerSection({ isMobile, onScrollToForm }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.2 }); if (ref.current) o.observe(ref.current); return () => o.disconnect() }, [])
  const go = () => onScrollToForm ? onScrollToForm() : document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section ref={ref} style={{ position: 'relative', minHeight: isMobile ? '260px' : '320px', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3rem 1rem' : '4rem 2rem', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 55%)`, pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '650px', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease' }}>
        <h2 style={{ fontSize: isMobile ? 'clamp(1.4rem, 6vw, 1.8rem)' : 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '900', color: '#fff', textTransform: 'uppercase', lineHeight: 1.15, margin: '0 0 1.5rem' }}>
          TIENTALLEN MENSEN WAREN JE VOOR,<br/>BEN JIJ DE VOLGENDE?
        </h2>
        <button onClick={go} style={{ padding: isMobile ? '1rem 2.5rem' : '1.1rem 3rem', background: `linear-gradient(135deg, ${G}, #B8973F)`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: '800', letterSpacing: '0.08em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation', transition: 'all 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>START VANDAAG <ArrowRight size={18} /></button>
      </div>
    </section>
  )
}
