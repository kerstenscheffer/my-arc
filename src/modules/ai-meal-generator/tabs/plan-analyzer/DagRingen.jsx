// src/modules/ai-meal-generator/tabs/plan-analyzer/DagRingen.jsx
//
// Wat deze dag optelt, tegen de doelen van de klant — als vier ringen.
//
// Dezelfde vorm, kleuren en iconen als de macro-ringen in het inzicht-paneel,
// zodat je in beide schermen naar hetzelfde plaatje kijkt. Het verschil zit in
// wat de ring betekent: daar het aandeel van een macro in de doelen, hier hoe
// vol de dag zit ten opzichte van het doel. Dat is waar de analyzer voor is.
//
// Verving de MacroHero: één grote kcal-ring met drie losse balken ernaast. Die
// gaf kcal een ander gewicht dan de rest terwijl je ze juist naast elkaar wil
// wegen — een dag die op kcal klopt maar 60 gram eiwit mist is geen goede dag.

import { Flame, Egg, Wheat, Droplet } from 'lucide-react'

const RINGEN = [
  { sleutel: 'calories', doel: 'calories', label: 'Kcal',  kleur: '#fff',    eenheid: '',  Icoon: Flame },
  { sleutel: 'protein',  doel: 'protein',  label: 'Eiwit', kleur: '#ef4444', eenheid: 'g', Icoon: Egg },
  { sleutel: 'carbs',    doel: 'carbs',    label: 'Koolh', kleur: '#f59e0b', eenheid: 'g', Icoon: Wheat },
  { sleutel: 'fat',      doel: 'fat',      label: 'Vet',   kleur: '#3b82f6', eenheid: 'g', Icoon: Droplet },
]

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

// Te weinig is rood, te veel oranje, daartussen de eigen kleur van de macro.
// Dezelfde grenzen als de dag-gezondheid in de dagkiezer, zodat één dag niet
// op twee plekken een ander oordeel krijgt.
const kleurVoor = (pct, eigen) => {
  if (pct == null) return 'rgba(255,255,255,0.15)'
  if (pct < 85) return '#ef4444'
  if (pct > 115) return '#f59e0b'
  return eigen
}

export default function DagRingen({ totalen, targets, isMobile }) {
  const m = isMobile
  const t = totalen || {}
  const d = targets || {}

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
      gap: m ? 4 : 8,
      padding: m ? '0.7rem 0.6rem 0.8rem' : '0.85rem 1rem 0.95rem',
      borderTop: '1px solid rgba(255,255,255,0.04)',
    }}>
      {RINGEN.map((ring) => {
        // Binnen de body uitpakken en niet in de parameter: no-unused-vars telt
        // een component dat alleen in JSX staat niet als gebruikt, maar negeert
        // wel variabelen met een hoofdletter (zie eslint.config.js).
        const { sleutel, doel, label, kleur, eenheid, Icoon } = ring
        const waarde = Number(t[sleutel] ?? (sleutel === 'calories' ? t.kcal : 0)) || 0
        const target = Number(d[doel]) || 0
        const pct = target > 0 ? (waarde / target) * 100 : null

        const maat = m ? 54 : 62
        const dikte = 5
        const r = (maat - dikte) / 2
        const omtrek = 2 * Math.PI * r
        const vol = omtrek - (Math.min(100, pct ?? 0) / 100) * omtrek
        const ringKleur = kleurVoor(pct, kleur)

        return (
          <div key={sleutel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <div style={{ position: 'relative', width: maat, height: maat }}>
              <svg width={maat} height={maat} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={maat / 2} cy={maat / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={dikte} fill="none" />
                <circle
                  cx={maat / 2} cy={maat / 2} r={r} stroke={ringKleur} strokeWidth={dikte} fill="none"
                  strokeDasharray={omtrek} strokeDashoffset={vol} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: m ? '0.76rem' : '0.82rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {nl(waarde)}
                </span>
                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>
                  {eenheid || 'kcal'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icoon size={10} color={kleur} strokeWidth={2.8} />
              <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff' }}>{label}</span>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              van {nl(target)}{eenheid}
            </span>
          </div>
        )
      })}
    </div>
  )
}
