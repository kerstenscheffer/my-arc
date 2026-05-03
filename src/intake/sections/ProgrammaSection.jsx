// src/intake/sections/ProgrammaSection.jsx — 90 DAGEN COACHING
// Compacter + Hiërarchie (met week layout)
import { useState, useEffect, useRef } from 'react'
import { Utensils, Dumbbell, PhoneCall, TrendingUp, Brain, ShieldCheck, ArrowRight } from 'lucide-react'

const G = '#C9A84C'
const BG = '#ffffff'

const PILLARS = [
  { icon: Utensils, label: 'MAALTIJDPLAN\nDAT WERKT' },
  { icon: Dumbbell, label: 'TRAININGSSCHEMA\nVOOR JOU' },
  { icon: PhoneCall, label: 'IK BEN ER\nVOOR JE' },
  { icon: TrendingUp, label: 'JE ZIET HET\nGEBEUREN' }
]

const WEEKS = [
  {
    range: 'WEEK 1-4',
    title: 'FOUNDATION',
    subtitle: 'Je plan staat klaar',
    items: [
      { t: 'JOUW MAALTIJDPLAN', d: 'Niet generic kip & rijst. Gebouwd op jouw smaak, voorkeur en budget.' },
      { t: 'MACROS TRACKEN — SIMPEL', d: 'Je logt in de app. 10 seconden per maaltijd. Je ziet exact waar je staat.' },
      { t: 'GELD BESPAREN TERWIJL JE EET', d: 'Gezond kost niet meer dan junkfood. Automatische boodschappenlijst, goedkope alternatieven.' },
      { t: 'REALISTISCH TRAININGSPLAN', d: 'Je hebt geen 2 uur per dag. We kijken naar je ECHTE beschikbaarheid. 3-4x training. Klaar.' }
    ]
  },
  {
    range: 'WEEK 5-8',
    title: 'MOMENTUM',
    subtitle: 'Je ziet verandering',
    items: [
      { t: 'TIMING IS ALLES', d: 'Wanneer je eet maakt verschil. Meer energie, betere workouts, sneller herstel.' },
      { t: 'JE LEVEN BEHOUDEN', d: 'Out eten, feestjes, balans. Je hoeft niet alles op te geven. We leren je hoe je dit ECHT doet.' },
      { t: 'HERSTEL IS DE ECHTE WERK', d: 'Je groeit niet in de gym, je groeit als je slaapt. Slaap en stress bepalen je resultaat.' },
      { t: 'DOORBREKEN DOOR MOMENTUM', d: 'Je bent 4 weken bezig. Je voelt je beter. We duwen je door naar volgende level.' }
    ]
  },
  {
    range: 'WEEK 9-12',
    title: 'FINALE',
    subtitle: 'Jij bent getransformeerd',
    items: [
      { t: 'JE BENT STERKER GEWORDEN', d: 'Je trainingsschema is gebouwd op progressie. Elke week sterker. Je voelt het. Je ziet het.' },
      { t: 'JE BENT CONSISTENT GEWORDEN', d: 'Dit is je leven nu. We geven je mentale tools zodat je dit volhoudt. Streaks, milestones, momentum.' },
      { t: 'JE BEGRIJPT HOE HET WERKT', d: 'Je kijkt naar je data. Je weet wat voor JOU werkt. Je bent niet afhankelijk van mij meer.' },
      { t: 'DIT IS HET BEGIN', d: 'De vraag is niet "wat nu?" maar "hoe hou ik dit vol?" Dit is je nieuwe reality.' }
    ]
  }
]

const VALUE_STACK = [
  { icon: Utensils, label: 'Maaltijdplan gemaakt voor JOU', sub: 'Niet generic. Jouw voorkeur, budget, doelen.' },
  { icon: Dumbbell, label: 'Compleet trainingsschema in de app', sub: 'Progressive overload, form guides, PR tracking.' },
  { icon: PhoneCall, label: '6 calls met mij', sub: 'Week 1 setup, week 2 check-in, dan elke 2 weken.' },
  { icon: Brain, label: 'Voice notes 2-3x per week', sub: 'Tips, motivatie, antwoorden op vragen direct in WhatsApp.' },
  { icon: TrendingUp, label: 'Je data in de app', sub: 'Gewicht, foto\'s, trainingsgewichten. Zie exact wat werkt.' },
  { icon: ShieldCheck, label: '90 dagen volledige support', sub: 'App, calls, voice notes, al je vragen beantwoord.' }
]

export default function ProgrammaSection({ isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true)
    }, { threshold: 0.05 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])

  const go = () => document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section ref={ref} style={{ background: BG, padding: isMobile ? '3rem 1rem' : '4rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em', color: '#1a1a1a', display: 'inline-block', border: `1px solid ${G}`, borderRadius: '4px', padding: '0.4rem 1.25rem', marginBottom: '0.75rem' }}>JE 90-DAAGSE PLAN</span>
        </div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: isMobile ? 'clamp(1.15rem, 5vw, 1.5rem)' : 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '400', color: '#1a1a1a', textAlign: 'center', maxWidth: '850px', margin: '0 auto 0.5rem', lineHeight: 1.3, opacity: vis ? 1 : 0, transition: 'opacity 0.7s ease 0.1s' }}>
          "Ik dacht dat ik dit niet kon volhouden. Blijkt dat ik gewoon het juiste plan nodig had."
        </h2>
        <p style={{ textAlign: 'center', fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#888', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>Simpel. Duidelijk. Resultaatgericht.</p>

        {/* PILLARS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '1rem' : '1.5rem', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
          {PILLARS.map((p, i) => (
            <div key={i} style={{ textAlign: 'center', opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(15px)', transition: `all 0.5s ease ${0.2 + i * 0.08}s` }}>
              <div style={{ width: isMobile ? '52px' : '64px', height: isMobile ? '52px' : '64px', borderRadius: '12px', background: `linear-gradient(135deg, ${G}, #B8973F)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <p.icon size={isMobile ? 22 : 28} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: '800', letterSpacing: '0.05em', color: '#555', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* WEEK BLOCKS */}
        {WEEKS.map((w, wi) => (
          <WeekBlock key={wi} week={w} index={wi} isMobile={isMobile} />
        ))}

        {/* VALUE STACK */}
        <ValueStackBlock isMobile={isMobile} go={go} />
      </div>
    </section>
  )
}

/* WEEK BLOCK */
function WeekBlock({ week, index, isMobile }) {
  const [vis, setVis] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true)
    }, { threshold: 0.15 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      marginBottom: isMobile ? '2.5rem' : '3.5rem',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: isMobile ? '1.5rem' : '3rem',
      alignItems: 'center',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(25px)',
      transition: 'all 0.7s ease'
    }}>
      <div style={{ order: isMobile ? 1 : (index % 2 === 0 ? 1 : 2) }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: '#555', display: 'inline-block', border: '1px solid #ccc', borderRadius: '4px', padding: '0.3rem 0.85rem', marginBottom: '1rem' }}>{week.range}</span>
        <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '900', color: '#1a1a1a', lineHeight: 1.15, margin: '0 0 0.3rem', textTransform: 'uppercase' }}>{week.title}</h3>
        <p style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888', margin: '0 0 1rem', fontWeight: '500' }}>{week.subtitle}</p>
        
        {week.items.map((item, ii) => (
          <div key={ii} style={{ marginBottom: '0.85rem', opacity: vis ? 1 : 0, transform: vis ? 'translateX(0)' : 'translateX(-10px)', transition: `all 0.4s ease ${0.2 + ii * 0.08}s` }}>
            <h4 style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: '800', color: '#1a1a1a', margin: '0 0 0.15rem', textTransform: 'uppercase' }}>{item.t}</h4>
            <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#777', lineHeight: 1.5, margin: 0 }}>{item.d}</p>
          </div>
        ))}
      </div>
      
      <div style={{ order: isMobile ? 2 : (index % 2 === 0 ? 2 : 1), display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: isMobile ? '170px' : '240px', aspectRatio: '9/16', background: '#f0f0f0', borderRadius: '24px', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '0.65rem', fontWeight: '600' }}>
          APP SCREENSHOT
        </div>
      </div>
    </div>
  )
}

/* VALUE STACK */
function ValueStackBlock({ isMobile, go }) {
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
    <div ref={ref} style={{ marginTop: isMobile ? '2rem' : '3rem', padding: isMobile ? '2rem 1.25rem' : '3rem 2.5rem', background: '#faf8f4', borderRadius: '16px', border: `1px solid ${G}33` }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem', opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.15em', color: G, display: 'inline-block', marginBottom: '0.5rem' }}>WAT JE KRIJGT</span>
        <h3 style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: '900', color: '#1a1a1a', margin: 0, lineHeight: 1.2, textTransform: 'uppercase' }}>Je complete 90-daagse pakket</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        {VALUE_STACK.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '0.75rem' : '1rem',
            background: '#fff',
            borderRadius: '10px',
            border: '1px solid #eee',
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(10px)',
            transition: `all 0.4s ease ${0.1 + i * 0.06}s`
          }}>
            <div style={{ width: isMobile ? '36px' : '42px', height: isMobile ? '36px' : '42px', borderRadius: '10px', background: `linear-gradient(135deg, ${G}20, ${G}10)`, border: `1px solid ${G}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={isMobile ? 16 : 20} color={G} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '800', color: '#1a1a1a', margin: '0 0 0.15rem' }}>{item.label}</p>
              <p style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#888', margin: 0, lineHeight: 1.4 }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={go} style={{
          padding: isMobile ? '0.85rem 2rem' : '0.95rem 2.5rem',
          background: `linear-gradient(135deg, ${G}, #B8973F)`,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: '800',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.3s ease'
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          BEGIN VANDAAG <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
