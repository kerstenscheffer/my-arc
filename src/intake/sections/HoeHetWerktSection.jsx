// src/intake/sections/HoeHetWerktSection.jsx — DARK
import { useState, useEffect, useRef } from 'react'
import { ClipboardList, MessageCircle, CheckSquare, Smile } from 'lucide-react'

const G = '#C9A84C'
const DARK = '#2D3436'
const STEPS = [
  { icon: ClipboardList, title: 'VUL HET FORMULIER IN', desc: 'Ben jij klaar voor echte resultaten? Geen geld meer aan onnodige dieet shakes die niet werken? Vul het formulier in.', cta: true },
  { icon: MessageCircle, title: 'WACHT TOT ER CONTACT WORDT OPGENOMEN', desc: 'Binnen 24 uur neemt mijn team contact op via WhatsApp om een Zoom call in te plannen.' },
  { icon: CheckSquare, title: 'JE BENT ER KLAAR VOOR', desc: 'Via een intake gesprek bespreken we hoe we jouw doelen gaan bereiken!' },
  { icon: Smile, title: 'WELKOM BIJ DE COMMUNITY!', desc: 'Toegang tot onze exclusieve app. Binnen 3 werkdagen jouw persoonlijke plannen ontvangen.' }
]

export default function HoeHetWerktSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true) }, { threshold: 0.15 }); if (ref.current) o.observe(ref.current); return () => o.disconnect() }, [])
  const go = () => document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section ref={ref} style={{ background: DARK, padding: isMobile ? '3.5rem 1rem' : '5rem 2rem', textAlign: 'center' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em', color: '#fff', display: 'inline-block', border: `1px solid ${G}`, borderRadius: '4px', padding: '0.4rem 1.25rem', marginBottom: '1.5rem', opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>HOE HET WERKT</span>

      <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: isMobile ? 'clamp(1.15rem, 5vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '400', color: '#fff', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.3, opacity: vis ? 1 : 0, transition: 'opacity 0.7s ease 0.1s' }}>
        "Ik had nooit verwacht dat het zo makkelijk zou zijn om resultaat te boeken!"
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1rem', maxWidth: '1100px', margin: '0 auto', textAlign: 'left' }}>
        {STEPS.map((st, i) => (
          <div key={i} style={{ padding: isMobile ? '1.25rem' : '1.5rem 1.25rem', border: `1px solid rgba(201,168,76,0.25)`, borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.5s ease ${0.2 + i * 0.1}s` }}>
            <div style={{ width: isMobile ? '42px' : '48px', height: isMobile ? '42px' : '48px', borderRadius: '10px', border: `1px solid rgba(201,168,76,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.08)' }}>
              <st.icon size={isMobile ? 18 : 22} color={G} />
            </div>
            <h3 style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, margin: 0 }}>{st.title}</h3>
            <p style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0, flex: 1 }}>{st.desc}</p>
            {st.cta && <button onClick={go} style={{ padding: '0.6rem 1rem', background: `linear-gradient(135deg, ${G}, #B8973F)`, border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.06em', cursor: 'pointer', alignSelf: 'flex-start', touchAction: 'manipulation' }}>VUL HET FORMULIER IN</button>}
          </div>
        ))}
      </div>
    </section>
  )
}
