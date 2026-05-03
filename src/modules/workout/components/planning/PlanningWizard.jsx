// src/modules/workout/components/planning/PlanningWizard.jsx
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Zap, Check, ChevronRight, ChevronLeft, Edit2, Trash2 } from 'lucide-react'

export default function PlanningWizard({ workoutService, clientId, schema, onComplete, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [step, setStep] = useState(1)
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(null)
  const [selectedDays, setSelectedDays] = useState([])
  const [workoutAssignments, setWorkoutAssignments] = useState({})
  const [customWorkouts, setCustomWorkouts] = useState([])
  const [editingDay, setEditingDay] = useState(null)
  const [loading, setLoading] = useState(false)

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayLabels = { Monday: 'Ma', Tuesday: 'Di', Wednesday: 'Wo', Thursday: 'Do', Friday: 'Vr', Saturday: 'Za', Sunday: 'Zo' }

  useEffect(() => { loadCustomWorkouts() }, [])

  const loadCustomWorkouts = async () => {
    if (!workoutService || !clientId) return
    try {
      const customs = await workoutService.getCustomWorkouts(clientId)
      setCustomWorkouts(customs || [])
    } catch (e) { console.error('❌ Failed to load custom workouts:', e) }
  }

  const getAllWorkouts = () => {
    const schemaWorkouts = schema?.week_structure
      ? Object.entries(schema.week_structure).map(([key, workout]) => ({ value: key, label: workout.name || key, type: 'schema' }))
      : []
    const customWorkoutOptions = customWorkouts.map(w => ({
      value: `custom_${w.id}`, label: w.name, type: 'custom',
      emoji: ({ running:'🏃', cycling:'🚴', swimming:'🏊', walking:'🚶', yoga:'🧘', hiking:'🥾', boxing:'🥊', dancing:'💃' }[w.type] || '⚡')
    }))
    return [...schemaWorkouts, ...customWorkoutOptions]
  }

  const getMuscleGroup = (workout) => {
    const text = ((workout?.focus || '') + ' ' + (workout?.name || '') + ' ' + (workout?.label || '')).toLowerCase()
    if (text.includes('push') || text.includes('borst') || text.includes('chest') || text.includes('tricep') || text.includes('schouder') || text.includes('shoulder')) return 'push'
    if (text.includes('pull') || text.includes('rug') || text.includes('back') || text.includes('bicep') || text.includes('row')) return 'pull'
    if (text.includes('leg') || text.includes('been') || text.includes('quad') || text.includes('hamstring') || text.includes('squat') || text.includes('glute') || text.includes('kont')) return 'legs'
    if (text.includes('upper') || text.includes('boven')) return 'upper'
    if (text.includes('full') || text.includes('totaal')) return 'full'
    if (text.includes('cardio') || text.includes('conditioning') || text.includes('hardlopen') || text.includes('running')) return 'cardio'
    return 'other'
  }

  const autoAssignWorkouts = () => {
    const all = getAllWorkouts()
    if (!all.length) return

    // Geef elke workout een spiergroep label
    const workoutsWithGroup = all.map(w => ({
      ...w,
      group: getMuscleGroup(w.type === 'schema' ? schema?.week_structure?.[w.value] : w)
    }))

    // Herstelregels: welke groepen mogen NIET opeenvolgend
    const conflictsWithPrev = (currentGroup, prevGroup) => {
      if (!prevGroup || prevGroup === 'cardio' || prevGroup === 'other') return false
      if (currentGroup === 'full' && prevGroup === 'full') return true
      if (currentGroup === 'legs' && prevGroup === 'legs') return true
      if (currentGroup === 'push' && prevGroup === 'push') return true
      if (currentGroup === 'pull' && prevGroup === 'pull') return true
      if (currentGroup === 'upper' && (prevGroup === 'push' || prevGroup === 'pull' || prevGroup === 'upper')) return true
      return false
    }

    // Sorteer selectedDays op weekdag volgorde
    const orderedDays = weekDays.filter(d => selectedDays.includes(d))

    // Greedy assignment: probeer conflict te vermijden
    const assignments = {}
    const used = new Set()
    let prevGroup = null

    orderedDays.forEach((day, idx) => {
      // Zoek beste workout: geen conflict met vorige dag, nog niet gebruikt indien mogelijk
      let best = null

      // 1e poging: niet gebruikt + geen conflict
      best = workoutsWithGroup.find(w => !used.has(w.value) && !conflictsWithPrev(w.group, prevGroup))
      // 2e poging: geen conflict (mag hergebruikt worden)
      if (!best) best = workoutsWithGroup.find(w => !conflictsWithPrev(w.group, prevGroup))
      // 3e poging: gewoon de eerste (conflict onvermijdelijk)
      if (!best) best = workoutsWithGroup[idx % workoutsWithGroup.length]

      assignments[day] = best.value
      used.add(best.value)
      prevGroup = best.group

      // Reset used als alle workouts gebruikt zijn
      if (used.size >= workoutsWithGroup.length) used.clear()
    })

    setWorkoutAssignments(assignments)
  }

  const assignWorkoutToDay = (day, workoutKey) => {
    setWorkoutAssignments(prev => ({ ...prev, [day]: workoutKey }))
    setEditingDay(null)
  }

  const removeWorkoutFromDay = (day) => {
    setWorkoutAssignments(prev => { const u = { ...prev }; delete u[day]; return u })
  }

  const getWorkoutDisplay = (key) => getAllWorkouts().find(w => w.value === key) || null

  const handleSaveSchedule = async () => {
    setLoading(true)
    try {
      const schedule = {}
      Object.entries(workoutAssignments).forEach(([day, key]) => { schedule[day] = key })
      await workoutService.updateWeekSchedule(clientId, schedule)
      if (onComplete) onComplete(schedule)
    } catch (e) {
      console.error('❌ Failed to save schedule:', e)
      alert('Er ging iets mis bij het opslaan.')
    } finally { setLoading(false) }
  }

  const canProceed = () => {
    if (step === 1) return targetDaysPerWeek !== null
    if (step === 2) return selectedDays.length > 0
    if (step === 3) return Object.keys(workoutAssignments).length > 0
    if (step === 4) return Object.keys(workoutAssignments).length > 0
    return true
  }

  const modal = (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? '0' : '2rem' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.12)', borderRadius: isMobile ? '0' : '16px', width: '100%', maxWidth: isMobile ? '100%' : '620px', height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Gouden top streep */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)', zIndex: 1 }} />

        {/* HEADER */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Stap {step} van 5</div>
            <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>Plan Je Workout Week</h2>
          </div>
          <button onClick={onClose} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${(step / 5) * 100}%`, background: '#FFD700', transition: 'width 0.3s ease' }} />
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '1.25rem 1rem' : '1.5rem' }}>

          {/* STAP 1 */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Hoeveel dagen per week?</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 1.25rem' }}>Kies het aantal trainingen dat bij jouw doelen past</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[3, 4, 5, 6].map(days => (
                  <button key={days} onClick={() => setTargetDaysPerWeek(days)}
                    style={{ padding: isMobile ? '1.25rem 0.5rem' : '1.5rem 0.5rem', background: targetDaysPerWeek === days ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)', border: `${targetDaysPerWeek === days ? '2' : '1'}px solid ${targetDaysPerWeek === days ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
                    <div style={{ fontSize: isMobile ? '1.75rem' : '2.25rem', fontWeight: '800', color: targetDaysPerWeek === days ? '#FFD700' : 'rgba(255,255,255,0.35)', marginBottom: '0.2rem' }}>{days}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: '700', color: targetDaysPerWeek === days ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>dagen</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAP 2 */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Welke dagen train je?</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 1.25rem' }}>Selecteer {targetDaysPerWeek} dagen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {weekDays.map(day => {
                  const selected = selectedDays.includes(day)
                  return (
                    <button key={day} onClick={() => setSelectedDays(prev => selected ? prev.filter(d => d !== day) : [...prev, day])}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.875rem 1rem' : '0.7rem 1rem', background: selected ? 'rgba(255,215,0,0.06)' : 'transparent', border: `1px solid ${selected ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
                      <span style={{ fontSize: isMobile ? '0.88rem' : '0.93rem', fontWeight: '700', color: selected ? '#FFD700' : 'rgba(255,255,255,0.55)' }}>{day}</span>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selected ? '#FFD700' : 'rgba(255,255,255,0.15)'}`, background: selected ? 'rgba(255,215,0,0.12)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <Check size={10} color="#FFD700" strokeWidth={3} />}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: selectedDays.length === targetDaysPerWeek ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedDays.length === targetDaysPerWeek ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '7px', textAlign: 'center', fontSize: '0.68rem', fontWeight: '700', color: selectedDays.length === targetDaysPerWeek ? 'rgba(255,215,0,0.7)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedDays.length} / {targetDaysPerWeek} geselecteerd
              </div>
            </div>
          )}

          {/* STAP 3 */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Kies workouts per dag</h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Wijs een workout toe aan elke dag</p>
                </div>
                <button onClick={autoAssignWorkouts} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.75rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '7px', color: 'rgba(255,215,0,0.7)', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                  <Zap size={11} strokeWidth={2.5} />Auto
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {selectedDays.map(day => {
                  const assigned = workoutAssignments[day]
                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 0.875rem' : '0.5rem 0.875rem', background: assigned ? 'rgba(255,215,0,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${assigned ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', color: assigned ? 'rgba(255,215,0,0.6)' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '26px', flexShrink: 0 }}>{dayLabels[day]}</span>
                      <select value={assigned || ''} onChange={(e) => assignWorkoutToDay(day, e.target.value)}
                        style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.375rem 0.5rem', color: assigned ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}>
                        <option value="">Kies workout</option>
                        {getAllWorkouts().map(w => <option key={w.value} value={w.value}>{w.type === 'custom' ? `${w.emoji} ` : ''}{w.label}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STAP 4 */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Weekoverzicht</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 1rem' }}>Bewerk je planning indien nodig</p>

              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.875rem' }}>
                {[{ label: 'Trainingsdagen', value: Object.keys(workoutAssignments).length, gold: true }, { label: 'Rustdagen', value: 7 - Object.keys(workoutAssignments).length, gold: false }].map(({ label, value, gold }, i, arr) => (
                  <div key={label} style={{ flex: 1, padding: '0.75rem 1rem', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: gold ? '#FFD700' : 'rgba(255,255,255,0.25)', marginBottom: '0.1rem' }}>{value}</div>
                    <div style={{ fontSize: '0.52rem', fontWeight: '700', color: gold ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {weekDays.map(day => {
                  const workout = workoutAssignments[day]
                  const display = workout ? getWorkoutDisplay(workout) : null
                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '0.625rem 0.875rem' : '0.5rem 0.875rem', background: workout ? 'rgba(255,215,0,0.025)' : 'transparent', border: `1px solid ${workout ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '7px', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', color: workout ? 'rgba(255,215,0,0.55)' : 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '26px', flexShrink: 0 }}>{dayLabels[day]}</span>
                      <span style={{ flex: 1, fontSize: isMobile ? '0.82rem' : '0.87rem', fontWeight: workout ? '700' : '500', color: workout ? '#fff' : 'rgba(255,255,255,0.2)', fontStyle: workout ? 'normal' : 'italic' }}>
                        {workout ? (display?.label || 'Workout') : 'Rustdag'}
                      </span>
                      {workout && (
                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                          <button onClick={() => setEditingDay(editingDay === day ? null : day)} style={{ width: '26px', height: '26px', background: 'transparent', border: '1px solid rgba(255,215,0,0.12)', borderRadius: '4px', color: 'rgba(255,215,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                            <Edit2 size={10} strokeWidth={2} />
                          </button>
                          <button onClick={() => removeWorkoutFromDay(day)} style={{ width: '26px', height: '26px', background: 'transparent', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '4px', color: 'rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                            <Trash2 size={10} strokeWidth={2} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {editingDay && (
                <div style={{ marginTop: '0.625rem', padding: '0.75rem 0.875rem', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.57rem', fontWeight: '700', color: 'rgba(255,215,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Bewerk {editingDay}</div>
                  <select value={workoutAssignments[editingDay] || ''} onChange={(e) => assignWorkoutToDay(editingDay, e.target.value)}
                    style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.5rem 0.625rem', color: '#fff', fontSize: '0.85rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Kies workout</option>
                    {getAllWorkouts().map(w => <option key={w.value} value={w.value}>{w.type === 'custom' ? `${w.emoji} ` : ''}{w.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STAP 5 */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: '800', color: '#fff', margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>Bevestig je planning</h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 1rem' }}>Je nieuwe weekschema wordt direct actief</p>

              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.875rem' }}>
                {weekDays.map((day, i) => {
                  const workout = workoutAssignments[day]
                  const display = workout ? getWorkoutDisplay(workout) : null
                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0.7rem 1rem' : '0.6rem 1rem', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: workout ? 'rgba(255,215,0,0.02)' : 'transparent' }}>
                      <span style={{ fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: '700', color: workout ? '#fff' : 'rgba(255,255,255,0.25)' }}>{day}</span>
                      <span style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: '600', color: workout ? 'rgba(255,215,0,0.75)' : 'rgba(255,255,255,0.18)', fontStyle: workout ? 'normal' : 'italic' }}>
                        {workout ? (display?.label || 'Workout') : 'Rustdag'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[{ label: 'Trainingsdagen', value: Object.keys(workoutAssignments).length, gold: true }, { label: 'Rustdagen', value: 7 - Object.keys(workoutAssignments).length, gold: false }].map(({ label, value, gold }) => (
                  <div key={label} style={{ padding: '0.875rem 1rem', background: gold ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${gold ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: gold ? '#FFD700' : 'rgba(255,255,255,0.25)', marginBottom: '0.1rem' }}>{value}</div>
                    <div style={{ fontSize: '0.52rem', fontWeight: '700', color: gold ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', flexShrink: 0, background: '#0a0a0a' }}>
          {step > 1 && (
            <button onClick={() => setStep(p => Math.max(p - 1, 1))} style={{ flex: 1, padding: isMobile ? '0.75rem' : '0.875rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: '46px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <ChevronLeft size={14} strokeWidth={2.5} />Terug
            </button>
          )}

          {step < 5 ? (
            <button onClick={() => { if (canProceed()) setStep(p => Math.min(p + 1, 5)) }} disabled={!canProceed()} style={{ flex: 2, padding: isMobile ? '0.75rem' : '0.875rem', background: canProceed() ? 'rgba(255,215,0,0.1)' : 'transparent', border: `1px solid ${canProceed() ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', color: canProceed() ? '#FFD700' : 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: canProceed() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: '46px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
              Volgende<ChevronRight size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <button onClick={handleSaveSchedule} disabled={loading} style={{ flex: 2, padding: isMobile ? '0.75rem' : '0.875rem', background: loading ? 'transparent' : 'rgba(16,185,129,0.1)', border: `1px solid ${loading ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.25)'}`, borderRadius: '8px', color: loading ? 'rgba(255,255,255,0.2)' : '#10b981', fontSize: isMobile ? '0.75rem' : '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: '46px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s ease' }}>
              {loading ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Opslaan...</> : <><Check size={14} strokeWidth={2.5} />Planning Opslaan</>}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
