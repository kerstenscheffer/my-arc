// src/modules/manual-workout-builder/components/useVolumeContext.js
//
// Wat volumeSuggesties.js van de klant nodig heeft (10 nov 2026):
//   status   beginner | intermediate | advanced  (clients.training_experience,
//            anders de intake user_workout_preferences.default_experience_level)
//   fase     bulk | onderhoud | cut  (lopende client_phases: build/cut)
//   leeftijd clients.age of uit date_of_birth
//   secMap   oefening → secundaire spieren uit de bibliotheek
//   logs     beste set per oefening per training, laatste weken

import { useEffect, useState } from 'react'
import { laadVolumeContext } from '../volumeData'

export function useVolumeContext(db, clientId, refreshKey = 0) {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    if (!clientId || !db?.supabase) { setCtx(null); return undefined }
    let weg = false
    laadVolumeContext(db.supabase, clientId).then(c => { if (!weg) setCtx(c) }, () => { if (!weg) setCtx(null) })
    return () => { weg = true }
  }, [clientId, db, refreshKey])
  return ctx
}
