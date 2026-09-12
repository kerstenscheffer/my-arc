// src/modules/workout/components/WorkoutProgressToast.jsx
// Inline progress-insights card op de workout-pagina. Niet meer een
// fixed-overlay; staat tussen TodaysWorkoutMain en WeekSchedule in normale
// document-flow zodat'ie meescrollt en niet midden-in-beeld blijft hangen.
import { useState, useEffect } from 'react'
import { X, Flame, Target, Zap } from 'lucide-react'

// Coach-foto — vult de rechterkant van de melding. Lokaal bestand in plaats
// van de externe ibb-link die hier eerst stond: een melding die de coach zelf
// laat zien moet niet afhangen van een gratis image-host.
const COACH_PHOTO_URL = '/coach-compliment.jpg'

// Wisselende positieve aanmoedigingen — vervangen het statische
// "Progressie/Streak/Plateau"-label. Per insight-type een eigen pool,
// deterministisch gekozen op exercise+date zodat'ie binnen 1 dag stabiel is.
const PRAISE_BY_TYPE = {
  pr: [
    'Lekker bezig',
    'Alweer progressie geboekt',
    'Sterke moves',
    'Indrukwekkend',
    'Knappe push',
    'Doorgaan zo',
    'Op de goede weg',
    'Crushing it',
    'Komt goed binnen',
    'Goed gewerkt',
  ],
  streak: [
    'Op fire deze week',
    'Lekker bezig',
    'Consistent als een tank',
    'Mooie streak',
    'Discipline op punt',
    'Doorpakken werkt',
    'Top ritme',
  ],
  stagnation: [
    'Tijd voor een nieuwe push',
    'Daag jezelf uit',
    'Ronde 2 incoming',
    'Volgende stap setupt',
    'Plateau in zicht',
  ],
}

const pickPraise = (type, seed = '') => {
  const pool = PRAISE_BY_TYPE[type] || PRAISE_BY_TYPE.pr
  const start = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000)
  // Tel ASCII-bytes van seed bij voor extra spreiding tussen exercises.
  let s = dayOfYear
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  return pool[s % pool.length]
}

export default function WorkoutProgressToast({ client, db, onViewChart }) {
  const isMobile = window.innerWidth <= 768
  const [insight, setInsight] = useState(null)
  // Twee stappen bij sluiten: eerst terug naar rechts uitschuiven, dan pas weg.
  const [sluiten, setSluiten] = useState(false)
  const [weg, setWeg] = useState(false)

  useEffect(() => {
    // Check if dismissed today
    const dismissedDate = localStorage.getItem('workout_toast_dismissed')
    const today = new Date().toDateString()

    if (dismissedDate === today) {
      setWeg(true)
      return
    }

    // Load and analyze workout data
    analyzeProgress()
  }, [client?.id])

  const analyzeProgress = async () => {
    if (!client?.id || !db) return

    try {
      // Get last 30 days of workout data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', client.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (sessionsError || !sessions || sessions.length === 0) {
        return
      }

      const sessionIds = sessions.map(s => s.id)

      // Get all progress records
      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)

      if (progressError || !progressData || progressData.length === 0) {
        return
      }

      // Analyze for insights
      const insights = []

      // 1. Check for PR (Personal Record) - biggest weight increase
      const exerciseProgress = {}
      progressData.forEach(record => {
        const exercise = record.exercise_name
        const sets = Array.isArray(record.sets) ? record.sets : []
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0)
        
        if (!exerciseProgress[exercise]) {
          exerciseProgress[exercise] = []
        }
        
        exerciseProgress[exercise].push({
          date: sessions.find(s => s.id === record.session_id)?.completed_at,
          maxWeight
        })
      })

      // Find biggest improvement
      let biggestImprovement = null
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 2) return
        
        records.sort((a, b) => new Date(a.date) - new Date(b.date))
        const firstWeight = records[0].maxWeight
        const lastWeight = records[records.length - 1].maxWeight
        const increase = lastWeight - firstWeight

        if (increase > 0) {
          if (!biggestImprovement || increase > biggestImprovement.increase) {
            biggestImprovement = {
              exercise,
              increase,
              from: firstWeight,
              to: lastWeight
            }
          }
        }
      })

      if (biggestImprovement && biggestImprovement.increase >= 2.5) {
        insights.push({
          type: 'pr',
          icon: Flame,
          name: biggestImprovement.exercise,
          metric: `+${biggestImprovement.increase}kg`,
          title: `${biggestImprovement.exercise} +${biggestImprovement.increase}kg!`,
          message: 'Sterke progressie deze maand',
          color: '#FFD700', // GOLD
          exercise: biggestImprovement.exercise
        })
      }

      // 2. Check for stagnation (3+ sessions with same weight)
      Object.entries(exerciseProgress).forEach(([exercise, records]) => {
        if (records.length < 3) return
        
        const recent = records.slice(-3)
        const weights = recent.map(r => r.maxWeight)
        const allSame = weights.every(w => w === weights[0])

        if (allSame && weights[0] > 0) {
          insights.push({
            type: 'stagnation',
            icon: Target,
            name: exercise,
            metric: `${weights[0]}kg`,
            title: `${exercise} op ${weights[0]}kg`,
            message: 'Tijd voor progressie overload!',
            color: '#FFD700', // GOLD
            exercise
          })
        }
      })

      // 3. Check weekly workout count
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeekSessions = sessions.filter(s => 
        new Date(s.completed_at) >= weekAgo
      ).length

      if (thisWeekSessions >= 4) {
        insights.push({
          type: 'streak',
          icon: Zap,
          name: null,
          metric: `${thisWeekSessions} workouts`,
          title: `${thisWeekSessions} workouts deze week!`,
          message: 'Je bent op 🔥',
          color: '#FFD700', // GOLD
          exercise: null
        })
      }

      // Pick best insight (priority: PR > Streak > Stagnation)
      const priorityOrder = ['pr', 'streak', 'stagnation']
      const bestInsight = insights.sort((a, b) => 
        priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
      )[0]

      if (bestInsight) {
        setInsight(bestInsight)
      }

    } catch (error) {
      console.error('Failed to analyze progress:', error)
    }
  }

  const handleDismiss = () => {
    setSluiten(true)
    localStorage.setItem('workout_toast_dismissed', new Date().toDateString())
    setTimeout(() => setWeg(true), 400)
  }

  const handleClick = () => {
    if (onViewChart && insight?.exercise) {
      onViewChart(insight.exercise)
    }
  }

  if (weg || !insight) return null

  const isClickable = !!(onViewChart && insight.exercise)
  const breedte = isMobile ? 'min(330px, 88vw)' : 380
  const hoogte = isMobile ? 116 : 132

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      style={{
        position: 'fixed',
        right: 0,
        top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 84px)' : 108,
        zIndex: 96,
        width: breedte, height: hoogte,
        borderRadius: '16px 0 0 16px',
        overflow: 'hidden',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRight: 'none',
        boxShadow: '0 16px 44px rgba(0,0,0,0.6)',
        cursor: isClickable ? 'pointer' : 'default',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        animation: `${sluiten ? 'complimentUit' : 'complimentIn'} 0.42s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
      }}
    >
      {/* Foto rechts; de linkerhelft loopt weg in het zwart zodat de tekst er
          overheen kan beginnen in plaats van ernaast te moeten passen. */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '62%',
        backgroundImage: `url(${COACH_PHOTO_URL})`,
        backgroundSize: 'cover',
        // Het beeld is staand (665x1182) en de kop zit rond 45% van de hoogte;
        // in een liggend vak van ~130px valt met 18% alleen het plafond binnen.
        backgroundPosition: 'center 42%',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 32%, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.45) 74%, rgba(10,10,10,0.05) 100%)',
      }} />

      {/* Tekst — begint links en loopt tot over de helft van de foto. */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: '72%',
        padding: isMobile ? '0.7rem 0.5rem 0.7rem 0.9rem' : '0.85rem 0.6rem 0.85rem 1.1rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
      }}>
        <div style={{
          fontSize: isMobile ? '1.05rem' : '1.2rem',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em', lineHeight: 1.1,
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}>
          {pickPraise(insight.type, insight.exercise || '')}
        </div>
        <div style={{
          fontSize: isMobile ? '0.74rem' : '0.8rem',
          fontWeight: 800, color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          {insight.name ? `${insight.name} ${insight.metric || ''}`.trim() : insight.title}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss() }}
        aria-label="Sluit melding"
        style={{
          position: 'absolute', top: 5, right: 6,
          width: 24, height: 24, padding: 0,
          background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 7,
          color: '#fff', opacity: 0.85,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <X size={13} strokeWidth={2.8} />
      </button>

      <style>{`
        @keyframes complimentIn {
          from { transform: translateX(105%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes complimentUit {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(105%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
