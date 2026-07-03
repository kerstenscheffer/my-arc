// src/modules/workout/components/WorkoutProgressToast.jsx
// Inline progress-insights card op de workout-pagina. Niet meer een
// fixed-overlay; staat tussen TodaysWorkoutMain en WeekSchedule in normale
// document-flow zodat'ie meescrollt en niet midden-in-beeld blijft hangen.
import { useState, useEffect } from 'react'
import { X, Flame, Target, Zap, ChevronRight } from 'lucide-react'

// Coach-foto (zelfde als CoachNoteCard) — komt linksboven in de toast.
const COACH_PHOTO_URL = 'https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg'

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
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed today
    const dismissedDate = localStorage.getItem('workout_toast_dismissed')
    const today = new Date().toDateString()

    if (dismissedDate === today) {
      setDismissed(true)
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
    setDismissed(true)
    localStorage.setItem('workout_toast_dismissed', new Date().toDateString())
  }

  const handleClick = () => {
    if (onViewChart && insight?.exercise) {
      onViewChart(insight.exercise)
    }
  }

  if (dismissed || !insight) return null

  const isClickable = !!(onViewChart && insight.exercise)

  return (
    <div style={{
      padding: isMobile ? '0 1rem' : '0 1.25rem',
      animation: 'workoutInsightFadeIn 0.4s ease',
    }}>
      <div
        onClick={isClickable ? handleClick : undefined}
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,215,0,0.02) 100%)',
          border: '1px solid rgba(255,215,0,0.28)',
          borderLeft: '3px solid #FFD700',
          borderRadius: 12,
          padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'transform 0.15s ease, border-color 0.15s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 10 : 12,
        }}
        onMouseEnter={(e) => {
          if (isClickable && !isMobile) {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)'
          }
        }}
        onMouseLeave={(e) => {
          if (isClickable && !isMobile) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.28)'
          }
        }}
      >
        {/* Coach-foto — vervangt de oude gouden icoon-cirkel met Flame/Target/Zap. */}
        <img
          src={COACH_PHOTO_URL}
          alt="Coach"
          style={{
            width: isMobile ? 40 : 44,
            height: isMobile ? 40 : 44,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,215,0,0.55)',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255,215,0,0.22)',
          }}
        />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            marginBottom: 3,
          }}>
            <span style={{
              fontSize: '0.58rem', fontWeight: 800,
              color: '#FFD700', opacity: 0.85,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {pickPraise(insight.type, insight.exercise || '')}
            </span>
          </div>
          {/* Oefeningnaam mag inkorten; de gewicht-progressie (metric) staat
              in een flexShrink:0 gouden stuk en blijft dus ALTIJD leesbaar. */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 900,
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            marginBottom: 2,
          }}>
            {insight.name ? (
              <>
                <span style={{
                  color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  minWidth: 0, flexShrink: 1,
                }}>
                  {insight.name}
                </span>
                {insight.metric && (
                  <span style={{ color: '#FFD700', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {insight.metric}
                  </span>
                )}
              </>
            ) : (
              <span style={{
                color: '#fff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
              }}>
                {insight.title}
              </span>
            )}
          </div>
          <div style={{
            fontSize: isMobile ? '0.76rem' : '0.82rem',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 600,
            lineHeight: 1.4,
          }}>
            {insight.message}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          {isClickable && (
            <div style={{
              width: isMobile ? 30 : 32, height: isMobile ? 30 : 32,
              borderRadius: 8,
              background: 'rgba(255,215,0,0.12)',
              border: '1px solid rgba(255,215,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFD700',
            }}>
              <ChevronRight size={isMobile ? 15 : 16} strokeWidth={2.6} />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss() }}
            aria-label="Sluit melding"
            style={{
              width: isMobile ? 30 : 32, height: isMobile ? 30 : 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              padding: 0,
              color: 'rgba(255,255,255,0.55)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
                e.currentTarget.style.color = '#fff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
              }
            }}
          >
            <X size={isMobile ? 14 : 15} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes workoutInsightFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
