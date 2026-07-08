// src/modules/content-batches/components/BatchPlanningOptions.jsx
// Stap 3 — DUIDELIJKE keuze wat er met de batch gebeurt:
//   1) Opslaan bij batches (niks in agenda)
//   2) Opnamemoment plannen (hele batch als één kaart op 1 dag/tijd)
//   3) Kies zelf welke items in de agenda (per item dag/tijd, rest opgeslagen)

import { Save, Clapperboard, CalendarCheck, Check } from 'lucide-react'
import { GOLD } from '../../output-planning/components/week-planning/constants'

const MODES = [
  { id: 'save',  icon: Save,           color: '#10b981', title: 'Opslaan bij batches', desc: 'Zet de batch klaar zonder iets in de agenda. Je plant later in.' },
  { id: 'shoot', icon: Clapperboard,   color: GOLD.primary, title: 'Opnamemoment plannen', desc: 'Alle items samen als één kaart op één dag & tijd — zo zie je wanneer je ze in één keer opneemt.' },
  { id: 'pick',  icon: CalendarCheck,  color: '#3b82f6', title: 'Kies items voor agenda', desc: 'Vink zelf aan welke items (bv. 1 en 2) in de agenda komen, met dag & tijd. De rest wordt opgeslagen.' },
]

export default function BatchPlanningOptions({
  planMode = 'save',
  onPlanModeChange,
  shootDate = '',
  shootTime = '10:00',
  onShootChange,
  items = [],
  itemSchedule = [],
  onItemScheduleChange,
  format,
  isMobile = false,
}) {
  const itemLabel = (item, i) => {
    const key = format?.fields?.[0]?.key
    const v = key ? item?.fieldValues?.[key] : null
    const s = Array.isArray(v) ? v.find(Boolean) : v
    return (s && String(s).trim()) ? String(s) : `Item ${i + 1}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '1.75rem' }}>
      <div>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Wat wil je met deze batch doen?</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{items.length} items klaar. Kies één van de opties hieronder.</p>
      </div>

      {/* 3 heldere keuzekaarten */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.9rem' }}>
        {MODES.map(m => {
          const active = planMode === m.id
          const Icon = m.icon
          return (
            <button key={m.id} onClick={() => onPlanModeChange(m.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem',
              padding: isMobile ? '1rem' : '1.15rem', textAlign: 'left',
              background: active ? `linear-gradient(135deg, ${m.color}22 0%, rgba(0,0,0,0.4) 100%)` : 'rgba(255,255,255,0.03)',
              border: active ? `2px solid ${m.color}` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease', touchAction: 'manipulation',
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: active ? `${m.color}30` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? m.color + '60' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={active ? m.color : 'rgba(255,255,255,0.6)'} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: active ? m.color : '#fff' }}>{m.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{m.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Opnamemoment — dag + tijd */}
      {planMode === 'shoot' && (
        <div style={{ padding: '1.25rem', background: `${GOLD.background}`, border: `1px solid ${GOLD.border}`, borderRadius: 12 }}>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: GOLD.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clapperboard size={16} /> Opnamemoment
          </h4>
          <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
            De hele batch ({items.length} items) komt als één kaart in de agenda op deze dag & tijd.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.9rem', maxWidth: 460 }}>
            <div>
              <label style={fieldLabel}>Dag</label>
              <input type="date" value={shootDate} onChange={e => onShootChange('date', e.target.value)} style={fieldInput} />
            </div>
            <div>
              <label style={fieldLabel}>Tijd</label>
              <input type="time" value={shootTime} onChange={e => onShootChange('time', e.target.value)} style={fieldInput} />
            </div>
          </div>
        </div>
      )}

      {/* Kies items — checkbox + dag/tijd per item */}
      {planMode === 'pick' && (
        <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12 }}>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarCheck size={16} /> Kies wat in de agenda komt
          </h4>
          <p style={{ margin: '0 0 0.9rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
            Aangevinkte items krijgen een dag & tijd in de agenda. Niet-aangevinkte items worden opgeslagen bij batches.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => {
              const sched = itemSchedule[i] || { selected: false, date: '', time: '12:00' }
              return (
                <div key={i} style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
                  padding: '0.6rem 0.7rem', borderRadius: 8,
                  background: sched.selected ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.25)',
                  border: `1px solid ${sched.selected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  <button onClick={() => onItemScheduleChange(i, { selected: !sched.selected })} style={{
                    width: 22, height: 22, flexShrink: 0, borderRadius: 5, cursor: 'pointer',
                    background: sched.selected ? '#3b82f6' : 'transparent',
                    border: sched.selected ? 'none' : '2px solid #444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{sched.selected && <Check size={13} strokeWidth={3} color="#fff" />}</button>
                  <span style={{ flex: 1, minWidth: 120, fontSize: '0.82rem', fontWeight: 600, color: sched.selected ? '#fff' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#3b82f6', fontWeight: 800, marginRight: 6 }}>{i + 1}.</span>{itemLabel(item, i)}
                  </span>
                  {sched.selected && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="date" value={sched.date} onChange={e => onItemScheduleChange(i, { date: e.target.value })} style={{ ...fieldInput, padding: '0.4rem', width: isMobile ? 130 : 150 }} />
                      <input type="time" value={sched.time} onChange={e => onItemScheduleChange(i, { time: e.target.value })} style={{ ...fieldInput, padding: '0.4rem', width: 90 }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const fieldLabel = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }
const fieldInput = { width: '100%', boxSizing: 'border-box', padding: '0.6rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }
