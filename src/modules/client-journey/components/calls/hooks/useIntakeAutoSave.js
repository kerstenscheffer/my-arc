// src/modules/client-journey/components/calls/hooks/useIntakeAutoSave.js
// Centrale auto-save — schrijft notes + planState direct naar client_journeys.coaching_plan
// Debounced 800ms zodat elke keystroke niet een DB call triggert
import { useEffect, useRef, useCallback } from 'react'

export function useIntakeAutoSave({ db, journey, notes, planState, coachingLevel, result }) {
  const timerRef = useRef(null)
  const lastSavedRef = useRef(null)

  const save = useCallback(async () => {
    if (!db?.supabase || !journey?.id) return

    const payload = {
      coaching_level: coachingLevel,
      intake_call_notes: {
        notes,
        plan_state: planState,
        plan_result: result ? {
          target_cal: result.targetCal,
          protein: result.prot,
          carbs: result.carbs,
          fat: result.fat,
          mode: result.mode,
          weekly_loss: result.weeklyLoss,
          weeks_needed: result.weeksNeeded,
          goal_weight: result.goalWeight,
          tdee: result.tdee,
          active_preset: result.activePreset,
        } : null,
        auto_saved_at: new Date().toISOString(),
      },
      // Afspraken direct toegankelijk op journey niveau
      startdatum_tekst: notes.afspraken?.startdatum || null,
      call_freq: notes.afspraken?.call_freq || null,
      whatsapp_afspraken: notes.afspraken?.whatsapp || null,
    }

    // Skip als identiek aan vorige save
    const hash = JSON.stringify(payload)
    if (hash === lastSavedRef.current) return
    lastSavedRef.current = hash

    try {
      const existing = journey?.coaching_plan || {}
      const { error } = await db.supabase
        .from('client_journeys')
        .update({
          coaching_plan: { ...existing, ...payload },
        })
        .eq('id', journey.id)

      if (error) console.error('❌ Auto-save coaching_plan:', error.message)
      else console.log('💾 Auto-save coaching_plan ✓')
    } catch (e) {
      console.error('❌ Auto-save error:', e)
    }
  }, [db, journey, notes, planState, coachingLevel, result])

  // Debounce: trigger save 800ms na laatste wijziging
  useEffect(() => {
    if (!journey?.id) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, 800)
    return () => clearTimeout(timerRef.current)
  }, [notes, planState, coachingLevel, save])

  // Force save bij unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      save()
    }
  }, [])
}
