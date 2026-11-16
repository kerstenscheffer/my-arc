// src/modules/workout/bouwfase/MesoOverzicht.jsx
//
// De hele mesocyclus onder elkaar (16 nov 2026, Kersten): per week een rij met
// het weekdoel (RIR), de trainingen en cardio uit de agenda van de klant, wat
// al gedaan is, en onderaan wanneer de deload en het einde vallen. Scrollt
// verticaal en opent op de huidige week. Tik op een week om de weekstrook
// daarheen te zetten.
//
// Trainingen en cardio komen uit het vaste weekrooster (elke week gelijk);
// gedaan = een sessie in workout_sessions of een cardio-log op die datum.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { rirSchema, rirLabel } from './rir'

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dag = (s) => new Date(`${String(s).slice(0, 10)}T12:00:00`)
const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const maandagVan = (d) => plus(d, -((d.getDay() + 6) % 7))
const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')
const lang = (d) => d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
const WEEKDAGEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const LETTERS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export default function MesoOverzicht({ db, clientId, fase, schema, rooster = {}, isMobile = false, onKiesWeek = null }) {
  const [sessies, setSessies] = useState(new Set())
  const [cardioGedaan, setCardioGedaan] = useState(new Set())
  const [cardio, setCardio] = useState([]) // vaste cardioblokken: { day, soort }
  const nuRef = useRef(null)

  const plan = useMemo(() => {
    const start = dag(fase.start_datum)
    const weken = Number(fase.bouw_weken) || 4
    const deloadDagen = Number(fase.deload_dagen) || 0
    const deloadStart = fase.deload_gestart_op ? dag(fase.deload_gestart_op) : plus(start, weken * 7)
    const eind = plus(deloadStart, Math.max(0, deloadDagen - 1)) // laatste dag van de mesocyclus
    const schemaRir = fase.rir_aan ? rirSchema(weken, fase.rir_schema) : null
    const rijen = []
    for (let m = maandagVan(start); m <= eind; m = plus(m, 7)) rijen.push(m)
    return { start, weken, deloadStart, eind, schemaRir, rijen }
  }, [fase])

  useEffect(() => {
    if (!db?.supabase || !clientId) return undefined
    let weg = false
    const van = iso(plan.rijen[0]), tot = iso(plan.eind)
    Promise.all([
      db.supabase.from('workout_sessions').select('workout_date').eq('client_id', clientId).gte('workout_date', van).lte('workout_date', tot).then(r => r, () => ({ data: [] })),
      db.supabase.from('cardio_logs').select('logged_date').eq('client_id', clientId).gte('logged_date', van).lte('logged_date', tot).then(r => r, () => ({ data: [] })),
      db.supabase.from('client_agenda_blocks').select('day, label, week_start').eq('client_id', clientId).eq('type', 'custom').ilike('label', 'Cardio ·%').is('week_start', null).then(r => r, () => ({ data: [] })),
    ]).then(([s, c, b]) => {
      if (weg) return
      setSessies(new Set((s.data || []).map(x => String(x.workout_date).slice(0, 10))))
      setCardioGedaan(new Set((c.data || []).map(x => String(x.logged_date).slice(0, 10))))
      setCardio((b.data || []).map(x => ({ day: String(x.day || '').toLowerCase(), soort: String(x.label).replace(/^Cardio\s*·\s*/, '') })))
    })
    return () => { weg = true }
  }, [db, clientId, plan])

  // Opent op de huidige week.
  useEffect(() => { nuRef.current?.scrollIntoView({ block: 'center' }) }, [plan])

  const vandaag = iso(new Date())
  const dezeMaandag = maandagVan(dag(vandaag))
  const naamVan = (weekdag) => {
    const key = rooster?.[weekdag]
    if (!key) return null
    return String(schema?.week_structure?.[key]?.name || key).trim()
  }

  return (
    <div>
      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
        {kort(plan.start)} tot {kort(plan.eind)} · deload vanaf {lang(plan.deloadStart)} · eindigt {lang(plan.eind)}
      </div>
      <div style={{ maxHeight: isMobile ? '56dvh' : '62vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -4px', padding: '0 4px' }}>
        {plan.rijen.map((maandag) => {
          const zondag = plus(maandag, 6)
          const isDeload = zondag >= plan.deloadStart
          // Week van de fase op de laatste bouwdag in deze rij.
          const weekNr = Math.min(plan.weken, Math.floor(Math.max(0, (Math.min(zondag, plus(plan.deloadStart, -1)) - plan.start) / 86400000) / 7) + 1)
          const heleDeload = maandag >= plan.deloadStart
          const rir = !heleDeload && plan.schemaRir ? plan.schemaRir[weekNr - 1] : null
          const isNu = iso(maandag) === iso(dezeMaandag)
          const offset = Math.round((maandag - dezeMaandag) / (7 * 86400000))
          return (
            <div key={iso(maandag)} ref={isNu ? nuRef : null} onClick={onKiesWeek ? () => onKiesWeek(offset) : undefined}
              style={{
                display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'stretch', padding: isMobile ? '0.55rem 0.5rem' : '0.6rem 0.7rem', marginBottom: 6, borderRadius: 12,
                border: `1px solid ${isNu ? '#10b981' : 'rgba(255,255,255,0.08)'}`, cursor: onKiesWeek ? 'pointer' : 'default',
              }}>
              <div style={{ width: isMobile ? 62 : 84, flexShrink: 0 }}>
                <div style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900, color: heleDeload ? '#f59e0b' : '#fff', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {heleDeload ? 'Deload' : `Week ${weekNr}`}
                </div>
                {rir != null && <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#10b981' }}>RIR {rirLabel(rir)}</div>}
                {!heleDeload && isDeload && <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b' }}>+ deload</div>}
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1, whiteSpace: 'nowrap' }}>{kort(maandag)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: isMobile ? 3 : 5 }}>
                {WEEKDAGEN.map((wd, i) => {
                  const d = plus(maandag, i)
                  const di = iso(d)
                  const buiten = d < plan.start || d > plan.eind
                  const deloadDag = !buiten && d >= plan.deloadStart
                  const training = buiten ? null : naamVan(wd)
                  const cardioVandaag = buiten ? [] : cardio.filter(c => c.day === wd.toLowerCase())
                  const gedaan = sessies.has(di)
                  const gemist = !!training && !gedaan && di < vandaag
                  return (
                    <div key={wd} style={{
                      minWidth: 0, minHeight: isMobile ? 46 : 52, padding: isMobile ? '3px 3px' : '4px 5px', borderRadius: 7, opacity: buiten ? 0.25 : 1,
                      background: di === vandaag ? 'rgba(16,185,129,0.14)' : deloadDag ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                        {LETTERS[i]} {d.getDate()}
                        {gedaan && <Check size={10} strokeWidth={3.5} color="#10b981" />}
                      </div>
                      {training && (
                        <div style={{ fontSize: isMobile ? '0.62rem' : '0.72rem', fontWeight: 900, color: gemist ? 'rgba(255,255,255,0.35)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{training}</div>
                      )}
                      {cardioVandaag.map((c, k) => (
                        <div key={k} style={{ fontSize: isMobile ? '0.56rem' : '0.62rem', fontWeight: 700, color: cardioGedaan.has(di) ? '#10b981' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.soort}</div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div style={{ padding: '0.5rem 0.7rem 0.2rem', fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
          Einde mesocyclus: {lang(plan.eind)}
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}> · daarna de check-in en een nieuwe mesocyclus</span>
        </div>
      </div>
    </div>
  )
}
