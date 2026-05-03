// src/modules/ai-meal-generator/tabs/plan-analyzer/TimingModal.jsx
// v1.0 — Maaltijdtijden instellen voor de hele week in één keer

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, Check } from 'lucide-react'

const SLOT_CONFIG = {
  breakfast: { label: 'Ontbijt',          color: '#f59e0b', icon: '🌅', default: '07:30' },
  snack1:    { label: 'Snack 1',          color: '#6b7280', icon: '🥤', default: '10:30' },
  lunch:     { label: 'Lunch',            color: '#10b981', icon: '🍱', default: '13:00' },
  snack2:    { label: 'Snack 2',          color: '#f97316', icon: '⚡', default: '15:30' },
  dinner:    { label: 'Diner',            color: '#3b82f6', icon: '🍽️', default: '19:00' },
  snack3:    { label: 'Voor bed snack',   color: '#a855f7', icon: '🌙', default: '21:30' },
}

const SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']

export default function TimingModal({ weekData, onApply, onClose, isMobile }) {
  const m = isMobile

  // Initialiseer tijden vanuit bestaande data (eerste dag met een waarde per slot)
  const getInitialTimes = () => {
    const times = {}
    SLOTS.forEach(slot => {
      // Zoek eerste dag die een timing heeft voor dit slot
      let found = null
      for (const day of weekData) {
        const t = day.meals[slot]?.timing
        if (t && typeof t === 'string' && t.length > 0) { found = t; break }
      }
      times[slot] = found || SLOT_CONFIG[slot].default
    })
    return times
  }

  const [times, setTimes] = useState(getInitialTimes)
  const [applied, setApplied] = useState(false)

  // Welke slots zijn daadwerkelijk gebruikt in het plan
  const usedSlots = SLOTS.filter(slot => weekData.some(day => day.meals[slot]))

  const handleApply = () => {
    // Bouw updated weekData op met nieuwe tijden
    const updated = weekData.map(day => {
      const meals = { ...day.meals }
      usedSlots.forEach(slot => {
        if (meals[slot] && times[slot]) {
          meals[slot] = { ...meals[slot], timing: times[slot] }
        }
      })
      return { ...day, meals }
    })
    setApplied(true)
    onApply(updated)
    setTimeout(() => onClose(), 600)
  }

  const modal = (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 10000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a',
        borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: '480px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        borderBottom: 'none'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} color="#FFD700" />
            <div>
              <div style={{ fontSize: m ? '0.85rem' : '0.95rem', fontWeight: 800, color: '#fff' }}>
                Maaltijdtijden
              </div>
              <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.3)' }}>
                Wordt toegepast op alle 7 dagen
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}><X size={16} /></button>
        </div>

        {/* Slot tijden */}
        <div style={{ padding: m ? '0.5rem 0.75rem' : '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {usedSlots.map(slot => {
            const cfg = SLOT_CONFIG[slot]
            return (
              <div key={slot} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: m ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: '0 6px 6px 0'
              }}>
                <span style={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>{cfg.icon}</span>
                <span style={{ flex: 1, fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  {cfg.label}
                </span>
                <input
                  type="time"
                  value={times[slot] || cfg.default}
                  onChange={e => setTimes(prev => ({ ...prev, [slot]: e.target.value }))}
                  style={{
                    background: `${cfg.color}10`,
                    border: `1px solid ${cfg.color}30`,
                    borderRadius: '5px',
                    color: cfg.color,
                    fontSize: m ? '0.75rem' : '0.8rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.5rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: '90px'
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: m ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: '0.5rem'
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.5rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px', color: 'rgba(255,255,255,0.3)',
            fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '44px', fontFamily: 'inherit'
          }}>
            Annuleren
          </button>
          <button onClick={handleApply} style={{
            flex: 2, padding: '0.5rem',
            background: applied ? '#10b981' : '#FFD700',
            border: 'none', borderRadius: '6px',
            color: '#000', fontSize: '0.7rem', fontWeight: 800,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '44px', fontFamily: 'inherit',
            transition: 'background 0.2s ease'
          }}>
            {applied ? <><Check size={14} /> Toegepast!</> : <><Clock size={14} /> Toepassen op hele week</>}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
