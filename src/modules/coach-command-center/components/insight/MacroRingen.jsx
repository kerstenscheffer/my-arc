// src/modules/coach-command-center/components/insight/MacroRingen.jsx
//
// Wat er nu op het bord van de klant staat: de macro's die hij volgt, als
// ringen. Zelfde vorm als op zijn eigen maaltijdpagina, zodat jullie naar
// hetzelfde plaatje kijken als je hem aan de telefoon hebt.
//
// De ring vult zich met het aandeel in de totale calorieën, niet met een
// voortgang: eiwit 170 g is 680 kcal en dus 22% van 3159. Zo zie je in één
// oogopslag of de verdeling klopt — een bulk met 12% eiwit springt eruit
// zonder dat je hoeft te rekenen.

import { Flame, Egg, Wheat, Droplet } from 'lucide-react'

const RINGEN = [
  { sleutel: 'target_protein', label: 'Eiwit', kleur: '#ef4444', kcalPerGram: 4, icoon: <Egg size={10} color="#ef4444" strokeWidth={2.8} /> },
  { sleutel: 'target_carbs',   label: 'Koolh', kleur: '#f59e0b', kcalPerGram: 4, icoon: <Wheat size={10} color="#f59e0b" strokeWidth={2.8} /> },
  { sleutel: 'target_fat',     label: 'Vet',   kleur: '#3b82f6', kcalPerGram: 9, icoon: <Droplet size={10} color="#3b82f6" strokeWidth={2.8} /> },
]

function Ring({ label, kleur, gram, aandeel, icoon, isMobile }) {
  const maat = isMobile ? 54 : 60
  const dikte = 5
  const r = (maat - dikte) / 2
  const omtrek = 2 * Math.PI * r
  const vol = omtrek - (Math.min(100, aandeel) / 100) * omtrek
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: maat, height: maat }}>
        <svg width={maat} height={maat} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={maat / 2} cy={maat / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={dikte} fill="none" />
          <circle
            cx={maat / 2} cy={maat / 2} r={r} stroke={kleur} strokeWidth={dikte} fill="none"
            strokeDasharray={omtrek} strokeDashoffset={vol} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{gram}</span>
          <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)' }}>gram</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {icoon}
        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff' }}>{label}</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{aandeel}%</span>
      </div>
    </div>
  )
}

export default function MacroRingen({ client, isMobile }) {
  const kcal = Math.round(Number(client?.target_calories) || 0)
  if (!kcal) return null

  const uit = RINGEN.map(r => {
    const gram = Math.round(Number(client?.[r.sleutel]) || 0)
    return { ...r, gram, kcal: gram * r.kcalPerGram }
  })
  const somKcal = uit.reduce((s, r) => s + r.kcal, 0)
  // Het aandeel rekenen we over de som van de macro's, niet over
  // target_calories: die twee lopen vaak een paar procent uiteen door afronden,
  // en dan telt de verdeling niet op tot honderd.
  const basis = somKcal > 0 ? somKcal : kcal
  const verschil = kcal - somKcal

  return (
    <div style={{
      padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Flame size={14} color="#fff" strokeWidth={2.6} />
        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Wat hij nu volgt
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {kcal.toLocaleString('nl-NL')}
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginLeft: 3 }}>kcal</span>
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
        {uit.map(r => (
          <Ring
            key={r.sleutel}
            label={r.label} kleur={r.kleur} gram={r.gram} icoon={r.icoon}
            aandeel={Math.round((r.kcal / basis) * 100)}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Tellen de macro's niet op tot het kcal-doel, dan klopt er iets niet —
          meestal een handmatig aangepast getal dat niet is doorgerekend. */}
      {Math.abs(verschil) > 50 && (
        <div style={{
          marginTop: 8, fontSize: '0.66rem', fontWeight: 800, color: '#f59e0b',
        }}>
          De macro's tellen op tot {somKcal.toLocaleString('nl-NL')} kcal, {Math.abs(verschil)} {verschil > 0 ? 'minder' : 'meer'} dan het doel. Herbereken ze hieronder.
        </div>
      )}
    </div>
  )
}
