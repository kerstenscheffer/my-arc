// src/modules/client-journey/components/calls/hooks/useIntakeState.js
import { useState, useCallback } from 'react'

const INITIAL_PLAN = {
  deficitPreset: null,
  manualCal: '',
  cardioSessions: 0,
  cheatDays: 0,
  cheatDayCal: 500,
  targetWeight: null,
  mode: null,
}

const INITIAL_NOTES = {
  doel: {},      // { antwoord, route }
  plan: {},      // { delivery }
  training: {},  // { schema, blessures, notitie }
  voeding: {},   // { aanpak, coachingLevel, notitie }
  afspraken: {}, // { callFreq, startDatum, whatsapp, notitie }
}

const INITIAL_ACTIONS = []

export function useIntakeState() {
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])

  // Plan state (voor useIntakeCalc)
  const [planState, setPlanState] = useState(INITIAL_PLAN)
  const updatePlan = useCallback((updates) => {
    setPlanState(prev => ({ ...prev, ...updates }))
  }, [])

  // Notities per stap
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const updateNotes = useCallback((step, updates) => {
    setNotes(prev => ({
      ...prev,
      [step]: typeof updates === 'function'
        ? updates(prev[step] || {})
        : { ...(prev[step] || {}), ...updates }
    }))
  }, [])

  // Coaching level (stap voeding)
  const [coachingLevel, setCoachingLevel] = useState(null)

  // Actie-lijst voor output scherm
  const [actions, setActions] = useState(INITIAL_ACTIONS)
  const toggleAction = useCallback((id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }, [])
  const setActionList = useCallback((list) => setActions(list), [])

  // Stap navigatie
  const goToStep = useCallback((step) => {
    setActiveStep(step)
  }, [])

  const completeStep = useCallback((step) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
    setActiveStep(step + 1)
  }, [])

  // Reset (bij nieuwe call)
  const reset = useCallback(() => {
    setActiveStep(0)
    setCompletedSteps([])
    setPlanState(INITIAL_PLAN)
    setNotes(INITIAL_NOTES)
    setCoachingLevel(null)
    setActions(INITIAL_ACTIONS)
  }, [])

  return {
    // Navigatie
    activeStep,
    completedSteps,
    setCompletedSteps,
    goToStep,
    completeStep,

    // Plan (voor calc)
    planState,
    updatePlan,
    setPlanState,

    // Notities
    notes,
    updateNotes,

    // Coaching level
    coachingLevel,
    setCoachingLevel,

    // Acties
    actions,
    toggleAction,
    setActionList,

    // Reset
    reset,
  }
}
