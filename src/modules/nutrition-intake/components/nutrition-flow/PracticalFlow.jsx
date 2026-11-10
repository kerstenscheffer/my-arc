// src/modules/nutrition-intake/components/nutrition-flow/PracticalFlow.jsx
// Stap 7-8: Budget + kookvoorkeur + guidance level (pre-selectie op kennis niveau)
import React, { useState, useEffect } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, OptionGrid, PhotoGrid } from '../../../public-intake/components/phase1/FlowStep'
import { isMealSkipped } from './EatPatternFlow'
import { Star, Coffee, Sandwich, UtensilsCrossed, Apple } from 'lucide-react'

// Rijtje bolletjes = aantal verschillende gerechten per week.
function Bolletjes({ aantal, kleur = '#fff', klein }) {
  const d = klein ? 4 : 6
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: klein ? 2 : 3 }}>
      {Array.from({ length: aantal }, (_, i) => (
        <span key={i} style={{ width: d, height: d, borderRadius: '50%', background: kleur }} />
      ))}
    </div>
  )
}

// Variatie per maaltijd (10 nov 2026). Elk antwoord is één vaste
// planstructuur, zodat de coach niet hoeft te gokken:
//   vast       → 1 gerecht, elke dag hetzelfde
//   afwisselen → 2 gerechten, om en om (A/B)
//   variatie   → 7 gerechten, elke dag een ander
const VARIATIE_OPTIES = [
  { value: 'vast',       label: 'Vast',       sub: 'Elke dag hetzelfde', aantal: 1 },
  { value: 'afwisselen', label: 'Afwisselen', sub: '2 opties om en om',  aantal: 2 },
  { value: 'variatie',   label: 'Variatie',   sub: 'Elke dag iets anders', aantal: 7 },
]
// Wat de coach aanraadt per maaltijd: ontbijt, lunch en snacks vast (makkelijk
// vol te houden), avondeten afwisselen.
const AANGERADEN = { ontbijt: 'vast', lunch: 'vast', snack: 'vast', diner: 'afwisselen' }
const VARIATIE_MOMENTEN = [
  { key: 'ontbijt', label: 'Ontbijt', icoon: Coffee },
  { key: 'lunch',   label: 'Lunch', icoon: Sandwich },
  { key: 'diner',   label: 'Avondeten', icoon: UtensilsCrossed },
  { key: 'snack',   label: 'Snacks', icoon: Apple },
]

// Guidance level — pre-selectie op basis van kennis niveau
// macros_kennis: ja → flexible/free, beetje → flexible, nee → strict
function getPreselectedGuidance(macrosKennis) {
  if (macrosKennis === 'ja') return 'flexible'
  if (macrosKennis === 'beetje') return 'flexible'
  return 'strict'
}

const GUIDANCE_OPTIONS = [
  {
    value: 'strict',
    label: 'Strak voedingsplan',
    sub: 'Ik krijg een exact plan met hoeveelheden',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop&q=80',
    badge: null,
  },
  {
    value: 'flexible',
    label: 'Plan met targets en flexibiliteit',
    sub: 'Ik weet wat ik eet, maar wissel zelf af',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=200&fit=crop&q=80',
    badge: 'Populairst',
  },
  {
    value: 'free',
    label: 'Alleen richtlijnen',
    sub: 'Ik regel het zelf, wil wel advies',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop&q=80',
    badge: null,
  },
]

export default function PracticalFlow({ data, onChange, onNext, onBack, isMobile }) {
  // Budget, kookvoorkeur en maaltijden per dag zijn op 10 nov 2026 weggehaald;
  // alleen de begeleidingsvraag is over.
  const [step, setStep] = useState(3)

  const update = (field, value) => onChange({ ...data, [field]: value })

  // Pre-selecteer guidance level op basis van kennis niveau uit vorige flow
  useEffect(() => {
    if (!data.guidance_level && data.macros_kennis) {
      update('guidance_level', getPreselectedGuidance(data.macros_kennis))
    }
  }, [])

  const goBack = () => { if (step > 3) setStep(step - 1); else if (onBack) onBack() }

  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  // Stap 3: variatie per maaltijd
  const momenten = VARIATIE_MOMENTEN.filter(m => !isMealSkipped(m.key, data))
  const variatie = data.variatie_per_maaltijd || {}
  const zetVariatie = (k, v) => update('variatie_per_maaltijd', { ...variatie, [k]: v })
  const variatieKlaar = momenten.every(m => variatie[m.key])
  // Snel: alles volgens coach-advies. Nog een keer tikken wist alles weer.
  const allesAdvies = momenten.length > 0 && momenten.every(m => variatie[m.key] === AANGERADEN[m.key])
  const wisselAdvies = () => update('variatie_per_maaltijd', allesAdvies ? {} : Object.fromEntries(momenten.map(m => [m.key, AANGERADEN[m.key]])))
  if (step === 3) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Hoeveel variatie wil je per maaltijd?</Q>
      <Hint isMobile={isMobile}>Zo weet ik precies hoeveel verschillende gerechten ik voor je klaarzet.</Hint>

      {/* Uitleg één keer bovenaan in plaats van onder elke knop. De bolletjes
          zijn het aantal gerechten per week dat je krijgt. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '0.3rem 0 0.9rem' }}>
        {VARIATIE_OPTIES.map(o => (
          <div key={o.value} style={{ textAlign: 'center' }}>
            <Bolletjes aantal={o.aantal} />
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', marginTop: 5 }}>{o.label}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{o.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '0.9rem' }}>
        {momenten.map((m, i) => {
          const Icoon = m.icoon
          return (
            <div key={m.key} style={{ marginTop: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', fontSize: isMobile ? '0.92rem' : '0.95rem', fontWeight: 900 }}>
                <Icoon size={16} strokeWidth={2.4} color="#fff" />
                <span style={{ color: '#fff' }}>{m.label}</span>
                {/* Alleen achter de eerste maaltijd: coach-advies voor alles */}
                {i === 0 && (
                  <button onClick={wisselAdvies} style={{
                    padding: 0, background: 'none', border: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    color: '#FFD700', fontSize: 'inherit', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <Star size={13} strokeWidth={2.6} fill={allesAdvies ? '#FFD700' : 'none'} />
                    {allesAdvies ? 'Coach-advies gekozen' : 'Neem coach-advies over'}
                  </button>
                )}
              </div>
              {/* Segmenten: één blok met drie vakken, gekozen vak wit */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                {VARIATIE_OPTIES.map(o => {
                  const aan = variatie[m.key] === o.value
                  const advies = AANGERADEN[m.key] === o.value
                  return (
                    <button key={o.value} onClick={() => zetVariatie(m.key, o.value)} style={{
                      position: 'relative', minHeight: 48, borderRadius: 9, border: 'none',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      background: aan ? '#fff' : 'transparent', color: aan ? '#000' : '#fff',
                      fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s ease',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      {/* "Advies" als labeltje rechtsboven op de hoek van het
                          vak: zweeft erboven, dus geen verschuiving in de vakken. */}
                      {advies && (
                        <span style={{
                          position: 'absolute', top: -11, right: -4, zIndex: 1,
                          display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap',
                          padding: '0.1rem 0.45rem', borderRadius: 999, background: '#FFD700', color: '#000',
                          fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}><Star size={9} strokeWidth={2.8} fill="#000" /> Advies</span>
                      )}
                      <span style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 900 }}>{o.label}</span>
                      <Bolletjes aantal={o.aantal} kleur={aan ? '#000' : 'rgba(255,255,255,0.55)'} klein />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <NextBtn onClick={() => setStep(4)} disabled={!variatieKlaar} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  // Stap 4 — Guidance level (met pre-selectie)
  if (step === 4) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Hoe wil je begeleid worden?</Q>
      <Hint isMobile={isMobile}>
        {data.macros_kennis === 'nee'
          ? 'We raden aan dat je coach alles voor je bouwt. Jij hoeft alleen te volgen'
          : 'We hebben alvast een keuze voor je gemaakt op basis van je kennis. Je kan dit aanpassen.'}
      </Hint>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
        {GUIDANCE_OPTIONS.map(opt => {
          const isSelected = data.guidance_level === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => update('guidance_level', opt.value)}
              style={{
                padding: 0, overflow: 'hidden',
                background: isSelected ? 'rgba(255,255,255,0.04)' : '#0a0a0a',
                border: `1.5px solid ${isSelected ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Foto */}
              <div style={{ width: '100%', height: isMobile ? '60px' : '70px', backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15))' : 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3))' }} />
                {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #fff, #fff)' }} />}
                {opt.badge && (
                  <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', padding: '0.15rem 0.5rem', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, fontSize: '0.62rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.55)' }}>{opt.badge}</div>
                )}
                {/* Check */}
                <div style={{ position: 'absolute', bottom: '0.4rem', right: '0.4rem', width: '22px', height: '22px', borderRadius: '50%', boxSizing: 'border-box', border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.6)', background: isSelected ? '#10b981' : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                  {isSelected && <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>✓</span>}
                </div>
              </div>
              {/* Tekst */}
              <div style={{ padding: isMobile ? '0.6rem 0.75rem 0.7rem' : '0.65rem 0.85rem 0.75rem' }}>
                <div style={{ fontSize: isMobile ? '0.92rem' : '0.95rem', fontWeight: 900, color: '#fff', marginBottom: '0.15rem', letterSpacing: '-0.01em' }}>{opt.label}</div>
                <div style={{ fontSize: isMobile ? '0.78rem' : '0.8rem', color: 'rgba(255,255,255,0.72)', fontWeight: 600, lineHeight: 1.4 }}>{opt.sub}</div>
              </div>
            </button>
          )
        })}
      </div>
      <NextBtn
        onClick={onNext}
        disabled={!data.guidance_level}
        isMobile={isMobile}
      onBack={goBack} />
    </div>
  )

  return null
}
