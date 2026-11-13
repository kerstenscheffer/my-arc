// src/modules/coach-command-center/components/insight/BouwfaseInzicht.jsx
//
// Coach Inzicht → Training: stand van de bouwfase (starten doe je in de
// Workout Builder, FaseStarter) en een indicator uit de feedback van de klant (9 nov 2026). Niets automatisch: de
// indicator stelt alleen voor (+1 set / gelijk / kijk dieper), jij beslist.

import { useEffect, useState, useCallback } from 'react'
import InklapKop, { useInklap } from './InklapKop'
import { faseStand, faseTekst, leesActieveFase, faseProgressie, magReflecteren, HERSTEL, GEVOEL } from '../../../workout/bouwfase/bouwfaseData'
import { spierLabel } from '../../../manual-workout-builder/spierGroepen'

const REGEL = { display: 'flex', gap: 8, marginTop: 5, fontSize: '0.8rem', fontWeight: 600, color: '#fff', lineHeight: 1.4 }
const PIJL = <span style={{ color: '#10b981', fontWeight: 900, flexShrink: 0 }}>→</span>
const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '12px 0 2px' }
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

// Indicatie per spiergroep uit de laatste herstelvraag en de oefeningen van
// de afgelopen 14 dagen.
function indicatie(herstel, pijn) {
  if (pijn || herstel === 'ja') return { tekst: 'kijk dieper', kleur: '#ef4444' }
  if (herstel === 'beetje') return { tekst: 'gelijk houden', kleur: '#f59e0b' }
  if (herstel === 'nee') return { tekst: '+1 set mogelijk', kleur: '#10b981' }
  return null
}

export default function BouwfaseInzicht({ db, client, isMobile, altijdOpen = false }) {
  const [openKeuze, wissel] = useInklap('bouwfase', true)
  // In een venster (Coach Inzicht, 13 nov 2026) is er geen inklapkop: altijd open.
  const open = altijdOpen || openKeuze
  const [fase, setFase] = useState(undefined) // undefined = laden
  const [rijen, setRijen] = useState([])
  const [progressie, setProgressie] = useState([])

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) return
    const f = await leesActieveFase(db.supabase, client.id)
    setFase(f)
    setProgressie(f && magReflecteren(faseStand(f)) ? await faseProgressie(db.supabase, f).then(r => r, () => []) : [])
    const van = new Date(); van.setDate(van.getDate() - 14)
    const { data } = await db.supabase.from('training_feedback')
      .select('id, datum, soort, oefening, spiergroep, score, gevoel, opmerking')
      .eq('client_id', client.id).gte('datum', van.toISOString().slice(0, 10))
      .order('datum', { ascending: false }).order('created_at', { ascending: false })
      .then(r => r, () => ({ data: [] }))
    setRijen(data || [])
  }, [client?.id, db])
  useEffect(() => { laad() }, [laad])

  if (!client?.id || fase === undefined) return null
  const stand = faseStand(fase)
  const workouts = rijen.filter(r => r.soort === 'workout').slice(0, 5)
  const oefeningen = rijen.filter(r => r.soort === 'oefening')
  // Laatste herstelantwoord per spiergroep, plus pijn/techniek in 14 dagen.
  const spieren = {}
  for (const r of rijen) {
    if (!r.spiergroep) continue
    const s = spieren[r.spiergroep] || (spieren[r.spiergroep] = { herstel: null, datum: null, pijn: 0, techniek: 0, scores: [] })
    if (r.soort === 'herstel' && !s.herstel) { s.herstel = r.gevoel; s.datum = r.datum }
    if (r.soort === 'oefening') {
      if (r.gevoel === 'pijn') s.pijn++
      if (r.gevoel === 'techniek') s.techniek++
      if (r.score) s.scores.push(r.score)
    }
  }
  const pad = isMobile ? '0 0.9rem 0.6rem' : '0 0.9rem 0.7rem'

  return (
    <div style={{ marginBottom: '0.4rem' }}>
      {!altijdOpen && <InklapKop titel="Bouwfase" aantal={rijen.length} open={open} onWissel={wissel} />}
      {open && (
        <div style={{ padding: pad }}>
          {!fase ? (
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Geen actieve fase. Starten doe je in de Workout Builder → Trainingsfase.</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 900, color: stand?.soort === 'deload' ? '#f59e0b' : '#10b981' }}>
                {faseTekst(stand)}
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                  Start {kort(fase.start_datum)} · {fase.bouw_weken} weken + deload {fase.deload_dagen} dagen
                </span>
              </span>
            </div>
          )}

          {fase?.reflectie && (
            <>
              <div style={LABEL}>Reflectie einde fase</div>
              <div style={REGEL}>{PIJL}<span><b style={{ fontWeight: 900 }}>Fase:</b> {fase.reflectie.cijfer}/10 · <b style={{ fontWeight: 900 }}>Herstel:</b> {fase.reflectie.herstel}/10</span></div>
              {fase.reflectie.goed && <div style={REGEL}>{PIJL}<span><b style={{ fontWeight: 900 }}>Ging het beste:</b> {fase.reflectie.goed}</span></div>}
              {fase.reflectie.beter && <div style={REGEL}>{PIJL}<span><b style={{ fontWeight: 900 }}>Volgende fase anders:</b> {fase.reflectie.beter}</span></div>}
            </>
          )}

          {progressie.length > 0 && (
            <>
              <div style={LABEL}>Progressie deze fase</div>
              {progressie.map(o => (
                <div key={o.naam} style={REGEL}>
                  {PIJL}
                  <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontWeight: 900 }}>{o.naam}:</b> {o.eerste.weight}×{o.eerste.reps} → {o.laatste.weight}×{o.laatste.reps}</span>
                  <span style={{ flexShrink: 0, fontWeight: 900, color: o.verschil > 0 ? '#10b981' : o.verschil < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{o.verschil > 0 ? '+' : ''}{o.verschil}%</span>
                </div>
              ))}
            </>
          )}

          {Object.keys(spieren).length > 0 && (
            <>
              <div style={LABEL}>Herstel per spiergroep · 14 dagen</div>
              {Object.entries(spieren).map(([k, s]) => {
                const ind = indicatie(s.herstel, s.pijn > 0)
                const h = HERSTEL.find(x => x.id === s.herstel)
                const gem = s.scores.length ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10 : null
                return (
                  <div key={k} style={REGEL}>
                    {PIJL}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontWeight: 900 }}>{spierLabel(k)}:</b>{' '}
                      {h ? <span style={{ color: h.kleur, fontWeight: 800 }}>herstel {h.label.toLowerCase()}</span> : 'geen herstelvraag'}
                      {gem != null ? ` · gevoel ${String(gem).replace('.', ',')}/10` : ''}
                      {s.pijn ? ` · ${s.pijn}× pijntje` : ''}{s.techniek ? ` · ${s.techniek}× techniek brak` : ''}
                    </span>
                    {ind && <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 900, color: ind.kleur }}>{ind.tekst}</span>}
                  </div>
                )
              })}
            </>
          )}

          {workouts.length > 0 && (
            <>
              <div style={LABEL}>Trainingen</div>
              {workouts.map(w => (
                <div key={w.id} style={REGEL}>
                  {PIJL}
                  <span style={{ flex: 1 }}><b style={{ fontWeight: 900 }}>{kort(w.datum)}:</b> {w.score}/10{w.opmerking ? ` · ${w.opmerking}` : ''}</span>
                </div>
              ))}
            </>
          )}

          {oefeningen.length > 0 && (
            <>
              <div style={LABEL}>Oefeningen</div>
              {oefeningen.slice(0, 12).map(o => (
                <div key={o.id} style={REGEL}>
                  {PIJL}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontWeight: 900 }}>{o.oefening}:</b> gevoel {o.score ?? '–'}/10
                    {o.gevoel && o.gevoel !== 'goed' ? <span style={{ color: '#f59e0b', fontWeight: 800 }}> · {GEVOEL.find(g => g.id === o.gevoel)?.label.toLowerCase()}</span> : ''}
                    {o.opmerking ? ` · ${o.opmerking}` : ''}
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{kort(o.datum)}</span>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
