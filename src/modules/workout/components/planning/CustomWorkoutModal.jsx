// src/modules/workout/components/planning/CustomWorkoutModal.jsx
//
// Eigen training van de klant: een trainingsdag met gymoefeningen uit de
// bibliotheek, zelf samengesteld. Naam, oefeningen (zoeken op naam, filter
// op spiergroep), per oefening sets/reps/rust, volgorde, en opslaan. De dag
// komt in custom_workouts (kolom exercises, zelfde vorm als een dag in
// workout_schemas.week_structure) en staat daarna onder "Eigen trainingen"
// in Training toevoegen, inzetbaar als gewone trainingsdag op de workout-
// pagina (9 okt 2026). Verving het oude venster met cardio-types en duur.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, Plus, Minus, ChevronUp, ChevronDown, Trash2, Check, ChevronLeft } from 'lucide-react'
import ExerciseService from '../../../../services/ExerciseService'
import useOefeningFotos from '../../utils/useOefeningFotos'
import Keuze from '../../../meal-plan/components/Keuze'

const SPIEREN = [
  { id: 'chest', label: 'Borst' }, { id: 'back', label: 'Rug' }, { id: 'shoulders', label: 'Schouders' },
  { id: 'legs', label: 'Benen' }, { id: 'biceps', label: 'Biceps' }, { id: 'triceps', label: 'Triceps' }, { id: 'abs', label: 'Core' },
]
const SPIER_NL = { chest: 'Borst', back: 'Rug', shoulders: 'Schouders', legs: 'Benen', biceps: 'Biceps', triceps: 'Triceps', abs: 'Core', calves: 'Kuiten', glutes: 'Billen' }

// Oefening uit de bibliotheek → oefening in een trainingsdag.
const naarDagOefening = (ex) => ({
  name: ex.name,
  sets: parseInt(ex.suggested_sets, 10) || 3,
  reps: ex.suggested_reps || '8-12',
  rust: ex.suggested_rest || '90s',
  equipment: ex.equipment || '',
  primairSpieren: ex.primair_spieren || '',
  type: 'strength',
  notes: '',
  video_url: ex.video_url || null,
  thumbnail_url: ex.thumbnail_url || null,
  image_url: ex.image_url || null,
})

const schatMinuten = (oef) => Math.max(10, Math.round(oef.reduce((n, e) => n + (Number(e.sets) || 3) * 2.5, 0) + 5))

export default function CustomWorkoutModal({ workoutService, clientId, db = null, existingWorkout = null, onClose, onSave }) {
  const isMobile = window.innerWidth <= 768
  const [naam, setNaam] = useState(existingWorkout?.name || '')
  const [oefeningen, setOefeningen] = useState(Array.isArray(existingWorkout?.exercises) ? existingWorkout.exercises : [])
  const [stap, setStap] = useState('dag')          // 'dag' | 'kiezen'
  const [bieb, setBieb] = useState([])
  const [laden, setLaden] = useState(false)
  const [zoek, setZoek] = useState('')
  const [spier, setSpier] = useState(null)
  const [materiaal, setMateriaal] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    let weg = false
    ;(async () => {
      setLaden(true)
      try {
        const alle = await ExerciseService.getAllExercises()
        if (!weg) setBieb((alle || []).filter(e => e.gym_friendly !== false))
      } catch (e) { console.error('Oefeningen laden mislukt:', e); if (!weg) setBieb([]) }
      finally { if (!weg) setLaden(false) }
    })()
    return () => { weg = true }
  }, [])

  const gekozen = useMemo(() => new Set(oefeningen.map(e => String(e.name).toLowerCase())), [oefeningen])
  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return bieb
      .filter(e => !spier || String(e.primair_spieren || '').toLowerCase() === spier)
      .filter(e => !materiaal || String(e.equipment || '').toLowerCase() === materiaal)
      .filter(e => !q || String(e.name).toLowerCase().includes(q) || (e.tags || []).some(t => String(t).toLowerCase().includes(q)))
      .slice(0, 80)
  }, [bieb, zoek, spier, materiaal])
  const materialen = useMemo(() => [...new Set(bieb.map(e => String(e.equipment || '').toLowerCase()).filter(Boolean))].sort(), [bieb])
  const fotoVan = useOefeningFotos(db, [...new Set([...lijst.map(e => e.name), ...oefeningen.map(e => e.name)])])

  const voegToe = (ex) => {
    if (gekozen.has(String(ex.name).toLowerCase())) return
    if (navigator.vibrate) navigator.vibrate(10)
    setOefeningen(l => [...l, naarDagOefening(ex)])
  }
  const haalWeg = (i) => setOefeningen(l => l.filter((_, j) => j !== i))
  const schuif = (i, d) => setOefeningen(l => {
    const j = i + d
    if (j < 0 || j >= l.length) return l
    const k = [...l]; const t = k[i]; k[i] = k[j]; k[j] = t
    return k
  })
  const zet = (i, veld, waarde) => setOefeningen(l => l.map((e, j) => j === i ? { ...e, [veld]: waarde } : e))

  const bewaar = async () => {
    if (!naam.trim()) { setFout('Geef je training een naam.'); return }
    if (oefeningen.length === 0) { setFout('Voeg minstens één oefening toe.'); return }
    setFout(''); setBezig(true)
    try {
      const data = { name: naam.trim(), type: 'gym', duration: schatMinuten(oefeningen), description: '', is_template: true, exercises: oefeningen }
      const w = existingWorkout
        ? await workoutService.updateCustomWorkout(existingWorkout.id, data)
        : await workoutService.createCustomWorkout(clientId, data)
      if (navigator.vibrate) navigator.vibrate([30, 50, 30])
      onSave && onSave(w)
      onClose && onClose()
    } catch (e) {
      console.error('Eigen training opslaan mislukt:', e)
      setFout('Opslaan mislukt. Probeer het nog eens.')
      setBezig(false)
    }
  }

  const knopRond = (extra = {}) => ({
    width: 36, height: 36, borderRadius: 10, flexShrink: 0, padding: 0,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...extra,
  })
  const invoer = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }
  // Stapper voor sets: tikken op - en +, geen toetsenbord nodig.
  const Stapper = ({ waarde, onMin, onPlus }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: 2 }}>
      <button onClick={onMin} aria-label="Minder" style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}><Minus size={14} strokeWidth={3} /></button>
      <span style={{ minWidth: 22, textAlign: 'center', fontSize: '0.95rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{waarde}</span>
      <button onClick={onPlus} aria-label="Meer" style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}><Plus size={14} strokeWidth={3} /></button>
    </div>
  )

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483610, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: isMobile ? '100%' : 560, height: isMobile ? '100dvh' : 'min(90vh, 860px)',
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden',
        background: '#0a0a0a', border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? 0 : 20,
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Kop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '0.9rem 1rem 0.6rem' : '1.1rem 1.2rem 0.7rem' }}>
          {stap === 'kiezen' ? (
            <button onClick={() => setStap('dag')} aria-label="Terug" style={knopRond()}><ChevronLeft size={18} strokeWidth={2.8} /></button>
          ) : <div style={{ width: 36 }} />}
          <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{existingWorkout ? 'Eigen training bewerken' : 'Eigen training'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stap === 'kiezen' ? 'Kies oefeningen' : (naam.trim() || 'Nieuwe trainingsdag')}</div>
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={knopRond()}><X size={18} strokeWidth={2.8} /></button>
        </div>

        {stap === 'dag' ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 1rem' : '0 1.2rem' }}>
              <input value={naam} onChange={e => setNaam(e.target.value)} placeholder="Naam, bijv. Push thuis of Bovenlichaam" style={{ ...invoer, width: '100%', padding: '0.85rem 1rem', fontSize: '1rem', marginBottom: 12 }} />

              {oefeningen.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 14 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Nog geen oefeningen</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Kies ze uit de bibliotheek: zoeken op naam of filteren op spiergroep.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {oefeningen.map((e, i) => (
                    <div key={`${e.name}-${i}`} style={{ display: 'flex', gap: 10, padding: 8, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${fotoVan(e.name)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: 4, left: 4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 5, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, minWidth: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                          <button onClick={() => schuif(i, -1)} disabled={i === 0} aria-label="Omhoog" style={{ ...knopRond({ width: 28, height: 28, borderRadius: 8 }), opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={14} strokeWidth={3} /></button>
                          <button onClick={() => schuif(i, 1)} disabled={i === oefeningen.length - 1} aria-label="Omlaag" style={{ ...knopRond({ width: 28, height: 28, borderRadius: 8 }), opacity: i === oefeningen.length - 1 ? 0.3 : 1 }}><ChevronDown size={14} strokeWidth={3} /></button>
                          <button onClick={() => haalWeg(i)} aria-label="Verwijderen" style={knopRond({ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' })}><Trash2 size={13} strokeWidth={2.6} /></button>
                        </div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{[SPIER_NL[String(e.primairSpieren).toLowerCase()] || e.primairSpieren, e.equipment].filter(Boolean).join(' · ')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <Stapper waarde={e.sets} onMin={() => zet(i, 'sets', Math.max(1, (Number(e.sets) || 1) - 1))} onPlus={() => zet(i, 'sets', Math.min(10, (Number(e.sets) || 0) + 1))} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>sets ×</span>
                          <input value={e.reps} onChange={ev => zet(i, 'reps', ev.target.value)} aria-label="Reps" style={{ ...invoer, width: 64, padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>reps · rust</span>
                          <input value={e.rust} onChange={ev => zet(i, 'rust', ev.target.value)} aria-label="Rust" style={{ ...invoer, width: 56, padding: '0.4rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setStap('kiezen')} style={{ width: '100%', minHeight: 48, marginTop: 10, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.3)', color: '#fff', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, touchAction: 'manipulation' }}>
                <Plus size={16} strokeWidth={3} /> Oefening toevoegen
              </button>
              {fout && <div style={{ marginTop: 10, fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b' }}>{fout}</div>}
              <div style={{ height: 12 }} />
            </div>

            <div style={{ padding: isMobile ? '0.6rem 1rem calc(0.9rem + env(safe-area-inset-bottom, 0px))' : '0.7rem 1.2rem 1.1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                {oefeningen.length} {oefeningen.length === 1 ? 'oefening' : 'oefeningen'}{oefeningen.length ? ` · ±${schatMinuten(oefeningen)} min` : ''}
              </div>
              <button onClick={bewaar} disabled={bezig} style={{ minHeight: 48, padding: '0 1.3rem', borderRadius: 12, background: '#fff', color: '#0a0a0a', border: 'none', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 900, cursor: bezig ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, touchAction: 'manipulation', opacity: bezig ? 0.7 : 1 }}>
                <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : existingWorkout ? 'Wijzigingen opslaan' : 'Training opslaan'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: isMobile ? '0 1rem 0.5rem' : '0 1.2rem 0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een oefening…" type="search" autoComplete="off" style={{ ...invoer, width: '100%', padding: '0.8rem 1rem 0.8rem 2.4rem', fontSize: '1rem' }} />
              </div>
              {/* Spiergroep en materiaal als keuzemenu's, zoals op de
                  voedingspagina. */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2 }}>
                <Keuze waarde={spier || 'alle'} zet={(v) => setSpier(v === 'alle' ? null : v)} isMobile={isMobile}
                  opties={[{ id: 'alle', label: 'Alle spiergroepen' }, ...SPIEREN]} />
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <Keuze waarde={materiaal || 'alle'} zet={(v) => setMateriaal(v === 'alle' ? null : v)} isMobile={isMobile} uitlijning="rechts"
                  opties={[{ id: 'alle', label: 'Al het materiaal' }, ...materialen.map(m => ({ id: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))]} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 1rem' : '0 1.2rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {laden && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Bibliotheek laden…</div>}
              {!laden && lijst.length === 0 && <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Geen oefening gevonden</div>}
              {lijst.map(ex => {
                const al = gekozen.has(String(ex.name).toLowerCase())
                return (
                  <button key={ex.name} onClick={() => voegToe(ex)} disabled={al} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6, borderRadius: 12, background: al ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${al ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: al ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 9, backgroundImage: `url(${fotoVan(ex.name)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{[SPIER_NL[String(ex.primair_spieren).toLowerCase()] || ex.primair_spieren, ex.equipment].filter(Boolean).join(' · ')}</div>
                    </div>
                    <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', background: al ? '#10b981' : '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{al ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}</span>
                  </button>
                )
              })}
              <div style={{ height: 12 }} />
            </div>
            <div style={{ padding: isMobile ? '0.6rem 1rem calc(0.9rem + env(safe-area-inset-bottom, 0px))' : '0.7rem 1.2rem 1.1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setStap('dag')} style={{ width: '100%', minHeight: 48, borderRadius: 12, background: '#fff', color: '#0a0a0a', border: 'none', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>
                Klaar · {oefeningen.length} {oefeningen.length === 1 ? 'oefening' : 'oefeningen'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
