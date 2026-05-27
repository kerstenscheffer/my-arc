// src/modules/meal-plan/components/food-log/WeeklyNutritionOverview.jsx
// 🎯 Weekoverzicht voeding — fullscreen modal
// 7 dagen, per dag: totalen vs doel + gelogde meals per moment
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

const DAYS_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const DAYS_SHORT = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA']
const MOMENT_LABELS = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack' }

export default function WeeklyNutritionOverview({ isOpen, onClose, client, db, targets, isMobile: propMobile }) {
  const isMobile = propMobile ?? window.innerWidth <= 768
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)

  useEffect(() => {
    if (isOpen && client?.id) loadWeekData()
  }, [isOpen, client?.id])

  const loadWeekData = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const days = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const { data, error } = await db.supabase
          .from('consumed_meals')
          .select('meal_name, meal_type, calories, protein, carbs, fat, consumed_at, source')
          .eq('client_id', client.id)
          .gte('consumed_at', `${dateStr}T00:00:00`)
          .lt('consumed_at', `${dateStr}T23:59:59`)
          .order('consumed_at', { ascending: true })

        if (error) throw error

        const meals = data || []
        const totals = meals.reduce((t, m) => ({
          calories: t.calories + (m.calories || 0),
          protein: t.protein + (parseFloat(m.protein) || 0),
          carbs: t.carbs + (parseFloat(m.carbs) || 0),
          fat: t.fat + (parseFloat(m.fat) || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

        // Group by moment
        const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] }
        meals.forEach(m => {
          const type = m.meal_type || 'snack'
          if (grouped[type]) grouped[type].push(m)
          else grouped.snack.push(m)
        })

        days.push({
          date,
          dateStr,
          dayName: DAYS_NL[date.getDay()],
          dayShort: DAYS_SHORT[date.getDay()],
          dayNum: date.getDate(),
          isToday: i === 0,
          meals,
          grouped,
          totals,
          mealCount: meals.length
        })
      }

      setWeekData(days)
      // Auto-expand today
      setExpandedDay(days.length - 1)
    } catch (err) {
      console.error('Failed to load week data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const goal = targets || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // Week averages
  const daysWithData = weekData.filter(d => d.mealCount > 0)
  const weekAvg = daysWithData.length > 0 ? {
    calories: Math.round(daysWithData.reduce((s, d) => s + d.totals.calories, 0) / daysWithData.length),
    protein: Math.round(daysWithData.reduce((s, d) => s + d.totals.protein, 0) / daysWithData.length),
    carbs: Math.round(daysWithData.reduce((s, d) => s + d.totals.carbs, 0) / daysWithData.length),
    fat: Math.round(daysWithData.reduce((s, d) => s + d.totals.fat, 0) / daysWithData.length)
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const modal = (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0a',
      zIndex: 10000,
      display: 'flex', flexDirection: 'column',
      animation: 'wnoFadeIn 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        flexShrink: 0
      }}>
        <div>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: '800', color: '#fff', letterSpacing: '-0.02em'
          }}>
            Weekoverzicht
          </div>
          <div style={{
            fontSize: '0.55rem', fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.25)', marginTop: '0.1rem'
          }}>
            Afgelopen 7 dagen
          </div>
        </div>
        <button onClick={onClose} style={{
          width: '36px', height: '36px', borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          color: 'rgba(255, 255, 255, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation'
        }}>
          <X size={16} />
        </button>
      </div>

      {/* Week average bar */}
      {daysWithData.length > 0 && (
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {[
            { label: 'GEM KCAL', value: weekAvg.calories, goal: goal.calories },
            { label: 'GEM EIWIT', value: weekAvg.protein, goal: Math.round(goal.protein || 0), unit: 'g' },
            { label: 'GEM KOOLH', value: weekAvg.carbs, goal: Math.round(goal.carbs || 0), unit: 'g' },
            { label: 'GEM VET', value: weekAvg.fat, goal: Math.round(goal.fat || 0), unit: 'g' }
          ].map((m, i) => {
            const pct = m.goal > 0 ? Math.round((m.value / m.goal) * 100) : 0
            const isOver = m.value > m.goal && m.goal > 0
            return (
              <div key={m.label} style={{
                flex: 1, textAlign: 'center',
                padding: isMobile ? '0.5rem 0' : '0.625rem 0',
                borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
              }}>
                <div style={{ fontSize: '0.35rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: '800', color: isOver ? '#f59e0b' : '#FFD700' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '0.4rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.15)' }}>
                  van {m.goal}{m.unit || ''}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.8rem' }}>Laden...</div>
        ) : (
          weekData.map((day, dayIdx) => {
            const isExpanded = expandedDay === dayIdx
            const calPct = goal.calories > 0 ? Math.min(100, (day.totals.calories / goal.calories) * 100) : 0
            const isOver = day.totals.calories > goal.calories && goal.calories > 0
            const isClose = calPct >= 80 && calPct <= 110
            const isEmpty = day.mealCount === 0

            return (
              <div key={day.dateStr}>
                {/* Day row — tap to expand */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%',
                    padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
                    background: day.isToday ? 'rgba(255, 215, 0, 0.03)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer', textAlign: 'left',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '52px', gap: '0.625rem'
                  }}
                >
                  {/* Day badge */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '6px',
                    background: day.isToday ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: day.isToday ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{ fontSize: '0.4rem', fontWeight: '700', color: day.isToday ? '#FFD700' : 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase' }}>
                      {day.dayShort}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: '800', color: day.isToday ? '#FFD700' : 'rgba(255, 255, 255, 0.5)', lineHeight: 1 }}>
                      {day.dayNum}
                    </div>
                  </div>

                  {/* Day info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', color: '#fff' }}>
                        {day.dayName}
                      </div>
                      {day.isToday && (
                        <div style={{ fontSize: '0.4rem', fontWeight: '700', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>VANDAAG</div>
                      )}
                    </div>
                    {isEmpty ? (
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.15)', marginTop: '0.1rem' }}>
                        Niet gelogd
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.6rem', color: isOver ? 'rgba(245, 158, 11, 0.6)' : isClose ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.3)' }}>
                          <span style={{ fontWeight: '800' }}>{Math.round(day.totals.calories)}</span> kcal
                        </span>
                        <span style={{ fontSize: '0.55rem', color: 'rgba(255, 255, 255, 0.2)' }}>
                          {Math.round(day.totals.protein)}E · {Math.round(day.totals.carbs)}K · {Math.round(day.totals.fat)}V
                        </span>
                      </div>
                    )}

                    {/* Mini progress bar */}
                    {!isEmpty && (
                      <div style={{
                        height: '2px', marginTop: '0.3rem',
                        background: 'rgba(255, 255, 255, 0.04)', borderRadius: '1px',
                        maxWidth: '120px'
                      }}>
                        <div style={{
                          height: '100%', width: `${calPct}%`,
                          background: isOver ? '#f59e0b' : isClose ? '#FFD700' : 'rgba(255, 215, 0, 0.4)',
                          borderRadius: '1px'
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Meal count */}
                  <div style={{ fontSize: '0.55rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }}>
                    {day.mealCount > 0 ? `${day.mealCount} items` : ''}
                  </div>

                  {/* Expand arrow */}
                  {day.mealCount > 0 && (
                    isExpanded ? <ChevronUp size={14} color="rgba(255, 255, 255, 0.2)" /> : <ChevronDown size={14} color="rgba(255, 255, 255, 0.2)" />
                  )}
                </button>

                {/* Expanded day detail */}
                {isExpanded && day.mealCount > 0 && (
                  <div style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    {/* Macro totals bar */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {[
                        { label: 'KCAL', value: Math.round(day.totals.calories), goal: goal.calories },
                        { label: 'EIWIT', value: Math.round(day.totals.protein), goal: Math.round(goal.protein || 0), unit: 'g' },
                        { label: 'KOOLH', value: Math.round(day.totals.carbs), goal: Math.round(goal.carbs || 0), unit: 'g' },
                        { label: 'VET', value: Math.round(day.totals.fat), goal: Math.round(goal.fat || 0), unit: 'g' }
                      ].map((m, i) => {
                        const over = m.value > m.goal && m.goal > 0
                        return (
                          <div key={m.label} style={{
                            flex: 1, textAlign: 'center',
                            padding: '0.4rem 0',
                            borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
                          }}>
                            <div style={{ fontSize: '0.35rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.15)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: over ? '#f59e0b' : '#FFD700' }}>{m.value}</div>
                            <div style={{ fontSize: '0.35rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.12)' }}>van {m.goal}{m.unit || ''}</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Meals per moment */}
                    {Object.entries(day.grouped).map(([moment, meals]) => {
                      if (meals.length === 0) return null
                      return (
                        <div key={moment}>
                          <div style={{
                            padding: isMobile ? '0.3rem 1rem' : '0.375rem 1.25rem',
                            fontSize: '0.45rem', fontWeight: '700',
                            color: 'rgba(255, 255, 255, 0.2)',
                            textTransform: 'uppercase', letterSpacing: '0.06em'
                          }}>
                            {MOMENT_LABELS[moment] || moment}
                          </div>
                          {meals.map((meal, mIdx) => (
                            <div key={mIdx} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: isMobile ? '0.35rem 1rem 0.35rem 1.75rem' : '0.4rem 1.25rem 0.4rem 2rem',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.02)'
                            }}>
                              <div style={{
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)',
                                flex: 1, minWidth: 0,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {meal.meal_name}
                              </div>
                              <div style={{
                                fontSize: isMobile ? '0.65rem' : '0.7rem',
                                fontWeight: '800', color: 'rgba(255, 255, 255, 0.35)',
                                flexShrink: 0, marginLeft: '0.5rem'
                              }}>
                                {Math.round(meal.calories || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Logging streak / stats */}
        {!loading && (
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <div style={{ fontSize: '0.55rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.15)' }}>
              {daysWithData.length} van 7 dagen gelogd
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes wnoFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
