// src/modules/ai-meal-generator/tabs/plan-analyzer/BereikKeuze.jsx
//
// "Waar geldt dit?" — dezelfde keuze als in het bewerk-blad van de klant
// (meal-plan/components/ClientMealEditModal). Wordt gesteld na een wissel én
// na een bewerking, zodat de coach niet per ongeluk de hele week raakt (of
// juist alleen één dag terwijl hij overal bedoelde).
//
//   day  = alleen de dag die open staat
//   all  = overal in de week waar de oude maaltijd staat
//   week = dit slot op alle zeven dagen (alleen bij wisselen)
//   dagen = dit slot op de dagen die de coach aantikt (alleen bij wisselen);
//           onKies('dagen', [0..6])
//
// `weekStart` ('JJJJ-MM-DD', maandag): de Analyzer staat in week-modus. Dan
// geldt elke keuze alleen voor die week (het opslaan regelt dat), en zeggen
// de teksten dat ook in plaats van "elke week".

import React, { useState } from 'react'
import { Repeat, CalendarDays, CalendarRange, CalendarCheck, Check } from 'lucide-react'

const SLOT_KORT = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack1: 'snack 1', snack2: 'snack 2', snack3: 'snack 3', snack4: 'snack 4',
  avondsnack: 'avondsnack', pre_workout: 'pre-workout',
}
const DAG_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const slotKort = (slot) => SLOT_KORT[slot] || String(slot || '').replace(/_/g, ' ')

export default function BereikKeuze({
  vraag = 'Waar geldt dit?',
  dagNaam, slot, oudeNaam, nieuweNaam,
  plekken = [],          // [{ dag: 'Ma', slot: 'lunch' }]
  metAlleDagen = false,  // derde keuze: dit slot op alle dagen
  bezig = null,          // key van de keuze die nu opslaat
  dagIndex = null,       // open dag (0 = ma), vooraf aangevinkt bij 'Kies dagen'
  weekStart = null,      // maandag van de week in week-modus, anders null
  onKies,
}) {
  const [kiesOpen, setKiesOpen] = useState(false)
  const [gekozen, setGekozen] = useState(() => new Set(dagIndex != null ? [dagIndex] : []))
  const wissel = (i) => setGekozen(g => { const n = new Set(g); if (n.has(i)) n.delete(i); else n.add(i); return n })
  const aantal = Array.isArray(plekken) ? plekken.length : 0
  const plekkenTekst = aantal === 0
    ? 'staat verder nergens in de week'
    : plekken.map(p => `${p.dag} ${slotKort(p.slot)}`).join(' · ')
  const dag = dagNaam || 'deze dag'
  const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const weekBegin = weekStart ? new Date(`${weekStart}T00:00:00`) : null
  const weekTekst = weekBegin ? (() => { const e = new Date(weekBegin); e.setDate(e.getDate() + 6); return `${kort(weekBegin)} – ${kort(e)}` })() : null
  const dagDatum = weekBegin && dagIndex != null ? (() => { const d = new Date(weekBegin); d.setDate(d.getDate() + dagIndex); return kort(d) })() : null

  const opties = [
    {
      key: 'day', Icon: CalendarDays,
      title: `Alleen ${dag}${dagDatum ? ` ${dagDatum}` : ''}`,
      sub: weekTekst ? 'alleen in deze week' : 'elke week op deze dag',
      effect: `past ${dag} ${slotKort(slot)} aan, de andere dagen blijven zoals ze zijn`,
    },
    {
      key: 'all', Icon: Repeat,
      title: aantal > 1 ? `Overal (${aantal}×)` : weekTekst ? 'Overal in deze week' : 'Overal in de week',
      sub: `waar ${oudeNaam || 'deze maaltijd'} staat`,
      effect: plekkenTekst,
      uit: aantal === 0,
    },
    ...(metAlleDagen ? [{
      key: 'week', Icon: CalendarRange,
      title: 'Alle dagen',
      sub: `${slotKort(slot)} op 7 dagen`,
      effect: `zet ${nieuweNaam || 'de nieuwe maaltijd'} als ${slotKort(slot)} op elke dag van ${weekTekst ? `de week ${weekTekst}` : 'de week, elke week'}`,
    }, {
      key: 'dagen', Icon: CalendarCheck,
      title: 'Kies dagen',
      sub: `${slotKort(slot)} op de dagen die jij aantikt`,
      effect: 'bijvoorbeeld alleen de trainingsdagen, of ma, wo en vr',
      open: true,
    }] : []),
  ]

  return (
    <>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 2 }}>
        {vraag}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
        {weekTekst
          ? <>Geldt alleen voor de week <span style={{ color: '#fff' }}>{weekTekst}</span>. Elke andere week blijft zoals hij is.</>
          : 'Geldt elke week. Je kunt dit later altijd weer aanpassen.'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {opties.map(opt => {
          const Icon = opt.Icon
          const isSaving = bezig === opt.key
          const uit = !!opt.uit
          return (
            <button
              key={opt.key}
              onClick={() => { if (bezig || uit) return; if (opt.open) setKiesOpen(v => !v); else onKies(opt.key) }}
              disabled={!!bezig || uit}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                padding: '0.85rem 0.9rem', borderRadius: 12,
                cursor: (bezig || uit) ? 'default' : 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                opacity: (bezig && !isSaving) || uit ? 0.35 : 1,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0, marginTop: 1,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSaving
                  ? <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'bereikSpin 0.8s linear infinite' }} />
                  : <Icon size={17} color="#fff" strokeWidth={2.4} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{opt.title}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{opt.sub}</span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.35 }}>
                  {opt.effect}
                </div>
              </div>
            </button>
          )
        })}
        {/* Dagen aantikken: zeven knoppen op één regel, dan bevestigen. */}
        {kiesOpen && (
          <div style={{ padding: '0.2rem 0 0.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {DAG_KORT.map((d, i) => {
                const aan = gekozen.has(i)
                return (
                  <button key={d} onClick={() => wissel(i)} disabled={!!bezig} style={{
                    minHeight: 40, borderRadius: 10, fontFamily: 'inherit',
                    background: aan ? '#fff' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{d}</button>
                )
              })}
            </div>
            <button
              onClick={() => gekozen.size && !bezig && onKies('dagen', [...gekozen].sort((a, b) => a - b))}
              disabled={!gekozen.size || !!bezig}
              style={{
                width: '100%', minHeight: 46, marginTop: 8, borderRadius: 12, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: gekozen.size ? '#fff' : 'rgba(255,255,255,0.08)',
                color: gekozen.size ? '#0a0a0a' : 'rgba(255,255,255,0.35)',
                fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit',
                cursor: gekozen.size && !bezig ? 'pointer' : 'default',
              }}
            >
              <Check size={15} strokeWidth={2.8} />
              {bezig === 'dagen' ? 'Bezig…' : `Wissel op ${gekozen.size} dag${gekozen.size === 1 ? '' : 'en'}`}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes bereikSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
