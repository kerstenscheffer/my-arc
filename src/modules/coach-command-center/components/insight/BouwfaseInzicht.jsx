// src/modules/coach-command-center/components/insight/BouwfaseInzicht.jsx
//
// Coach Inzicht → Training: bouwfase-tracking aan/uit per klant, en een
// indicator uit de feedback van de klant (9 nov 2026). Niets automatisch: de
// indicator stelt alleen voor (+1 set / gelijk / kijk dieper), jij beslist.

import { useEffect, useState, useCallback } from 'react'
import InklapKop, { useInklap } from './InklapKop'
import { faseStand, faseTekst, leesActieveFase, vandaagIso, HERSTEL, GEVOEL } from '../../../workout/bouwfase/bouwfaseData'
import { spierLabel } from '../../../manual-workout-builder/spierGroepen'

const REGEL = { display: 'flex', gap: 8, marginTop: 5, fontSize: '0.8rem', fontWeight: 600, color: '#fff', lineHeight: 1.4 }
const PIJL = <span style={{ color: '#10b981', fontWeight: 900, flexShrink: 0 }}>→</span>
const LABEL = { fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '12px 0 2px' }
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
const knop = (vol) => ({
  height: 32, padding: '0 0.8rem', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
  background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff', border: vol ? 'none' : '1px solid rgba(255,255,255,0.2)',
})

// Indicatie per spiergroep uit de laatste herstelvraag en de oefeningen van
// de afgelopen 14 dagen.
function indicatie(herstel, pijn) {
  if (pijn || herstel === 'ja') return { tekst: 'kijk dieper', kleur: '#ef4444' }
  if (herstel === 'beetje') return { tekst: 'gelijk houden', kleur: '#f59e0b' }
  if (herstel === 'nee') return { tekst: '+1 set mogelijk', kleur: '#10b981' }
  return null
}

export default function BouwfaseInzicht({ db, client, isMobile }) {
  const [open, wissel] = useInklap('bouwfase', true)
  const [fase, setFase] = useState(undefined) // undefined = laden
  const [rijen, setRijen] = useState([])
  const [form, setForm] = useState({ start: vandaagIso(), weken: 7, deload: 3 })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) return
    setFase(await leesActieveFase(db.supabase, client.id))
    const van = new Date(); van.setDate(van.getDate() - 14)
    const { data } = await db.supabase.from('training_feedback')
      .select('id, datum, soort, oefening, spiergroep, score, gevoel, opmerking')
      .eq('client_id', client.id).gte('datum', van.toISOString().slice(0, 10))
      .order('datum', { ascending: false }).order('created_at', { ascending: false })
      .then(r => r, () => ({ data: [] }))
    setRijen(data || [])
  }, [client?.id, db])
  useEffect(() => { laad() }, [laad])

  const aanzetten = async () => {
    setBezig(true); setFout(null)
    try {
      const coach = (await db.supabase.auth.getSession()).data.session?.user?.id || null
      // Eén actieve fase per klant: een oude gaat eerst uit.
      await db.supabase.from('training_fases').update({ actief: false, updated_at: new Date().toISOString() }).eq('client_id', client.id).eq('actief', true)
      const { error } = await db.supabase.from('training_fases').insert({
        client_id: client.id, coach_id: coach, start_datum: form.start, bouw_weken: form.weken, deload_dagen: form.deload, actief: true,
      })
      if (error) throw error
      await laad()
    } catch (e) { setFout(e.message || 'Aanzetten mislukt') }
    setBezig(false)
  }
  const uitzetten = async () => {
    if (!fase || !window.confirm('Bouwfase-tracking uitzetten? De feedback die er al is blijft bewaard.')) return
    setBezig(true)
    const { error } = await db.supabase.from('training_fases').update({ actief: false, updated_at: new Date().toISOString() }).eq('id', fase.id)
    if (error) setFout(error.message)
    await laad()
    setBezig(false)
  }

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
      <InklapKop titel="Bouwfase" aantal={rijen.length} open={open} onWissel={wissel} />
      {open && (
        <div style={{ padding: pad }}>
          {!fase ? (
            <>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                Staat uit. Aan = na elke oefening en workout feedback, en de herstelvraag per spiergroep.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <input type="date" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                  style={{ height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9, color: '#fff', padding: '0 0.5rem', fontFamily: 'inherit', fontWeight: 800, colorScheme: 'dark' }} />
                {[6, 7].map(w => <button key={w} onClick={() => setForm(f => ({ ...f, weken: w }))} style={knop(form.weken === w)}>{w} weken</button>)}
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>+ deload {form.deload} dagen</span>
                <button onClick={aanzetten} disabled={bezig} style={{ ...knop(true), background: '#10b981', color: '#0a0a0a' }}>{bezig ? 'Bezig…' : 'Aanzetten'}</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 900, color: stand?.soort === 'deload' ? '#f59e0b' : '#10b981' }}>
                {faseTekst(stand)}
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
                  Start {kort(fase.start_datum)} · {fase.bouw_weken} weken + deload {fase.deload_dagen} dagen
                </span>
              </span>
              <button onClick={uitzetten} disabled={bezig} style={knop(false)}>Uitzetten</button>
            </div>
          )}
          {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginTop: 6 }}>{fout}</div>}

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
                      {h ? <span style={{ color: h.kleur, fontWeight: 800 }}>voelt nog: {h.label.toLowerCase()}</span> : 'geen herstelvraag'}
                      {gem != null ? ` · zwaarte ${String(gem).replace('.', ',')}` : ''}
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
                    <b style={{ fontWeight: 900 }}>{o.oefening}:</b> zwaarte {o.score ?? '–'}
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
