// src/modules/workout/components/KrachtBlad.jsx
//
// Kracht: hoe sta je ervoor, per oefening. Dezelfde maat als onder 'Set
// toevoegen' in het logscherm: je beste set per training omgerekend naar
// wat je op acht herhalingen zou halen, afgezet tegen de band van je fase
// (op tempo / traag / stil). Bovenin de telling, daaronder per oefening een
// regel met foto, laatste stand en verschil; tik erop voor de grafiek.

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, Info } from 'lucide-react'
import ExerciseProgressChart from './todays-workout/components/ExerciseProgressChart'
import { metBandFases, KLEUR_VOOR, oordeelTekst, geschatRM, REFERENTIE_REPS } from './todays-workout/krachtBand'
import useOefeningFotos from '../utils/useOefeningFotos'

const DOEL_LABEL = { cut: 'Cut', build: 'Build', recomp: 'Recomp', onderhoud: 'Onderhoud' }
// De tellers heten anders per fase: in een cut is 'staat stil' juist goed.
const TELLER_LABELS = {
  cut: { goed: 'behouden', traag: 'zakt licht', stil: 'zakt hard' },
  anders: { goed: 'op tempo', traag: 'traag', stil: 'stil' },
}
const nl1 = (n) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n || 0)
const kort = (d) => new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// Zelfde keuze als de grafiek in het logscherm: de set met de hoogste
// schatting, niet per se het zwaarste gewicht.
const besteSet = (sets) => (sets || []).reduce((beste, set) => {
  const gewicht = Number(set?.weight) || 0, reps = Number(set?.reps) || 0
  if (!gewicht) return beste
  const score = geschatRM(gewicht, reps)
  return (!beste || score > beste.score) ? { gewicht, reps, score } : beste
}, null)

export default function KrachtBlad({ db, client, isMobile }) {
  // Fases van de klant; de keuze bepaalt het bereik én de norm (cut = kracht
  // vasthouden is goed, build = omhoog). Standaard de lopende fase.
  const [fases, setFases] = useState(null)
  const [faseId, setFaseId] = useState('alles')
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    db.supabase.from('client_phases').select('id, doel, started_on, ended_on').eq('client_id', client.id).order('started_on', { ascending: true })
      .then(r => r, () => ({ data: [] }))
      .then(({ data }) => {
        if (weg) return
        const lijst = data || []
        setFases(lijst)
        const lopend = lijst.find(f => !f.ended_on) || lijst[lijst.length - 1]
        if (lopend) setFaseId(lopend.id)
      })
    return () => { weg = true }
  }, [client?.id, db])
  const fase = (fases || []).find(f => f.id === faseId) || null
  const vanaf = fase ? String(fase.started_on).slice(0, 10) : null
  const tot = fase?.ended_on ? String(fase.ended_on).slice(0, 10) : null
  const [filter, setFilter] = useState('alles') // alles | goed | traag | stil
  const [zoek, setZoek] = useState('')
  const [open, setOpen] = useState(null)
  const [uitleg, setUitleg] = useState(false)
  const [ruw, setRuw] = useState(null) // { perOefening: {naam: [punten]}, fases }

  useEffect(() => {
    if (!client?.id || !db?.supabase || fases === null) return
    let weg = false
    setRuw(null)
    ;(async () => {
      let q = db.supabase.from('workout_sessions').select('id, workout_date').eq('client_id', client.id)
      if (vanaf) q = q.gte('workout_date', vanaf)
      if (tot) q = q.lte('workout_date', tot)
      const { data: sessies } = await q.order('workout_date', { ascending: true }).then(r => r, () => ({ data: [] }))
      const perSessie = new Map((sessies || []).map(s => [s.id, s.workout_date]))
      let rijen = []
      const ids = (sessies || []).map(s => s.id)
      for (let i = 0; i < ids.length; i += 200) {
        const { data } = await db.supabase.from('workout_progress').select('session_id, exercise_name, sets').in('session_id', ids.slice(i, i + 200))
          .then(r => r, () => ({ data: [] }))
        rijen = rijen.concat(data || [])
      }
      if (weg) return
      const perOefening = {}
      rijen.forEach(r => {
        const beste = besteSet(r.sets); const datum = perSessie.get(r.session_id)
        if (!beste || !datum || !r.exercise_name) return
        const lijst = (perOefening[r.exercise_name] = perOefening[r.exercise_name] || [])
        const bestaand = lijst.find(x => x.datum === datum)
        const punt = { datum, gewicht: beste.score, ruwGewicht: beste.gewicht, reps: beste.reps }
        if (!bestaand) lijst.push(punt); else if (punt.gewicht > bestaand.gewicht) Object.assign(bestaand, punt)
      })
      Object.values(perOefening).forEach(l => l.sort((a, b) => String(a.datum).localeCompare(String(b.datum))))
      setRuw({ perOefening, fases })
    })()
    return () => { weg = true }
  }, [client?.id, db, fases, vanaf, tot])

  // Per oefening: laatste stand, oordeel, verschil, PR.
  const oefeningen = useMemo(() => {
    if (!ruw) return []
    return Object.entries(ruw.perOefening).map(([naam, punten]) => {
      const metBand = metBandFases(punten, ruw.fases)
      const laatste = metBand[metBand.length - 1]
      const eerste = metBand[0]
      const max = Math.max(...punten.map(p => p.gewicht))
      return {
        naam, punten, aantal: punten.length,
        laatste, eerste,
        verschil: punten.length > 1 ? Math.round((laatste.gewicht - eerste.gewicht) * 10) / 10 : null,
        oordeel: punten.length > 1 ? laatste.oordeel : null,
        norm: laatste?.norm || null,
        isPR: punten.length > 1 && laatste.gewicht >= max,
      }
    }).sort((a, b) => String(b.laatste?.datum || '').localeCompare(String(a.laatste?.datum || '')))
  }, [ruw])

  const labels = String(fase?.doel || '').toLowerCase() === 'cut' ? TELLER_LABELS.cut : TELLER_LABELS.anders
  const faseNaam = (f) => `${DOEL_LABEL[String(f.doel || '').toLowerCase()] || f.doel || 'Fase'} · ${kort(f.started_on)}${f.ended_on ? ` – ${kort(f.ended_on)}` : ' – nu'}`
  const telling = { goed: 0, traag: 0, stil: 0, pr: 0 }
  oefeningen.forEach(o => { if (o.oordeel) telling[o.oordeel]++; if (o.isPR) telling.pr++ })
  const q = zoek.trim().toLowerCase()
  const lijst = oefeningen.filter(o => (filter === 'alles' || o.oordeel === filter) && (!q || o.naam.toLowerCase().includes(q)))
  const fotoVan = useOefeningFotos(db, oefeningen.map(o => o.naam))

  const stip = (kleur) => <span style={{ width: 7, height: 7, borderRadius: '50%', background: kleur, flexShrink: 0 }} />

  return (
    <div style={{ paddingBottom: '1rem' }}>
      {/* Telling: hoeveel oefeningen lopen op tempo, traag, stil, en PR's */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'flex-end' }}>
        {[{ w: telling.goed, l: labels.goed, k: KLEUR_VOOR.goed }, { w: telling.traag, l: labels.traag, k: KLEUR_VOOR.traag }, { w: telling.stil, l: labels.stil, k: KLEUR_VOOR.stil }, { w: telling.pr, l: 'op PR', k: '#fff' }].map(x => (
          <div key={x.l}>
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 900, color: x.k, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{x.w}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{x.l}</div>
          </div>
        ))}
        <button onClick={() => setUitleg(v => !v)} aria-label="Uitleg" style={{ marginLeft: 'auto', width: 28, height: 28, padding: 0, background: 'transparent', border: 'none', color: uitleg ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Info size={16} /></button>
      </div>
      {uitleg && (
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 12 }}>
          Per oefening tellen we je beste set per training, omgerekend naar wat je op <strong style={{ color: '#fff' }}>{REFERENTIE_REPS} herhalingen</strong> zou halen. Zo telt 70 kg × 11 zwaarder dan 70 kg × 8. Het oordeel zet je laatste stand tegen de band van de gekozen fase: in een build hoort het omhoog, in een cut is vasthouden het doel en is 'behouden' dus groen.
        </div>
      )}

      {/* Eén regel: oordeel-dropdown links, fase-dropdown rechts. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {filter !== 'alles' && stip(KLEUR_VOOR[filter])}
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', padding: '0 18px 0 0', cursor: 'pointer', outline: 'none' }}>
            <option value="alles" style={{ background: '#0a0a0a' }}>Alle oefeningen</option>
            {['goed', 'traag', 'stil'].map(k => <option key={k} value={k} style={{ background: '#0a0a0a' }}>{labels[k][0].toUpperCase() + labels[k].slice(1)}</option>)}
          </select>
          <ChevronDown size={14} color="#fff" strokeWidth={2.8} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
        </div>
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select value={faseId} onChange={e => setFaseId(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', padding: '0 18px 0 0', cursor: 'pointer', outline: 'none', maxWidth: 200, textOverflow: 'ellipsis' }}>
            {(fases || []).map(f => <option key={f.id} value={f.id} style={{ background: '#0a0a0a' }}>{faseNaam(f)}</option>)}
            <option value="alles" style={{ background: '#0a0a0a' }}>Alle fases</option>
          </select>
          <ChevronDown size={14} color="#fff" strokeWidth={2.8} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een oefening…" style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit', padding: '0.5rem 0 0.5rem 24px', outline: 'none' }} />
      </div>

      {ruw === null ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 700 }}>Laden…</div>
      ) : lijst.length === 0 ? (
        <div style={{ padding: '2rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 700 }}>Geen oefeningen in deze fase.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lijst.map(o => {
            const isOpen = open === o.naam
            const kleur = o.oordeel ? KLEUR_VOOR[o.oordeel] : 'rgba(255,255,255,0.35)'
            return (
              <div key={o.naam}>
                <button onClick={() => setOpen(isOpen ? null : o.naam)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '4px 0', textAlign: 'left',
                  background: 'transparent', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  <div style={{ position: 'relative', width: isMobile ? 56 : 64, height: isMobile ? 56 : 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${fotoVan(o.naam)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)' }} />
                    <span style={{ position: 'absolute', left: 5, bottom: 5, width: 8, height: 8, borderRadius: '50%', background: kleur, boxShadow: '0 0 0 2px rgba(0,0,0,0.5)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.naam}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {o.laatste.ruwGewicht} kg × {o.laatste.reps} · {kort(o.laatste.datum)} · {o.aantal}×
                    </div>
                    <div style={{ fontSize: '0.64rem', fontWeight: 800, color: kleur, marginTop: 3 }}>
                      {o.oordeel ? oordeelTekst(o.oordeel, o.norm) : 'Eén training, nog geen verloop'}{o.isPR ? ' · PR' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{nl1(o.laatste.gewicht)}<span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 0 }}> kg</span></div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>op {REFERENTIE_REPS} reps</div>
                    {o.verschil !== null && (
                      <div style={{ fontSize: '0.74rem', fontWeight: 900, color: o.verschil > 0 ? KLEUR_VOOR.goed : o.verschil < 0 ? KLEUR_VOOR.stil : 'rgba(255,255,255,0.5)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                        {o.verschil > 0 ? '+' : ''}{nl1(o.verschil)} kg
                      </div>
                    )}
                  </div>
                  <ChevronDown size={16} color="rgba(255,255,255,0.4)" strokeWidth={2.6} style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
                {isOpen && (
                  <div style={{ margin: '0 0 10px', marginLeft: isMobile ? -16 : -20, marginRight: isMobile ? -16 : -20 }}>
                    <ExerciseProgressChart db={db} client={client} exerciseName={o.naam} isMobile={isMobile} vanaf={vanaf} tot={tot} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
