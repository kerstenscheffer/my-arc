// src/modules/manual-workout-builder/hooks/useHistoryState.js
// useState met undo/redo-geschiedenis. Drop-in vervanger voor useState:
//   const [state, setState, { undo, redo, canUndo, canRedo, reset }] = useHistoryState(initial)
//
// setState ondersteunt zowel een waarde als een updater-functie (net als useState).
// Elke wijziging duwt de vorige staat op de undo-stack. Snel op elkaar volgende
// wijzigingen (bv. typen in een tekstveld) worden binnen COALESCE_MS samengevoegd
// tot één history-stap, zodat undo per "actie" werkt i.p.v. per toetsaanslag.
import { useState, useRef, useCallback } from 'react'

const COALESCE_MS = 600
const MAX_HISTORY = 100

export default function useHistoryState(initial) {
  const [state, setStateRaw] = useState(initial)
  const pastRef = useRef([])
  const futureRef = useRef([])
  const lastPushRef = useRef(0)
  // Bump om re-render te forceren wanneer alleen de stacks wijzigen (undo/redo-
  // knoppen moeten enablen/disablen).
  const [, force] = useState(0)
  const rerender = () => force(n => n + 1)

  const setState = useCallback((updater, opts = {}) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next === prev) return prev
      const now = Date.now()
      const coalesce = opts.coalesce !== false && (now - lastPushRef.current) < COALESCE_MS
      // Nieuwe wijziging → redo-stack vervalt.
      futureRef.current = []
      if (!coalesce) {
        pastRef.current.push(prev)
        if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
      }
      lastPushRef.current = now
      return next
    })
    rerender()
  }, [])

  const undo = useCallback(() => {
    setStateRaw(prev => {
      if (pastRef.current.length === 0) return prev
      const previous = pastRef.current.pop()
      futureRef.current.push(prev)
      lastPushRef.current = 0 // volgende edit start een nieuwe history-stap
      return previous
    })
    rerender()
  }, [])

  const redo = useCallback(() => {
    setStateRaw(prev => {
      if (futureRef.current.length === 0) return prev
      const nextState = futureRef.current.pop()
      pastRef.current.push(prev)
      lastPushRef.current = 0
      return nextState
    })
    rerender()
  }, [])

  // Harde reset (bv. bij laden van een template): wist de geschiedenis.
  const reset = useCallback((value) => {
    pastRef.current = []
    futureRef.current = []
    lastPushRef.current = 0
    setStateRaw(value)
    rerender()
  }, [])

  return [state, setState, {
    undo, redo, reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  }]
}
