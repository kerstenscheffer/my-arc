// src/modules/meal-plan/components/food-log/QuickAddTab.jsx
// 🎯 Snel toevoegen — direct macros invoeren zonder zoeken
import React, { useState } from 'react'
import { Check } from 'lucide-react'

const MEAL_MOMENTS = [
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Avondeten' },
  { id: 'snack', label: 'Tussendoortjes' }
]

const getDefaultMoment = () => {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 20) return 'dinner'
  return 'snack'
}

export default function QuickAddTab({ onLog, isMobile }) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [mealMoment, setMealMoment] = useState(getDefaultMoment())
  const [saving, setSaving] = useState(false)

  const cal = parseInt(calories) || 0
  const canSave = cal > 0 || (parseInt(protein) || 0) > 0

  const handleLog = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onLog({
        name: name.trim() || 'Snel toevoegen',
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        type: 'quick_add',
        source: 'quick_add',
        meal_type: mealMoment,
        per100g: false
      })
    } catch {
      setSaving(false)
    }
  }

  const Row = ({ label, value, onChange, placeholder, autoFocus }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      minHeight: '48px'
    }}>
      <div style={{
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)'
      }}>
        {label}
      </div>
      <input
        type={label === 'Naam' ? 'text' : 'number'}
        inputMode={label === 'Naam' ? 'text' : 'numeric'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => { if (label !== 'Naam') e.target.select() }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: label === 'Naam' ? '180px' : '80px',
          padding: '0.5rem',
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          textAlign: label === 'Naam' ? 'left' : 'right',
          outline: 'none',
          minHeight: '36px'
        }}
      />
    </div>
  )

  const currentMealLabel = MEAL_MOMENTS.find(m => m.id === mealMoment)?.label

  return (
    <div>
      {/* Naam */}
      <Row label="Naam" value={name} onChange={setName} placeholder="Optioneel" />

      {/* Macros */}
      <Row label="Calorieën" value={calories} onChange={setCalories} placeholder="0" />
      <Row label="Eiwit (g)" value={protein} onChange={setProtein} placeholder="0" />
      <Row label="Koolhydraten (g)" value={carbs} onChange={setCarbs} placeholder="0" />
      <Row label="Vetten (g)" value={fat} onChange={setFat} placeholder="0" />

      {/* Maaltijd */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        minHeight: '48px'
      }}>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Maaltijd
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {MEAL_MOMENTS.map(m => (
            <button
              key={m.id}
              onClick={() => setMealMoment(m.id)}
              style={{
                padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.625rem',
                background: mealMoment === m.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                border: mealMoment === m.id
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                color: mealMoment === m.id ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                fontSize: isMobile ? '0.55rem' : '0.6rem',
                fontWeight: mealMoment === m.id ? '700' : '500',
                cursor: 'pointer', minHeight: '28px',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registreer */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem 1.5rem'
      }}>
        <button
          onClick={handleLog}
          disabled={saving || !canSave}
          style={{
            width: '100%', padding: isMobile ? '0.875rem' : '1rem',
            background: (saving || !canSave) ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: isMobile ? '10px' : '12px',
            color: '#10b981',
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800', cursor: (saving || !canSave) ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', minHeight: '48px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            opacity: (saving || !canSave) ? 0.4 : 1
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          {saving ? 'Opslaan...' : `Registreer${cal > 0 ? ` — ${cal} kcal` : ''}`}
        </button>
      </div>
    </div>
  )
}
