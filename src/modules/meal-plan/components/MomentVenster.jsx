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
import { X, ChevronDown, Check } from 'lucide-react'

// Zelfde waarden als de coach opslaat; op de knop een korte naam.
const LABEL_OPTIES = [
  { id: 'Ontbijt', kort: 'Ontbijt' }, { id: 'Lunch', kort: 'Lunch' }, { id: 'Diner', kort: 'Diner' }, { id: 'Snack', kort: 'Snack' },
  { id: 'Pre Workout Meal', kort: 'Pre-workout' }, { id: 'After Workout Meal', kort: 'Post-workout' }, { id: 'Avondsnack', kort: 'Avondsnack' }, { id: 'Fruit', kort: 'Fruit' },
]
// "13:00" +/- minuten, binnen de dag.
const schuif = (tijd, min) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(tijd || ''))
  const nu = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 12 * 60
  const n = Math.round(((nu + min) % 1440 + 1440) % 1440 / 15) * 15 % 1440
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
}

export default function MomentVenster({ label, tijd, metTijd = true, dagNaam, pos, bezig = false, onClose, onSave }) {
  const BREED = 280, HOOG = 170
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(8, Math.min((pos?.left || 8), vw - BREED - 8))
  const top = (pos?.top || 8) + HOOG > vh - 8 ? Math.max(8, (pos?.boven || 0) - HOOG - 6) : (pos?.top || 8)
  const [l, setL] = useState(label || '')
  const [t, setT] = useState(tijd || '')
  const [lijstOpen, setLijstOpen] = useState(false)
  const opties = LABEL_OPTIES
  const stap = {
    width: 32, height: 32, padding: 0, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
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
        {/* Soort: mini-dropdown op één regel, net als de tijd eronder. */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={kop}>Soort</span>
          <button onClick={() => setLijstOpen(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 0.7rem', borderRadius: 9, border: 'none',
            background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            {opties.find(o => o.id.toLowerCase() === String(l).toLowerCase())?.kort || l || 'Kies'}
            <ChevronDown size={14} strokeWidth={3} style={{ transition: 'transform 0.15s ease', transform: lijstOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          {lijstOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 2, minWidth: 150,
              background: '#1c1c1c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 4,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            }}>
              {opties.map(o => {
                const aan = String(l).toLowerCase() === o.id.toLowerCase()
                return (
                  <button key={o.id} onClick={() => { setL(o.id); setLijstOpen(false) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    height: 34, padding: '0 0.6rem', borderRadius: 7, border: 'none',
                    background: aan ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff',
                    fontSize: '0.84rem', fontWeight: aan ? 900 : 700, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                  }}>
                    {o.kort}{aan && <Check size={14} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {metTijd ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={kop}>Tijd</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => setT(schuif(t, -15))} aria-label="Eerder" style={stap}>−</button>
              <span style={{ minWidth: 56, textAlign: 'center', fontSize: '1rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{t || '--:--'}</span>
              <button onClick={() => setT(schuif(t, 15))} aria-label="Later" style={stap}>+</button>
            </div>
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
