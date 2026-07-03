// src/modules/lab/LabHub.jsx
// Interne "Lab"-tab in CoachHub: speeltuin om nieuwe functies te bouwen en testen
// vóór ze naar de client-kant gaan. Lijst van experimenten; klik opent er één.
// Nieuwe experimenten toevoegen = een entry in EXPERIMENTS + een component.
import { useState } from 'react'
import { FlaskConical, Apple, ChevronLeft, Lock } from 'lucide-react'
import NutritionChoiceTrainer from './experiments/NutritionChoiceTrainer'

const GOLD = '#FFD700'

const EXPERIMENTS = [
  {
    id: 'nutrition-choice',
    title: 'Voedingskeuze Trainer',
    desc: 'Train de juiste voedingskeuze: 2 opties, kies de beste, krijg uitleg. Per situatie uit te breiden.',
    icon: Apple,
    status: 'live',
    Component: NutritionChoiceTrainer,
  },
  // Volgende experimenten hier toevoegen ({ status: 'soon' } voor placeholder).
]

export default function LabHub({ isMobile }) {
  const [openId, setOpenId] = useState(null)
  const active = EXPERIMENTS.find(e => e.id === openId)

  if (active) {
    const C = active.Component
    return (
      <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
        <button onClick={() => setOpenId(null)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          padding: '0.5rem 0.8rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
        }}>
          <ChevronLeft size={16} /> Terug naar Lab
        </button>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{active.title}</h2>
        <C isMobile={isMobile} />
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Intro */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <FlaskConical size={isMobile ? 22 : 26} color={GOLD} />
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Lab</h1>
      </div>
      <p style={{ margin: '0 0 1.75rem', fontSize: isMobile ? '0.9rem' : '1rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.5, maxWidth: 560 }}>
        Bouw en test nieuwe functies hier voordat ze naar de client-kant gaan.
      </p>

      {/* Experiment-grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 12 : 16 }}>
        {EXPERIMENTS.map(exp => {
          const Icon = exp.icon
          const soon = exp.status === 'soon'
          return (
            <button
              key={exp.id}
              onClick={() => !soon && setOpenId(exp.id)}
              disabled={soon}
              style={{
                textAlign: 'left', cursor: soon ? 'default' : 'pointer', opacity: soon ? 0.55 : 1,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                padding: isMobile ? '1.1rem' : '1.4rem', display: 'flex', flexDirection: 'column', gap: 10,
                transition: 'all 0.2s ease', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,215,0,0.12)', border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={GOLD} />
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: soon ? 'rgba(255,255,255,0.4)' : '#22c55e' }}>
                  {soon ? <><Lock size={11} /> Binnenkort</> : '● Live'}
                </span>
              </div>
              <span style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{exp.title}</span>
              <span style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>{exp.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
