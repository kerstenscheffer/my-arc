// src/intake/sections/FAQSection.jsx — LIGHT (WHITE)
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

const G = '#C9A84C'
const FAQS = [
  { q: 'HOE WERKT DE NIET-GOED? GELD-TERUG! GARANTIE?', a: 'Het 16 weken programma is een wetenschappelijk bewezen methode waarin zichtbaar resultaat gegarandeerd is mits aan alle voorwaardes worden gedaan: trainingen voltooien, voeding bijhouden en check-in formulieren invullen.', hl: true },
  { q: 'WAT ZIJN DE MAANDELIJKSE KOSTEN?', a: 'De kosten worden besproken tijdens het intake gesprek, zodat we een plan op maat kunnen maken dat past bij jouw situatie en doelen.' },
  { q: 'HOE VAAK MOET IK PER WEEK TRAINEN?', a: 'Gemiddeld adviseren we 3-4 trainingen per week, maar we passen dit aan op jouw situatie en fitnessgraad.' },
  { q: 'HOE WORDT MIJN PROGRESSIE BIJGEHOUDEN?', a: 'Via onze exclusieve app kun je je voortgang bijhouden. Wekelijkse check-ins, foto-vergelijkingen en data-tracking.' },
  { q: 'HEB JE VOEDINGSPLANNEN VOOR ALLERGIEËN EN RESTRICTIES?', a: 'Ja! Alle voedingsplannen worden volledig op maat gemaakt. Vegetarisch, veganistisch, glutenvrij of lactosevrij — we passen alles aan.' },
  { q: 'WAT IS HET VERSCHIL MET ANDERE PROGRAMMA\'S?', a: 'Persoonlijke 1-op-1 begeleiding, wetenschappelijke methodes, een exclusieve app en geld-terug-garantie.' }
]

export default function FAQSection({ isMobile }) {
  const [open, setOpen] = useState(0)
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.1 }); if (ref.current) o.observe(ref.current); return () => o.disconnect() }, [])
  const go = () => document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section ref={ref} style={{ background: '#fff', padding: isMobile ? '3.5rem 1rem' : '5rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '2rem' : '4rem', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
          <div style={{ borderLeft: `3px solid ${G}`, paddingLeft: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em', color: '#999' }}>FAQS</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: isMobile ? 'clamp(1.15rem, 5vw, 1.5rem)' : 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: '400', color: '#1a1a1a', lineHeight: 1.25, margin: '0 0 2rem' }}>
            "De zichtbare resultaten in de eerste maand zorgden ervoor dat volhouden heel makkelijk was"
          </h2>
          {/* Side CTA */}
          <div style={{ background: '#fafafa', borderRadius: '12px', padding: isMobile ? '1.5rem' : '2rem', textAlign: 'center', border: '1px solid #eee' }}>
            <p style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.5rem' }}>Meer vragen?</p>
            <p style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.5, margin: '0 0 1.25rem' }}>Vul het formulier in voor een vrijblijvend intake gesprek.</p>
            <button onClick={go} style={{ padding: '0.8rem 1.75rem', background: `linear-gradient(135deg, ${G}, #B8973F)`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.06em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', touchAction: 'manipulation' }}>VUL HET FORMULIER IN <ArrowRight size={14} /></button>
          </div>
        </div>

        {/* Right - Accordion */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.7s ease 0.15s' }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div key={i}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{
                  width: '100%', padding: isMobile ? '1rem' : '1.15rem 1.5rem',
                  background: faq.hl && isOpen ? `linear-gradient(135deg, ${G}, #B8973F)` : '#fff',
                  border: 'none', borderBottom: '1px solid #eee',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.3s ease'
                }}>
                  <span style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: '800', color: faq.hl && isOpen ? '#fff' : '#333', textAlign: 'left' }}>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} color={faq.hl && isOpen ? '#fff' : '#999'} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="#ccc" style={{ flexShrink: 0 }} />}
                </button>
                <div style={{ maxHeight: isOpen ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)' }}>
                  <p style={{ padding: isMobile ? '1rem' : '1rem 1.5rem 1.25rem', fontSize: isMobile ? '0.78rem' : '0.82rem', color: '#777', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
