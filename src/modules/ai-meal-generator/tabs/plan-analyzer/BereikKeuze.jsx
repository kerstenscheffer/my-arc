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

import React from 'react'
import { Repeat, CalendarDays, CalendarRange } from 'lucide-react'

const SLOT_KORT = {
  breakfast: 'ontbijt', lunch: 'lunch', dinner: 'diner',
  snack1: 'snack 1', snack2: 'snack 2', snack3: 'snack 3', snack4: 'snack 4',
  avondsnack: 'avondsnack', pre_workout: 'pre-workout',
}
const slotKort = (slot) => SLOT_KORT[slot] || String(slot || '').replace(/_/g, ' ')

export default function BereikKeuze({
  vraag = 'Waar geldt dit?',
  dagNaam, slot, oudeNaam, nieuweNaam,
  plekken = [],          // [{ dag: 'Ma', slot: 'lunch' }]
  metAlleDagen = false,  // derde keuze: dit slot op alle dagen
  bezig = null,          // key van de keuze die nu opslaat
  onKies,
}) {
  const aantal = Array.isArray(plekken) ? plekken.length : 0
  const plekkenTekst = aantal === 0
    ? 'staat verder nergens in de week'
    : plekken.map(p => `${p.dag} ${slotKort(p.slot)}`).join(' · ')
  const dag = dagNaam || 'deze dag'

  const opties = [
    {
      key: 'day', Icon: CalendarDays,
      title: `Alleen ${dag}`,
      sub: 'elke week op deze dag',
      effect: `past ${dag} ${slotKort(slot)} aan, de andere dagen blijven zoals ze zijn`,
    },
    {
      key: 'all', Icon: Repeat,
      title: aantal > 1 ? `Overal (${aantal}×)` : 'Overal in de week',
      sub: `waar ${oudeNaam || 'deze maaltijd'} staat`,
      effect: plekkenTekst,
      uit: aantal === 0,
    },
    ...(metAlleDagen ? [{
      key: 'week', Icon: CalendarRange,
      title: 'Alle dagen',
      sub: `${slotKort(slot)} op 7 dagen`,
      effect: `zet ${nieuweNaam || 'de nieuwe maaltijd'} als ${slotKort(slot)} op elke dag van de week`,
    }] : []),
  ]

  return (
    <>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 2 }}>
        {vraag}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
        Je kunt dit later altijd weer aanpassen.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {opties.map(opt => {
          const Icon = opt.Icon
          const isSaving = bezig === opt.key
          const uit = !!opt.uit
          return (
            <button
              key={opt.key}
              onClick={() => !bezig && !uit && onKies(opt.key)}
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
      </div>
      <style>{`@keyframes bereikSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
