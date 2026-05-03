// src/modules/public-intake/components/phase3/PracticalFlow.jsx
import React, { useState, useRef } from 'react'
import { Q, Hint, NextBtn, BackBtn, BigOption, OptionGrid } from '../phase1/FlowStep'

const DURATION_OPTIONS = [
  { value: 30,  label: '30–45 min', sub: 'Weinig tijd, kort en krachtig' },
  { value: 45,  label: '45–60 min', sub: 'Compact maar compleet' },
  { value: 60,  label: '60–75 min', sub: 'Ruim de tijd voor een goede sessie' },
  { value: 90,  label: '75–90 min', sub: 'Uitgebreid, geen tijdsdruk' },
]

const LOCATION_OPTIONS = [
  { value: 'gym',  label: 'Sportschool',  sub: 'Alle apparatuur beschikbaar' },
  { value: 'home', label: 'Thuis',        sub: 'Eigen apparatuur of bodyweight' },
  { value: 'both', label: 'Mix',          sub: 'Soms gym, soms thuis' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'dumbbells',        label: 'Dumbbells' },
  { value: 'barbell',          label: 'Stang & schijven' },
  { value: 'bench',            label: 'Bankje' },
  { value: 'pullup_bar',       label: 'Pull-up stang' },
  { value: 'cables',           label: 'Kabelmachine' },
  { value: 'kettlebells',      label: 'Kettlebells' },
  { value: 'resistance_bands', label: 'Weerstandsbanden' },
  { value: 'cardio_machine',   label: 'Cardio apparaat' },
]

export default function PracticalFlow({ data, onChange, isMobile, onNext, onBack, isBeginner }) {
  const [step, setStep] = useState('duration')
  const history = useRef([])

  const update = (field, value) => onChange({ ...data, [field]: value })

  const go = (next) => {
    history.current.push(step)
    setStep(next)
  }

  const back = () => {
    if (history.current.length > 0) {
      setStep(history.current.pop())
    } else if (onBack) {
      onBack()
    }
  }

  if (step === 'duration') {
    return (
      <div>
        <Q isMobile={isMobile}>Hoe lang zou je kunnen trainen per sessie?</Q>
        <Hint isMobile={isMobile}>Dit helpt ons je schema realistisch in te delen.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {DURATION_OPTIONS.map(opt => (
            <BigOption
              key={opt.value}
              label={opt.label}
              sub={opt.sub}
              selected={data.time_per_session === opt.value}
              onClick={() => {
                update('time_per_session', opt.value)
                setTimeout(() => go('location'), 150)
              }}
              isMobile={isMobile}
            />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'location') {
    return (
      <div>
        <Q isMobile={isMobile}>{isBeginner ? 'Waar wil je gaan trainen?' : 'Waar train je?'}</Q>
        <Hint isMobile={isMobile}>We stemmen je schema af op je trainingslocatie.</Hint>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {LOCATION_OPTIONS.map(opt => (
            <BigOption
              key={opt.value}
              label={opt.label}
              sub={opt.sub}
              selected={data.training_location === opt.value}
              onClick={() => {
                if (opt.value === 'gym') {
                  // Gym = volledige apparatuur beschikbaar, geen aparte equipment stap nodig
                  onChange({ ...data, training_location: 'gym', equipment: ['full_gym'] })
                  setTimeout(() => go('gym_name'), 150)
                } else if (opt.value === 'both') {
                  // Mix = gym apparatuur als basis, thuis equipment wordt aangevuld
                  onChange({ ...data, training_location: 'both', equipment: ['full_gym'] })
                  setTimeout(() => go('equipment'), 150)
                } else {
                  // Thuis = handmatig equipment kiezen
                  update('training_location', opt.value)
                  setTimeout(() => go('equipment'), 150)
                }
              }}
              isMobile={isMobile}
            />
          ))}
        </div>
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'gym_name') {
    return (
      <div>
        <Q isMobile={isMobile}>Bij welke sportschool train je?</Q>
        <Hint isMobile={isMobile}>Optioneel — vul in als je wilt.</Hint>
        <input
          type="text"
          value={data.gym_name || ''}
          onChange={e => update('gym_name', e.target.value)}
          placeholder="Bijv. Basic-Fit, Anytime Fitness..."
          style={{
            width: '100%', padding: isMobile ? '0.75rem' : '0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${data.gym_name ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px',
            color: data.gym_name ? '#FFD700' : '#fff',
            fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            marginTop: '1rem'
          }}
        />
        <NextBtn
          onClick={() => {
            console.log('✅ PracticalFlow onNext — gym name, equipment:', data.equipment)
            onNext()
          }}
          isMobile={isMobile}
          label="Verder"
        />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  if (step === 'equipment') {
    const selected = data.equipment || []
    const allIds = EQUIPMENT_OPTIONS.map(o => o.value)
    const allSelected = allIds.every(id => selected.includes(id))

    const toggleEquipment = (val) => {
      const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]
      update('equipment', next)
    }

    const handleSelectAll = () => {
      update('equipment', allSelected ? [] : allIds)
    }

    return (
      <div>
        <Q isMobile={isMobile}>Welke apparatuur heb je tot je beschikking?</Q>
        <Hint isMobile={isMobile}>Selecteer alles wat je hebt of kunt gebruiken.</Hint>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: isMobile ? '0.6rem' : '0.63rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, flex: 1 }}>
            {selected.filter(v => v !== 'full_gym').length} geselecteerd
          </span>
          <button onClick={handleSelectAll} style={{
            background: 'transparent', border: 'none',
            color: allSelected ? 'rgba(255,215,0,0.45)' : 'rgba(255,215,0,0.7)',
            fontSize: '0.52rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', padding: '0.1rem 0.25rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}>
            {allSelected ? 'Deselecteer alles' : 'Selecteer alles'}
          </button>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '0.5rem'
        }}>
          {EQUIPMENT_OPTIONS.map(opt => {
            const sel = selected.includes(opt.value)
            return (
              <button key={opt.value} onClick={() => toggleEquipment(opt.value)} style={{
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                background: sel ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${sel ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: sel ? '#FFD700' : 'rgba(255,255,255,0.55)',
                fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: sel ? 700 : 600,
                cursor: 'pointer', minHeight: '44px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease', fontFamily: 'inherit', textAlign: 'left'
              }}>
                {sel && <span style={{ marginRight: '0.3rem', fontSize: '0.5rem' }}>✓</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
        <NextBtn
          onClick={() => {
            console.log('✅ PracticalFlow onNext — equipment:', data.equipment)
            onNext()
          }}
          disabled={selected.filter(v => v !== 'full_gym').length === 0}
          isMobile={isMobile}
        />
        <BackBtn onBack={back} isMobile={isMobile} />
      </div>
    )
  }

  return null
}
