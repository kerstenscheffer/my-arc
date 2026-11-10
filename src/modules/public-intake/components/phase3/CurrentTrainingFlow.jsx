// src/modules/public-intake/components/phase3/CurrentTrainingFlow.jsx
// Alleen voor wie al traint (intermediate/advanced).
//
// 10 nov 2026 herbouwd: we willen precies weten wat iemand nu doet, zodat de
// coach niet hoeft te gokken. Twee stappen:
//   1. Hoeveel dagen train je nu per week? (1 t/m 7, of zelf typen)
//   2. Wat doe je op die dagen? Eén regel per dag. Een split-knop vult de
//      dagen in (full body, upper/lower, PPL, bro split), daarna per dag aan
//      te passen; "Iets anders" = zelf invullen.
//
// Opslag (PublicIntakePage → user_workout_preferences.split_preferences, jsonb):
//   preferred      = gekozen split (full_body / upper_lower / ppl / bro_split / anders)
//   huidig_dagen   = aantal dagen nu (getal) of null als zelf getypt
//   huidig_dagen_tekst = wat de klant zelf typte bij het aantal dagen
//   huidig_schema  = ['Upper', 'Lower', ...] één regel per dag
//   huidig_toelichting = vrije tekst (oefeningen, sets, wat dan ook)
import React, { useState } from 'react'
import { Q, Hint, NextBtn } from '../phase1/FlowStep'

const SPLITS = [
  { value: 'full_body',   label: 'Full body',      maak: n => Array(n).fill('Full body') },
  { value: 'upper_lower', label: 'Upper / Lower',  maak: n => Array.from({ length: n }, (_, i) => (i % 2 ? 'Lower' : 'Upper')) },
  { value: 'ppl',         label: 'Push / Pull / Legs', maak: n => Array.from({ length: n }, (_, i) => ['Push', 'Pull', 'Legs'][i % 3]) },
  { value: 'bro_split',   label: 'Bro split',      maak: n => Array.from({ length: n }, (_, i) => ['Borst', 'Rug', 'Benen', 'Schouders', 'Armen'][i % 5]) },
  { value: 'anders',      label: 'Iets anders',    maak: n => Array(n).fill('') },
]

const kaal = {
  fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

export default function CurrentTrainingFlow({ data, onChange, isMobile, onNext, onBack }) {
  const [stap, setStap] = useState('dagen')
  const update = (velden) => onChange({ ...data, ...velden })

  const dagen = data.huidig_dagen || null
  const eigenDagen = data.huidig_dagen_tekst || ''
  const schema = Array.isArray(data.huidig_schema) ? data.huidig_schema : []

  // ── Stap 1: aantal dagen ─────────────────────────────────────────────────
  if (stap === 'dagen') {
    const kiesDagen = (n) => {
      // Schema op de nieuwe lengte brengen; wat er al stond blijft staan.
      const split = SPLITS.find(s => s.value === data.split_preference)
      const basis = split ? split.maak(n) : Array(n).fill('')
      update({ huidig_dagen: n, huidig_dagen_tekst: '', huidig_schema: basis.map((v, i) => schema[i] ?? v) })
    }
    const klaar = !!dagen || !!eigenDagen.trim()
    return (
      <div>
        <Q isMobile={isMobile}>Hoeveel dagen train je nu per week?</Q>
        <Hint isMobile={isMobile}>Hoe het nu echt gaat, niet hoe je het zou willen.</Hint>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: '0.8rem' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(n => {
            const aan = dagen === n
            return (
              <button key={n} onClick={() => kiesDagen(n)} style={{
                ...kaal, minHeight: 48, borderRadius: 9, border: 'none',
                background: aan ? '#fff' : 'transparent', color: aan ? '#000' : '#fff',
                fontSize: '1.05rem', fontWeight: 900, transition: 'all 0.15s ease',
              }}>{n}</button>
            )
          })}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', margin: '1rem 0 0.4rem' }}>Of typ het zelf</div>
        <input
          value={eigenDagen}
          onChange={e => update({ huidig_dagen_tekst: e.target.value, ...(e.target.value.trim() ? { huidig_dagen: null } : {}) })}
          placeholder="Bijv: 3 à 4, wisselt per week"
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 48, padding: '0 0.9rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}
        />
        <div style={{ height: '1rem' }} />
        <NextBtn onClick={() => setStap('schema')} disabled={!klaar} isMobile={isMobile} onBack={onBack} />
      </div>
    )
  }

  // ── Stap 2: wat doe je op die dagen ──────────────────────────────────────
  const kiesSplit = (s) => update({ split_preference: s.value, huidig_schema: dagen ? s.maak(dagen) : schema })
  const zetDag = (i, v) => { const nieuw = [...schema]; nieuw[i] = v; update({ huidig_schema: nieuw }) }
  const klaar = dagen
    ? schema.length === dagen && schema.every(v => (v || '').trim())
    : !!(data.huidig_toelichting || '').trim()

  return (
    <div>
      <Q isMobile={isMobile}>Wat doe je op die dagen?</Q>
      <Hint isMobile={isMobile}>Kies je split, pas daarna per dag aan wat niet klopt.</Hint>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '0.8rem 0 1rem' }}>
        {SPLITS.map(s => {
          const aan = data.split_preference === s.value
          return (
            <button key={s.value} onClick={() => kiesSplit(s)} style={{
              ...kaal, minHeight: 40, padding: '0 0.9rem', borderRadius: 999,
              background: aan ? '#fff' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.15)'}`,
              color: aan ? '#000' : '#fff', fontSize: '0.82rem', fontWeight: 800,
            }}>{s.label}</button>
          )
        })}
      </div>

      {dagen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: dagen }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 52, flexShrink: 0, fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>Dag {i + 1}</div>
              <input
                value={schema[i] || ''}
                onChange={e => zetDag(i, e.target.value)}
                placeholder="Bijv: Push, borst en schouders"
                style={{ flex: 1, minWidth: 0, minHeight: 46, padding: '0 0.85rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.3rem' }}>
          Je traint wisselend ({eigenDagen}). Beschrijf hieronder wat je meestal doet.
        </div>
      )}

      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', margin: '1rem 0 0.4rem' }}>
        {dagen ? 'Nog iets toevoegen? (optioneel)' : 'Wat doe je meestal?'}
      </div>
      <textarea
        value={data.huidig_toelichting || ''}
        onChange={e => update({ huidig_toelichting: e.target.value })}
        placeholder="Bijv: oefeningen, sets en herhalingen, hoe lang je zo traint"
        rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '0.75rem 0.9rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, color: '#fff', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }}
      />
      <div style={{ height: '1rem' }} />
      <NextBtn onClick={onNext} disabled={!klaar} isMobile={isMobile} onBack={() => setStap('dagen')} />
    </div>
  )
}
