// src/modules/nutrition-intake/components/PracticalSection.jsx
// Practical info - no emojis, questions, better contrast inputs
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

export default function PracticalSection({ value, onChange, onComplete, isMobile }) {
  const [breakfastLoc, setBreakfastLoc] = useState('')
  const [lunchLoc, setLunchLoc] = useState('')
  const [dinnerLoc, setDinnerLoc] = useState('')
  const [cooking, setCooking] = useState('')
  const [variety, setVariety] = useState('repetitive')
  const [allergies, setAllergies] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (value) {
      setBreakfastLoc(value.breakfast_location || ''); setLunchLoc(value.lunch_location || '')
      setDinnerLoc(value.dinner_location || ''); setCooking(value.cooking_preference || '')
      setVariety(value.variety_preference || 'repetitive'); setAllergies(value.allergies || ''); setNotes(value.notes || '')
    }
  }, [value])

  useEffect(() => { onComplete(breakfastLoc && lunchLoc && dinnerLoc && cooking) }, [breakfastLoc, lunchLoc, dinnerLoc, cooking])

  const handleChange = (field, val) => {
    const updates = {
      breakfast_location: breakfastLoc, lunch_location: lunchLoc, dinner_location: dinnerLoc,
      cooking_preference: cooking, variety_preference: variety, allergies, notes, [field]: val
    }
    switch (field) {
      case 'breakfast_location': setBreakfastLoc(val); break; case 'lunch_location': setLunchLoc(val); break
      case 'dinner_location': setDinnerLoc(val); break; case 'cooking_preference': setCooking(val); break
      case 'variety_preference': setVariety(val); break; case 'allergies': setAllergies(val); break
      case 'notes': setNotes(val); break
    }
    onChange(updates)
  }

  const isComplete = breakfastLoc && lunchLoc && dinnerLoc && cooking

  const OptionRow = ({ label, field, options, currentValue }) => (
    <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{
        fontSize: r(isMobile, '0.6rem', '0.65rem'), fontWeight: 800, color: '#fff', marginBottom: '0.4rem'
      }}>{label}</div>
      <div style={{ display: 'flex', gap: r(isMobile, '0.3rem', '0.4rem'), flexWrap: 'wrap' }}>
        {options.map(opt => {
          const isSelected = currentValue === opt
          return (
            <button key={opt} onClick={() => handleChange(field, opt)} style={{
              padding: r(isMobile, '0.45rem 0.65rem', '0.5rem 0.8rem'),
              background: isSelected ? t.colors.gold : t.colors.inputBg,
              border: `1px solid ${isSelected ? t.colors.gold : t.colors.borderVisible}`,
              borderRadius: '6px', color: isSelected ? '#000' : t.colors.textSecondary,
              fontSize: r(isMobile, '0.7rem', '0.74rem'), fontWeight: isSelected ? 800 : 600,
              cursor: 'pointer', minHeight: '32px', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease'
            }}>{opt}</button>
          )
        })}
      </div>
    </div>
  )

  const OptionCard = ({ label, field, options, currentValue }) => (
    <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
      <div style={{
        fontSize: r(isMobile, '0.6rem', '0.65rem'), fontWeight: 800, color: '#fff', marginBottom: '0.4rem'
      }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: r(isMobile, '0.3rem', '0.4rem') }}>
        {options.map(opt => {
          const isSelected = currentValue === opt.value
          return (
            <button key={opt.value} onClick={() => handleChange(field, opt.value)} style={{
              display: 'flex', alignItems: 'center', gap: r(isMobile, '0.5rem', '0.6rem'),
              padding: r(isMobile, '0.5rem 0.6rem', '0.6rem 0.75rem'),
              background: isSelected ? t.colors.goldBgStrong : t.colors.inputBg,
              border: `1px solid ${isSelected ? t.colors.borderGoldActive : t.colors.borderVisible}`,
              borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease', textAlign: 'left'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                border: `2px solid ${isSelected ? t.colors.gold : 'rgba(255,255,255,0.15)'}`,
                background: isSelected ? t.colors.gold : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {isSelected && <span style={{ fontSize: '10px', fontWeight: 800, color: '#000' }}>{'\u2713'}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: r(isMobile, '0.78rem', '0.82rem'), fontWeight: 700, color: isSelected ? t.colors.white : t.colors.textSecondary }}>{opt.label}</div>
                <div style={{ fontSize: r(isMobile, '0.5rem', '0.55rem'), color: t.colors.textMuted, marginTop: '0.05rem' }}>{opt.subtitle}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      <OptionRow label="Waar eet je ontbijt?" field="breakfast_location" options={['Thuis', 'Op werk', 'Onderweg']} currentValue={breakfastLoc} />
      <OptionRow label="Waar eet je lunch?" field="lunch_location" options={['Thuis (meal prep)', 'Kantine', 'Onderweg']} currentValue={lunchLoc} />
      <OptionRow label="Hoe eet je je diner?" field="dinner_location" options={['Zelf gekookt', 'Iemand anders kookt', 'Restaurant']} currentValue={dinnerLoc} />

      <OptionCard label="Hoe graag kook je?" field="cooking_preference" currentValue={cooking} options={[
        { value: 'niet_graag', label: 'Ik kook niet graag', subtitle: 'Focus op meal prep en simpel' },
        { value: 'neutraal', label: 'Neutraal', subtitle: 'Mix van prep en vers' },
        { value: 'graag', label: 'Ik kook graag', subtitle: 'Verse variatie welkom' }
      ]} />

      <OptionCard label="Hoeveel variatie wil je in je maaltijden?" field="variety_preference" currentValue={variety} options={[
        { value: 'repetitive', label: 'Herhalend', subtitle: 'Zelfde maaltijden elke week — makkelijk vol te houden' },
        { value: 'abab', label: 'A/B patroon', subtitle: '2 sets die afwisselen — beetje variatie' },
        { value: 'varied', label: 'Gevarieerd', subtitle: 'Elke week andere recepten — maximale afwisseling' }
      ]} />

      {/* Extra allergies */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
        <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
          Nog andere restricties die we moeten weten?
        </div>
        <input type="text" value={allergies} onChange={(e) => handleChange('allergies', e.target.value)}
          placeholder="Bijv: Lactose-intolerant, Noten allergie"
          style={{
            width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
            background: t.colors.inputBg, border: `1px solid ${allergies ? 'rgba(255,215,0,0.25)' : t.colors.borderVisible}`,
            borderRadius: '8px', color: allergies ? '#FFD700' : t.colors.white,
            fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: allergies ? 800 : 600,
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
          }}
          onFocus={e => { e.target.style.borderColor = '#FFD700' }}
          onBlur={e => { e.target.style.borderColor = allergies ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Notes */}
      <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem') }}>
        <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
          Wil je nog iets kwijt?
        </div>
        <textarea value={notes} onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Alles wat we nog moeten weten..."
          rows={2} style={{
            width: '100%', padding: r(isMobile, '0.6rem 0.75rem', '0.65rem 0.85rem'),
            background: t.colors.inputBg, border: `1px solid ${t.colors.borderVisible}`,
            borderRadius: '8px', color: t.colors.white,
            fontSize: r(isMobile, '0.8rem', '0.85rem'), fontFamily: 'inherit',
            outline: 'none', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box'
          }}
          onFocus={e => { e.target.style.borderColor = '#FFD700' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {isComplete && (
        <div style={{
          padding: r(isMobile, '0.35rem 1rem', '0.4rem 1.25rem'),
          background: t.colors.greenBg, fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.green
        }}>Praktische info compleet</div>
      )}
    </div>
  )
}
