// src/modules/workout/bouwfase/FaseStarter.jsx
//
// Workout Builder → Trainingsfase: per klant een bouwfase starten of stoppen,
// gekoppeld aan het plan dat openstaat. Coach Inzicht toont alleen de stand.

import { useCallback, useEffect, useState } from 'react'
import { faseStand, faseTekst, leesActieveFase, vandaagIso } from './bouwfaseData'

const knop = (vol) => ({
  height: 32, padding: '0 0.8rem', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
  background: vol ? '#fff' : 'transparent', color: vol ? '#0a0a0a' : '#fff', border: vol ? 'none' : '1px solid rgba(255,255,255,0.2)',
})
const kort = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

export default function FaseStarter({ db, client, schemaId, plannen = [] }) {
  const [fase, setFase] = useState(undefined) // undefined = laden
  const [start, setStart] = useState(vandaagIso)
  const [weken, setWeken] = useState(7)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const laad = useCallback(async () => {
    if (client?.id) setFase(await leesActieveFase(db.supabase, client.id))
  }, [client?.id, db])
  useEffect(() => { laad() }, [laad])

  const stopOud = () => db.supabase.from('training_fases')
    .update({ actief: false, updated_at: new Date().toISOString() }).eq('client_id', client.id).eq('actief', true)

  const starten = async () => {
    setBezig(true); setFout(null)
    try {
      const coach = (await db.supabase.auth.getSession()).data.session?.user?.id || null
      const { error: uit } = await stopOud()
      if (uit) throw uit
      const { error } = await db.supabase.from('training_fases').insert({
        client_id: client.id, coach_id: coach, schema_id: schemaId, start_datum: start, bouw_weken: weken, deload_dagen: 3, actief: true,
      })
      if (error) throw error
      await laad()
    } catch (e) { setFout(e.message || 'Starten mislukt') }
    setBezig(false)
  }

  const stoppen = async () => {
    if (!window.confirm('Trainingsfase stoppen? De feedback die er al is blijft bewaard.')) return
    setBezig(true); setFout(null)
    const { error } = await stopOud()
    if (error) setFout(error.message)
    await laad()
    setBezig(false)
  }

  if (fase === undefined) return null
  const stand = faseStand(fase)
  const planNaam = plannen.find(p => p.id === fase?.schema_id)?.name

  return (
    <div style={{ marginTop: '0.6rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem 0.85rem' }}>
      {fase ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', fontWeight: 900, color: stand?.soort === 'deload' ? '#f59e0b' : '#10b981' }}>
            {faseTekst(stand)}
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
              Start {kort(fase.start_datum)} · {fase.bouw_weken} weken + deload {fase.deload_dagen} dagen{planNaam ? ` · ${planNaam}` : ''}
            </span>
          </span>
          <button onClick={stoppen} disabled={bezig} style={knop(false)}>Stoppen</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} aria-label="Startdatum"
            style={{ height: 32, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9, color: '#fff', padding: '0 0.5rem', fontFamily: 'inherit', fontWeight: 800, colorScheme: 'dark' }} />
          {[6, 7].map(w => <button key={w} onClick={() => setWeken(w)} style={knop(weken === w)}>{w} weken</button>)}
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>+ deload 3 dagen</span>
          <button onClick={starten} disabled={bezig || !start} style={{ ...knop(true), background: '#10b981', color: '#0a0a0a' }}>{bezig ? 'Bezig…' : 'Fase starten'}</button>
        </div>
      )}
      {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginTop: 6 }}>{fout}</div>}
    </div>
  )
}
