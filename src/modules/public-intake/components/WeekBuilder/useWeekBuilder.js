// src/modules/public-intake/components/WeekBuilder/useWeekBuilder.js
// State logica voor Week Builder — slaap, werk, training
// Output: week_schedule JSONB compatibel met Supabase clients tabel

import { useState, useCallback } from 'react'

export const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
export const DAY_LABELS = { ma: 'Ma', di: 'Di', wo: 'Wo', do: 'Do', vr: 'Vr', za: 'Za', zo: 'Zo' }

export const WORK_TYPES = {
  kantoor:  { label: 'Kantoor',   color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  horeca:   { label: 'Horeca',    color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  fysiek:   { label: 'Fysiek',    color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  thuis:    { label: 'Thuis',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  winkel:   { label: 'Winkel',    color: '#EC4899', bg: 'rgba(236,72,153,0.12)'  },
  anders:   { label: 'Anders',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

export const BLOCK_TYPES = {
  ...WORK_TYPES,
  slaap:    { label: 'Slaap',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  training: { label: 'Training',  color: '#FFD700', bg: 'rgba(255,215,0,0.12)'   },
  vrij:     { label: 'Vrij',      color: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
}

// Stappen in de conversational flow
export const STEPS = ['slaap', 'werk_type', 'werk_dagen', 'werk_tijden', 'training', 'overzicht']

function timeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m) {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// Bouw slaapblokken voor alle dagen op basis van slaap-in/wake-up tijden
function buildSleepBlocks(sleepTime, wakeTime) {
  const result = {}
  DAYS.forEach(day => {
    result[day] = [{ type: 'slaap', start: sleepTime, end: wakeTime }]
  })
  return result
}

// Voeg werkblokken toe aan bestaand schedule
function mergeWorkBlocks(schedule, workBlocks) {
  const result = {}
  DAYS.forEach(day => {
    result[day] = [...(schedule[day] || [])]
  })
  workBlocks.forEach(block => {
    block.days.forEach(day => {
      const existing = result[day] || []
      // Verwijder eerst oude werkblokken van dit type op deze dag
      const cleaned = existing.filter(b => !WORK_TYPES[b.type])
      result[day] = [...cleaned, { type: block.type, start: block.start, end: block.end }]
    })
  })
  return result
}

// Voeg trainingsblokken toe
function mergeTrainingBlocks(schedule, trainingDays, trainingTime) {
  const result = {}
  DAYS.forEach(day => {
    result[day] = [...(schedule[day] || [])]
  })
  trainingDays.forEach(day => {
    if (!DAYS.includes(day)) return
    const existing = result[day] || []
    const cleaned = existing.filter(b => b.type !== 'training')
    const startMin = timeToMinutes(trainingTime || '18:00')
    const endMin = startMin + 75 // default 75 min sessie
    result[day] = [...cleaned, {
      type: 'training',
      start: trainingTime || '18:00',
      end: minutesToTime(endMin)
    }]
  })
  return result
}

// Sorteer blokken per dag op starttijd
function sortSchedule(schedule) {
  const result = {}
  DAYS.forEach(day => {
    const blocks = schedule[day] || []
    result[day] = [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
  })
  return result
}

export default function useWeekBuilder({ initialData, preferredTrainingDays, onComplete }) {
  const [step, setStep] = useState(0) // index in STEPS array

  // Slaap
  const [sleepTime, setSleepTime] = useState(initialData?.sleep_time || '23:00')
  const [wakeTime, setWakeTime]   = useState(initialData?.wake_time  || '07:00')

  // Werk
  const [workType, setWorkType]   = useState(null) // huidig werktype in wizard
  const [workBlocks, setWorkBlocks] = useState(
    // Herstel vanuit bestaande work_schedule als die er al is
    initialData?.work_schedule_blocks || []
  )
  // werk_dagen stap: welke dagen voor het huidige werktype
  const [activeDays, setActiveDays]   = useState([])
  const [activeStart, setActiveStart] = useState('09:00')
  const [activeEnd, setActiveEnd]     = useState('17:00')
  const [hasMoreWork, setHasMoreWork] = useState(false)

  // Training
  const [trainingDays, setTrainingDays]   = useState(preferredTrainingDays || [])
  const [trainingTime, setTrainingTime]   = useState(initialData?.training_time || '18:00')

  // Computed schedule (live preview voor kalender)
  const buildSchedule = useCallback(() => {
    let s = buildSleepBlocks(sleepTime, wakeTime)
    s = mergeWorkBlocks(s, workBlocks)
    s = mergeTrainingBlocks(s, trainingDays, trainingTime)
    return sortSchedule(s)
  }, [sleepTime, wakeTime, workBlocks, trainingDays, trainingTime])

  const currentStep = STEPS[step]

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const goBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const goTo = (stepName) => {
    const idx = STEPS.indexOf(stepName)
    if (idx >= 0) setStep(idx)
  }

  // Werkblok toevoegen vanuit wizard
  const addWorkBlock = () => {
    if (!workType || activeDays.length === 0) return
    // Check of er al een blok van dit type+tijden bestaat — vervang dan
    const newBlock = { type: workType, days: [...activeDays], start: activeStart, end: activeEnd }
    setWorkBlocks(prev => {
      // Merge: als dezelfde dagen al een blok hebben, voeg toe als extra blok
      const filtered = prev.filter(b =>
        !(b.type === workType &&
          JSON.stringify([...b.days].sort()) === JSON.stringify([...activeDays].sort()))
      )
      return [...filtered, newBlock]
    })
  }

  const removeWorkBlock = (idx) => {
    setWorkBlocks(prev => prev.filter((_, i) => i !== idx))
  }

  const toggleDay = (day) => {
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleTrainingDay = (day) => {
    setTrainingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // Finale output naar parent
  const handleComplete = () => {
    const schedule = buildSchedule()

    // sleep_hours berekenen uit tijden (over-middernacht aware)
    const sleepMin = timeToMinutes(sleepTime)
    const wakeMin  = timeToMinutes(wakeTime)
    const diffMin  = wakeMin > sleepMin ? wakeMin - sleepMin : (24 * 60 - sleepMin) + wakeMin
    const sleepHours = Math.round(diffMin / 60 * 10) / 10

    onComplete({
      week_schedule:           schedule,
      work_schedule:           workBlocks, // legacy compat
      preferred_training_days: trainingDays,
      training_time:           trainingTime,
      sleep_time:              sleepTime,
      wake_time:               wakeTime,
      sleep_hours:             sleepHours,
    })
  }

  return {
    // State
    step, currentStep, STEPS,
    sleepTime, wakeTime,
    workType, workBlocks,
    activeDays, activeStart, activeEnd, hasMoreWork,
    trainingDays, trainingTime,
    // Computed
    schedule: buildSchedule(),
    // Actions
    setSleepTime, setWakeTime,
    setWorkType,
    setActiveDays, setActiveStart, setActiveEnd, setHasMoreWork,
    setTrainingTime,
    addWorkBlock, removeWorkBlock,
    toggleDay, toggleTrainingDay,
    goNext, goBack, goTo,
    handleComplete,
  }
}
