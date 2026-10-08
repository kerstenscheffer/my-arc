// src/modules/workout/components/TrainingToevoegen.jsx
//
// "Training toevoegen" als vragenreeks, midden in het scherm, één vraag per
// stap. Gym: welke training (dag uit het plan, eigen training, of nieuw
// opstellen) → welke dag. Cardio: welke sport → hoe lang en hoe laat → welke
// dagen. Allebei eindigen met: standaard in je plan, of eenmalig deze week.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, Check, Dumbbell, HeartPulse, Plus, Footprints, Bike, Waves, Timer, Wind, Activity, TrendingUp, Zap, Repeat, CalendarDays, Info } from 'lucide-react'
import CustomWorkoutModal from './planning/CustomWorkoutModal'
import { maakPlanKey } from '../utils/planKey'
import { getWorkoutImage } from './week-schedule/workoutImage'

const SPORTEN = [
  { id: 'Wandelen', icoon: Footprints }, { id: 'Fietsen', icoon: Bike }, { id: 'Zwemmen', icoon: Waves }, { id: 'Hardlopen', icoon: Timer },
  { id: 'Roeien', icoon: Wind }, { id: 'Crosstrainer', icoon: Activity }, { id: 'Stairmaster', icoon: TrendingUp }, { id: 'HIIT', icoon: Zap },
]
const DAGEN = [
  { id: 'Monday', kort: 'Ma' }, { id: 'Tuesday', kort: 'Di' }, { id: 'Wednesday', kort: 'Wo' }, { id: 'Thursday', kort: 'Do' },
  { id: 'Friday', kort: 'Vr' }, { id: 'Saturday', kort: 'Za' }, { id: 'Sunday', kort: 'Zo' },
]
const TITELS = {
  soort: 'Wat voor training?', 'gym-welke': 'Welke training?', 'gym-dag': 'Op welke dag?',
  'cardio-sport': 'Welke sport?', 'cardio-duur': 'Hoe lang en hoe laat?', 'cardio-dagen': 'Op welke dagen?', bereik: 'Waar geldt dit?',
}
const VORIGE = { 'gym-welke': 'soort', 'gym-dag': 'gym-welke', 'cardio-sport': 'soort', 'cardio-duur': 'cardio-sport', 'cardio-dagen': 'cardio-duur' }
const fmt = (d) => d ? d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''

export default function TrainingToevoegen({
  open, onClose, isMobile, schema, workoutService, clientId, db,
  tempSchedule = {}, getWorkoutData, dayDates = [], isHuidigeWeek = true,
  cardioPerDag = {}, onBewaarGym, onBewaarCardio,
}) {
  const [stap, setStap] = useState('soort')
  const [info, setInfo] = useState(null) // kaart waarvan de oefeningen open staan
  const [zoek, setZoek] = useState('')
  // De andere plannen van de klant: elke dag daaruit is ook te kiezen,
  // zonder van actief plan te wisselen (call Martijn, 8 okt 2026).
  const [anderePlannen, setAnderePlannen] = useState([])
  // Ook de standaardplannen van de coach (is_template + is_public): iedereen
  // mag elke soort trainingsdag kiezen, niet alleen wat in zijn eigen
  // plannen staat (8 okt 2026).
  const [standaardPlannen, setStandaardPlannen] = useState([])
  useEffect(() => {
    if (!open || !db?.getClientWorkoutPlans || !clientId) return
    let weg = false
    db.getClientWorkoutPlans(clientId)
      .then(({ plans }) => { if (!weg) setAnderePlannen((plans || []).filter(p => p.id !== schema?.id && p.week_structure)) })
      .catch(() => {})
    db.supabase?.from('workout_schemas')
      .select('id, name, days_per_week, week_structure')
      .eq('is_template', true).eq('is_public', true)
      .or('is_archived.is.null,is_archived.eq.false')
      .order('days_per_week', { ascending: true }).order('name', { ascending: true })
      .then(r => { if (!weg) setStandaardPlannen((r?.data || []).filter(p => p.id !== schema?.id && p.week_structure)) }, () => {})
    return () => { weg = true }
  }, [open, clientId, schema?.id, db])
  const [soortTraining, setSoortTraining] = useState(null) // 'gym' | 'cardio'
  const [workoutKey, setWorkoutKey] = useState(null)
  const [dag, setDag] = useState(null)
  const [sport, setSport] = useState(null)
  const [duur, setDuur] = useState(30)
  const [tijd, setTijd] = useState('18:00')
  const [dagen, setDagen] = useState([])
  const [eigen, setEigen] = useState([])
  const [eigenOpen, setEigenOpen] = useState(false)
  const [bezig, setBezig] = useState(false)

  useEffect(() => {
    if (!open) return
    setStap('soort'); setSoortTraining(null); setWorkoutKey(null); setDag(null); setSport(null)
    setDuur(30); setTijd('18:00'); setDagen([]); setEigenOpen(false); setBezig(false)
    if (workoutService && clientId) workoutService.getCustomWorkouts(clientId).then(l => setEigen(l || []), () => setEigen([]))
  }, [open, workoutService, clientId])
  if (!open) return null

  const knop = {
    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const tegel = (aan, extra = {}) => ({
    minHeight: 56, padding: '0 0.85rem', borderRadius: 12, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
    background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
    color: aan ? '#0a0a0a' : '#fff', fontFamily: 'inherit', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...extra,
  })
  const primair = (uit = false) => ({
    width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: uit ? 'rgba(255,255,255,0.12)' : '#fff', border: '1px solid ' + (uit ? 'rgba(255,255,255,0.12)' : '#fff'), borderRadius: 14,
    color: uit ? 'rgba(255,255,255,0.4)' : '#0a0a0a', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit',
    cursor: uit ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })
  const stepper = {
    width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
    fontFamily: 'inherit', fontSize: '1.4rem', fontWeight: 900, lineHeight: 1, cursor: 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  }
  const tik = () => { if (navigator.vibrate) navigator.vibrate(10) }
  const sub = { fontSize: '0.64rem', fontWeight: 700, opacity: 0.6 }

  // Trainingen uit het plan van de coach, zoals ze in week_structure staan.
  const planDagen = Object.entries(schema?.week_structure || {}).map(([key, w]) => ({
    key, w, plan: schema?.name || 'Je plan', naam: w?.name || w?.focus || key, sub: [w?.focus && w?.name ? w.focus : null, Array.isArray(w?.exercises) ? `${w.exercises.length} oefeningen` : null].filter(Boolean).join(' · '),
  }))
  const andereDagen = anderePlannen.flatMap(p => Object.entries(p.week_structure || {}).map(([dagKey, w]) => ({
    key: maakPlanKey(p.id, dagKey), w, plan: p.name, naam: w?.name || w?.focus || dagKey,
    sub: [p.name, Array.isArray(w?.exercises) ? `${w.exercises.length} oefeningen` : null].filter(Boolean).join(' · '),
  })))
  const standaardDagen = standaardPlannen
    .filter(p => !anderePlannen.some(a => a.id === p.id))
    .flatMap(p => Object.entries(p.week_structure || {}).map(([dagKey, w]) => ({
      key: maakPlanKey(p.id, dagKey), w, plan: p.name, naam: w?.name || w?.focus || dagKey,
      sub: [p.name, Array.isArray(w?.exercises) ? `${w.exercises.length} oefeningen` : null].filter(Boolean).join(' · '),
    })))
  const naamVan = (key) => {
    const w = getWorkoutData ? getWorkoutData(key) : null
    if (w?.name || w?.focus) return w.name || w.focus
    const ander = andereDagen.find(d => d.key === key) || standaardDagen.find(d => d.key === key)
    return ander?.naam || key
  }

  const bewaar = async (bereik) => {
    if (bezig) return
    setBezig(true)
    try {
      if (soortTraining === 'gym') await onBewaarGym({ workoutKey, day: dag, bereik })
      else await onBewaarCardio({ soort: sport, duur, tijd, dagen, bereik })
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      onClose()
    } catch (e) { alert('Opslaan mislukt: ' + (e?.message || 'onbekende fout')) }
    finally { setBezig(false) }
  }

  const weekTekst = isHuidigeWeek ? 'deze week' : `de week van ${fmt(dayDates?.[0])}`
  const samenvatting = soortTraining === 'gym'
    ? `${naamVan(workoutKey)} op ${DAGEN.find(d => d.id === dag)?.kort || ''}`
    : `${sport} · ${duur} min om ${tijd} op ${dagen.map(d => DAGEN.find(x => x.id === d)?.kort).join(', ')}`

  return createPortal(
    <>
      {/* Eigen training opstellen zit in zijn eigen venster; dit venster gaat
          zolang even uit beeld. */}
      {eigenOpen && (
        <CustomWorkoutModal workoutService={workoutService} clientId={clientId}
          onClose={() => setEigenOpen(false)}
          onSave={(w) => { if (w?.id) { setEigen(l => [w, ...l]); setWorkoutKey(`custom_${w.id}`); setStap('gym-dag') } }}
        />
      )}
      {!eigenOpen && (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: isMobile ? '100%' : 520, height: isMobile ? '100dvh' : 'auto', maxHeight: isMobile ? 'none' : '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', boxSizing: 'border-box', background: '#0a0a0a', border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? 0 : 20, paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 0.9rem)' : undefined, padding: isMobile ? '1.1rem 1rem 1.2rem' : '1.3rem 1.3rem 1.4rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {VORIGE[stap] || stap === 'bereik' ? (
              <button onClick={() => setStap(stap === 'bereik' ? (soortTraining === 'gym' ? 'gym-dag' : 'cardio-dagen') : VORIGE[stap])} aria-label="Vorige stap" style={knop}><ChevronLeft size={18} strokeWidth={2.8} /></button>
            ) : <div style={{ width: 40 }} />}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Training toevoegen</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{TITELS[stap]}</div>
            </div>
            <button onClick={onClose} aria-label="Sluit" style={knop}><X size={18} strokeWidth={2.6} /></button>
          </div>

          {stap === 'soort' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ id: 'gym', label: 'Gym', uitleg: 'kracht uit je plan', icoon: Dumbbell, naar: 'gym-welke' }, { id: 'cardio', label: 'Cardio', uitleg: 'lopen, fietsen, …', icoon: HeartPulse, naar: 'cardio-sport' }].map(o => {
                const Icoon = o.icoon
                return (
                  <button key={o.id} onClick={() => { tik(); setSoortTraining(o.id); setStap(o.naar) }} style={tegel(false, { minHeight: 96, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0.8rem 0.85rem' })}>
                    <Icoon size={22} strokeWidth={2.4} />
                    <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.015em', marginTop: 6 }}>{o.label}</div>
                    <div style={sub}>{o.uitleg}</div>
                  </button>
                )
              })}
            </div>
          )}

          {stap === 'gym-welke' && (() => {
            // Kaarten met foto, in groepen. Tik = kiezen; het i-knopje laat
            // de oefeningen zien voordat je kiest.
            const groepen = [
              { titel: 'Uit je plan', items: planDagen },
              { titel: 'Uit je andere plannen', items: andereDagen },
              { titel: 'Standaardtrainingen', items: standaardDagen },
              { titel: 'Eigen trainingen', items: eigen.map(w => ({ key: `custom_${w.id}`, w, plan: 'Eigen', naam: w.name, sub: [w.type, w.duration ? `${w.duration} min` : null].filter(Boolean).join(' · ') })) },
            ].map(g => {
              const q = zoek.trim().toLowerCase()
              if (!q) return g
              return { ...g, items: g.items.filter(i => `${i.naam} ${i.plan} ${(i.w?.exercises || []).map(e => e.name).join(' ')}`.toLowerCase().includes(q)) }
            }).filter(g => g.items.length > 0)
            const kies = (key) => { tik(); setWorkoutKey(key); setStap('gym-dag') }
            const Kaart = ({ item }) => {
              const aan = workoutKey === item.key
              const n = Array.isArray(item.w?.exercises) ? item.w.exercises.length : null
              return (
                <div style={{ position: 'relative', minWidth: 0 }}>
                  <button onClick={() => kies(item.key)} style={{
                    width: '100%', height: isMobile ? 118 : 132, padding: 0, borderRadius: 14, overflow: 'hidden', textAlign: 'left',
                    border: `1.5px solid ${aan ? '#fff' : 'rgba(255,255,255,0.14)'}`, background: '#111',
                    cursor: 'pointer', fontFamily: 'inherit', color: '#fff', position: 'relative',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${getWorkoutImage(item.w || { name: item.naam })})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.2) 40%, rgba(10,10,10,0.88) 100%)' }} />
                    <div style={{ position: 'absolute', left: 10, right: 10, bottom: 9 }}>
                      <div style={{ fontSize: '0.56rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.plan}</div>
                      <div style={{ fontSize: isMobile ? '0.95rem' : '1.02rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{item.naam}</div>
                      {n != null && <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{n} oefeningen</div>}
                    </div>
                  </button>
                  {Array.isArray(item.w?.exercises) && item.w.exercises.length > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); tik(); setInfo(item) }} aria-label="Oefeningen bekijken" style={{
                      position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', padding: 0,
                      background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <Info size={14} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              )
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Zoeken op naam van de training, het plan of een oefening. */}
                <input
                  value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek een training…"
                  type="search" autoComplete="off"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '0.85rem 1rem', marginBottom: 6,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12,
                    color: '#fff', fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                {groepen.length === 0 && <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Niets gevonden voor "{zoek}"</div>}
                {groepen.map((g, gi) => (
                  <div key={g.titel}>
                    <div style={{ fontSize: isMobile ? '1.35rem' : '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, margin: gi === 0 ? '6px 0 10px' : '20px 0 10px' }}>{g.titel}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
                      {g.items.map(item => <Kaart key={item.key} item={item} />)}
                    </div>
                  </div>
                ))}
                <button onClick={() => { tik(); setEigenOpen(true) }} style={{ ...tegel(false), marginTop: 10, borderStyle: 'dashed', justifyContent: 'center' }}>
                  <Plus size={16} strokeWidth={2.8} /><span style={{ fontSize: '0.9rem', fontWeight: 900 }}>Eigen training opstellen</span>
                </button>

                {/* Oefeningen van een training, vóór je kiest. */}
                {info && (
                  <div onClick={() => setInfo(null)} style={{ position: 'fixed', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '80vh', background: '#0a0a0a', borderRadius: '18px 18px 0 0', border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', height: 120, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${getWorkoutImage(info.w || { name: info.naam })})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.9) 100%)' }} />
                        <button onClick={() => setInfo(null)} aria-label="Sluit" style={{ ...knop, position: 'absolute', top: 10, right: 10 }}><X size={18} strokeWidth={2.6} /></button>
                        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10 }}>
                          <div style={{ fontSize: '0.56rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>{info.plan}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>{info.naam}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.5rem 0.9rem' }}>
                        {(info.w?.exercises || []).map((ex, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <span style={{ width: 22, fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                                {[ex.sets ? `${ex.sets} sets` : null, ex.reps ? `${ex.reps} reps` : null, ex.rest || ex.rust ? `rust ${ex.rest || ex.rust}` : null].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '0.7rem 0.9rem calc(0.9rem + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }}>
                        <button onClick={() => { const k = info.key; setInfo(null); kies(k) }} style={primair()}>
                          <Check size={18} strokeWidth={3} /> Kies deze training
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {(stap === 'gym-dag' || stap === 'cardio-dagen') && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 14 }}>
                {DAGEN.map((d, i) => {
                  const aan = stap === 'gym-dag' ? dag === d.id : dagen.includes(d.id)
                  const bezet = stap === 'gym-dag' ? tempSchedule[d.id] : null
                  const cardioHier = (cardioPerDag[i] || []).map(c => c.soort)
                  return (
                    <button key={d.id} onClick={() => { tik(); if (stap === 'gym-dag') { setDag(d.id); setStap('bereik') } else setDagen(l => l.includes(d.id) ? l.filter(x => x !== d.id) : [...l, d.id]) }} style={{
                      minHeight: 72, padding: '6px 2px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                      background: aan ? '#fff' : 'rgba(255,255,255,0.04)', border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`, color: aan ? '#0a0a0a' : '#fff',
                      fontFamily: 'inherit', cursor: 'pointer', minWidth: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.kort}</div>
                      <div style={{ fontSize: '0.56rem', fontWeight: 800, opacity: 0.5 }}>{dayDates?.[i]?.getDate() || ''}</div>
                      <div style={{ fontSize: '0.52rem', fontWeight: 800, opacity: 0.7, textAlign: 'center', lineHeight: 1.15, overflow: 'hidden', width: '100%' }}>
                        {stap === 'gym-dag' ? (bezet ? naamVan(bezet) : '') : cardioHier.join(', ')}
                      </div>
                    </button>
                  )
                })}
              </div>
              {stap === 'gym-dag' && (
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.4 }}>Staat er al iets op die dag, dan komt {naamVan(workoutKey)} daarvoor in de plaats.</div>
              )}
              {stap === 'cardio-dagen' && (
                <button onClick={() => dagen.length && setStap('bereik')} disabled={!dagen.length} style={primair(!dagen.length)}>{dagen.length ? `Volgende · ${dagen.length}×` : 'Kies één of meer dagen'}</button>
              )}
            </>
          )}

          {stap === 'cardio-sport' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SPORTEN.map(s => {
                const Icoon = s.icoon
                return (
                  <button key={s.id} onClick={() => { tik(); setSport(s.id); setStap('cardio-duur') }} style={tegel(sport === s.id)}>
                    <Icoon size={18} strokeWidth={2.4} /><span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em' }}>{s.id}</span>
                  </button>
                )
              })}
            </div>
          )}

          {stap === 'cardio-duur' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
                <button onClick={() => setDuur(d => Math.max(5, d - 5))} aria-label="5 minuten minder" style={stepper}>−</button>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{duur}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>minuten {sport?.toLowerCase()}</div>
                </div>
                <button onClick={() => setDuur(d => d + 5)} aria-label="5 minuten meer" style={stepper}>+</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hoe laat</span>
                <input type="time" value={tijd} onChange={e => setTijd(e.target.value || '18:00')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: '1.1rem', fontWeight: 900, fontFamily: 'inherit', padding: '0.45rem 0.7rem', outline: 'none', colorScheme: 'dark' }} />
              </div>
              <button onClick={() => setStap('cardio-dagen')} style={primair()}>Volgende</button>
            </>
          )}

          {stap === 'bereik' && (
            <>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 14 }}>{samenvatting}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => bewaar('standaard')} disabled={bezig} style={tegel(false, { minHeight: 64 })}>
                  <Repeat size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div><div style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.015em' }}>Standaard in mijn plan</div><div style={sub}>elke week, vanaf {weekTekst}</div></div>
                </button>
                <button onClick={() => bewaar('eenmalig')} disabled={bezig} style={tegel(false, { minHeight: 64 })}>
                  <CalendarDays size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div><div style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.015em' }}>Eenmalig</div><div style={sub}>alleen {weekTekst}, daarna weer je plan</div></div>
                </button>
              </div>
              {bezig && <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 12, display: 'flex', justifyContent: 'center', gap: 6 }}><Check size={14} /> Bezig…</div>}
            </>
          )}
        </div>
      </div>
      )}
    </>,
    document.body
  )
}
