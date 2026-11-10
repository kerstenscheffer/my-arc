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
import { KRACHT_WEKEN_TERUG } from '../volumeRegels'

const e1rm = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)

export function useVolumeContext(db, clientId, refreshKey = 0) {
  const [ctx, setCtx] = useState(null)
  useEffect(() => {
    if (!clientId || !db?.supabase) { setCtx(null); return undefined }
    let weg = false
    const leeg = { data: null }
    ;(async () => {
      const sb = db.supabase
      const { data: c } = await sb.from('clients').select('training_experience, experience, age, date_of_birth, auth_user_id')
        .eq('id', clientId).single().then(r => r, () => leeg)
      const ids = [c?.auth_user_id, clientId].filter(Boolean)
      const van = new Date(); van.setDate(van.getDate() - KRACHT_WEKEN_TERUG * 7)
      const [wp, fases, bib, sessies] = await Promise.all([
        sb.from('user_workout_preferences').select('default_experience_level').in('user_id', ids)
          .order('workout_completed_at', { ascending: false, nullsFirst: false }).limit(1).then(r => r, () => leeg),
        sb.from('client_phases').select('doel, started_on, ended_on').eq('client_id', clientId).is('ended_on', null)
          .order('started_on', { ascending: false }).limit(1).then(r => r, () => leeg),
        sb.from('exercises').select('name, secundair_spieren').not('secundair_spieren', 'is', null).limit(2000).then(r => r, () => leeg),
        sb.from('workout_sessions').select('id, workout_date').eq('client_id', clientId)
          .gte('workout_date', van.toISOString().slice(0, 10)).then(r => r, () => leeg),
      ])
      let logs = []
      if (sessies.data?.length) {
        const datum = Object.fromEntries(sessies.data.map(s => [s.id, String(s.workout_date).slice(0, 10)]))
        const { data } = await sb.from('workout_progress').select('session_id, exercise_name, sets')
          .in('session_id', sessies.data.map(s => s.id)).then(r => r, () => leeg)
        logs = (data || []).map(l => ({ naam: l.exercise_name, datum: datum[l.session_id], kracht: Math.max(0, ...(Array.isArray(l.sets) ? l.sets : []).map(e1rm)) }))
          .filter(r => r.naam && r.datum)
      }
      const ervaring = String(c?.training_experience || wp.data?.[0]?.default_experience_level || c?.experience || '').toLowerCase()
      const status = /begin/.test(ervaring) ? 'beginner' : /adv|gevorder/.test(ervaring) ? 'advanced' : /inter|gemiddeld/.test(ervaring) ? 'intermediate' : null
      const doel = fases.data?.[0]?.doel
      const fase = doel === 'cut' ? 'cut' : doel === 'build' ? 'bulk' : 'onderhoud'
      let leeftijd = Number(c?.age) || null
      if (!leeftijd && c?.date_of_birth) leeftijd = Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / (365.25 * 864e5))
      const secMap = {}
      for (const b of bib.data || []) if (b.name && b.secundair_spieren?.length) secMap[b.name.trim().toLowerCase()] = b.secundair_spieren
      if (!weg) setCtx({ status: status || 'intermediate', statusBekend: !!status, fase, faseBekend: !!doel, leeftijd, secMap, logs })
    })()
    return () => { weg = true }
  }, [clientId, db, refreshKey])
  return ctx
}
