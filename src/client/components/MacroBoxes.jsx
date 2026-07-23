// src/client/components/MacroBoxes.jsx
// Gedeelde "4 macro-vakken" — Kcal / Koolh / Eiwit / Vet, elk met een %-ring
// en "x over / te veel". Gebruikt op de client-home (TodayCard) én op de
// meal-pagina (via MacroHero variant="boxes"), zodat ze identiek zijn.
import React from 'react'
import { Flame, Wheat, Egg, Droplet } from 'lucide-react'

function MacroBox({ label, icon, color, consumed, target, unitLabel }) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  const over = Math.round((target || 0) - (consumed || 0))
  const size = 48, stroke = 5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (pct / 100) * circ
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.55rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: '100%' }}>
        <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color }}>{pct}<span style={{ fontSize: '0.6em' }}>%</span></span>
        </div>
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
        {Math.abs(over)}
        <span style={{ fontSize: '0.82em', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{unitLabel} {over >= 0 ? 'over' : 'te veel'}</span>
      </div>
    </div>
  )
}

export default function MacroBoxes({ consumed = {}, targets = {}, style }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', ...style }}>
      <MacroBox label="Kcal"  icon={<Flame size={11} color="#10b981" />}   color="#10b981" consumed={consumed.calories} target={targets.calories} unitLabel="" />
      <MacroBox label="Koolh" icon={<Wheat size={11} color="#ec4899" />}   color="#ec4899" consumed={consumed.carbs}    target={targets.carbs}    unitLabel="g" />
      <MacroBox label="Eiwit" icon={<Egg size={11} color="#3b82f6" />}     color="#3b82f6" consumed={consumed.protein}  target={targets.protein}  unitLabel="g" />
      <MacroBox label="Vet"   icon={<Droplet size={11} color="#f59e0b" />} color="#f59e0b" consumed={consumed.fat}      target={targets.fat}      unitLabel="g" />
    </div>
  )
}
