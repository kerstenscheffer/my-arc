// src/modules/nutrition-intake/components/MealScheduleSection.jsx
// Meal Schedule - no emojis, flush styling, better contrast
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const TEMPLATES = {
  3: { times: ['08:00', '13:00', '18:00'], labels: ['Ontbijt', 'Lunch', 'Diner'], distribution: [0.35, 0.35, 0.30] },
  4: { times: ['07:00', '12:00', '16:00', '19:00'], labels: ['Ontbijt', 'Lunch', 'Pre-Workout', 'Diner'], distribution: [0.25, 0.30, 0.20, 0.25] },
  5: { times: ['07:00', '10:30', '13:00', '16:00', '19:00'], labels: ['Ontbijt', 'Snack', 'Lunch', 'Pre-Workout', 'Diner'], distribution: [0.20, 0.25, 0.15, 0.20, 0.20] },
  6: { times: ['07:00', '10:00', '13:00', '15:30', '18:00', '20:30'], labels: ['Ontbijt', 'Snack 1', 'Lunch', 'Pre-Workout', 'Diner', 'Avondsnack'], distribution: [0.20, 0.15, 0.20, 0.15, 0.20, 0.10] }
}

function getRecommended(cal) { return cal < 2500 ? 4 : cal < 3000 ? 5 : 6 }

export default function MealScheduleSection({ clientData, value, onChange, onComplete, isMobile }) {
  const [mode, setMode] = useState('locked')
  const [numMeals, setNumMeals] = useState(null)
  const [customTimes, setCustomTimes] = useState([])

  const recommended = clientData ? getRecommended(clientData.target_calories) : 4
  const template = TEMPLATES[numMeals || recommended]

  useEffect(() => {
    if (value) {
      setNumMeals(value.num_meals); setCustomTimes(value.times || [])
      if (value.custom_adjustments) setMode('custom')
    } else if (clientData) {
      setNumMeals(recommended); setCustomTimes(TEMPLATES[recommended].times)
    }
  }, [clientData, value])

  if (!clientData) return null
  const calsPerMeal = template.distribution.map(pct => Math.round(clientData.target_calories * pct))

  const handleAccept = () => {
    const tmpl = TEMPLATES[recommended]
    onChange({ num_meals: recommended, times: tmpl.times, labels: tmpl.labels, distribution: tmpl.distribution, caloriesPerMeal: tmpl.distribution.map(p => Math.round(clientData.target_calories * p)), custom_adjustments: null })
    onComplete(true)
  }

  const handleNumChange = (num) => {
    setNumMeals(num); const tmpl = TEMPLATES[num]; setCustomTimes(tmpl.times)
    onChange({ num_meals: num, times: tmpl.times, labels: tmpl.labels, distribution: tmpl.distribution, caloriesPerMeal: tmpl.distribution.map(p => Math.round(clientData.target_calories * p)), custom_adjustments: 'Aantal aangepast' })
    onComplete(true)
  }

  const handleTimeChange = (index, newTime) => {
    const updated = [...customTimes]; updated[index] = newTime; setCustomTimes(updated)
    const tmpl = TEMPLATES[numMeals]
    onChange({ num_meals: numMeals, times: updated, labels: tmpl.labels, distribution: tmpl.distribution, caloriesPerMeal: tmpl.distribution.map(p => Math.round(clientData.target_calories * p)), custom_adjustments: 'Tijden aangepast' })
  }

  return (
    <div>
      {/* LOCKED MODE */}
      {mode === 'locked' && (
        <div>
          {template.labels.map((label, i) => (
            <div key={i} style={{
              display: 'flex',
              padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'),
              borderBottom: `1px solid ${t.colors.border}`,
              alignItems: 'center'
            }}>
              <div style={{
                width: r(isMobile, '42px', '50px'),
                fontSize: r(isMobile, '0.75rem', '0.8rem'), fontWeight: 800,
                color: t.colors.gold, flexShrink: 0
              }}>{template.times[i]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: 700, color: t.colors.white }}>{label}</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: '0.05rem' }}>
                <span style={{ fontSize: r(isMobile, '0.75rem', '0.8rem'), fontWeight: 800, color: t.colors.textSecondary }}>{calsPerMeal[i]}</span>
                <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4 }}>kcal</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.5rem', padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
            <button onClick={handleAccept} style={{
              flex: 1, padding: r(isMobile, '0.7rem 0', '0.8rem 0'),
              background: t.colors.gold, border: 'none', borderRadius: '8px',
              color: '#000', fontSize: r(isMobile, '0.75rem', '0.8rem'), fontWeight: 800,
              cursor: 'pointer', minHeight: '44px',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >Dit klopt</button>
            <button onClick={() => setMode('custom')} style={{
              flex: 1, padding: r(isMobile, '0.7rem 0', '0.8rem 0'),
              background: 'transparent', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '8px',
              color: t.colors.white, fontSize: r(isMobile, '0.75rem', '0.8rem'), fontWeight: 700,
              cursor: 'pointer', minHeight: '44px',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >Aanpassen</button>
          </div>
        </div>
      )}

      {/* CUSTOM MODE */}
      {mode === 'custom' && (
        <div>
          <div style={{ padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'), borderBottom: `1px solid ${t.colors.border}` }}>
            <div style={{ fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.gold, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Hoeveel maaltijden per dag?
            </div>
            <div style={{ display: 'flex', gap: r(isMobile, '0.4rem', '0.5rem') }}>
              {[3, 4, 5, 6].map(num => {
                const isSelected = num === numMeals
                const isRec = num === recommended
                return (
                  <button key={num} onClick={() => handleNumChange(num)} style={{
                    flex: 1, padding: r(isMobile, '0.6rem 0', '0.7rem 0'),
                    background: isSelected ? t.colors.gold : t.colors.inputBg,
                    border: `1px solid ${isSelected ? t.colors.gold : isRec ? t.colors.borderGold : t.colors.borderVisible}`,
                    borderRadius: '6px', color: isSelected ? '#000' : t.colors.white,
                    fontSize: r(isMobile, '0.9rem', '0.95rem'), fontWeight: 800,
                    cursor: 'pointer', position: 'relative', minHeight: '40px',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
                  }}>
                    {num}
                    {isRec && !isSelected && (
                      <div style={{
                        position: 'absolute', top: '-6px', right: '-4px',
                        fontSize: '0.4rem', fontWeight: 800, color: '#000',
                        background: t.colors.gold, padding: '0.1rem 0.25rem', borderRadius: '3px'
                      }}>TIP</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {numMeals && TEMPLATES[numMeals].labels.map((label, i) => (
            <div key={i} style={{
              display: 'flex',
              padding: r(isMobile, '0.5rem 1rem', '0.6rem 1.25rem'),
              borderBottom: `1px solid ${t.colors.border}`,
              alignItems: 'center', gap: r(isMobile, '0.5rem', '0.75rem')
            }}>
              <div style={{ flex: 1, fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: 700, color: t.colors.white }}>{label}</div>
              <input type="time" value={customTimes[i] || TEMPLATES[numMeals].times[i]}
                onChange={(e) => handleTimeChange(i, e.target.value)}
                style={{
                  padding: r(isMobile, '0.35rem 0.5rem', '0.4rem 0.6rem'),
                  background: t.colors.inputBg, border: `1px solid ${t.colors.borderGold}`,
                  borderRadius: '6px', color: t.colors.gold,
                  fontSize: r(isMobile, '0.8rem', '0.85rem'), fontWeight: 800,
                  outline: 'none', textAlign: 'center', fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.05rem', flexShrink: 0, width: '55px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: r(isMobile, '0.7rem', '0.75rem'), fontWeight: 800, color: t.colors.textSecondary }}>{calsPerMeal[i]}</span>
                <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4 }}>kcal</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {value && (
        <div style={{
          padding: r(isMobile, '0.35rem 1rem', '0.4rem 1.25rem'),
          background: t.colors.greenBg, fontSize: r(isMobile, '0.55rem', '0.6rem'), fontWeight: 700, color: t.colors.green
        }}>
          {value.num_meals} maaltijden per dag{value.custom_adjustments ? ` (${value.custom_adjustments.toLowerCase()})` : ''}
        </div>
      )}
    </div>
  )
}
