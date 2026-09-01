// src/modules/nutrition-intake/components/nutrition-flow/CurrentMealsFlow.jsx
// Stap 0: Huidige eetgewoonten — wat eet je op een typische dag?
// Vaste structuur (4 slots) met toevoeg-optie, vrije tekst + suggesties
import React, { useState, useRef, useEffect } from 'react'
import { Q, Hint, NextBtn, BackBtn } from '../../../public-intake/components/phase1/FlowStep'

const SUGGESTIONS = {
  ontbijt: [
    'Havermout', 'Brood met kaas', 'Brood met pindakaas', 'Yoghurt met granola',
    'Eieren', 'Kwark', 'Croissant', 'Smoothie', 'Fruit', 'Cornflakes met melk',
    'Skyr met fruit', 'Eiwitshake', 'Niks / sla ontbijt over',
  ],
  lunch: [
    'Brood met beleg', 'Salade', 'Soep', 'Wrap', 'Restjes avondeten',
    'Rijst met groenten', 'Pasta', 'Kwark', 'Niks / sla lunch over',
  ],
  diner: [
    'Aardappelen, groenten en vlees', 'Pasta', 'Rijst met kip', 'Pizza',
    'Wrap / burrito', 'Stamppot', 'Roerbakgerecht', 'Vis met groenten',
    'Soep', 'Eiwitrijke salade', 'Besteld eten / afhaal',
  ],
  snack: [
    'Fruit', 'Yoghurt', 'Noten', 'Kwark', 'Eiwitreep', 'Rijstwafels',
    'Chips of koekjes', 'Snoep', 'Brood of cracker', 'Kaas', 'Niks / geen snacks',
  ],
}

const BASE_SLOTS = [
  { key: 'ontbijt', label: 'Ontbijt',    placeholder: 'Bijv: havermout met banaan en melk' },
  { key: 'lunch',   label: 'Lunch',      placeholder: 'Bijv: 2 boterhammen met kaas' },
  { key: 'diner',   label: 'Diner',      placeholder: 'Bijv: rijst, kip en broccoli' },
  { key: 'snack',   label: 'Snack',      placeholder: 'Bijv: kwark met fruit' },
]

function MealSlot({ slotKey, label, placeholder, value, onChange, isMobile, removable, onRemove }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const suggestions = SUGGESTIONS[slotKey] || SUGGESTIONS.snack

  const appendSuggestion = (s) => {
    const current = value || ''
    const separator = current.trim() ? ', ' : ''
    onChange(current.trim() + separator + s)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <div style={{ fontSize: isMobile ? '0.72rem' : '0.75rem', fontWeight: 800, color: 'rgba(255,215,0,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </div>
        {removable && (
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', cursor: 'pointer', padding: '0', fontFamily: 'inherit', touchAction: 'manipulation' }}>
            ✕ verwijder
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 0.9rem',
            fontSize: isMobile ? '0.82rem' : '0.85rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,215,0,0.15)',
            color: '#fff', fontFamily: 'inherit',
            lineHeight: 1.5, resize: 'vertical',
            outline: 'none', transition: 'border-color 0.15s ease',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.35)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.15)' }}
        />
        <button
          onClick={() => setShowSuggestions(p => !p)}
          style={{
            position: 'absolute', bottom: '0.45rem', right: '0.5rem',
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
            color: 'rgba(255,215,0,0.6)', fontSize: '0.58rem', fontWeight: 800,
            cursor: 'pointer', padding: '0.2rem 0.5rem', fontFamily: 'inherit',
            letterSpacing: '0.04em', touchAction: 'manipulation',
          }}
        >
          {showSuggestions ? 'SLUIT' : 'SUGGESTIES'}
        </button>
      </div>
      {showSuggestions && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => appendSuggestion(s)}
              style={{
                background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)',
                color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? '0.67rem' : '0.7rem',
                fontWeight: 600, cursor: 'pointer', padding: '0.25rem 0.6rem',
                fontFamily: 'inherit', touchAction: 'manipulation',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.14)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.07)' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CurrentMealsFlow({ data, onChange, onNext, onBack, isMobile }) {
  const [extraSlots, setExtraSlots] = useState(() => {
    const count = parseInt(data.current_meals_extra_count || '0', 10)
    return Array.from({ length: count }, (_, i) => i)
  })
  const [nextId, setNextId] = useState(extraSlots.length)

  const handleChange = (key, val) => onChange({ ...data, [key]: val })

  const addExtraSlot = () => {
    setExtraSlots(p => [...p, nextId])
    setNextId(p => p + 1)
    onChange({ ...data, current_meals_extra_count: String(extraSlots.length + 1) })
  }

  const removeExtraSlot = (id) => {
    const remaining = extraSlots.filter(x => x !== id)
    setExtraSlots(remaining)
    // Compact remaining data
    const next = { ...data, current_meals_extra_count: String(remaining.length) }
    remaining.forEach((origId, newIdx) => {
      next[`current_meals_extra_${newIdx}`] = data[`current_meals_extra_${origId}`] || ''
    })
    onChange(next)
  }

  const canContinue = BASE_SLOTS.some(s => (data[`current_meals_${s.key}`] || '').trim())

  return (
    <div style={{ padding: isMobile ? '1.5rem 1rem 2.5rem' : '2rem 1.25rem 3rem' }}>
      {onBack && <BackBtn onBack={onBack} />}

      <Q isMobile={isMobile}>Wat eet je op een typische dag?</Q>
      <Hint isMobile={isMobile}>
        Vul per maaltijdmoment in wat je normaal eet — zo vrij als je wil. Dit helpt je coach je huidige gewoonten begrijpen. Gebruik de suggesties als je inspiratie nodig hebt.
      </Hint>

      <div style={{ marginTop: '1.25rem' }}>
        {BASE_SLOTS.map(slot => (
          <MealSlot
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            placeholder={slot.placeholder}
            value={data[`current_meals_${slot.key}`]}
            onChange={val => handleChange(`current_meals_${slot.key}`, val)}
            isMobile={isMobile}
          />
        ))}

        {extraSlots.map((id, idx) => (
          <MealSlot
            key={id}
            slotKey="snack"
            label={`Extra snack ${idx + 1}`}
            placeholder="Bijv: proteïnerijpe, appel met nootjes"
            value={data[`current_meals_extra_${idx}`]}
            onChange={val => handleChange(`current_meals_extra_${idx}`, val)}
            isMobile={isMobile}
            removable
            onRemove={() => removeExtraSlot(id)}
          />
        ))}

        <button
          onClick={addExtraSlot}
          style={{
            background: 'transparent', border: '1px dashed rgba(255,215,0,0.2)',
            color: 'rgba(255,215,0,0.45)', fontSize: isMobile ? '0.72rem' : '0.75rem',
            fontWeight: 700, cursor: 'pointer', width: '100%',
            padding: '0.6rem', fontFamily: 'inherit', marginBottom: '1.25rem',
            letterSpacing: '0.04em', touchAction: 'manipulation',
          }}
        >
          + Extra snackmoment toevoegen
        </button>
      </div>

      <NextBtn
        onClick={onNext}
        label={canContinue ? 'VOLGENDE →' : 'OVERSLAAN →'}
        isMobile={isMobile}
      />
      {!canContinue && (
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
          Je mag dit overslaan — ook zonder invullen ga je door
        </div>
      )}
    </div>
  )
}
