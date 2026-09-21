// src/modules/coach-command-center/components/insight/MetingenTabel.jsx
//
// De cijfers achter de grafiek, in een tabel die je zelf instelt.
//
// Er stonden er eerst twee: een vast rijtje van drie weken onder het oordeel en
// een uitklapper "Alle metingen" met een eigen week/dag-knop. Dezelfde getallen,
// twee plekken, twee bedieningen. Dit is de enige.
//
// Twee vragen bedien je hier:
//   · Week of dag — week is waar je op stuurt, dag is waar je iets opzoekt
//     ("wat deed hij die maandag?").
//   · Welke periode — de lopende fase, of gewoon de laatste x weken.
//
// Het oordeel per week komt uit dezelfde rekenmodule als de band erboven, dus
// de kleur in deze tabel en de kleur van de lijn kunnen niet uit elkaar lopen.

import { useMemo, useState } from 'react'
import {
  maakConfig, trendReeks, weekBeoordelingen, STATUS_TEKST, STATUS_KLEUR,
} from '../../../weight-tracker/utils/coachingBand'

const PERIODES = [
  { id: 'fase', label: 'Fase' },
  { id: '2w', label: '2 wk', dagen: 14 },
  { id: '4w', label: '4 wk', dagen: 28 },
  { id: '2m', label: '2 mnd', dagen: 61 },
  { id: '4m', label: '4 mnd', dagen: 122 },
  { id: '6m', label: '6 mnd', dagen: 183 },
]

const datumKort = (d) => {
  try {
    return new Date(`${String(d).slice(0, 10)}T00:00:00`)
      .toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return d }
}
const dagNaam = (d) => {
  try {
    return new Date(`${String(d).slice(0, 10)}T00:00:00`)
      .toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2)
  } catch { return '' }
}

// Eén set kolombreedtes per weergave, zodat koprij en rijen niet uit de pas
// lopen. Vaste breedtes: met 1fr schiet de laatste kolom in een breed paneel
// naar de rechterrand.
const KOLOMMEN = {
  week: '3.4rem 5rem 4rem 3rem 1fr',
  dag: '5.5rem 5rem 4rem 5rem',
}

const knop = (aan) => ({
  minHeight: 26, padding: '0 0.55rem', borderRadius: 999, flexShrink: 0,
  background: aan ? '#fff' : 'transparent',
  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
  color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
  fontSize: '0.66rem', fontWeight: 900, fontFamily: 'inherit',
  cursor: 'pointer', whiteSpace: 'nowrap',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function MetingenTabel({ client, history, fase, isMobile }) {
  const [weergave, setWeergave] = useState('week')     // 'week' | 'dag'
  const [periode, setPeriode] = useState(fase ? 'fase' : '4w')

  const model = useMemo(() => {
    const gekozen = PERIODES.find(p => p.id === periode) || PERIODES[0]
    const vanaf = (() => {
      if (gekozen.id === 'fase') return fase?.started_on ? String(fase.started_on).slice(0, 10) : null
      const d = new Date()
      d.setDate(d.getDate() - gekozen.dagen)
      return d.toISOString().split('T')[0]
    })()

    const binnen = vanaf
      ? (history || []).filter(e => String(e?.date || '').slice(0, 10) >= vanaf)
      : (history || [])
    const reeks = trendReeks(binnen)
    if (reeks.length === 0) return { leeg: true }

    // Het weekoordeel hoort bij de fase; kiest de coach een losse periode, dan
    // rekenen we nog steeds vanaf het fase-nulpunt — anders zou "week 1" iets
    // anders betekenen dan in de grafiek erboven.
    const config = maakConfig(client, fase)
    const startGewicht = fase?.start_gewicht ? Number(fase.start_gewicht) : null
    const startDatum = fase?.started_on || reeks[0]?.datum
    const weken = (startGewicht && startDatum)
      ? weekBeoordelingen(reeks, startGewicht, startDatum, config)
      : []

    // Dag-weergave: elke meting met zijn verschil t.o.v. de vorige meting en de
    // trend van dat moment.
    const dagen = reeks.map((r, i) => ({
      ...r,
      verschil: i > 0 && Number.isFinite(reeks[i - 1].meting)
        ? Math.round((r.meting - reeks[i - 1].meting) * 100) / 100
        : null,
    }))

    return { weken, dagen, leeg: false }
  }, [client, history, fase, periode])

  const kop = {
    display: 'grid', gridTemplateColumns: KOLOMMEN[weergave],
    gap: '0 0.9rem', alignItems: 'center', maxWidth: 'max-content',
    fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)',
  }
  const rij = {
    display: 'grid', gridTemplateColumns: KOLOMMEN[weergave],
    gap: '0 0.9rem', alignItems: 'center', maxWidth: 'max-content',
    fontSize: '0.72rem', fontWeight: 900, color: '#fff',
    fontVariantNumeric: 'tabular-nums',
    padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  }

  return (
    <div style={{
      padding: isMobile ? '0.6rem 0.75rem 0.8rem' : '0.7rem 1rem 0.9rem',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Bediening: wat voor rijen, en over welke periode. */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {[{ id: 'week', label: 'Week' }, { id: 'dag', label: 'Dag' }].map(w => (
          <button key={w.id} onClick={() => setWeergave(w.id)} style={knop(weergave === w.id)}>
            {w.label}
          </button>
        ))}
        <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', margin: '0 3px' }} />
        {PERIODES.filter(p => p.id !== 'fase' || fase).map(p => (
          <button key={p.id} onClick={() => setPeriode(p.id)} style={knop(periode === p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      {model.leeg ? (
        <div style={{ padding: '0.8rem 0', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
          Geen metingen in deze periode.
        </div>
      ) : weergave === 'week' ? (
        model.weken.length === 0 ? (
          <div style={{ padding: '0.8rem 0', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
            Geen fase, dus geen weekoordeel. Kies Dag, of leg een fase vast.
          </div>
        ) : (
          <>
            <div style={kop}>
              <span>Week</span>
              <span style={{ textAlign: 'right' }}>Trend</span>
              <span style={{ textAlign: 'right' }}>Δ</span>
              <span style={{ textAlign: 'right' }}>Weeg</span>
              <span style={{ textAlign: 'right' }}>Oordeel</span>
            </div>
            {[...model.weken].reverse().map(w => {
              const kleur = STATUS_KLEUR[w.status] || '#fff'
              return (
                <div key={w.week} style={rij}>
                  <span style={{ color: kleur }}>wk {w.week}</span>
                  <span style={{ textAlign: 'right' }}>{w.trend} kg</span>
                  <span style={{ textAlign: 'right', color: w.verschil == null ? 'rgba(255,255,255,0.3)' : kleur }}>
                    {w.verschil == null ? '—' : `${w.verschil > 0 ? '+' : ''}${w.verschil}`}
                  </span>
                  <span style={{ textAlign: 'right', color: w.metingen >= 5 ? '#fff' : '#f59e0b' }}>
                    {w.metingen}×
                  </span>
                  <span style={{ textAlign: 'right', color: kleur, fontSize: '0.66rem' }}>
                    {STATUS_TEKST[w.status] || '—'}
                    {w.wekenBuiten > 1 ? ` ${w.wekenBuiten}×` : ''}
                  </span>
                </div>
              )
            })}
          </>
        )
      ) : (
        <>
          <div style={kop}>
            <span>Dag</span>
            <span style={{ textAlign: 'right' }}>Weging</span>
            <span style={{ textAlign: 'right' }}>Δ</span>
            <span style={{ textAlign: 'right' }}>Trend</span>
          </div>
          {[...model.dagen].reverse().map(d => (
            <div key={d.datum} style={rij}>
              <span>
                <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 5 }}>{dagNaam(d.datum)}</span>
                {datumKort(d.datum)}
              </span>
              <span style={{ textAlign: 'right' }}>{d.meting} kg</span>
              <span style={{
                textAlign: 'right',
                color: d.verschil == null ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)',
              }}>
                {d.verschil == null ? '—' : `${d.verschil > 0 ? '+' : ''}${d.verschil}`}
              </span>
              <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.65)' }}>
                {d.trend} kg
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
