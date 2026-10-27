// src/modules/meal-plan/components/WisselStappen.jsx
//
// "Waar wissel je?" in drie stappen, één vraag per scherm (27 okt 2026,
// zoals het logscherm):
//   1. Welke dag?   — week met datums; stip = staat daar nu
//   2. Hoe vaak?    — alleen deze keer (die datums) of altijd (die weekdagen)
//   3. Klopt dit?   — samenvatting en het wissel-icoon
//
// Geeft via onKies hetzelfde terug als DagenKiezer:
//   { modus: 'altijd', dagen: ['monday', ...] }
//   { modus: 'week',   dagen: [...], datums: ['2026-10-27', ...] }
//
// Pre-workout (`trainingsdagen` + `vastAltijd`): alleen trainingsdagen te
// kiezen, en "altijd" betekent op al je trainingsdagen.
import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, CalendarDays, Repeat } from 'lucide-react'
import { lokaleIso } from '../utils/dagVenster'

const DAGEN = [
  { key: 'monday', kort: 'Ma', lang: 'maandag' }, { key: 'tuesday', kort: 'Di', lang: 'dinsdag' },
  { key: 'wednesday', kort: 'Wo', lang: 'woensdag' }, { key: 'thursday', kort: 'Do', lang: 'donderdag' },
  { key: 'friday', kort: 'Vr', lang: 'vrijdag' }, { key: 'saturday', kort: 'Za', lang: 'zaterdag' },
  { key: 'sunday', kort: 'Zo', lang: 'zondag' },
]
const SLOT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', pre_workout: 'Pre-workout',
  snack1: 'Snack', snack2: 'Snack', snack3: 'Snack', snack4: 'Snack',
}

const maandagVan = (datum) => {
  const d = new Date(datum); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}
const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const kortDatum = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const lijstTekst = (woorden) => woorden.length <= 1 ? (woorden[0] || '')
  : `${woorden.slice(0, -1).join(', ')} en ${woorden[woorden.length - 1]}`

export default function WisselStappen({
  datum, dagKey, slot, oudNaam, nieuwNaam,
  dagenMetMaaltijd = null, trainingsdagen = null, vastAltijd = false,
  bezig = false, fout = null, onKies, onTerug,
}) {
  const mag = (key) => !trainingsdagen || trainingsdagen.includes(key)
  const ditMaandag = maandagVan(new Date())
  const startWeek = Math.max(0, Math.min(2, Math.round((maandagVan(datum || new Date()) - ditMaandag) / (7 * 864e5))))

  const [stap, setStap] = useState(1)
  const [week, setWeek] = useState(startWeek)
  const [gekozen, setGekozen] = useState(() => new Set(dagKey && mag(dagKey) ? [dagKey] : []))
  const [modus, setModus] = useState(null) // 'week' | 'altijd'

  const weekMaandag = plus(ditMaandag, week * 7)
  const datumVan = (i) => plus(weekMaandag, i)

  // Stippen: waar staat deze maaltijd die week.
  const [aanwezig, setAanwezig] = useState(() => new Set())
  useEffect(() => {
    if (!dagenMetMaaltijd) return undefined
    let weg = false
    Promise.resolve(dagenMetMaaltijd(weekMaandag))
      .then(k => { if (!weg) setAanwezig(new Set(k || [])) }, () => { if (!weg) setAanwezig(new Set()) })
    return () => { weg = true }
  }, [week]) // eslint-disable-line react-hooks/exhaustive-deps

  const lijst = DAGEN.filter(d => gekozen.has(d.key))
  const wissel = (key) => mag(key) && setGekozen(prev => {
    const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n
  })
  const moment = SLOT_LABEL[slot] || (String(slot || '').startsWith('snack') ? 'Snack' : 'Maaltijd')
  const isPre = vastAltijd && !!trainingsdagen

  const datumTekst = lijstTekst(lijst.map(d => `${d.kort.toLowerCase()} ${kortDatum(datumVan(DAGEN.indexOf(d)))}`))
  const altijdTekst = isPre ? 'op al je trainingsdagen'
    : lijst.length === 7 ? 'elke dag' : `elke ${lijstTekst(lijst.map(d => d.lang))}`

  const bevestig = () => {
    if (bezig || !lijst.length || !modus) return
    if (modus === 'altijd') {
      onKies({ modus, dagen: isPre ? trainingsdagen : lijst.map(d => d.key) })
    } else {
      onKies({ modus, dagen: lijst.map(d => d.key), datums: lijst.map(d => lokaleIso(datumVan(DAGEN.indexOf(d)))) })
    }
  }

  const titel = (t) => (
    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '0.9rem' }}>{t}</div>
  )
  const terugKnop = (doe, tekst = '← Terug') => (
    <button onClick={doe} disabled={bezig} style={{
      alignSelf: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem',
      fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', padding: '0.5rem', touchAction: 'manipulation',
    }}>{tekst}</button>
  )
  const wit = (uit) => ({
    width: '100%', minHeight: 48, borderRadius: 12, border: 'none',
    background: uit ? 'rgba(255,255,255,0.15)' : '#fff', color: uit ? 'rgba(255,255,255,0.5)' : '#0a0a0a',
    fontSize: '0.92rem', fontWeight: 900, fontFamily: 'inherit', cursor: uit ? 'default' : 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const pijl = (uit) => ({
    width: 28, height: 28, padding: 0, background: 'none', border: 'none', color: '#fff', opacity: uit ? 0.25 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  })

  // Stapjes-indicator: drie streepjes, de huidige wit.
  const voortgang = (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: '0.9rem' }}>
      {[1, 2, 3].map(n => (
        <span key={n} style={{ width: n === stap ? 18 : 6, height: 6, borderRadius: 3, background: n <= stap ? '#fff' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s ease' }} />
      ))}
    </div>
  )

  return (
    <div key={stap} style={{ display: 'flex', flexDirection: 'column', animation: 'wsIn 0.22s ease both' }}>
      {voortgang}

      {stap === 1 && (<>
        {titel(isPre ? 'Op welke trainingsdag?' : 'Welke dag?')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
          <button onClick={() => setWeek(w => Math.max(0, w - 1))} disabled={week === 0} aria-label="Vorige week" style={pijl(week === 0)}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', minWidth: 120, textAlign: 'center' }}>
            {kortDatum(weekMaandag)} – {kortDatum(plus(weekMaandag, 6))}
          </span>
          <button onClick={() => setWeek(w => Math.min(2, w + 1))} disabled={week === 2} aria-label="Volgende week" style={pijl(week === 2)}><ChevronRight size={18} strokeWidth={2.8} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
          {DAGEN.map((d, i) => {
            const aan = gekozen.has(d.key)
            const kan = mag(d.key)
            return (
              <button key={d.key} onClick={() => wissel(d.key)} disabled={!kan || bezig} style={{
                padding: '0.5rem 0', borderRadius: 10, fontFamily: 'inherit', cursor: kan ? 'pointer' : 'default',
                background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`,
                color: aan ? '#000' : 'rgba(255,255,255,0.75)', opacity: kan ? 1 : 0.25,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{d.kort}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.75 }}>{datumVan(i).getDate()}</span>
                <span style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 2, background: aanwezig.has(d.key) ? (aan ? '#000' : '#fff') : 'transparent' }} />
              </button>
            )
          })}
        </div>
        {aanwezig.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />staat nu in je plan
          </div>
        )}
        <div style={{ height: '1rem' }} />
        <button onClick={() => setStap(2)} disabled={!lijst.length} style={wit(!lijst.length)}>Volgende</button>
        {onTerug && terugKnop(onTerug, '← Andere maaltijd')}
      </>)}

      {stap === 2 && (<>
        {titel('Hoe vaak?')}
        {[
          { id: 'week', Icon: CalendarDays, kop: 'Alleen deze keer', sub: datumTekst },
          { id: 'altijd', Icon: Repeat, kop: 'Altijd', sub: altijdTekst },
        ].map(o => (
          <button key={o.id} onClick={() => { setModus(o.id); setStap(3) }} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            padding: '0.85rem 1rem', marginBottom: 8, borderRadius: 14, border: 'none',
            background: 'rgba(255,255,255,0.07)', color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <o.Icon size={20} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 900 }}>{o.kop}</span>
              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{o.sub}</span>
            </span>
            <ChevronRight size={18} strokeWidth={2.6} style={{ flexShrink: 0, opacity: 0.5 }} />
          </button>
        ))}
        {terugKnop(() => setStap(1))}
      </>)}

      {stap === 3 && (<>
        {titel('Klopt dit?')}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fff' }}>
            {moment} · {modus === 'altijd' ? altijdTekst : datumTekst}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.35 }}>
            {oudNaam} → <span style={{ color: '#fff' }}>{nieuwNaam}</span>
          </div>
          {modus === 'week' && (
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Daarna weer je gewone plan</div>
          )}
        </div>
        {fout && (
          <div style={{ fontSize: '0.72rem', color: '#ef4444', textAlign: 'center', marginBottom: '0.6rem' }}>{fout}</div>
        )}
        <button onClick={bevestig} disabled={bezig} aria-label="Wisselen" style={{
          alignSelf: 'center', padding: '0.4rem 1rem', background: 'none', border: 'none', color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'default' : 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {bezig
            ? <span style={{ width: 40, height: 40, boxSizing: 'border-box', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'wsSpin 0.8s linear infinite' }} />
            : <RefreshCw size={44} strokeWidth={3} />}
          Wisselen
        </button>
        {terugKnop(() => setStap(2))}
      </>)}

      <style>{'@keyframes wsIn { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: none } } @keyframes wsSpin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
