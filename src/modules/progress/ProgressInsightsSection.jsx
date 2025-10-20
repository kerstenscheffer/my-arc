// src/modules/progress/ProgressInsightsSection.jsx - MAIN ORCHESTRATOR
import { useState, useEffect } from 'react'
import { TrendingUp, Flame, Target, Zap, Trophy } from 'lucide-react'
import HeroInsightCard from './components/HeroInsightCard'
import RegularInsightCard from './components/RegularInsightCard'
import TopExercisesStrip from './components/TopExercisesStrip'

export default function ProgressInsightsSection({ db, clientId, onSelectExercise }) {
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState([])
  const [topExercises, setTopExercises] = useState([])
  const [heroInsight, setHeroInsight] = useState(null)

  useEffect(() => {
    if (clientId && db) {
      analyzeProgress()
    }
  }, [clientId, db])

  const handleExerciseClick = (exerciseName, metric = '1rm') => {
    // 1. Scroll to chart section
    const chartElement = document.getElementById('workout-charts-section')
    if (chartElement) {
      const offset = isMobile ? 100 : 150
      const elementPosition = chartElement.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }

    // 2. After scroll, open exercise in chart
    setTimeout(() => {
      if (onSelectExercise) {
        onSelectExercise(exerciseName, metric)
      }
    }, 400)
  }

  const analyzeProgress = async () => {
    try {
      setLoading(true)

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const { data: sessions, error: sessionsError } = await db.supabase
        .from('workout_sessions')
        .select('id, completed_at')
        .eq('client_id', clientId)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false })

      if (sessionsError || !sessions || sessions.length === 0) {
        setLoading(false)
        return
      }

      const sessionIds = sessions.map(s => s.id)

      const { data: progressData, error: progressError } = await db.supabase
        .from('workout_progress')
        .select('*')
        .in('session_id', sessionIds)

      if (progressError || !progressData || progressData.length === 0) {
        setLoading(false)
        return
      }

      const exerciseStats = {}
      const exerciseFrequency = {}

      progressData.forEach(record => {
        const exercise = record.exercise_name
        const sessionDate = sessions.find(s => s.id === record.session_id)?.completed_at
        const sets = Array.isArray(record.sets) ? record.sets : []
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0)

        if (!exerciseStats[exercise]) {
          exerciseStats[exercise] = []
          exerciseFrequency[exercise] = 0
        }

        exerciseStats[exercise].push({
          date: sessionDate,
          maxWeight
        })
        exerciseFrequency[exercise]++
      })

      const generatedInsights = []
      let hero = null

      // 1. PR - HERO CARD
      let biggestPR = null
      Object.entries(exerciseStats).forEach(([exercise, records]) => {
        if (records.length < 2) return

        records.sort((a, b) => new Date(a.date) - new Date(b.date))
        const firstWeight = records[0].maxWeight
        const lastWeight = records[records.length - 1].maxWeight
        const increase = lastWeight - firstWeight

        if (increase > 0) {
          if (!biggestPR || increase > biggestPR.increase) {
            biggestPR = { exercise, increase, from: firstWeight, to: lastWeight }
          }
        }
      })

      if (biggestPR && biggestPR.increase >= 2.5) {
        hero = {
          type: 'pr',
          icon: Trophy,
          title: `+${biggestPR.increase}kg Personal Record!`,
          subtitle: `${biggestPR.exercise} - Van ${biggestPR.from}kg naar ${biggestPR.to}kg`,
          message: 'Je wordt elke week sterker! Blijf dit tempo vasthouden en zie wat er gebeurt. 💪',
          exercise: biggestPR.exercise,
          metric: '1rm',
          badge: 'BEAST MODE',
          color: '#10b981',
          image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
        }
      }

      // 2. Consistency Achievement
      if (sessions.length >= 12) {
        generatedInsights.push({
          type: 'consistency',
          icon: Flame,
          title: `${sessions.length} workouts deze maand!`,
          subtitle: 'Consistentie is de sleutel',
          message: 'Dit is hoe je resultaten behaalt. Respect! 🔥',
          color: '#f97316',
          badge: 'ON FIRE'
        })
      }

      // 3. Stagnation - BLUE TIP
      Object.entries(exerciseStats).forEach(([exercise, records]) => {
        if (records.length < 3) return

        const recent = records.slice(-3)
        const weights = recent.map(r => r.maxWeight)
        const allSame = weights.every(w => w === weights[0])

        if (allSame && weights[0] > 0 && generatedInsights.length < 2) {
          generatedInsights.push({
            type: 'tip',
            icon: Target,
            title: `${exercise} progressie tip`,
            subtitle: `Al 3 sessies ${weights[0]}kg`,
            message: 'Tijd voor een nieuwe uitdaging! Probeer +2.5kg of +2 reps.',
            exercise,
            metric: 'maxWeight',
            color: '#3b82f6',
            badge: 'TIP'
          })
        }
      })

      // 4. Volume Achievement
      if (generatedInsights.length < 2) {
        const totalVolume = progressData.reduce((sum, record) => {
          const sets = Array.isArray(record.sets) ? record.sets : []
          const volume = sets.reduce((s, set) => 
            s + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
          )
          return sum + volume
        }, 0)

        if (totalVolume > 10000) {
          const exerciseVolumes = {}
          progressData.forEach(record => {
            const exercise = record.exercise_name
            const sets = Array.isArray(record.sets) ? record.sets : []
            const volume = sets.reduce((s, set) => 
              s + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
            )
            exerciseVolumes[exercise] = (exerciseVolumes[exercise] || 0) + volume
          })

          const topVolumeExercise = Object.entries(exerciseVolumes)
            .sort(([, a], [, b]) => b - a)[0]

          if (topVolumeExercise) {
            generatedInsights.push({
              type: 'volume',
              icon: Zap,
              title: `${Math.round(totalVolume / 1000)}k volume op ${topVolumeExercise[0]}`,
              subtitle: 'Massieve workload',
              message: 'Deze volume maakt je sterker. Keep pushing! ⚡',
              exercise: topVolumeExercise[0],
              metric: 'volume',
              color: '#10b981',
              badge: 'STRONG'
            })
          }
        }
      }

      setHeroInsight(hero)
      setInsights(generatedInsights)

      const sortedExercises = Object.entries(exerciseFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))

      setTopExercises(sortedExercises)

    } catch (error) {
      console.error('Failed to analyze progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(23, 23, 23, 0.6)',
        borderRadius: isMobile ? '14px' : '16px',
        border: '1px solid rgba(249, 115, 22, 0.2)',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        <div style={{
          width: isMobile ? '32px' : '40px',
          height: isMobile ? '32px' : '40px',
          border: '3px solid rgba(249, 115, 22, 0.2)',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  if (!heroInsight && insights.length === 0 && topExercises.length === 0) {
    return null
  }

  return (
    <div style={{
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* HERO CARD */}
      <HeroInsightCard 
        insight={heroInsight}
        onClick={() => handleExerciseClick(heroInsight?.exercise, heroInsight?.metric)}
        isMobile={isMobile}
      />

      {/* REGULAR INSIGHTS */}
      {insights.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : insights.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          {insights.map((insight, idx) => (
            <RegularInsightCard
              key={idx}
              insight={insight}
              onClick={() => {
                if (insight.exercise && insight.metric) {
                  handleExerciseClick(insight.exercise, insight.metric)
                }
              }}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* TOP EXERCISES STRIP */}
      <TopExercisesStrip 
        exercises={topExercises}
        onExerciseClick={handleExerciseClick}
        isMobile={isMobile}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
