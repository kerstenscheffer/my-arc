// src/modules/manual-workout-builder/components/GymKoppeling.jsx
//
// Plan per sportschool (13 nov 2026, Kersten): bij welke sportschool(s) van
// de klant hoort het plan dat nu in de builder staat? Wisselt de klant in zijn
// app van sportschool, dan wisselt zijn actieve plan mee (gym-plan.sql).
//
// Een knop in de planbalk met een klein venster: de sportscholen van de klant
// met een schakelaar, en een veld om er een toe te voegen (bv. "Thuis").

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Check, Plus } from 'lucide-react'
import { haalGyms, bewaarGym, koppelPlanAanGym } from '../../workout/gym/GymService'
import { standaardWeekindeling } from '../../client-agenda/standaardWeekindeling'

export default function GymKoppeling({ db, client, schemaId, weekStructure, plannen = [], knopStijl, onGewijzigd }) {
  const [gyms, setGyms] = useState([])
  const [actiefId, setActiefId] = useState(null)
  const [open, setOpen] = useState(false)
  const [nieuw, setNieuw] = useState('')
  const [bezig, setBezig] = useState(null)
  const [fout, setFout] = useState(null)
  const wortel = useRef(null)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const { gyms: lijst, actiefId: id } = await haalGyms(db, client.id)
    setGyms(lijst); setActiefId(id)
  }, [db, client?.id])
  useEffect(() => { laad() }, [laad, schemaId])

  useEffect(() => {
    if (!open) return undefined
    const buiten = (e) => { if (wortel.current && !wortel.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', buiten)
    return () => document.removeEventListener('pointerdown', buiten)
  }, [open])

  const hier = gyms.filter(g => g.schema_id === schemaId)
  const planNaam = (id) => plannen.find(p => p.id === id)?.name || 'ander plan'

  const wissel = async (gym) => {
    setBezig(gym.id); setFout(null)
    const aan = gym.schema_id !== schemaId
    const { error } = await koppelPlanAanGym(db, gym.id, aan ? schemaId : null, aan ? standaardWeekindeling(weekStructure) : null)
    setBezig(null)
    if (error) { setFout(error); return }
    await laad()
    onGewijzigd?.()
  }

  const voegToe = async () => {
    const naam = nieuw.trim()
    if (!naam) return
    setBezig('nieuw'); setFout(null)
    const { error, gym } = await bewaarGym(db, { clientId: client.id, naam, eenheid: 'kg' })
    if (error || !gym) { setBezig(null); setFout(error || 'Toevoegen mislukt'); return }
    // Meteen aan dit plan hangen: daarvoor maak je hem hier aan.
    const res = await koppelPlanAanGym(db, gym.id, schemaId, standaardWeekindeling(weekStructure))
    setBezig(null); setNieuw('')
    if (res.error) setFout(res.error)
    await laad()
    onGewijzigd?.()
  }

  if (!client?.id || !schemaId) return null
  return (
    <div ref={wortel} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)} title="Bij welke sportschool hoort dit plan" aria-label="Sportschool van dit plan" style={{
        ...knopStijl, width: 'auto', padding: '0 0.55rem', gap: 6, display: 'flex', alignItems: 'center',
        fontSize: '0.78rem', fontWeight: 800, fontFamily: 'inherit', color: '#fff', whiteSpace: 'nowrap',
      }}>
        <MapPin size={15} />
        {hier.length ? hier.map(g => g.naam).join(', ') : 'Sportschool'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, width: 300, padding: '0.7rem', background: '#111', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.7)' }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>Sportschool van dit plan</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, margin: '2px 0 8px' }}>
            Kiest de klant deze sportschool in zijn app, dan wordt dit zijn actieve plan.
          </div>
          {gyms.length === 0 && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Deze klant heeft nog geen sportscholen.</div>}
          {gyms.map(g => {
            const aan = g.schema_id === schemaId
            return (
              <button key={g.id} onClick={() => wissel(g)} disabled={bezig === g.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 40, padding: '0 0.55rem', marginBottom: 4, borderRadius: 9,
                background: aan ? '#fff' : 'transparent', color: aan ? '#000' : '#fff', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`,
                fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', opacity: bezig === g.id ? 0.6 : 1,
              }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.naam}{g.id === actiefId ? ' · staat hij nu' : ''}
                  </span>
                  {!aan && g.schema_id && <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, opacity: 0.6 }}>nu: {planNaam(g.schema_id)}</span>}
                </span>
                {aan && <Check size={15} strokeWidth={3} />}
              </button>
            )
          })}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={nieuw} onChange={e => setNieuw(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') voegToe() }} placeholder="Nieuwe, bv. Thuis"
              style={{ flex: 1, minWidth: 0, height: 36, padding: '0 0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 9, color: '#fff', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }} />
            <button onClick={voegToe} disabled={!nieuw.trim() || bezig === 'nieuw'} aria-label="Sportschool toevoegen" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, border: 'none', background: nieuw.trim() ? '#fff' : 'rgba(255,255,255,0.12)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus size={17} strokeWidth={3} />
            </button>
          </div>
          {/* De klant staat nu al bij een sportschool die je net aan dit plan hing,
              maar volgt een ander plan: het wisselt pas bij zijn volgende keuze. */}
          {hier.some(g => g.id === actiefId) && client.assigned_schema_id && client.assigned_schema_id !== schemaId && (
            <div style={{ marginTop: 8, fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1.4 }}>
              De klant staat nu bij deze sportschool maar volgt nog een ander plan. Zet dit plan actief met de wisselknop, anders gaat het pas in als hij de sportschool opnieuw kiest.
            </div>
          )}
          {fout && <div style={{ marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: '#f87171' }}>{fout}</div>}
        </div>
      )}
    </div>
  )
}
