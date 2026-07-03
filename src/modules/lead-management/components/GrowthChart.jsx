// src/modules/lead-management/components/GrowthChart.jsx
// Time-series line chart used in WeekStatsModal: 6 overlaid lines so the
// coach sees input-vs-output causation at a glance.
//
// Inputs  (effort):  nieuwe leads, opvolg verstuurd
// Outputs (results): reacties, call voorgesteld, calls ingepland, sales
//
// Colours match the kanban-section convention already used in the modal's
// Funnel cards so the chart, the cards, and the kanban itself line up.

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts'

const COLORS = {
  newLeads:      '#FFD700', // goud — input
  followups:     '#D4AF37', // donker-goud — input
  replied:       '#3b82f6', // blauw
  callProposed:  '#ef4444', // rood (Call voorgesteld kanban-kleur)
  callScheduled: '#FFD700', // goud (Sales Call kanban-kleur)
  sale:          '#10b981', // groen
}

const LABELS = {
  newLeads:      'Nieuwe leads',
  followups:     'Opvolg verstuurd',
  replied:       'Reacties',
  callProposed:  'Call voorgesteld',
  callScheduled: 'Calls ingepland',
  sale:          'Sales',
}

const fmtAxisDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

const fmtTooltipDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('nl-NL', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,215,0,0.3)',
      borderRadius: 8, padding: '0.6rem 0.75rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        fontSize: '0.65rem', fontWeight: 800,
        color: '#FFD700', marginBottom: 6,
        letterSpacing: '0.04em', textTransform: 'capitalize',
      }}>
        {fmtTooltipDate(label)}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.7rem', color: '#fff',
          padding: '1px 0',
        }}>
          <span style={{ width: 8, height: 8, background: p.color, borderRadius: 2 }} />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{LABELS[p.dataKey] || p.dataKey}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, fontFamily: 'monospace' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function GrowthChart({ data = [], isMobile = false }) {
  // Per-line visibility — let the coach mute noise (e.g. hide follow-ups
  // to see the pure outreach→reply→sale chain).
  const [hidden, setHidden] = useState(new Set())
  const toggle = (key) => setHidden(prev => {
    const n = new Set(prev)
    n.has(key) ? n.delete(key) : n.add(key)
    return n
  })

  // Only show ticks every ~5 days when the window is big — otherwise the
  // X-axis gets unreadable.
  const tickInterval = useMemo(() => {
    if (!data.length) return 0
    if (data.length <= 14) return 0  // show all
    if (data.length <= 35) return Math.ceil(data.length / 7)
    return Math.ceil(data.length / 10)
  }, [data.length])

  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '2rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
      }}>
        Nog geen data in deze periode.
      </div>
    )
  }

  const lineKeys = ['newLeads', 'followups', 'replied', 'callProposed', 'callScheduled', 'sale']

  return (
    <div>
      {/* Legend with toggleable chips */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        marginBottom: '0.6rem',
      }}>
        {lineKeys.map(k => {
          const isHidden = hidden.has(k)
          return (
            <button
              key={k}
              onClick={() => toggle(k)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px',
                background: isHidden ? 'rgba(255,255,255,0.03)' : `${COLORS[k]}15`,
                border: `1px solid ${isHidden ? 'rgba(255,255,255,0.08)' : COLORS[k] + '55'}`,
                borderRadius: 999,
                color: isHidden ? 'rgba(255,255,255,0.3)' : COLORS[k],
                fontSize: '0.62rem', fontWeight: 700,
                cursor: 'pointer', touchAction: 'manipulation',
                textDecoration: isHidden ? 'line-through' : 'none',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: isHidden ? 'rgba(255,255,255,0.15)' : COLORS[k],
              }} />
              {LABELS[k]}
            </button>
          )
        })}
      </div>

      <div style={{ width: '100%', height: isMobile ? 240 : 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tickFormatter={fmtAxisDate}
              interval={tickInterval}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} />
            {lineKeys.map(k => (
              !hidden.has(k) && (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={COLORS[k]}
                  strokeWidth={k === 'sale' ? 2.5 : 1.8}
                  dot={{ r: 2, fill: COLORS[k], strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: COLORS[k], strokeWidth: 2, stroke: '#0a0a0a' }}
                  connectNulls
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
