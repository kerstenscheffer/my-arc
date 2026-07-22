// src/client/components/TodayCard.jsx
// "Planning vandaag" bovenaan de client-home:
//   - Volle-breedte workout-card met foto (training van vandaag, of Rustdag)
//   - Voeding: hergebruikt de meal-pagina styling (RemainingPill): kcal over +
//     eiwit te gaan vs doel
//   - Eerstvolgende call
import { useState, useEffect } from 'react'
import { Dumbbell, Play, Phone, Moon, ChevronRight, Flame, Wheat, Egg, Droplet } from 'lucide-react'
import AIMealPlanService from '../../modules/meal-plan/AIMealPlanService'
import { resolveFoodImage } from '../../modules/meal-plan/foodImageFallback'

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
  const [macros, setMacros] = useState(null)       // { targets, consumed }
  const [nextMeal, setNextMeal] = useState(null)   // maaltijd-object | 'none'
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

    // ── Macro's (voor MacroHero: ring + eiwit/koolh/vet) ──
    ;(async () => {
      try {
        const [{ data: t }, { data: cm }] = await Promise.all([
          db.supabase.from('clients').select('target_calories, target_protein, target_carbs, target_fat').eq('id', client.id).single(),
          db.supabase.from('consumed_meals').select('calories, protein, carbs, fat')
            .eq('client_id', client.id)
            .gte('consumed_at', `${day}T00:00:00`).lt('consumed_at', `${day}T23:59:59`),
        ])
        let ck = 0, cp = 0, cc = 0, cf = 0
        ;(cm || []).forEach(m => { ck += Number(m.calories) || 0; cp += parseFloat(m.protein) || 0; cc += parseFloat(m.carbs) || 0; cf += parseFloat(m.fat) || 0 })
        if (alive) setMacros({
          targets: {
            calories: t?.target_calories || client.target_calories || 0,
            protein: t?.target_protein || client.target_protein || 0,
            carbs: t?.target_carbs || 0,
            fat: t?.target_fat || 0,
          },
          consumed: { calories: Math.round(ck), protein: Math.round(cp), carbs: Math.round(cc), fat: Math.round(cf) },
        })
      } catch { if (alive) setMacros({ targets: { calories: 0, protein: 0, carbs: 0, fat: 0 }, consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 } }) }
    })()

    // ── Volgende maaltijd uit het plan ──
    ;(async () => {
      try {
        const svc = new AIMealPlanService(db)
        const plan = await svc.getActiveAIPlan(client.id)
        if (!plan) { if (alive) setNextMeal('none'); return }
        const progress = await svc.getAIProgress(client.id, day)
        const meals = await svc.getTodayFromWeekStructure(plan, progress)
        const nm = svc.calculateNextMeal(meals, progress?.consumed_meals)
        if (alive) setNextMeal(nm || 'none')
      } catch { if (alive) setNextMeal('none') }
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

  const hasTarget = macros && macros.targets.calories > 0

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

  const meal = (nextMeal && nextMeal !== 'none') ? {
    name: nextMeal.meal_name || nextMeal.name || 'Maaltijd',
    kcal: Math.round(nextMeal.calories || 0),
    slot: nextMeal.timeSlot || '',
    time: (() => { const h = Math.floor(nextMeal.plannedTime || 0); const m = Math.round(((nextMeal.plannedTime || 0) - h) * 60); return `${h}:${String(m).padStart(2, '0')}` })(),
    img: resolveFoodImage(nextMeal, { size: 160 }),
  } : null

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
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

      {/* ── Voeding — volgende maaltijd + 4 macro-vakken ── */}
      <div style={{ marginTop: '1.1rem' }}>
        {/* Volgende maaltijd uit het plan */}
        {meal && (
          <button
            onClick={() => setCurrentView && setCurrentView('meal')}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '0.6rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.7rem', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, backgroundImage: `url(${meal.img})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,215,0,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Volgende{meal.slot ? ` · ${meal.slot}` : ''}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{meal.time} · {meal.kcal} kcal</div>
            </div>
            <ChevronRight size={18} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
          </button>
        )}

        {/* 4 macro-vakken naast elkaar (kcal / koolh / eiwit / vet) */}
        {macros == null ? (
          <div style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>…</div>
        ) : hasTarget ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: meal ? '0.7rem' : 0 }}>
            <MacroBox label="Kcal"  icon={<Flame size={11} color="#10b981" />}   color="#10b981" consumed={macros.consumed.calories} target={macros.targets.calories} unitLabel="" />
            <MacroBox label="Koolh" icon={<Wheat size={11} color="#ec4899" />}   color="#ec4899" consumed={macros.consumed.carbs}    target={macros.targets.carbs}    unitLabel="g" />
            <MacroBox label="Eiwit" icon={<Egg size={11} color="#3b82f6" />}     color="#3b82f6" consumed={macros.consumed.protein}  target={macros.targets.protein}  unitLabel="g" />
            <MacroBox label="Vet"   icon={<Droplet size={11} color="#f59e0b" />} color="#f59e0b" consumed={macros.consumed.fat}      target={macros.targets.fat}      unitLabel="g" />
          </div>
        ) : (
          <div style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Nog geen voedingsdoel ingesteld.</div>
        )}
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
