// Client-side wrapper rond WorkoutOverviewChart — dezelfde rijke
// multi-exercise grafiek die de coach in z'n insight-modal ziet, nu
// ook op de workout-pagina van de klant zelf. Vervangt de oudere
// ProgressChartsWidget (die de coach "kut" vond).
//
// Doet één extra ding dat de coach-versie kreeg van CommandCenterService:
// 90-dagen exerciseProgress voor déze client laden, in exact dezelfde
// shape die WorkoutOverviewChart verwacht. 1y/all-ranges fetcht de
// chart zelf intern.

import React, { useEffect, useState } from 'react'
import WorkoutOverviewChart from '../../coach-command-center/components/insight/WorkoutOverviewChart'

async function loadExerciseProgress(db, clientId) {
  if (!clientId || !db?.supabase) return {}
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const { data: sessions, error: sessErr } = await db.supabase
      .from('workout_sessions')
      .select('id, workout_date')
      .eq('client_id', clientId)
      .gte('workout_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('workout_date', { ascending: true })
    if (sessErr || !sessions || sessions.length === 0) return {}

    const sessionMap = {}
    sessions.forEach(s => { sessionMap[s.id] = s.workout_date })

    let allProgress = []
    const batchSize = 200
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize).map(s => s.id)
      const { data: progress } = await db.supabase
        .from('workout_progress')
        .select('session_id, exercise_name, sets, notes, attachment_used')
        .in('session_id', batch)
      if (progress) allProgress = allProgress.concat(progress)
    }

    const progressByExercise = {}
    allProgress.forEach(entry => {
      const date = sessionMap[entry.session_id]
      if (!date || !entry.sets || !Array.isArray(entry.sets)) return
      const name = entry.exercise_name
      if (!progressByExercise[name]) progressByExercise[name] = []
      const completedSets = entry.sets.filter(s => s.completed !== false)
      const bestSet = completedSets.reduce(
        (best, s) => (!best || (s.weight || 0) > (best.weight || 0)) ? s : best,
        null
      )
      progressByExercise[name].push({
        date,
        sessionId: entry.session_id,
        sets: completedSets.map(s => ({
          reps: s.reps, weight: s.weight,
          partials: s.partials || 0,
          dropsets: s.dropsets || [],
        })),
        bestWeight: bestSet?.weight || 0,
        bestReps: bestSet?.reps || 0,
        totalSets: completedSets.length,
        totalVolume: completedSets.reduce((v, s) => v + ((s.weight || 0) * (s.reps || 0)), 0),
        notes: entry.notes || null,
        attachment_used: entry.attachment_used || null,
      })
    })
    return progressByExercise
  } catch (e) {
    console.error('ClientWorkoutChart: load failed', e)
    return {}
  }
}

export default function ClientWorkoutChart({ db, client }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (!client?.id) return
    let cancelled = false
    loadExerciseProgress(db, client.id).then(p => {
      if (!cancelled) setProgress(p)
    })
    return () => { cancelled = true }
  }, [db, client?.id])

  // Skeleton tijdens laden — voorkomt dat de chart eerst "geen data" toont
  // en daarna pas vult als de fetch klaar is. Border/radius matcht nu het
  // chart-component zelf zodat de overgang naadloos is.
  if (progress === null) {
    return (
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14,
        height: isMobile ? 520 : 640,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.9rem', fontWeight: 600,
      }}>
        Workout-grafiek laden…
      </div>
    )
  }

  return (
    <WorkoutOverviewChart
      db={db}
      client={client}
      exerciseProgress={progress}
      isMobile={isMobile}
    />
  )
}
