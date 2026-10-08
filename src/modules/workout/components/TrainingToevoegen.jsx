// src/modules/workout/components/TrainingToevoegen.jsx
//
// "Training toevoegen" als vragenreeks, midden in het scherm, één vraag per
// stap. Gym: welke training (dag uit het plan, eigen training, of nieuw
// opstellen) → welke dag. Cardio: welke sport → hoe lang en hoe laat → welke
// dagen. Allebei eindigen met: standaard in je plan, of eenmalig deze week.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, Check, Dumbbell, HeartPulse, Plus, Footprints, Bike, Waves, Timer, Wind, Activity, TrendingUp, Zap, Repeat, CalendarDays } from 'lucide-react'
import CustomWorkoutModal from './planning/CustomWorkoutModal'
import { maakPlanKey } from '../utils/planKey'

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
  // De andere plannen van de klant: elke dag daaruit is ook te kiezen,
  // zonder van actief plan te wisselen (call Martijn, 8 okt 2026).
  const [anderePlannen, setAnderePlannen] = useState([])
  useEffect(() => {
    if (!open || !db?.getClientWorkoutPlans || !clientId) return
    let weg = false
    db.getClientWorkoutPlans(clientId)
      .then(({ plans }) => { if (!weg) setAnderePlannen((plans || []).filter(p => p.id !== schema?.id && p.week_structure)) })
      .catch(() => {})
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
    key, naam: w?.name || w?.focus || key, sub: [w?.focus && w?.name ? w.focus : null, Array.isArray(w?.exercises) ? `${w.exercises.length} oefeningen` : null].filter(Boolean).join(' · '),
  }))
  const andereDagen = anderePlannen.flatMap(p => Object.entries(p.week_structure || {}).map(([dagKey, w]) => ({
    key: maakPlanKey(p.id, dagKey), naam: w?.name || w?.focus || dagKey,
    sub: [p.name, Array.isArray(w?.exercises) ? `${w.exercises.length} oefeningen` : null].filter(Boolean).join(' · '),
  })))
  const naamVan = (key) => {
    const w = getWorkoutData ? getWorkoutData(key) : null
    if (w?.name || w?.focus) return w.name || w.focus
    const ander = andereDagen.find(d => d.key === key)
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '1.1rem 1rem 1.2rem' : '1.3rem 1.3rem 1.4rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
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

          {stap === 'gym-welke' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {planDagen.length > 0 && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0' }}>Uit je plan</div>}
              {planDagen.map(p => (
                <button key={p.key} onClick={() => { tik(); setWorkoutKey(p.key); setStap('gym-dag') }} style={tegel(workoutKey === p.key)}>
                  <Dumbbell size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.naam}</div>
                    {p.sub && <div style={sub}>{p.sub}</div>}
                  </div>
                </button>
              ))}
              {andereDagen.length > 0 && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '8px 0 2px' }}>Uit je andere plannen</div>}
              {andereDagen.map(p => (
                <button key={p.key} onClick={() => { tik(); setWorkoutKey(p.key); setStap('gym-dag') }} style={tegel(workoutKey === p.key)}>
                  <Dumbbell size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.naam}</div>
                    {p.sub && <div style={sub}>{p.sub}</div>}
                  </div>
                </button>
              ))}
              {eigen.length > 0 && <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '8px 0 2px' }}>Eigen trainingen</div>}
              {eigen.map(w => (
                <button key={w.id} onClick={() => { tik(); setWorkoutKey(`custom_${w.id}`); setStap('gym-dag') }} style={tegel(workoutKey === `custom_${w.id}`)}>
                  <Activity size={16} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
                    <div style={sub}>{[w.type, w.duration ? `${w.duration} min` : null].filter(Boolean).join(' · ')}</div>
                  </div>
                </button>
              ))}
              <button onClick={() => { tik(); setEigenOpen(true) }} style={{ ...tegel(false), marginTop: 8, borderStyle: 'dashed', justifyContent: 'center' }}>
                <Plus size={16} strokeWidth={2.8} /><span style={{ fontSize: '0.9rem', fontWeight: 900 }}>Eigen training opstellen</span>
              </button>
            </div>
          )}

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
