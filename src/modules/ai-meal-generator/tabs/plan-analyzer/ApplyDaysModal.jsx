// src/modules/ai-meal-generator/tabs/plan-analyzer/ApplyDaysModal.jsx
// Past één bestaande meal (met huidige aanpassingen) toe op meerdere dagen.
// Opent in het dock-vak vanaf de "Dagen"-knop op een meal-card.

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, CalendarDays, Check } from 'lucide-react'

const DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export default function ApplyDaysModal({ meal, slot, dayIndex, trainingDays = [], onApply, onClose, isMobile, embedded = false }) {
  const modalHost = useModalHost()
  const m = isMobile
  const [selectedDays, setSelectedDays] = useState([dayIndex])
  const [applied, setApplied] = useState(false)

  const toggleDay = (i) => setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])
  const apply = () => {
    if (!selectedDays.length || applied) return
    setApplied(true)
    onApply(selectedDays)
    setTimeout(() => onClose(), 500)
  }

  const quick = [
    { label: 'Deze dag', days: [dayIndex] },
    { label: 'Alle dagen', days: [0, 1, 2, 3, 4, 5, 6] },
    ...(trainingDays.length ? [{ label: '💪 Trainingsdagen', days: [...trainingDays] }] : []),
    { label: 'Werkdagen', days: [0, 1, 2, 3, 4] },
    { label: 'Weekend', days: [5, 6] },
  ]
  const sameDays = (a) => a.length === selectedDays.length && a.every(d => selectedDays.includes(d))

  const modal = (
    <div onClick={embedded ? undefined : onClose} style={embedded
      ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0a0a0a' }
      : { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={embedded
        ? { background: '#0a0a0a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        : { background: '#0a0a0a', borderRadius: m ? '16px 16px 0 0' : '12px', width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.6rem 0.8rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800, fontSize: m ? '0.95rem' : '1.05rem', letterSpacing: '-0.01em' }}>
            <CalendarDays size={16} /> Toepassen op dagen
          </span>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: m ? '0.75rem 0.8rem' : '0.9rem 1rem' }}>
          {/* Meal preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.6rem', marginBottom: '0.9rem', background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8 }}>
            {meal?.image_url && <div style={{ width: 46, height: 38, borderRadius: 5, backgroundImage: `url(${meal.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: m ? '0.88rem' : '0.95rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal?.name || 'Maaltijd'}</div>
              <div style={{ fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {Math.round(meal?.calories || 0)} kcal · {Math.round(meal?.protein || 0)}g E
              </div>
            </div>
          </div>

          <div style={{ fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Welke dagen?</div>
          <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem' }}>
            {DAYS_SHORT.map((day, i) => {
              const on = selectedDays.includes(i)
              return (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  flex: 1, padding: m ? '0.6rem 0' : '0.7rem 0',
                  background: on ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${on ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, color: on ? '#FFD700' : 'rgba(255,255,255,0.6)',
                  fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 800,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 40,
                }}>{day}</button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
            {quick.map(q => {
              const on = sameDays(q.days)
              return (
                <button key={q.label} onClick={() => setSelectedDays(q.days)} style={{
                  padding: m ? '0.4rem 0.7rem' : '0.45rem 0.8rem',
                  background: on ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${on ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 999, color: on ? '#FFD700' : 'rgba(255,255,255,0.7)',
                  fontSize: m ? '0.72rem' : '0.76rem', fontWeight: 800,
                  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{q.label}</button>
              )
            })}
          </div>

          <button onClick={apply} disabled={!selectedDays.length} style={{
            width: '100%', padding: m ? '0.7rem' : '0.8rem',
            background: applied ? '#10b981' : (selectedDays.length ? '#FFD700' : 'rgba(255,255,255,0.05)'),
            border: 'none', borderRadius: 8,
            color: selectedDays.length || applied ? '#000' : 'rgba(255,255,255,0.25)',
            fontSize: m ? '0.85rem' : '0.9rem', fontWeight: 800,
            cursor: selectedDays.length ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            minHeight: 46, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            {applied ? <><Check size={16} /> Toegepast!</> : <><CalendarDays size={16} /> Toepassen op {selectedDays.length} dag{selectedDays.length !== 1 ? 'en' : ''}</>}
          </button>
        </div>
      </div>
    </div>
  )

  if (embedded) return modal
  return createPortal(modal, modalHost)
}
