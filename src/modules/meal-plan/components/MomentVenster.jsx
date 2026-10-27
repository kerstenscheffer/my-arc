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

const LABEL_OPTIES = ['Ontbijt', 'Lunch', 'Diner', 'Pre Workout Meal', 'After Workout Meal', 'Snack', 'Avondsnack', 'Fruit']

export default function MomentVenster({ label, tijd, metTijd = true, dagNaam, pos, bezig = false, onClose, onSave }) {
  const BREED = 300, HOOG = 190
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min((pos?.left || 8), vw - BREED - 8))
  const top = (pos?.top || 8) + HOOG > vh - 8 ? Math.max(8, (pos?.boven || 0) - HOOG - 6) : (pos?.top || 8)
  const [l, setL] = useState(label || '')
  const [t, setT] = useState(tijd || '')
  const opties = [
    ...(LABEL_OPTIES.some(o => o.toLowerCase() === String(l).toLowerCase()) || !l ? [] : [l]),
    ...LABEL_OPTIES,
  ]
  const kop = { fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }
  const knop = (vol) => ({
    flex: 1, height: 40, borderRadius: 10, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900,
    cursor: bezig ? 'wait' : 'pointer', border: 'none',
    background: vol ? '#fff' : 'rgba(255,255,255,0.08)', color: vol ? '#0a0a0a' : '#fff',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  return (
    <div onClick={() => !bezig && onClose?.()} style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'transparent' }}>
      <style>{'@keyframes mvIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } } .mv-rij::-webkit-scrollbar { display: none }'}</style>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top, left, width: BREED, maxWidth: 'calc(100vw - 16px)', boxSizing: 'border-box',
        background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '0.85rem 0.85rem 0.8rem',
        boxShadow: '0 18px 44px rgba(0,0,0,0.7)', animation: 'mvIn 0.16s ease',
      }}>
        {/* Soort: pilletjes, de gekozen wit. Geen keuzelijst met vak. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={kop}>Moment</span>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 24, height: 24, padding: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>
        <div className="mv-rij" style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -0.85rem 12px', padding: '0 0.85rem' }}>
          {opties.map(o => {
            const aan = String(l).toLowerCase() === o.toLowerCase()
            return (
              <button key={o} onClick={() => setL(o)} style={{
                flexShrink: 0, height: 32, padding: '0 0.75rem', borderRadius: 999, border: 'none',
                background: aan ? '#fff' : 'rgba(255,255,255,0.07)', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.75)',
                fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>{o}</button>
            )
          })}
        </div>
        {metTijd ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={kop}>Tijd</span>
            <input type="time" value={t} onChange={e => setT(e.target.value)} style={{
              width: 92, boxSizing: 'border-box', height: 34, padding: '0 0.5rem', borderRadius: 9, textAlign: 'center',
              background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff',
              fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
            }} />
          </div>
        ) : (
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>De tijd volgt je training.</div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={bezig} onClick={() => onSave(l, t, 'dag')} style={knop(false)}>Alleen {dagNaam || 'deze dag'}</button>
          <button disabled={bezig} onClick={() => onSave(l, t, 'overal')} style={knop(true)}>Overal</button>
        </div>
      </div>
    </div>
  )
}
