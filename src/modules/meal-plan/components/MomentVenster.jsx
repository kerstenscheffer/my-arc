// src/modules/meal-plan/components/MomentVenster.jsx
//
// Klein venster om het moment van een maaltijd aan te passen: welke soort
// ("Lunch", "Pre Workout Meal") en hoe laat. Zelfde venster als de coach in de
// Plan Analyzer heeft (27 okt 2026), nu voor de klant. Opent direct onder de
// foto waar je op tikte.
//
// Bewaren kan voor alleen deze weekdag of overal waar deze maaltijd staat.
// Bij een pre-workout geen tijd: die volgt de training.
import React, { useState } from 'react'
import { X } from 'lucide-react'
import Keuze from './Keuze'

const LABEL_OPTIES = ['Ontbijt', 'Lunch', 'Diner', 'Pre Workout Meal', 'After Workout Meal', 'Snack', 'Avondsnack', 'Fruit']

export default function MomentVenster({ label, tijd, metTijd = true, dagNaam, pos, isMobile, bezig = false, onClose, onSave }) {
  const BREED = 300, HOOG = 200
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min((pos?.left || 8), vw - BREED - 8))
  const top = (pos?.top || 8) + HOOG > vh - 8 ? Math.max(8, (pos?.boven || 0) - HOOG - 6) : (pos?.top || 8)
  const [l, setL] = useState(label || '')
  const [t, setT] = useState(tijd || '')
  const opties = [
    ...(LABEL_OPTIES.some(o => o.toLowerCase() === String(l).toLowerCase()) ? [] : [{ id: l, label: l || 'Kies soort' }]),
    ...LABEL_OPTIES.map(o => ({ id: o, label: o })),
  ]
  const knop = (vol) => ({
    minHeight: 36, borderRadius: 9, fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900, cursor: bezig ? 'wait' : 'pointer',
    background: vol ? '#fff' : 'transparent', border: vol ? 'none' : '1px solid rgba(255,255,255,0.25)', color: vol ? '#0a0a0a' : '#fff',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  return (
    <div onClick={() => !bezig && onClose?.()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent' }}>
      <style>{'@keyframes mvIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } }'}</style>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top, left, width: BREED, maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box',
        background: '#141414', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14, padding: '0.8rem',
        boxShadow: '0 18px 44px rgba(0,0,0,0.7)', animation: 'mvIn 0.16s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>Moment aanpassen</div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 28, height: 28, padding: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)' }}>
            <Keuze waarde={l} zet={setL} isMobile={isMobile} opties={opties} />
          </div>
          {metTijd && (
            <input type="time" value={t} onChange={e => setT(e.target.value)} style={{
              width: 96, boxSizing: 'border-box', height: 36, padding: '0 0.5rem', borderRadius: 9,
              background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
              fontSize: '0.85rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
            }} />
          )}
        </div>
        {!metTijd && (
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: '-2px 0 10px' }}>De tijd volgt je training.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button disabled={bezig} onClick={() => onSave(l, t, 'dag')} style={knop(false)}>Alleen {dagNaam || 'deze dag'}</button>
          <button disabled={bezig} onClick={() => onSave(l, t, 'overal')} style={knop(true)}>Overal waar hij staat</button>
        </div>
      </div>
    </div>
  )
}
