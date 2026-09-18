// src/client/components/TodayCard.jsx
// "Planning vandaag" bovenaan de client-home:
//   - Workout-card met foto (training van vandaag, of Rustdag)
//   - Eerstvolgende call
//
// De voeding stond hier ook: de vier macro-ringen en de volgende maaltijd.
// Die zitten nu in de dagagenda, onder de datum en op de maaltijdblokken
// zelf — daar staan ze op hun plek in de dag in plaats van los erboven.
import { useState, useEffect } from 'react'
import { Play, Phone } from 'lucide-react'
import { workoutFoto } from './workoutFoto'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']


export default function TodayCard({ client, db, setCurrentView, isMobile }) {
  const [training, setTraining] = useState(null)   // null=laden; { rest:true } | { name, focus }
  const [nextCall, setNextCall] = useState(null)   // { scheduled_date, ... } | 'none'

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let alive = true

    // ── Training van vandaag ──
    ;(async () => {
      try {
        const { data: c } = await db.supabase
          .from('clients').select('workout_schedule, assigned_schema_id').eq('id', client.id).single()
        const map = c?.workout_schedule || {}
        const key = map[DAY_NAMES[new Date().getDay()]]
        let w = null
        if (key && c?.assigned_schema_id) {
          const { data: s } = await db.supabase
            .from('workout_schemas').select('week_structure').eq('id', c.assigned_schema_id).single()
          const ws = s?.week_structure
          if (ws) w = Array.isArray(ws) ? ws.find(d => d?.key === key || d?.id === key) : ws[key]
        }
        if (alive) setTraining(w ? { name: w.name || w.title || 'Training', focus: w.focus || '' } : { rest: true })
      } catch { if (alive) setTraining({ rest: true }) }
    })()

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

  const goWorkout = () => setCurrentView && setCurrentView('workout')
  const isRest = training && training.rest
  const workoutImg = training && !isRest ? workoutFoto(training.name) : null

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

      {/* ── Workout-card: foto over de volle breedte, alles op één regel ──
          Was een blok van 140 hoog met de naam onderin en een gouden
          start-knop. Compacter en in dezelfde taal als de rest: wit accent,
          de knop wit met zwarte tekst. */}
      <div
        onClick={goWorkout}
        style={{
          position: 'relative', width: '100%', minHeight: isMobile ? 96 : 112,
          borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {workoutImg
          ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${workoutImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.9) 100%)' }} />

        <div style={{
          position: 'relative',
          padding: isMobile ? '0.7rem 0.8rem' : '0.8rem 1rem',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem',
        }}>
          <div style={{ minWidth: 0 }}>
            {training == null ? (
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>…</div>
            ) : (
              <>
                <div style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.025em', lineHeight: 1.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                }}>
                  {isRest ? 'Rustdag' : training.name}
                </div>
                {!isRest && training.focus && (
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {training.focus}
                  </div>
                )}
              </>
            )}
          </div>

          {training && !isRest && (
            <div style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              minHeight: 34, padding: '0 0.8rem', background: '#fff', borderRadius: 10,
              color: '#0a0a0a', fontSize: '0.74rem', fontWeight: 900, letterSpacing: '-0.01em',
              boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            }}>
              <Play size={12} fill="#0a0a0a" strokeWidth={0} /> Start
            </div>
          )}
        </div>
      </div>

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
