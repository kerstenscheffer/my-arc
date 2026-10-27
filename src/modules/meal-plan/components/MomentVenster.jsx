// src/modules/meal-plan/components/MomentVenster.jsx
//
// Moment van een maaltijd aanpassen (soort + tijd) door de klant. Eén op één
// het venster van de coach in de Plan Analyzer (plan-analyzer/MealCard.jsx,
// MomentVenster), op verzoek van Kersten (27 okt 2026). Opent direct onder
// de foto waar je op tikte.
//
// Bewaren: 'dag' = alleen deze weekdag, 'overal' = waar deze maaltijd staat.
// Bij een pre-workout geen tijd: die volgt de training.
import React, { useState } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'

// Zelfde lijst als de coach.
const LABEL_OPTIONS = [
  'Ontbijt', 'Lunch', 'Diner', 'Pre Workout Meal', 'After Workout Meal', 'Snack', 'Avondsnack', 'Fruit',
]

export default function MomentVenster({ label, tijd, metTijd = true, pos, bezig = false, onClose, onSave }) {
  const BREED = 300, HOOG = 150
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min((pos?.left || 8), vw - BREED - 8))
  const top = (pos?.top || 8) + HOOG > vh - 8 ? Math.max(8, (pos?.boven || 0) - HOOG - 6) : (pos?.top || 8)
  const [l, setL] = useState(label || '')
  const [t, setT] = useState(tijd || '')
  const [lijstOpen, setLijstOpen] = useState(false)
  return (
    <div onClick={() => !bezig && onClose?.()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent' }}>
      <style>{'@keyframes momentIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } } .mv-tijd::-webkit-calendar-picker-indicator { display: none } .mv-tijd::-webkit-datetime-edit { padding: 0 }'}</style>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top, left, width: BREED, maxWidth: 'calc(100vw - 16px)', background: '#141414', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '0.75rem', boxShadow: '0 18px 44px rgba(0,0,0,0.7)', fontFamily: "'DM Sans', sans-serif", animation: 'momentIn 0.16s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Moment aanpassen</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        </div>
        {/* Soort en tijd op één regel, zonder vakken: bold witte tekst. De
            soort klapt een mini-lijstje uit; de tijd is het systeem-tijdveld
            zonder klokje (tikken opent het wiel). */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, margin: '4px 0 12px' }}>
          <button onClick={() => setLijstOpen(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: 0, background: 'none', border: 'none',
            color: '#fff', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', minWidth: 0,
          }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l || 'Kies soort'}</span>
            <ChevronDown size={16} strokeWidth={3} style={{ flexShrink: 0, transition: 'transform 0.15s ease', transform: lijstOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          {metTijd && (
            // Tijd direct achter de soort, met hetzelfde pijltje: ook een keuze.
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <input className="mv-tijd" type="time" value={t} onChange={e => setT(e.target.value)} style={{
                width: 52, padding: 0, background: 'none', border: 'none', color: '#fff',
                fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark', cursor: 'pointer',
              }} />
              <ChevronDown size={16} strokeWidth={3} color="#fff" style={{ flexShrink: 0 }} />
            </label>
          )}
          {lijstOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 2, minWidth: 180,
              background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 4,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            }}>
              {[...(LABEL_OPTIONS.some(o => o.toLowerCase() === String(l).toLowerCase()) || !l ? [] : [l]), ...LABEL_OPTIONS].map(o => {
                const aan = String(l).toLowerCase() === o.toLowerCase()
                return (
                  <button key={o} onClick={() => { setL(o); setLijstOpen(false) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    height: 34, padding: '0 0.6rem', borderRadius: 7, border: 'none',
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff',
                    fontSize: '0.84rem', fontWeight: aan ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                  }}>{o}{aan && <Check size={14} strokeWidth={3} />}</button>
                )
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button disabled={bezig} onClick={() => onSave(l, t, 'dag')} style={{ minHeight: 34, borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer' }}>Alleen deze dag</button>
          <button disabled={bezig} onClick={() => onSave(l, t, 'overal')} style={{ minHeight: 34, borderRadius: 8, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 900, cursor: 'pointer' }}>Overal waar hij staat</button>
        </div>
      </div>
    </div>
  )
}
