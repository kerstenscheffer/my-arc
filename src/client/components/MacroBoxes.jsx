// src/client/components/MacroBoxes.jsx
// Gedeelde "4 macro-vakken" — Kcal / Koolh / Eiwit / Vet, elk met een %-ring
// en "x over / te veel". Gebruikt op de client-home (TodayCard) én op de
// meal-pagina (via MacroHero variant="boxes"), zodat ze identiek zijn.
import React, { useEffect, useRef, useState } from 'react'
import { Flame, Wheat, Egg, Droplet } from 'lucide-react'

// Telt een getal soepel naar de nieuwe waarde (600 ms, zelfde curve als de
// ring). Zonder dit sprong het percentage in één keer terwijl de ring nog
// onderweg was.
function useTelOp(doel, duur = 600) {
  const [waarde, setWaarde] = useState(doel)
  const huidig = useRef(doel)
  useEffect(() => {
    const van = huidig.current
    if (van === doel) return
    const start = performance.now()
    let frame
    const stap = (nu) => {
      const t = Math.min(1, (nu - start) / duur)
      const e = 1 - Math.pow(1 - t, 3)
      const v = van + (doel - van) * e
      huidig.current = v
      setWaarde(v)
      if (t < 1) frame = requestAnimationFrame(stap)
    }
    frame = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(frame)
  }, [doel, duur])
  return waarde
}

function MacroBox({ label, icon, color, consumed: echt, target, unitLabel, kaal = false, compact = false, leeg = false }) {
  const consumed = useTelOp(Number(echt) || 0)
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  const over = Math.round((target || 0) - (consumed || 0))
  // Compact: kleinere ring en kleinere cijfers, voor de meal-pagina waar de
  // lijst eronder de ruimte nodig heeft.
  const size = compact ? 42 : 48, stroke = compact ? 4 : 5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (pct / 100) * circ
  return (
    <div style={{ background: kaal ? 'transparent' : 'rgba(255,255,255,0.03)', border: kaal ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: kaal ? (compact ? '0.1rem 0.25rem 0.2rem' : '0.2rem 0.25rem 0.35rem') : '0.5rem 0.25rem 0.55rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '0.2rem' : '0.3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: '100%' }}>
        <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          {!leeg && <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color, visibility: leeg ? 'hidden' : undefined }}>{pct}<span style={{ fontSize: '0.6em' }}>%</span></span>
        </div>
      </div>
      {/* "x over" en "x / y" zijn één blokje: ze zeggen hetzelfde vanuit twee
          kanten. Met de vaste tussenruimte van de kolom ertussen stond er
          een gat waar niets gebeurde. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, ...(leeg ? { visibility: 'hidden' } : null) }}>
        <div style={{ fontSize: compact ? '0.74rem' : '0.82rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
          {Math.abs(over)}
          <span style={{ fontSize: '0.72em', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>{unitLabel} {over >= 0 ? 'over' : 'te veel'}</span>
        </div>
        <div style={{ fontSize: compact ? '0.6rem' : '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
          {Math.round(consumed || 0)}{unitLabel} / {Math.round(target || 0)}{unitLabel}
        </div>
      </div>
    </div>
  )
}

// `kaal`: zonder het kadertje om elk vak. Op de meal-pagina staan de vier
// ringen direct onder de foto-kop; daar maakten vier randjes het onrustig.
// `leeg`: alleen de labels en lege ringen, op exact dezelfde maat. Voor het
// laadskelet, zodat de cijfers er straks gewoon in komen te staan.
export default function MacroBoxes({ consumed = {}, targets = {}, style, kaal = false, compact = false, leeg = false }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', ...style }}>
      <MacroBox kaal={kaal} compact={compact} leeg={leeg} label="Kcal"  icon={<Flame size={11} color="#10b981" />}   color="#10b981" consumed={consumed.calories} target={targets.calories} unitLabel="" />
      <MacroBox kaal={kaal} compact={compact} leeg={leeg} label="Koolh" icon={<Wheat size={11} color="#ec4899" />}   color="#ec4899" consumed={consumed.carbs}    target={targets.carbs}    unitLabel="g" />
      <MacroBox kaal={kaal} compact={compact} leeg={leeg} label="Eiwit" icon={<Egg size={11} color="#3b82f6" />}     color="#3b82f6" consumed={consumed.protein}  target={targets.protein}  unitLabel="g" />
      <MacroBox kaal={kaal} compact={compact} leeg={leeg} label="Vet"   icon={<Droplet size={11} color="#f59e0b" />} color="#f59e0b" consumed={consumed.fat}      target={targets.fat}      unitLabel="g" />
    </div>
  )
}
