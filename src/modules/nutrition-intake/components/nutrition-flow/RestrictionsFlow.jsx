// src/modules/nutrition-intake/components/nutrition-flow/RestrictionsFlow.jsx
// Stap 5-6: Wat wil je niet eten (smaak) + allergieën/intoleranties (3-stap schaal)
import React, { useState } from 'react'
import { Q, Hint, NextBtn, BackBtn, SkipBtn, TextField, BigOption } from '../../../public-intake/components/phase1/FlowStep'

// Stap 5: smaakvoorkeuren — wat eet je liever niet (geen allergie)
const NIET_LEKKER_OPTIONS = [
  { value: 'vis',          label: 'Vis' },
  { value: 'lever',        label: 'Lever of orgaanvlees' },
  { value: 'bloemkool',    label: 'Bloemkool' },
  { value: 'champignons',  label: 'Champignons' },
  { value: 'spinazie',     label: 'Spinazie' },
  { value: 'kwark',        label: 'Kwark' },
  { value: 'eieren',       label: 'Eieren' },
  { value: 'tofu',         label: 'Tofu of tempeh' },
]

// Stap 6: allergieën met 3 niveaus
const ALLERGEN_ITEMS = [
  { id: 'lactose',      label: 'Zuivel / lactose',    sub: 'Melk, kaas, kwark, yoghurt' },
  { id: 'gluten',       label: 'Gluten',              sub: 'Brood, pasta, tarwe, havermout' },
  { id: 'noten',        label: 'Noten',               sub: 'Amandelen, walnoten, cashew' },
  { id: 'pinda',        label: 'Pinda',               sub: 'Pindakaas, pinda-olie' },
  { id: 'ei',           label: 'Ei',                  sub: 'Eieren in elk gerecht' },
  { id: 'vis',          label: 'Vis',                 sub: 'Zalm, tonijn, kabeljauw' },
  { id: 'schaaldieren', label: 'Schaaldieren',        sub: 'Garnalen, kreeft, mosselen' },
  { id: 'soja',         label: 'Soja',                sub: 'Sojamelk, tofu, edamame' },
]

const DIEET_OPTIONS = [
  { value: 'geen',        label: 'Geen',              sub: 'Ik eet alles' },
  { value: 'vegetarisch', label: 'Vegetarisch',       sub: 'Geen vlees of vis' },
  { value: 'veganistisch',label: 'Veganistisch',      sub: 'Geen dierlijke producten' },
  { value: 'halal',       label: 'Halal',             sub: 'Geen varkensvlees, halal vlees' },
  { value: 'pescotarisch',label: 'Pescotarisch',      sub: 'Geen vlees, wel vis' },
]

const ERNST_LABELS = {
  volledig: { label: 'Volledig vermijden', color: '#ef4444' },
  beperkt:  { label: 'Beperkt',           color: '#f97316' },
  geen:     { label: 'Geen probleem',      color: '#10b981' },
}

function AllergenRow({ item, ernst, onSelect, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0.6rem 0' : '0.65rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.1rem' }}>{item.label}</div>
      <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)', marginBottom: '0.35rem' }}>{item.sub}</div>
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {Object.entries(ERNST_LABELS).map(([key, cfg]) => {
          const isSelected = ernst === key
          return (
            <button key={key} onClick={() => onSelect(key)} style={{
              flex: 1, padding: isMobile ? '0.45rem 0.3rem' : '0.5rem 0.4rem',
              background: isSelected ? `${cfg.color}15` : 'transparent',
              border: `1px solid ${isSelected ? cfg.color : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}>
              <div style={{ fontSize: isMobile ? '0.6rem' : '0.62rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? cfg.color : 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.3 }}>
                {cfg.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function RestrictionsFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [step, setStep] = useState(1)

  const update = (field, value) => onChange({ ...data, [field]: value })

  const toggleNietLekker = (item) => {
    const current = data.niet_lekker || []
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item]
    update('niet_lekker', updated)
  }

  const setAllergenErnst = (id, ernst) => {
    const current = data.allergen_ernst || {}
    update('allergen_ernst', { ...current, [id]: ernst })
  }

  const goBack = () => {
    if (step > 1) setStep(step - 1)
    else if (onBack) onBack()
  }

  const pad = isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem'

  // Stap 1 — Wat wil je absoluut niet eten (smaak)
  if (step === 1) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Is er iets dat je liever niet eet?</Q>
      <Hint isMobile={isMobile}>Geen allergie — gewoon niet lekker. Tik alles aan dat geldt.</Hint>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
        {NIET_LEKKER_OPTIONS.map(opt => {
          const isSelected = (data.niet_lekker || []).includes(opt.value)
          return (
            <button key={opt.value} onClick={() => toggleNietLekker(opt.value)} style={{
              padding: isMobile ? '0.55rem 0.75rem' : '0.6rem 0.85rem',
              background: isSelected ? 'rgba(239,68,68,0.08)' : '#0d0d0d',
              border: `1px solid ${isSelected ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}>
              <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>
                {isSelected ? '✕ ' : ''}{opt.label}
              </span>
            </button>
          )
        })}
      </div>
      <TextField
        placeholder="Iets anders dat je echt niet wil? (optioneel)"
        value={data.niet_lekker_overig}
        onChange={v => update('niet_lekker_overig', v)}
        isMobile={isMobile}
      />
      <NextBtn onClick={() => setStep(2)} isMobile={isMobile} onBack={onBack} />
    </div>
  )

  // Stap 2 — Dieetvoorkeur
  if (step === 2) return (
    <div style={{ padding: pad }}>
      <BackBtn onBack={goBack} />
      <Q isMobile={isMobile}>Volg je een specifiek dieet?</Q>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.25rem' }}>
        {DIEET_OPTIONS.map(opt => (
          <BigOption
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            selected={data.diet_preference === opt.value}
            onClick={() => {
              update('diet_preference', opt.value)
              setTimeout(() => setStep(3), 200)
            }}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  )

  // Stap 3 — Allergieën 3-stap schaal
  if (step === 3) return (
    <div style={{ padding: pad }}>
      <Q isMobile={isMobile}>Heb je allergieën of intoleranties?</Q>
      <Hint isMobile={isMobile}>Geef per product aan hoe erg het is</Hint>
      <div style={{ marginBottom: '0.75rem' }}>
        {ALLERGEN_ITEMS.map(item => (
          <AllergenRow
            key={item.id}
            item={item}
            ernst={(data.allergen_ernst || {})[item.id] || 'geen'}
            onSelect={ernst => setAllergenErnst(item.id, ernst)}
            isMobile={isMobile}
          />
        ))}
      </div>
      <TextField
        placeholder="Andere allergie of intolerantie? (optioneel)"
        value={data.allergen_overig}
        onChange={v => update('allergen_overig', v)}
        isMobile={isMobile}
      />
      <NextBtn onClick={onNext} isMobile={isMobile} onBack={goBack} />
    </div>
  )

  return null
}
