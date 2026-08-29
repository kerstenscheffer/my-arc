// src/modules/coach-command-center/components/insight/CardioInsightBlock.jsx
// Toont de cardio-sessies die de client logt (cardio_logs) in de
// Coach-Insight Training-kolom. Read-only overzicht voor de coach.
import React, { useState, useEffect } from 'react'
import { Footprints, ChevronDown } from 'lucide-react'

const ACCENT = '#fff'

const fmtDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d + 'T00:00:00')
    return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return d }
}

// Maandag = start van de week (NL).
function startOfWeekISO() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  const y = d.getFullYear(), mo = String(d.getMonth() + 1).padStart(2, '0'), da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

export default function CardioInsightBlock({ db, client, isMobile }) {
  const m = isMobile
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!client?.id || !db?.supabase) { setLoading(false); return }
      const since = new Date(); since.setDate(since.getDate() - 30)
      const sinceISO = since.toISOString().slice(0, 10)
      const { data } = await db.supabase
        .from('cardio_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('logged_date', sinceISO)
        .order('logged_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (active) { setLogs(data || []); setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [client?.id])

  // Niets laten zien zolang we laden of als er nooit cardio is gelogd —
  // houdt de kolom schoon voor clients die geen cardio doen.
  if (loading || logs.length === 0) return null

  const weekStart = startOfWeekISO()
  const thisWeek = logs.filter(l => l.logged_date >= weekStart).length

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Footprints size={13} color={ACCENT} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ACCENT, letterSpacing: '-0.01em' }}>Cardio</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{thisWeek} deze week · {logs.length} in 30d</span>
        </div>
        <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div style={{ padding: m ? '0 0.75rem 0.5rem' : '0 1rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {logs.slice(0, 12).map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', minWidth: m ? '38px' : '42px' }}>{fmtDate(log.logged_date)}</span>
              <span style={{ flex: 1, fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.cardio_type}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ACCENT, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {[
                  log.duration_minutes ? `${log.duration_minutes}min` : null,
                  log.distance_km ? `${log.distance_km}km` : null,
                  log.steps ? `${log.steps.toLocaleString('nl-NL')} st` : null,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
          {logs.length > 12 && (
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingTop: '0.2rem' }}>+{logs.length - 12} eerder</div>
          )}
        </div>
      )}
    </div>
  )
}
