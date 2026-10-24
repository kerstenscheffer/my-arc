// src/modules/coach-command-center/components/LooptijdKort.jsx
//
// De looptijd als één compacte lijn in de kopregel van Coach Inzicht:
// stip (status), weken, een smalle balk en "nog Xw · start → eind". Altijd
// zichtbaar; klikken opent het menu met de knoppen (CoachingPeriodPanel).
// Stond eerder achter een "Looptijd"-knop als volle-breedte balk onder de kop.

import { ChevronDown, Lock } from 'lucide-react'
import { computePeriod } from './trajectPeriode'

const kort = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined })
}

export default function LooptijdKort({ client, open, onClick, isMobile }) {
  const period = computePeriod(client)
  const status = client.coaching_status || 'active'
  const opSlot = !!client.account_locked_at
  const overdue = period?.isOver && status !== 'ended'
  const kleur = overdue ? '#ef4444' : status === 'paused' ? '#f59e0b' : status === 'ended' ? '#6b7280' : '#10b981'

  return (
    <button
      onClick={onClick}
      title="Looptijd: verlengen, pauzeren, aanpassen"
      aria-expanded={open}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0,
        height: 34, padding: '0 0.55rem', borderRadius: 10,
        background: open ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none',
        color: '#fff', fontFamily: 'inherit', cursor: 'pointer', flexShrink: isMobile ? 1 : 0,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
      {!period ? (
        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Looptijd instellen</span>
      ) : (
        <>
          <span style={{ fontSize: '0.78rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
            {period.weeksDone}<span style={{ color: 'rgba(255,255,255,0.4)' }}>/{period.weeksTotal}</span> wk
          </span>
          <span style={{ width: isMobile ? 48 : 72, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexShrink: 0 }}>
            <span style={{ display: 'block', width: `${period.pct}%`, height: '100%', background: kleur }} />
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: overdue ? '#ef4444' : 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {overdue ? 'voorbij' : status === 'paused' ? `pauze · ${period.weeksRemaining}w` : status === 'ended' ? 'gestopt' : `nog ${period.weeksRemaining}w`}
            {!isMobile && (
              <span style={{ color: 'rgba(255,255,255,0.32)', fontWeight: 700 }}>
                {' · '}{kort(period.startDate)} → {kort(period.endDate)}
              </span>
            )}
          </span>
        </>
      )}
      {opSlot && <Lock size={12} strokeWidth={2.8} color="#ef4444" style={{ flexShrink: 0 }} />}
      <ChevronDown size={13} strokeWidth={2.6} style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
    </button>
  )
}
