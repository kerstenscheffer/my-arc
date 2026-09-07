// src/modules/workout/components/planning/WeekPlanner.jsx
//
// De week van een klant in één scherm: zeven dagen naast elkaar, per dag
// bladeren met pijltjes tot de juiste training erop staat.
//
// Vervangt de wizard van vier stappen achter de knop Trainingsagenda. Die
// vroeg eerst welke dagen, dan welke workout per dag, dan een bevestiging —
// terwijl je bij het plannen van een week juist alles tegelijk wil zien. Je
// verzet een training niet los van de rest; je kijkt naar de spreiding.
//
// De pijltjes lopen door dezelfde lijst: Rust, de dagen uit het schema, en
// de losse cardio-workouts van de klant. Rust staat vooraan, want een lege
// dag is het startpunt en geen uitzondering.

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Check, Loader2, Moon } from 'lucide-react'

const DAGEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAG_NL = {
  Monday: 'Maandag', Tuesday: 'Dinsdag', Wednesday: 'Woensdag', Thursday: 'Donderdag',
  Friday: 'Vrijdag', Saturday: 'Zaterdag', Sunday: 'Zondag',
}
const DAG_KORT = {
  Monday: 'MA', Tuesday: 'DI', Wednesday: 'WO', Thursday: 'DO',
  Friday: 'VR', Saturday: 'ZA', Sunday: 'ZO',
}

const RUST = '__rust__'

// Kleur per soort training, zodat je in één blik de spreiding ziet: twee keer
// benen achter elkaar valt op als twee dezelfde kleuren naast elkaar.
const groepVan = (naam = '') => {
  const t = naam.toLowerCase()
  if (/push|borst|chest|tricep|schouder|shoulder/.test(t)) return { id: 'push', kleur: '#3b82f6' }
  if (/pull|rug|back|bicep|row/.test(t)) return { id: 'pull', kleur: '#a855f7' }
  if (/leg|been|quad|hamstring|squat|glute/.test(t)) return { id: 'legs', kleur: '#f59e0b' }
  if (/upper|boven/.test(t)) return { id: 'upper', kleur: '#06b6d4' }
  if (/full|totaal/.test(t)) return { id: 'full', kleur: '#22c55e' }
  if (/cardio|hardlop|running|fiets|cycl|zwem|swim|wandel|walk/.test(t)) return { id: 'cardio', kleur: '#ef4444' }
  return { id: 'other', kleur: '#64748b' }
}

export default function WeekPlanner({ workoutService, clientId, schema, clientNaam, onComplete, onClose }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [schedule, setSchedule] = useState({})
  const [origineel, setOrigineel] = useState({})
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)

  // ── Wat kun je op een dag zetten ──
  const opties = useMemo(() => {
    const uitSchema = schema?.week_structure
      ? Object.entries(schema.week_structure).map(([sleutel, w]) => ({
          waarde: sleutel,
          label: w?.name || sleutel,
          sub: w?.focus || '',
        }))
      : []
    const eigen = customWorkouts.map(w => ({
      waarde: `custom_${w.id}`,
      label: w.name,
      sub: w.type || 'cardio',
    }))
    return [{ waarde: RUST, label: 'Rust', sub: '' }, ...uitSchema, ...eigen]
  }, [schema, customWorkouts])

  useEffect(() => {
    let leeft = true
    const laad = async () => {
      try {
        const [bestaand, customs] = await Promise.all([
          workoutService?.getWeekSchedule ? workoutService.getWeekSchedule(clientId) : null,
          workoutService?.getCustomWorkouts ? workoutService.getCustomWorkouts(clientId) : [],
        ])
        if (!leeft) return
        setCustomWorkouts(customs || [])
        // De opgeslagen vorm bevat alleen trainingsdagen; rustdagen ontbreken
        // gewoon. Hier vullen we ze aan zodat elke kolom iets toont.
        const compleet = {}
        DAGEN.forEach(d => { compleet[d] = bestaand?.[d] || RUST })
        setSchedule(compleet)
        setOrigineel(compleet)
      } catch (e) {
        console.error('weekschema laden mislukt:', e)
      } finally {
        if (leeft) setLaden(false)
      }
    }
    laad()
    return () => { leeft = false }
  }, [workoutService, clientId])

  const verschuif = (dag, richting) => {
    setSchedule(prev => {
      const huidig = prev[dag] || RUST
      let i = opties.findIndex(o => o.waarde === huidig)
      if (i === -1) i = 0
      // Rondlopen: voorbij het einde begin je weer bij Rust. Bij zeven dagen
      // en drie workouts blader je zo in een paar tikken naar alles.
      const nieuw = opties[(i + richting + opties.length) % opties.length]
      return { ...prev, [dag]: nieuw.waarde }
    })
  }

  const gewijzigd = DAGEN.some(d => (schedule[d] || RUST) !== (origineel[d] || RUST))
  const aantalTrainingen = DAGEN.filter(d => (schedule[d] || RUST) !== RUST).length

  const bewaar = async () => {
    setOpslaan(true)
    try {
      // Alleen trainingsdagen wegschrijven: een rustdag is de afwezigheid van
      // een sleutel, en dat is ook wat de rest van de app verwacht (de agenda
      // en de pre-workout maaltijd lezen deze vorm).
      const uit = {}
      DAGEN.forEach(d => { if ((schedule[d] || RUST) !== RUST) uit[d] = schedule[d] })
      await workoutService.updateWeekSchedule(clientId, uit)
      setOrigineel({ ...schedule })
      onComplete?.(uit)
    } catch (e) {
      console.error('weekschema opslaan mislukt:', e)
      alert('Opslaan mislukt — ' + (e?.message || e))
    } finally {
      setOpslaan(false)
    }
  }

  const optieVan = (waarde) => opties.find(o => o.waarde === waarde) || opties[0]

  const inhoud = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 1100,
          maxHeight: isMobile ? '100%' : '90vh',
          background: '#0f0f0f',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: isMobile ? 0 : 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Kop */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
              Trainingsweek{clientNaam ? ` — ${clientNaam}` : ''}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
              {aantalTrainingen} training{aantalTrainingen === 1 ? '' : 'en'} · blader per dag met de pijltjes
            </div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', flexShrink: 0,
            width: 30, height: 30, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', cursor: 'pointer',
          }}><X size={15} /></button>
        </div>

        {/* De week */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: isMobile ? '0.75rem' : '1rem' }}>
          {laden ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>Laden…</div>
          ) : (
            <div style={{
              display: 'grid',
              // Zeven naast elkaar op desktop. Op een smal scherm onder elkaar:
              // zeven kolommen van 50 pixels leest niemand.
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(7, 1fr)',
              gap: 8,
            }}>
              {DAGEN.map(dag => {
                const keuze = optieVan(schedule[dag])
                const isRust = keuze.waarde === RUST
                const groep = isRust ? null : groepVan(`${keuze.label} ${keuze.sub}`)
                return (
                  <div key={dag} style={{
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isRust ? 'rgba(255,255,255,0.07)' : groep.kleur + '55'}`,
                    borderTop: `3px solid ${isRust ? 'rgba(255,255,255,0.12)' : groep.kleur}`,
                    borderRadius: 10, overflow: 'hidden',
                    minHeight: isMobile ? 0 : 150,
                  }}>
                    <div style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.45)', textAlign: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      {isMobile ? DAG_NL[dag] : DAG_KORT[dag]}
                    </div>

                    {/* De kaart met pijltjes ernaast */}
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      padding: isMobile ? '0.5rem' : '0.4rem 0.25rem', gap: 2,
                    }}>
                      <button
                        onClick={() => verschuif(dag, -1)}
                        aria-label="Vorige training"
                        style={{
                          flexShrink: 0, width: 22, height: 30, padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none',
                          color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 6,
                        }}
                      ><ChevronLeft size={16} /></button>

                      <div style={{
                        flex: 1, minWidth: 0, textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      }}>
                        {isRust ? (
                          <>
                            <Moon size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                            }}>Rust</span>
                          </>
                        ) : (
                          <>
                            <span style={{
                              fontSize: isMobile ? '0.8rem' : '0.74rem', fontWeight: 900, color: '#fff',
                              lineHeight: 1.2, wordBreak: 'break-word',
                            }}>{keuze.label}</span>
                            {keuze.sub && (
                              <span style={{
                                fontSize: '0.58rem', fontWeight: 700, color: groep.kleur,
                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              }}>{keuze.sub}</span>
                            )}
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => verschuif(dag, 1)}
                        aria-label="Volgende training"
                        style={{
                          flexShrink: 0, width: 22, height: 30, padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none',
                          color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: 6,
                        }}
                      ><ChevronRight size={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!laden && opties.length <= 1 && (
            <div style={{
              marginTop: '0.9rem', padding: '0.6rem 0.75rem', borderRadius: 8,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            }}>
              Dit plan heeft nog geen trainingsdagen, dus er valt niets te kiezen.
              Voeg eerst dagen toe aan het plan en sla het op.
            </div>
          )}
        </div>

        {/* Opslaan */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0.75rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
            {gewijzigd ? 'Niet opgeslagen' : 'Alles opgeslagen'}
          </span>
          <button
            onClick={bewaar}
            disabled={!gewijzigd || opslaan}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0.55rem 1rem',
              background: gewijzigd ? '#fff' : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 9,
              color: gewijzigd ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: (gewijzigd && !opslaan) ? 'pointer' : 'default',
            }}
          >
            {opslaan
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <Check size={14} />}
            {opslaan ? 'Opslaan…' : 'Week opslaan'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(inhoud, document.body)
}
