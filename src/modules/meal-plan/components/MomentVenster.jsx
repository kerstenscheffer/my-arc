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
import { X } from 'lucide-react'
import Keuze from './Keuze'

// Zelfde lijst als de coach.
const LABEL_OPTIONS = [
  'Ontbijt', 'Lunch', 'Diner', 'Pre Workout Meal', 'After Workout Meal', 'Snack', 'Avondsnack', 'Fruit',
]

export default function MomentVenster({ label, tijd, metTijd = true, pos, isMobile, bezig = false, onClose, onSave }) {
  const BREED = 300, HOOG = 280
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min((pos?.left || 8), vw - BREED - 8))
  const top = (pos?.top || 8) + HOOG > vh - 8 ? Math.max(8, (pos?.boven || 0) - HOOG - 6) : (pos?.top || 8)
  const [l, setL] = useState(label || '')
  const [t, setT] = useState(tijd || '')
  return (
    <div onClick={() => !bezig && onClose?.()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent' }}>
      <style>{'@keyframes momentIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }'}</style>
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top, left, width: BREED, maxWidth: 'calc(100vw - 16px)', background: '#141414', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: '0.75rem', boxShadow: '0 18px 44px rgba(0,0,0,0.7)', fontFamily: "'DM Sans', sans-serif", animation: 'momentIn 0.16s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Moment aanpassen</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
        </div>
        {/* Soort als keuzemenu en tijd op één regel. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <Keuze waarde={l} zet={setL} isMobile={isMobile}
              opties={[...(LABEL_OPTIONS.some(o => o.toLowerCase() === String(l).toLowerCase()) ? [] : [{ id: l, label: l || 'Kies soort' }]), ...LABEL_OPTIONS.map(o => ({ id: o, label: o }))]} />
          </div>
          {metTijd && (
            <input type="time" value={t} onChange={e => setT(e.target.value)} style={{ width: 96, boxSizing: 'border-box', height: 34, padding: '0 0.5rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }} />
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
