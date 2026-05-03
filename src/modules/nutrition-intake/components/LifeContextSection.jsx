// src/modules/nutrition-intake/components/LifeContextSection.jsx
// v2 — Kooktijd = per maaltijd, meal prep herframed, betere labels
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const WORK_SITUATIONS = [
  { id: 'thuis', label: 'Thuiswerker' },
  { id: 'kantoor', label: 'Kantoor' },
  { id: 'fysiek', label: 'Fysiek werk' },
  { id: 'student', label: 'Student' },
  { id: 'wisselend', label: 'Wisselend' },
  { id: 'anders', label: 'Anders' }
]

const WORK_HOURS = [
  { id: '7-16', label: '7:00 — 16:00' },
  { id: '8-17', label: '8:00 — 17:00' },
  { id: '9-18', label: '9:00 — 18:00' },
  { id: 'wisselend', label: 'Wisselend / Ploegen' },
  { id: 'flexibel', label: 'Flexibel / Eigen planning' }
]

const LUNCH_OPTIONS = [
  { id: 'echte_pauze', label: 'Echte pauze — rustig eten' },
  { id: 'aan_bureau', label: 'Aan bureau / tussendoor' },
  { id: 'geen_pauze', label: 'Geen echte pauze' }
]

const SNACKING_OPTIONS = [
  { id: 'makkelijk', label: 'Ja, makkelijk' },
  { id: 'soms', label: 'Soms even snel' },
  { id: 'nee', label: 'Nee, niet echt' }
]

const BUDGET_OPTIONS = [
  { id: '30-40', label: '€30 — 40' },
  { id: '40-60', label: '€40 — 60' },
  { id: '60-80', label: '€60 — 80' },
  { id: '80+', label: '€80+' }
]

const COOK_OPTIONS = [
  { id: 'graag', label: 'Ik kook graag' },
  { id: 'neutraal', label: 'Neutraal' },
  { id: 'niet_graag', label: 'Liefst zo min mogelijk' }
]

const COOK_TIME_OPTIONS = [
  { id: '15', label: 'Max 15 min' },
  { id: '30', label: 'Max 30 min' },
  { id: '45', label: 'Max 45 min' },
  { id: '60+', label: 'Maakt niet uit' }
]

const PREP_OPTIONS = [
  { id: 'preppen', label: 'Preppen — meerdere dagen vooruit' },
  { id: 'mix', label: 'Mix — soms preppen, soms vers' },
  { id: 'dagelijks', label: 'Elke dag bereiden' }
]

const DAYS = [
  { id: 'ma', label: 'Ma' },
  { id: 'di', label: 'Di' },
  { id: 'wo', label: 'Wo' },
  { id: 'do', label: 'Do' },
  { id: 'vr', label: 'Vr' },
  { id: 'za', label: 'Za' },
  { id: 'zo', label: 'Zo' }
]

export default function LifeContextSection({ value, onChange, onComplete, isMobile }) {
  const [data, setData] = useState({
    work_situation: null,
    work_days: ['ma', 'di', 'wo', 'do', 'vr'],
    work_hours: null,
    lunch_situation: null,
    snacking_possible: null,
    weekly_budget: null,
    cooking_preference: null,
    available_cook_time: null,
    meal_prep_preference: null,
    ...(value || {})
  })

  useEffect(() => {
    if (value) setData(prev => ({ ...prev, ...value }))
  }, [value])

  const update = (field, val) => {
    setData(prev => ({ ...prev, [field]: val }))
  }

  const toggleWorkDay = (dayId) => {
    const current = data.work_days || []
    const updated = current.includes(dayId)
      ? current.filter(d => d !== dayId)
      : [...current, dayId]
    update('work_days', updated)
  }

  const isComplete = data.work_situation && data.work_hours && data.lunch_situation
    && data.weekly_budget && data.cooking_preference && data.meal_prep_preference

  const handleConfirm = () => {
    if (!isComplete) return
    onChange(data)
  }

  return (
    <div>
      <QuestionRow label="Wat is je werksituatie?" isMobile={isMobile}>
        <OptionGrid options={WORK_SITUATIONS} selected={data.work_situation} onSelect={v => update('work_situation', v)} isMobile={isMobile} columns={3} />
      </QuestionRow>

      <QuestionRow label="Op welke dagen werk je?" isMobile={isMobile}>
        <DayToggles days={DAYS} selected={data.work_days || []} onToggle={toggleWorkDay} isMobile={isMobile} />
      </QuestionRow>

      <QuestionRow label="Wat zijn je werktijden?" isMobile={isMobile}>
        <OptionGrid options={WORK_HOURS} selected={data.work_hours} onSelect={v => update('work_hours', v)} isMobile={isMobile} columns={2} />
      </QuestionRow>

      <QuestionRow label="Hoe ziet je lunch eruit?" isMobile={isMobile}>
        <OptionGrid options={LUNCH_OPTIONS} selected={data.lunch_situation} onSelect={v => update('lunch_situation', v)} isMobile={isMobile} columns={1} />
      </QuestionRow>

      <QuestionRow label="Kun je tussendoor iets eten?" isMobile={isMobile}>
        <OptionGrid options={SNACKING_OPTIONS} selected={data.snacking_possible} onSelect={v => update('snacking_possible', v)} isMobile={isMobile} columns={3} />
      </QuestionRow>

      <QuestionRow label="Budget voor voeding per week?" isMobile={isMobile}>
        <OptionGrid options={BUDGET_OPTIONS} selected={data.weekly_budget} onSelect={v => update('weekly_budget', v)} isMobile={isMobile} columns={2} />
      </QuestionRow>

      <QuestionRow label="Hoe graag kook je?" isMobile={isMobile}>
        <OptionGrid options={COOK_OPTIONS} selected={data.cooking_preference} onSelect={v => update('cooking_preference', v)} isMobile={isMobile} columns={3} />
      </QuestionRow>

      <QuestionRow label="Hoeveel tijd per maaltijd om te koken?" isMobile={isMobile}>
        <OptionGrid options={COOK_TIME_OPTIONS} selected={data.available_cook_time} onSelect={v => update('available_cook_time', v)} isMobile={isMobile} columns={2} />
      </QuestionRow>

      <QuestionRow label="Hoe wil je je maaltijden bereiden?" isMobile={isMobile}>
        <OptionGrid options={PREP_OPTIONS} selected={data.meal_prep_preference} onSelect={v => update('meal_prep_preference', v)} isMobile={isMobile} columns={1} />
      </QuestionRow>

      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
        <button onClick={handleConfirm} disabled={!isComplete} style={{
          width: '100%', padding: r(isMobile, '0.65rem', '0.7rem'),
          background: isComplete ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isComplete ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
          borderRadius: '8px', color: isComplete ? '#FFD700' : t.colors.textMuted,
          fontSize: r(isMobile, '0.72rem', '0.76rem'), fontWeight: 800,
          cursor: isComplete ? 'pointer' : 'default', minHeight: '40px',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: isComplete ? 1 : 0.4, transition: 'all 0.2s ease'
        }}>
          {isComplete ? 'OPSLAAN EN DOOR' : 'VUL ALLE VELDEN IN'}
        </button>
      </div>
    </div>
  )
}

function QuestionRow({ label, children, isMobile }) {
  return (
    <div style={{ padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), fontWeight: 800, color: '#fff', marginBottom: r(isMobile, '0.35rem', '0.4rem') }}>{label}</div>
      {children}
    </div>
  )
}

function OptionGrid({ options, selected, onSelect, isMobile, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: r(isMobile, '0.3rem', '0.35rem') }}>
      {options.map(opt => {
        const sel = selected === opt.id
        return (
          <button key={opt.id} onClick={() => onSelect(opt.id)} style={{
            padding: r(isMobile, '0.5rem 0.5rem', '0.55rem 0.6rem'),
            background: sel ? 'rgba(255,215,0,0.06)' : t.colors.inputBg,
            border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
            borderRadius: '8px', color: sel ? '#FFD700' : t.colors.textSecondary,
            fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: sel ? 800 : 600,
            cursor: 'pointer', minHeight: '40px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease', textAlign: 'center', fontFamily: 'inherit'
          }}>{opt.label}</button>
        )
      })}
    </div>
  )
}

function DayToggles({ days, selected, onToggle, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: r(isMobile, '0.25rem', '0.3rem') }}>
      {days.map(day => {
        const sel = selected.includes(day.id)
        return (
          <button key={day.id} onClick={() => onToggle(day.id)} style={{
            flex: 1, padding: r(isMobile, '0.45rem 0', '0.5rem 0'),
            background: sel ? 'rgba(255,215,0,0.08)' : t.colors.inputBg,
            border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : t.colors.borderVisible}`,
            borderRadius: '6px', color: sel ? '#FFD700' : t.colors.textMuted,
            fontSize: r(isMobile, '0.6rem', '0.65rem'), fontWeight: sel ? 800 : 600,
            cursor: 'pointer', minHeight: '36px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.15s ease', fontFamily: 'inherit'
          }}>{day.label}</button>
        )
      })}
    </div>
  )
}
