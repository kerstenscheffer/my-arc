// src/modules/lead-management/components/StatWeekGrafiek.jsx
//
// Grafiekje per stat in het uitlegvenster: de laatste 8 weken, week op week
// (17 okt 2026). Zelfde opmaak als het krachtverloop bij de workouts: één
// lijn, punten groen als het beter ging dan de week ervoor, rood als slechter,
// het weekgemiddelde als stippellijn. Eén stat per grafiek, dus een lage stat
// als Sales wordt niet weggedrukt door een hoge als Nieuwe leads.

import { useEffect, useState } from 'react'
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { haalStatWeekReeks, STAT_REEKS } from './statWeekReeks'

const GROEN = '#10b981'
const ROOD = '#ef4444'

// Bij No-shows, Afgewezen, Sale verloren en No-show% is lager juist beter.
const LAGER_BETER = new Set(['No-shows', 'Afgewezen', 'Sale verloren', 'No-show', 'Opvolg', 'Niet geschikt'])

export default function StatWeekGrafiek({ leadService, coachId, label, eindDatum, isMobile }) {
  const [reeks, setReeks] = useState(undefined)
  const def = STAT_REEKS[label]
  const eenheid = def?.[2] || ''

  useEffect(() => {
    if (!def) return
    let weg = false
    setReeks(undefined)
    haalStatWeekReeks(leadService, coachId, label, eindDatum)
      .then(r => { if (!weg) setReeks(r || null) }, () => { if (!weg) setReeks(null) })
    return () => { weg = true }
  }, [leadService, coachId, label, eindDatum?.getTime?.()]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!def) return null
  const fmt = (v) => (v == null ? '—' : eenheid === '€' ? `€${Math.round(v).toLocaleString('nl-NL')}` : eenheid === '%' ? `${v}%` : String(v))

  if (reeks === undefined) {
    return <div style={{ height: isMobile ? 170 : 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700 }}>Grafiek laden…</div>
  }
  if (!reeks) return null

  const lagerBeter = LAGER_BETER.has(label)
  const data = reeks.map((p, i) => {
    const vorig = i > 0 ? reeks[i - 1].waarde : null
    const beter = vorig == null || p.waarde == null ? null : (lagerBeter ? p.waarde < vorig : p.waarde > vorig)
    const slechter = vorig == null || p.waarde == null ? null : (lagerBeter ? p.waarde > vorig : p.waarde < vorig)
    return { ...p, kleur: beter ? GROEN : slechter ? ROOD : '#fff' }
  })
  const waarden = data.map(d => d.waarde).filter(v => v != null)
  const gem = waarden.length ? Math.round((waarden.reduce((t, v) => t + v, 0) / waarden.length) * 10) / 10 : null
  const nu = data[data.length - 1]?.waarde
  const vorig = data[data.length - 2]?.waarde
  const verschil = nu != null && vorig != null ? nu - vorig : null
  const goed = verschil == null || verschil === 0 ? null : (lagerBeter ? verschil < 0 : verschil > 0)

  const Punt = ({ cx, cy, payload, index }) => {
    if (cx == null || cy == null || payload.waarde == null) return null
    const laatste = index === data.length - 1
    return (
      <g>
        <circle cx={cx} cy={cy} r={laatste ? 5 : 3.5} fill={payload.kleur} stroke="#0a0a0a" strokeWidth={1.5} />
        <text x={cx} y={cy - 9} textAnchor="middle" fontSize={10} fontWeight={900} fill={laatste ? '#fff' : 'rgba(255,255,255,0.6)'}>
          {fmt(payload.waarde)}
        </text>
      </g>
    )
  }

  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <TrendingUp size={14} color="#fff" strokeWidth={2.6} />
        <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>Week op week</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
          {verschil != null && (
            <span style={{ color: goed == null ? '#fff' : goed ? GROEN : ROOD }}>
              {verschil > 0 ? '▲ +' : verschil < 0 ? '▼ ' : '= '}{verschil !== 0 ? fmt(Math.abs(verschil)).replace(/^-/, '') : ''}
            </span>
          )}
          {verschil != null && ' t.o.v. vorige week'}
        </span>
      </div>
      <div style={{ width: '100%', height: isMobile ? 170 : 200 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#fff', fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#fff', fontWeight: 800 }} axisLine={false} tickLine={false} width={40}
              allowDecimals={false} tickFormatter={(v) => (eenheid === '€' && v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
            <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.2)' }} content={({ active, payload }) => (active && payload?.[0]) ? (
              <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                {payload[0].payload.label} · {fmt(payload[0].payload.waarde)}
              </div>
            ) : null} />
            {gem != null && <ReferenceLine y={gem} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />}
            <Line dataKey="waarde" stroke="rgba(255,255,255,0.85)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round"
              dot={<Punt />} activeDot={false} isAnimationActive={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 0.9rem', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 2, background: 'rgba(255,255,255,0.3)' }} />gemiddeld {fmt(gem)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: GROEN }} />beter dan de week ervoor</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: ROOD }} />slechter</span>
      </div>
    </div>
  )
}
