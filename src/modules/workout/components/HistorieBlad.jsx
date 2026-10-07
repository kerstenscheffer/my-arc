// src/modules/workout/components/HistorieBlad.jsx
//
// Historie: alles wat de klant ooit heeft gelogd, kracht én cardio, per dag
// onder elkaar. Tik op een training en je ziet de oefeningen met hun sets;
// tik op cardio en je ziet de cijfers. Bovenin kies je kracht/cardio en de
// periode, en zoek je op oefening.

import { useEffect, useMemo, useState } from 'react'
import { Search, Dumbbell, HeartPulse, ChevronDown, Clock } from 'lucide-react'
import RealiteitBlad from '../../client-agenda/RealiteitBlad'
import CardioGedaanBlad from './CardioGedaanBlad'
import ExerciseLogModal from './todays-workout/components/ExerciseLogModal'
import CardioService from '../services/CardioService'
import { cardioFoto } from '../utils/workoutFoto'
import { getWorkoutImage } from './week-schedule/workoutImage'

const PERIODES = [{ id: 30, label: '30 dagen' }, { id: 90, label: '90 dagen' }, { id: 365, label: '1 jaar' }, { id: 0, label: 'Alles' }]
const ZWAARTE = { rustig: 'rustig', gemiddeld: 'gemiddeld', pittig: 'pittig', vol_gas: 'vol gas' }
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dagKop = (datum) => {
  const d = new Date(datum + 'T12:00:00')
  const vandaag = iso(new Date())
  const gisteren = (() => { const g = new Date(); g.setDate(g.getDate() - 1); return iso(g) })()
  if (datum === vandaag) return 'Vandaag'
  if (datum === gisteren) return 'Gisteren'
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}
const minVan = (ts) => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes() }

export default function HistorieBlad({ db, clientId, isMobile, client = null }) {
  const [soort, setSoort] = useState('alles') // alles | kracht | cardio
  const [periode, setPeriode] = useState(90)
  const [zoek, setZoek] = useState('')
  const [sessies, setSessies] = useState(null)
  const [cardio, setCardio] = useState([])
  const [open, setOpen] = useState(null) // { type: 'training', blok } | { type: 'cardio', log }
  const [oefeningLog, setOefeningLog] = useState(null) // { exercise, datum }
  const [limiet, setLimiet] = useState(40)
  // Rooster + plan om oude sessies zonder echte naam ('Quick Log - …') alsnog
  // een naam te geven op basis van de weekdag.
  const [naamPerWeekdag, setNaamPerWeekdag] = useState({})
  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    ;(async () => {
      const { data: klant } = await db.supabase.from('clients').select('workout_schedule, assigned_schema_id').eq('id', clientId).maybeSingle().then(r => r, () => ({ data: null }))
      if (!klant?.assigned_schema_id) return
      const { data: plan } = await db.supabase.from('workout_schemas').select('week_structure').eq('id', klant.assigned_schema_id).maybeSingle().then(r => r, () => ({ data: null }))
      if (weg) return
      const uit = {}
      Object.entries(klant.workout_schedule || {}).forEach(([dag, sleutel]) => {
        const d = plan?.week_structure?.[sleutel]
        const naam = (d?.name || d?.focus || '').trim()
        if (naam) uit[dag.toLowerCase()] = naam
      })
      setNaamPerWeekdag(uit)
    })()
    return () => { weg = true }
  }, [clientId, db])

  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let weg = false
    setSessies(null)
    const vanaf = periode ? (() => { const d = new Date(); d.setDate(d.getDate() - periode); return iso(d) })() : '2000-01-01'
    Promise.all([
      db.supabase.from('workout_sessions')
        .select('id, workout_date, day_name, day_display_name, duration_minutes, is_completed, created_at, workout_progress ( id, exercise_name, sets, created_at )')
        .eq('client_id', clientId).gte('workout_date', vanaf).order('workout_date', { ascending: false })
        .then(r => r, () => ({ data: [] })),
      CardioService.getLogs(clientId, vanaf, db),
    ]).then(([s, c]) => {
      if (weg) return
      setSessies((s?.data || []).filter(x => (x.workout_progress || []).length > 0))
      setCardio(c || [])
      setLimiet(40)
    })
    return () => { weg = true }
  }, [clientId, db, periode])

  // Eén lijst van dagen, nieuwste eerst, met daarin trainingen en cardio.
  const dagen = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    const perDag = {}
    const voeg = (datum, item) => { (perDag[datum] = perDag[datum] || []).push(item) }
    if (soort !== 'cardio') (sessies || []).forEach(s => {
      let oef = s.workout_progress || []
      if (q) oef = oef.filter(p => String(p.exercise_name || '').toLowerCase().includes(q))
      if (!oef.length) return
      const sets = oef.reduce((t, p) => t + (Array.isArray(p.sets) ? p.sets.length : 0), 0)
      const beste = oef.reduce((m, p) => Math.max(m, ...(Array.isArray(p.sets) ? p.sets.map(x => Number(x.weight) || 0) : [0])), 0)
      const laatste = oef.reduce((m, p) => Math.max(m, new Date(p.created_at).getTime() || 0), 0)
      const start = minVan(s.created_at)
      let eind = laatste ? minVan(laatste) + 5 : start + (Number(s.duration_minutes) || 60)
      eind = Math.min(eind, start + 120, 24 * 60); if (eind <= start) eind = Math.min(start + 45, 24 * 60)
      const ruw = s.day_display_name || ''
      const weekdag = new Date(String(s.workout_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const naam = (!ruw || /^quick log/i.test(ruw)) ? (naamPerWeekdag[weekdag] || 'Training') : ruw
      voeg(String(s.workout_date).slice(0, 10), {
        type: 'training', id: s.id, naam, tijd: s.created_at,
        sub: [`${oef.length} oef`, `${sets} sets`, s.duration_minutes ? `${s.duration_minutes} min` : null, beste ? `beste ${nl(beste)} kg` : null].filter(Boolean).join(' · '),
        foto: getWorkoutImage({ name: naam }),
        blok: {
          id: `hist-${s.id}`, day: null, type: 'training', label: 'Training', sublabel: naam, start, end: eind, color: '#fff', source: 'realiteit', editable: false,
          meta: { echt: true, sessionId: s.id, exercise_count: oef.length, estimated_time: `${eind - start} min`, afgerond: !!s.is_completed, datum: s.workout_date },
        },
      })
    })
    if (soort !== 'kracht' && !q) cardio.forEach(l => {
      voeg(String(l.logged_date).slice(0, 10), {
        type: 'cardio', id: l.id, naam: l.cardio_type || 'Cardio', tijd: l.created_at, log: l,
        sub: [l.duration_minutes ? `${l.duration_minutes} min` : null, l.calories ? `${nl(l.calories)} kcal` : null, ZWAARTE[l.intensity] || null, l.distance_km ? `${String(l.distance_km).replace('.', ',')} km` : null, l.steps ? `${nl(l.steps)} stappen` : null].filter(Boolean).join(' · '),
        foto: cardioFoto(l.cardio_type),
      })
    })
    return Object.keys(perDag).sort((a, b) => b.localeCompare(a)).map(datum => ({
      datum, items: perDag[datum].sort((a, b) => new Date(b.tijd) - new Date(a.tijd)),
    }))
  }, [sessies, cardio, soort, zoek, naamPerWeekdag])

  const totaal = { trainingen: (sessies || []).length, cardio: cardio.length, sets: (sessies || []).reduce((t, s) => t + (s.workout_progress || []).reduce((u, p) => u + (Array.isArray(p.sets) ? p.sets.length : 0), 0), 0) }
  const zichtbaar = dagen.slice(0, limiet)

  const pil = (aan) => ({
    minHeight: 34, padding: '0 0.8rem', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 5,
    background: aan ? '#fff' : 'transparent', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.2)'}`, color: aan ? '#0a0a0a' : '#fff',
    fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return (
    <div style={{ paddingBottom: '1rem' }}>
      {/* Cijfers van de periode */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
        {[{ w: totaal.trainingen, l: 'trainingen' }, { w: totaal.cardio, l: 'cardio' }, { w: totaal.sets, l: 'sets' }].map(x => (
          <div key={x.l}>
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{nl(x.w)}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Kracht/cardio links, periode als dropdown rechts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {[{ id: 'alles', label: 'Alles' }, { id: 'kracht', label: 'Kracht', I: Dumbbell }, { id: 'cardio', label: 'Cardio', I: HeartPulse }].map(o => {
          const I = o.I
          return <button key={o.id} onClick={() => setSoort(o.id)} style={pil(soort === o.id)}>{I && <I size={13} strokeWidth={2.6} />}{o.label}</button>
        })}
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select value={periode} onChange={e => setPeriode(Number(e.target.value))} style={{
            appearance: 'none', WebkitAppearance: 'none', background: 'transparent', border: 'none', color: '#fff',
            fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', padding: '0 18px 0 0', cursor: 'pointer', outline: 'none',
          }}>
            {PERIODES.map(p => <option key={p.id} value={p.id} style={{ background: '#0a0a0a' }}>{p.label}</option>)}
          </select>
          <ChevronDown size={14} color="#fff" strokeWidth={2.8} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Zoeken op oefening */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een oefening…" style={{
          width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', padding: '0.5rem 0 0.5rem 24px', outline: 'none',
        }} />
      </div>

      {sessies === null ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 700 }}>Laden…</div>
      ) : dagen.length === 0 ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 700 }}>Nog niets gelogd in deze periode.</div>
      ) : zichtbaar.map(dag => (
        <div key={dag.datum} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{dagKop(dag.datum)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dag.items.map(it => (
              <button key={`${it.type}-${it.id}`} onClick={() => setOpen(it.type === 'training' ? { type: 'training', blok: it.blok } : { type: 'cardio', log: it.log })} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 0, textAlign: 'left',
                background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <div style={{ position: 'relative', width: isMobile ? 64 : 72, height: isMobile ? 64 : 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${it.foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }} />
                  <div style={{ position: 'absolute', left: 5, bottom: 4, display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {it.type === 'training' ? <Dumbbell size={9} strokeWidth={2.8} /> : <HeartPulse size={9} strokeWidth={2.8} />}{it.type === 'training' ? 'Kracht' : 'Cardio'}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '0.95rem' : '1.02rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.naam}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.sub}</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {it.tijd ? new Date(it.tijd).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {dagen.length > limiet && (
        <button onClick={() => setLimiet(l => l + 40)} style={{ ...pil(false), width: '100%', justifyContent: 'center', minHeight: 44, borderRadius: 14 }}>Meer laden</button>
      )}

      <RealiteitBlad blok={open?.type === 'training' && !oefeningLog ? open.blok : null} db={db} isMobile={isMobile} onClose={() => setOpen(null)}
        onOefening={(ex) => { const sets = Array.isArray(ex?.sets) ? ex.sets : []; setOefeningLog({ exercise: { name: ex.exercise_name, sets: sets.length || 3, reps: sets[0]?.reps || 10 }, datum: open?.blok?.meta?.datum || null }) }} />
      {oefeningLog && (
        <ExerciseLogModal db={db} client={client || { id: clientId }} exercise={oefeningLog.exercise} datum={oefeningLog.datum} isMobile={isMobile}
          onClose={() => setOefeningLog(null)} />
      )}
      {open?.type === 'cardio' && (
        <CardioGedaanBlad log={open.log} soort={open.log?.cardio_type} db={db} isMobile={isMobile}
          onClose={() => setOpen(null)}
          onVerwijderd={() => { setCardio(c => c.filter(x => x.id !== open.log.id)); window.dispatchEvent(new CustomEvent('myarc:cardio-changed')) }} />
      )}
    </div>
  )
}
