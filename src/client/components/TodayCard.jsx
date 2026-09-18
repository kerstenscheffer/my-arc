// src/client/components/TodayCard.jsx
// Wat er van "Planning vandaag" over is: de eerstvolgende call.
//
// De voeding (de vier macro-ringen en de volgende maaltijd) en de training
// stonden hier ook. Die zitten nu in de dagagenda, op hun plek in de dag, met
// de knoppen op de blokken zelf. Een call staat niet in de agenda, dus die
// blijft hier tot dat wel zo is.
import { useState, useEffect } from 'react'
import { Phone } from 'lucide-react'


export default function TodayCard({ client, db, setCurrentView, isMobile }) {
  const [nextCall, setNextCall] = useState(null)   // { scheduled_date, ... } | 'none'

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let alive = true

    // ── Eerstvolgende call ──
    ;(async () => {
      try {
        const { data } = await db.supabase
          .from('client_calls')
          .select('scheduled_date, call_title, call_number, client_call_plans!inner(client_id)')
          .eq('client_call_plans.client_id', client.id)
          .eq('status', 'scheduled')
          .gte('scheduled_date', new Date().toISOString())
          .order('scheduled_date', { ascending: true }).limit(1)
        if (alive) setNextCall(data?.[0] || 'none')
      } catch { if (alive) setNextCall('none') }
    })()

    return () => { alive = false }
  }, [client?.id, db])

  const callInfo = () => {
    if (nextCall === 'none' || !nextCall) return null
    const d = new Date(nextCall.scheduled_date)
    const dagen = Math.ceil((d - new Date()) / 86400000)
    return {
      datum: d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }),
      sub: dagen <= 0 ? 'vandaag' : dagen === 1 ? 'morgen' : `over ${dagen} dagen`,
    }
  }
  const call = callInfo()

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>

      {/* ── Eerstvolgende call ── */}
      {call && (
        <button
          onClick={() => setCurrentView && setCurrentView('calls')}
          style={{ width: '100%', marginTop: '0.9rem', textAlign: 'left', cursor: 'pointer', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 14, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <Phone size={16} color="#a855f7" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Volgende call</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{call.datum}</div>
          </div>
          <span style={{ flexShrink: 0, fontSize: '0.68rem', fontWeight: 700, color: '#c084fc' }}>{call.sub}</span>
        </button>
      )}
    </div>
  )
}

// Compact macro-vak (4 naast elkaar): icoon + label, %-ring, "Xg over".
