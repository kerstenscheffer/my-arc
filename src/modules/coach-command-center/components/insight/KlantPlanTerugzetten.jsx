// src/modules/coach-command-center/components/insight/KlantPlanTerugzetten.jsx
//
// Wat de klant zelf blijvend in zijn workout- of maaltijdplan veranderde, met
// een knop om het terug te zetten. De database bewaart bij elke wijziging door
// de klant de oude en nieuwe inhoud van de geraakte dagen (client_plan_versies,
// trigger trg_klant_planwijziging). Terugzetten gaat via de RPC
// zet_planwijziging_terug: per dag de oude inhoud terug, maar alleen als die
// dag daarna niet nóg eens veranderd is. Zie plan-terugzetten.sql.
import { useCallback, useEffect, useState } from 'react'
import { Undo2, Check } from 'lucide-react'

const SECTIEKOP = { padding: '0.6rem 0.9rem 0.45rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }
const ZWAK = 'rgba(255,255,255,0.5)'

const DAG = { monday: 'ma', tuesday: 'di', wednesday: 'wo', thursday: 'do', friday: 'vr', saturday: 'za', sunday: 'zo' }
const DAG_VOLGORDE = Object.keys(DAG)
const SLOT = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', pre_workout: 'Pre-workout', snack: 'Snack' }
const slotNaam = (s) => SLOT[s] || (/^snack\d+$/.test(s) ? `Snack ${s.slice(5)}` : s)
const GEEN_SLOT = new Set(['totals', 'is_training_day', 'notes', 'day_notes'])

const MELDING = {
  'later nog aangepast': 'Deze dag is daarna nog eens aangepast. Zet eerst de nieuwere wijziging terug.',
  'al teruggezet': 'Was al teruggezet.',
  'plan bestaat niet meer': 'Dit plan bestaat niet meer.',
  'geen toegang': 'Geen toegang tot deze klant.',
}

// Gerechtnaam uit een plan-vakje: object met naam, of alleen een id.
function gerechtNaam(v, namen) {
  if (v == null) return null
  if (typeof v === 'string') return namen[v] || 'gerecht'
  return v.meal_name || v.name || (v.meal_id && namen[v.meal_id]) || 'gerecht'
}
function gerechtIds(versies) {
  const ids = new Set()
  const pak = (v) => { if (typeof v === 'string') ids.add(v); else if (v?.meal_id && !v.meal_name && !v.name) ids.add(v.meal_id) }
  for (const r of versies) for (const kant of [r.oud, r.nieuw]) for (const [dag, inhoud] of Object.entries(kant || {})) {
    if (dag.startsWith('_') || !inhoud || typeof inhoud !== 'object') continue
    for (const [slot, v] of Object.entries(inhoud)) if (!GEEN_SLOT.has(slot)) pak(v)
  }
  return [...ids]
}

// Maaltijdplan: "Lunch: Kip-bowl → Pasta (ma, di)". Zelfde wissel op meerdere
// dagen wordt één regel.
function maaltijdRegels(r, namen) {
  const per = new Map()
  const dagen = Object.keys(r.nieuw || {}).filter(k => !k.startsWith('_'))
    .sort((a, b) => DAG_VOLGORDE.indexOf(a) - DAG_VOLGORDE.indexOf(b))
  for (const dag of dagen) {
    const oud = r.oud?.[dag] || {}, nieuw = r.nieuw?.[dag] || {}
    const slots = new Set([...Object.keys(oud || {}), ...Object.keys(nieuw || {})])
    for (const slot of slots) {
      if (GEEN_SLOT.has(slot)) continue
      if (JSON.stringify(oud?.[slot] ?? null) === JSON.stringify(nieuw?.[slot] ?? null)) continue
      const a = gerechtNaam(oud?.[slot], namen), b = gerechtNaam(nieuw?.[slot], namen)
      const tekst = !b ? `${slotNaam(slot)}: ${a} weggehaald`
        : !a ? `${slotNaam(slot)}: ${b} toegevoegd`
        : a === b ? `${slotNaam(slot)}: ${a} aangepast (porties of ingrediënten)`
        : `${slotNaam(slot)}: ${a} → ${b}`
      if (!per.has(tekst)) per.set(tekst, [])
      per.get(tekst).push(DAG[dag] || dag)
    }
  }
  const regels = [...per.entries()].map(([t, d]) => `${t} (${d.join(', ')})`)
  if (r.nieuw && '_pre_workout_meal' in r.nieuw) regels.push('Pre-workout maaltijd aangepast')
  return regels.length ? regels : ['Maaltijdplan aangepast']
}

// Workoutplan: per trainingsdag welke oefening eruit en welke erin ging.
function workoutRegels(r) {
  const regels = []
  for (const dag of Object.keys(r.nieuw || {}).sort()) {
    const oud = r.oud?.[dag], nieuw = r.nieuw?.[dag]
    const naam = nieuw?.name || oud?.name || dag
    const a = (oud?.exercises || []).map(e => e?.name).filter(Boolean)
    const b = (nieuw?.exercises || []).map(e => e?.name).filter(Boolean)
    const eruit = [...a], erin = []
    for (const n of b) { const i = eruit.indexOf(n); if (i >= 0) eruit.splice(i, 1); else erin.push(n) }
    if (eruit.length === 1 && erin.length === 1) regels.push(`${naam}: ${eruit[0]} → ${erin[0]}`)
    else {
      if (eruit.length) regels.push(`${naam}: ${eruit.join(', ')} eruit`)
      if (erin.length) regels.push(`${naam}: ${erin.join(', ')} erin`)
      if (!eruit.length && !erin.length) regels.push(`${naam}: sets, herhalingen of volgorde aangepast`)
    }
  }
  return regels.length ? regels : ['Workoutplan aangepast']
}

export default function KlantPlanTerugzetten({ db, client, soort, isMobile, onTeruggezet }) {
  const [versies, setVersies] = useState([])
  const [namen, setNamen] = useState({})
  const [bezig, setBezig] = useState(null)   // id
  const [zeker, setZeker] = useState(null)   // id dat om bevestiging vraagt
  const [melding, setMelding] = useState({}) // id -> tekst
  const [alles, setAlles] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) { setVersies([]); return }
    const { data, error } = await db.supabase.from('client_plan_versies')
      .select('id, soort, oud, nieuw, created_at, teruggezet_at')
      .eq('client_id', client.id).eq('soort', soort)
      .order('created_at', { ascending: false }).limit(30)
    if (error) { console.error('client_plan_versies', error); return }
    setVersies(data || [])
    const ids = soort === 'meal' ? gerechtIds(data || []) : []
    if (ids.length) {
      const { data: m } = await db.supabase.from('ai_meals').select('id, name').in('id', ids)
      setNamen(Object.fromEntries((m || []).map(x => [x.id, x.name])))
    }
  }, [db, client?.id, soort])

  useEffect(() => { laad() }, [laad])

  const terug = async (id) => {
    if (zeker !== id) { setZeker(id); return }
    setZeker(null); setBezig(id)
    const { data, error } = await db.supabase.rpc('zet_planwijziging_terug', { p_id: id })
    setBezig(null)
    if (error || data !== 'ok') {
      setMelding(m => ({ ...m, [id]: error ? 'Terugzetten mislukt.' : (MELDING[data] || data) }))
      return
    }
    await laad()
    onTeruggezet?.()
  }

  if (!versies.length) return null
  const zichtbaar = alles ? versies : versies.slice(0, 4)

  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={SECTIEKOP}>Blijvend aangepast door klant</div>
      {zichtbaar.map(r => {
        const regels = soort === 'meal' ? maaltijdRegels(r, namen) : workoutRegels(r)
        const datum = new Date(r.created_at).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
        const tijd = new Date(r.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
        const terugGezet = !!r.teruggezet_at
        return (
          <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: isMobile ? '0.5rem 0.9rem' : '0.55rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: terugGezet ? 0.45 : 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {regels.map((t, i) => (
                <div key={i} style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fff', lineHeight: 1.35, textDecoration: terugGezet ? 'line-through' : 'none' }}>{t}</div>
              ))}
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: ZWAK, marginTop: 1 }}>
                {datum} {tijd}{terugGezet ? ` · teruggezet ${new Date(r.teruggezet_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}
              </div>
              {melding[r.id] && <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{melding[r.id]}</div>}
            </div>
            {terugGezet ? (
              <Check size={15} strokeWidth={3} color={ZWAK} style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <button onClick={() => terug(r.id)} disabled={bezig === r.id}
                onBlur={() => setZeker(z => (z === r.id ? null : z))}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                  padding: '0.35rem 0.65rem', borderRadius: 8, cursor: 'pointer', touchAction: 'manipulation',
                  fontSize: '0.7rem', fontWeight: 900,
                  background: zeker === r.id ? '#fff' : 'rgba(255,255,255,0.06)',
                  color: zeker === r.id ? '#000' : '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                <Undo2 size={13} strokeWidth={2.8} />
                {bezig === r.id ? 'Bezig…' : zeker === r.id ? 'Zeker?' : 'Terugzetten'}
              </button>
            )}
          </div>
        )
      })}
      {versies.length > 4 && (
        <button onClick={() => setAlles(v => !v)} style={{ background: 'none', border: 'none', padding: '0.4rem 0.9rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          {alles ? 'Minder tonen' : `Alle ${versies.length} tonen`}
        </button>
      )}
    </div>
  )
}
