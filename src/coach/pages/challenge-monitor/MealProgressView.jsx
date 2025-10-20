// src/coach/pages/challenge-monitor/MealProgressView.jsx
import { useState, useEffect } from 'react'
import { Utensils, CheckCircle, XCircle, Calendar, TrendingUp, Zap, AlertCircle } from 'lucide-react'

export default function MealProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [mealData, setMealData] = useState({
    total: 0,
    totalTracked: 0,
    byWeek: {},
    streak: 0,
    compliance: 0,
    todayComplete: false,
    todayPercentage: 0,
    averageCompletion: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMealData()
  }, [client?.id, challengeData])

  async function loadMealData() {
    if (!client?.id || !challengeData) return

    try {
      const startDate = new Date(challengeData.start_date)
      const endDate = new Date(challengeData.end_date)
      
      // Load all meal progress
      const { data: mealDays } = await db.supabase
        .from('ai_meal_progress')
        .select('date, meals_consumed, manual_intake, completion_percentage')
        .eq('client_id', client.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      // Process by week with detailed tracking
      const byWeek = {}
      for (let week = 1; week <= 8; week++) {
        byWeek[week] = {
          complete: [],  // Days with ≥50% completion
          partial: [],   // Days with <50% but >0% completion
          total: 0
        }
      }

      let totalCompletionPercentage = 0
      let daysWithData = 0
      let trackedDaysCount = 0

      mealDays?.forEach(day => {
        const mealDate = new Date(day.date)
        const daysSinceStart = Math.floor((mealDate - startDate) / (1000 * 60 * 60 * 24))
        const weekNum = Math.min(8, Math.floor(daysSinceStart / 7) + 1)
        
        // Check if day has ANY tracking
        const hasTracking = day.meals_consumed > 0 || 
                          day.manual_intake !== null || 
                          day.completion_percentage > 0
        
        if (hasTracking) {
          trackedDaysCount++
          
          // Determine completion level
          const percentage = day.completion_percentage || 0
          
          if (percentage >= 50) {
            // Complete day (counts for challenge)
            byWeek[weekNum].complete.push({
              date: day.date,
              percentage: percentage,
              dayOfWeek: mealDate.toLocaleDateString('nl-NL', { weekday: 'short' })
            })
            byWeek[weekNum].total++
          } else if (percentage > 0) {
            // Partial day (tracked but not complete)
            byWeek[weekNum].partial.push({
              date: day.date,
              percentage: percentage,
              dayOfWeek: mealDate.toLocaleDateString('nl-NL', { weekday: 'short' })
            })
          }
          
          if (percentage > 0) {
            totalCompletionPercentage += percentage
            daysWithData++
          }
        }
      })

      // Calculate streak (only for ≥50% days)
      let streak = 0
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const todayMeal = mealDays?.find(m => m.date === todayStr)
      const todayComplete = todayMeal?.completion_percentage >= 50
      const todayPercentage = todayMeal?.completion_percentage || 0

      // Calculate streak from today or yesterday
      let checkDate = todayComplete ? new Date(today) : new Date(today.setDate(today.getDate() - 1))
      
      for (let i = 0; i < 56; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        const dayMeal = mealDays?.find(m => m.date === dateStr)
        
        if (dayMeal?.completion_percentage >= 50) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      // Count total complete days (≥50%)
      const totalCompleteDays = Object.values(byWeek).reduce(
        (sum, week) => sum + week.complete.length, 0
      )

      const compliance = Math.round((totalCompleteDays / 45) * 100)
      const averageCompletion = daysWithData > 0 
        ? Math.round(totalCompletionPercentage / daysWithData)
        : 0

      setMealData({
        total: totalCompleteDays,
        totalTracked: trackedDaysCount,
        byWeek,
        streak,
        compliance,
        todayComplete,
        todayPercentage,
        averageCompletion
      })
    } catch (error) {
      console.error('Error loading meal data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading meal data...
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(16, 185, 129, 0.2)'
    }}>
      {/* Header Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Utensils size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {mealData.total}/45
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Complete Days
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <CheckCircle size={20} color="#fbbf24" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {mealData.compliance}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Compliance
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <Zap size={20} color="#f97316" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {mealData.streak}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Streak
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '0.875rem' : '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <TrendingUp size={20} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {mealData.averageCompletion}%
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Avg Daily
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div style={{
        background: mealData.todayPercentage >= 50 
          ? 'rgba(16, 185, 129, 0.1)' 
          : mealData.todayPercentage > 0
            ? 'rgba(251, 191, 36, 0.1)'
            : 'rgba(220, 38, 38, 0.1)',
        borderRadius: '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        border: `1px solid ${
          mealData.todayPercentage >= 50 
            ? 'rgba(16, 185, 129, 0.3)'
            : mealData.todayPercentage > 0
              ? 'rgba(251, 191, 36, 0.3)'
              : 'rgba(220, 38, 38, 0.3)'
        }`,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {mealData.todayPercentage >= 50 ? (
            <CheckCircle size={20} color="#10b981" />
          ) : mealData.todayPercentage > 0 ? (
            <AlertCircle size={20} color="#fbbf24" />
          ) : (
            <XCircle size={20} color="#dc2626" />
          )}
          <div>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              Vandaag: {mealData.todayPercentage}% compleet
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '0.1rem'
            }}>
              {mealData.todayPercentage >= 50 
                ? 'Telt mee voor challenge ✓'
                : mealData.todayPercentage > 0
                  ? 'Nog niet compleet (min. 50% nodig)'
                  : 'Log je maaltijden voor vandaag'}
            </div>
          </div>
        </div>
        {mealData.todayPercentage < 100 && (
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {100 - mealData.todayPercentage}% te gaan
          </div>
        )}
      </div>

      {/* Challenge Info Box */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: isMobile ? '0.875rem' : '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: 1.5
        }}>
          <strong style={{ color: '#fff' }}>Challenge Requirement:</strong> 45 dagen met minimaal 50% completion.
          <br />
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Tracked: {mealData.totalTracked} dagen • Complete: {mealData.total} dagen • 
            Nog nodig: {Math.max(0, 45 - mealData.total)} dagen
          </span>
        </div>
      </div>

      {/* Week by Week Breakdown */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={18} />
          Week by Week Progress
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(week => {
            const weekData = mealData.byWeek[week] || { complete: [], partial: [], total: 0 }
            const isCurrentWeek = week === challengeData.currentWeek
            const isPastWeek = week < challengeData.currentWeek
            const weekCompliance = Math.round((weekData.complete.length / 7) * 100)
            const isCompliant = weekCompliance >= 80 // 6/7 days

            return (
              <div
                key={week}
                style={{
                  background: isCurrentWeek 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: isMobile ? '0.875rem' : '1rem',
                  border: `1px solid ${isCurrentWeek 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: (weekData.complete.length > 0 || weekData.partial.length > 0) ? '0.75rem' : 0
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      color: isCurrentWeek ? '#10b981' : '#fff'
                    }}>
                      Week {week}
                    </span>
                    {isCurrentWeek && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        borderRadius: '4px',
                        color: '#34d399',
                        fontWeight: '600'
                      }}>
                        CURRENT
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      color: isCompliant ? '#10b981' : '#fff'
                    }}>
                      {weekData.complete.length}/7 ({weekCompliance}%)
                    </span>
                    {isPastWeek && (
                      isCompliant ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <XCircle size={16} color="#ef4444" />
                      )
                    )}
                  </div>
                </div>

                {/* Day badges */}
                {(weekData.complete.length > 0 || weekData.partial.length > 0) && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Complete days (≥50%) */}
                    {weekData.complete.map((day, idx) => (
                      <div
                        key={`complete-${idx}`}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: '0.75rem',
                          color: '#34d399',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {day.dayOfWeek}
                        <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                          {day.percentage}%
                        </span>
                      </div>
                    ))}
                    
                    {/* Partial days (<50%) */}
                    {weekData.partial.map((day, idx) => (
                      <div
                        key={`partial-${idx}`}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(251, 191, 36, 0.15)',
                          borderRadius: '6px',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                          fontSize: '0.75rem',
                          color: '#fde047',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {day.dayOfWeek}
                        <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                          {day.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
