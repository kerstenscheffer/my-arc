// src/client/components/TodayCard.jsx
// "Vandaag"-card bovenaan de client-home. Zelf-ladend overzicht van vandaag:
//   - Training van vandaag (schema-dag) + Start, of Rustdag
//   - Macro's over (kcal + vooral eiwit resterend) uit consumed_meals vs target
//   - Water (liters vs doel) met één tik om een glas te loggen
//   - Eerstvolgende geplande call
import { useState, useEffect } from 'react'
import { Dumbbell, Flame, Droplet, Phone, Play, Plus } from 'lucide-react'

const GOLD = '#FFD700'
const WATER_GOAL_L = 2.0
const GLASS_L = 0.25
const todayYMD = () => new Date().toISOString().split('T')[0]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TodayCard({ client, db, setCurrentView, isMobile }) {
  const [training, setTraining] = useState(null)   // null = nog laden; { rest:true } of { name }
  const [macros, setMacros] = useState(null)       // { kcal, protein }
  const [water, setWater] = useState(0)            // liters
  const [nextCall, setNextCall] = useState(null)   // { scheduled_date, ... } | 'none'
  const [savingWater, setSavingWater] = useState(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let alive = true
    const day = todayYMD()

    // ── Training van vandaag ──
    ;(async () => {
      try {
        const { data: c } = await db.supabase
          .from('clients')
          .select('workout_schedule, assigned_schema_id')
          .eq('id', client.id).single()
        const map = c?.workout_schedule || {}
        const key = map[DAY_NAMES[new Date().getDay()]]
        let w = null
        if (key && c?.assigned_schema_id) {
          const { data: s } = await db.supabase
            .from('workout_schemas').select('week_structure').eq('id', c.assigned_schema_id).single()
          const ws = s?.week_structure
          if (ws) w = Array.isArray(ws) ? ws.find(d => d?.key === key || d?.id === key) : ws[key]
        }
        if (alive) setTraining(w ? { name: w.name || w.title || w.focus || 'Training' } : { rest: true })
      } catch { if (alive) setTraining({ rest: true }) }
    })()

    // ── Macro's over ──
    ;(async () => {
      try {
        const [{ data: t }, { data: cm }] = await Promise.all([
          db.supabase.from('clients').select('target_calories, target_protein').eq('id', client.id).single(),
          db.supabase.from('consumed_meals').select('calories, protein')
            .eq('client_id', client.id)
            .gte('consumed_at', `${day}T00:00:00`).lt('consumed_at', `${day}T23:59:59`),
        ])
        const tKcal = t?.target_calories || client.target_calories || 0
        const tProt = t?.target_protein || client.target_protein || 0
        let ck = 0, cp = 0
        ;(cm || []).forEach(m => { ck += Number(m.calories) || 0; cp += parseFloat(m.protein) || 0 })
        if (alive) setMacros({
          kcal: Math.max(0, Math.round(tKcal - ck)),
          protein: Math.max(0, Math.round(tProt - cp)),
          hasTarget: tKcal > 0 || tProt > 0,
        })
      } catch { if (alive) setMacros({ kcal: 0, protein: 0, hasTarget: false }) }
    })()

    // ── Water ──
    ;(async () => {
      try {
        const row = await db.getWaterIntake(client.id, day)
        if (alive) setWater(row?.amount || 0)
      } catch { /* laat 0 staan */ }
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
          .order('scheduled_date', { ascending: true })
          .limit(1)
        if (alive) setNextCall(data?.[0] || 'none')
      } catch { if (alive) setNextCall('none') }
    })()

    return () => { alive = false }
  }, [client?.id, db])

  const logGlass = async () => {
    if (savingWater) return
    const next = Math.round((water + GLASS_L) * 100) / 100
    setWater(next)  // optimistisch
    setSavingWater(true)
    try { await db.saveWaterIntake(client.id, todayYMD(), next) }
    catch (e) { console.error('water log mislukt:', e) }
    setSavingWater(false)
  }

  const callLabel = () => {
    if (nextCall === 'none' || !nextCall) return { big: 'Geen', sub: 'call gepland' }
    const d = new Date(nextCall.scheduled_date)
    const dagen = Math.ceil((d - new Date()) / 86400000)
    const datum = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    return { big: datum, sub: dagen <= 0 ? 'vandaag' : dagen === 1 ? 'morgen' : `over ${dagen} dagen` }
  }

  const glasses = Math.round(water / GLASS_L)
  const call = callLabel()

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', paddingLeft: '0.15rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Vandaag</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        {/* Training */}
        <Tile onClick={() => setCurrentView && setCurrentView('workout')} accent={GOLD} icon={<Dumbbell size={15} color={GOLD} />} label="Training">
          {training == null ? (
            <Dim>…</Dim>
          ) : training.rest ? (
            <Big>Rustdag</Big>
          ) : (
            <>
              <Big title={training.name}>{training.name}</Big>
              <ActionPill color={GOLD}><Play size={10} /> Start</ActionPill>
            </>
          )}
        </Tile>

        {/* Macro's over */}
        <Tile onClick={() => setCurrentView && setCurrentView('meal')} accent="#10b981" icon={<Flame size={15} color="#10b981" />} label="Nog te eten">
          {macros == null ? <Dim>…</Dim> : !macros.hasTarget ? <Dim>Geen doel</Dim> : (
            <>
              <Big><span style={{ color: '#10b981' }}>{macros.protein}g</span> eiwit</Big>
              <Sub>{macros.kcal} kcal over</Sub>
            </>
          )}
        </Tile>

        {/* Water */}
        <Tile onClick={logGlass} accent="#3b82f6" icon={<Droplet size={15} color="#3b82f6" />} label="Water">
          <Big><span style={{ color: '#3b82f6' }}>{water.toFixed(1)}</span> / {WATER_GOAL_L.toFixed(1)}L</Big>
          <ActionPill color="#3b82f6"><Plus size={10} /> Glas ({glasses})</ActionPill>
        </Tile>

        {/* Eerstvolgende call */}
        <Tile onClick={() => setCurrentView && setCurrentView('calls')} accent="#a855f7" icon={<Phone size={15} color="#a855f7" />} label="Volgende call">
          {nextCall == null ? <Dim>…</Dim> : (
            <>
              <Big style={{ textTransform: 'capitalize' }}>{call.big}</Big>
              <Sub>{call.sub}</Sub>
            </>
          )}
        </Tile>
      </div>
    </div>
  )
}

function Tile({ onClick, accent, icon, label, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', cursor: 'pointer', width: '100%',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${accent}`, borderRadius: 14, padding: '0.85rem 0.9rem',
        display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 96,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon}
        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      {children}
    </button>
  )
}
const Big = ({ children, title, style }) => (
  <div title={title} style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums', ...style }}>{children}</div>
)
const Sub = ({ children }) => (
  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{children}</div>
)
const Dim = ({ children }) => (
  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{children}</div>
)
const ActionPill = ({ color, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 'auto', padding: '0.15rem 0.45rem', background: `${color}1f`, border: `1px solid ${color}55`, borderRadius: 6, color, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{children}</span>
)
