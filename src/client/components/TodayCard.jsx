// src/client/components/TodayCard.jsx
// "Planning vandaag" bovenaan de client-home:
//   - Volle-breedte workout-card met foto (training van vandaag, of Rustdag)
//   - Voeding: hergebruikt de meal-pagina styling (RemainingPill): kcal over +
//     eiwit te gaan vs doel
//   - Eerstvolgende call
import { useState, useEffect } from 'react'
import { Dumbbell, Play, Phone, Moon } from 'lucide-react'
import RemainingPill from '../../modules/meal-plan/components/RemainingPill'

const GOLD = '#FFD700'
const todayYMD = () => new Date().toISOString().split('T')[0]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const WORKOUT_IMAGES = {
  push: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=1200&h=500&fit=crop&q=85',
  pull: 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1200&h=500&fit=crop&q=85',
  legs: 'https://images.unsplash.com/photo-1567598508481-65985588e295?w=1200&h=500&fit=crop&q=85',
  default: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=500&fit=crop&q=85',
}
const pickWorkoutImg = (name) => {
  const n = (name || '').toLowerCase()
  if (/push|duw|borst|chest|press/.test(n)) return WORKOUT_IMAGES.push
  if (/pull|trek|rug|back|lat/.test(n)) return WORKOUT_IMAGES.pull
  if (/leg|been|quad|squat|hamstring|glute/.test(n)) return WORKOUT_IMAGES.legs
  return WORKOUT_IMAGES.default
}

export default function TodayCard({ client, db, setCurrentView, isMobile }) {
  const [training, setTraining] = useState(null)   // null=laden; { rest:true } | { name, focus }
  const [macros, setMacros] = useState(null)       // { targetKcal, targetProtein, consumedKcal, consumedProtein }
  const [nextCall, setNextCall] = useState(null)   // { scheduled_date, ... } | 'none'

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let alive = true
    const day = todayYMD()

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

    // ── Macro's ──
    ;(async () => {
      try {
        const [{ data: t }, { data: cm }] = await Promise.all([
          db.supabase.from('clients').select('target_calories, target_protein').eq('id', client.id).single(),
          db.supabase.from('consumed_meals').select('calories, protein')
            .eq('client_id', client.id)
            .gte('consumed_at', `${day}T00:00:00`).lt('consumed_at', `${day}T23:59:59`),
        ])
        let ck = 0, cp = 0
        ;(cm || []).forEach(m => { ck += Number(m.calories) || 0; cp += parseFloat(m.protein) || 0 })
        if (alive) setMacros({
          targetKcal: t?.target_calories || client.target_calories || 0,
          targetProtein: t?.target_protein || client.target_protein || 0,
          consumedKcal: Math.round(ck),
          consumedProtein: Math.round(cp),
        })
      } catch { if (alive) setMacros({ targetKcal: 0, targetProtein: 0, consumedKcal: 0, consumedProtein: 0 }) }
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
  }, [client?.id, db]) // eslint-disable-line react-hooks/exhaustive-deps

  const goWorkout = () => setCurrentView && setCurrentView('workout')
  const isRest = training && training.rest
  const workoutImg = training && !isRest ? pickWorkoutImg(training.name) : null

  // Voeding-props in de vorm die RemainingPill verwacht.
  const hasTarget = macros && macros.targetKcal > 0
  const remaining = macros ? { kcal: macros.targetKcal - macros.consumedKcal, protein: macros.targetProtein > 0 ? (macros.targetProtein - macros.consumedProtein) : null } : null
  const consumed = macros ? { calories: macros.consumedKcal } : null
  const target = macros ? { calories: macros.targetKcal, protein: macros.targetProtein } : null

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
      {/* Kop */}
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.65rem', paddingLeft: '0.15rem' }}>
        Planning vandaag
      </div>

      {/* ── Workout-card volle breedte met foto ── */}
      <div
        onClick={goWorkout}
        style={{
          position: 'relative', width: '100%', minHeight: isMobile ? 140 : 165,
          borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {workoutImg
          ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${workoutImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)' }} />

        <div style={{ position: 'relative', padding: isMobile ? '0.9rem 1rem' : '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
            {isRest ? <Moon size={13} color="rgba(255,255,255,0.65)" /> : <Dumbbell size={13} color={GOLD} />}
            <span style={{ fontSize: '0.56rem', fontWeight: 800, color: isRest ? 'rgba(255,255,255,0.6)' : GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Training vandaag
            </span>
          </div>
          {training == null ? (
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>…</div>
          ) : isRest ? (
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Rustdag</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {training.name}
                </div>
                {training.focus && <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{training.focus}</div>}
              </div>
              <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.5rem 0.85rem', background: GOLD, borderRadius: 10, color: '#0a0a0a', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <Play size={13} fill="#0a0a0a" /> Start
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Voeding — styling overgenomen van de voeding-pagina (RemainingPill) ── */}
      <div style={{ marginTop: '1.1rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', paddingLeft: '0.15rem' }}>
          Voeding
        </div>
        <div
          onClick={() => setCurrentView && setCurrentView('meal')}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}
        >
          {macros == null ? (
            <div style={{ padding: '1.1rem', fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>…</div>
          ) : hasTarget ? (
            <RemainingPill remaining={remaining} consumed={consumed} target={target} isMobile={isMobile} />
          ) : (
            <div style={{ padding: '1.1rem', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Nog geen voedingsdoel ingesteld.</div>
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
