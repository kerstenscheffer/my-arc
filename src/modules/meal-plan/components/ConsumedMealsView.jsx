// src/modules/meal-plan/components/ConsumedMealsView.jsx
// 🎯 v5.0 - Calorie ring + macro bars + compact week avg + per-moment meals
import React, { useState, useEffect } from 'react'
import { Clock, Trash2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import FoodLogModal from './food-log/FoodLogModal'

const formatTime = (ts) => {
  if (!ts) return '--:--'
  return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

const formatDateLabel = (date) => {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Vandaag'
  if (d.toDateString() === yesterday.toDateString()) return 'Gisteren'
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

const MOMENT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']
const MOMENT_LABELS = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Tussendoortjes' }

const getMealImage = (meal) => {
  if (meal?.image_url) return meal.image_url
  const fb = {
    breakfast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop&q=80',
    lunch: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop&q=80',
    dinner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop&q=80',
    snack: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=200&h=200&fit=crop&q=80'
  }
  return fb[meal?.meal_type] || fb.snack
}

export default function ConsumedMealsView({ client, db, onMealLogged, targets, onClose }) {
  const isMobile = window.innerWidth <= 768
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [consumedMeals, setConsumedMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [dayTotals, setDayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [showFoodLog, setShowFoodLog] = useState(false)
  const [weekAvg, setWeekAvg] = useState(null)

  useEffect(() => { if (client?.id) loadConsumedMeals() }, [client?.id, selectedDate])
  useEffect(() => { if (client?.id) loadWeekAverages() }, [client?.id])

  const navigateDay = (dir) => {
    const next = new Date(selectedDate)
    next.setDate(selectedDate.getDate() + dir)
    setSelectedDate(next)
  }

  const loadConsumedMeals = async () => {
    setLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data, error } = await db.supabase
        .from('consumed_meals').select('*').eq('client_id', client.id)
        .gte('consumed_at', `${dateStr}T00:00:00`).lt('consumed_at', `${dateStr}T23:59:59`)
        .order('consumed_at', { ascending: true })
      if (error) throw error
      const t = { calories: 0, protein: 0, carbs: 0, fat: 0 }
      data?.forEach(m => { t.calories += m.calories || 0; t.protein += parseFloat(m.protein) || 0; t.carbs += parseFloat(m.carbs) || 0; t.fat += parseFloat(m.fat) || 0 })
      setConsumedMeals(data || [])
      setDayTotals(t)
    } catch { setConsumedMeals([]); setDayTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 }) }
    finally { setLoading(false) }
  }

  const loadWeekAverages = async () => {
    try {
      const today = new Date()
      const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6)
      const { data, error } = await db.supabase
        .from('consumed_meals').select('consumed_at, calories, protein, carbs, fat')
        .eq('client_id', client.id)
        .gte('consumed_at', `${weekAgo.toISOString().split('T')[0]}T00:00:00`)
        .lte('consumed_at', `${today.toISOString().split('T')[0]}T23:59:59`)
      if (error) throw error
      const perDay = {}
      ;(data || []).forEach(m => {
        const day = m.consumed_at.split('T')[0]
        if (!perDay[day]) perDay[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
        perDay[day].calories += m.calories || 0; perDay[day].protein += parseFloat(m.protein) || 0
        perDay[day].carbs += parseFloat(m.carbs) || 0; perDay[day].fat += parseFloat(m.fat) || 0
      })
      const days = Object.keys(perDay).length
      if (days === 0) { setWeekAvg(null); return }
      const tot = Object.values(perDay).reduce((a, d) => ({ calories: a.calories + d.calories, protein: a.protein + d.protein, carbs: a.carbs + d.carbs, fat: a.fat + d.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      setWeekAvg({ days, calories: Math.round(tot.calories / days), protein: Math.round(tot.protein / days), carbs: Math.round(tot.carbs / days), fat: Math.round(tot.fat / days) })
    } catch { setWeekAvg(null) }
  }

  const handleDeleteMeal = async (id) => {
    if (!confirm('Verwijderen?')) return
    try { await db.supabase.from('consumed_meals').delete().eq('id', id); await loadConsumedMeals(); loadWeekAverages() } catch {}
  }

  const handleMealLogged = async () => { await loadConsumedMeals(); loadWeekAverages(); if (onMealLogged) await onMealLogged() }

  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] }
  consumedMeals.forEach(m => { const t = m.meal_type || 'snack'; if (grouped[t]) grouped[t].push(m); else grouped.snack.push(m) })

  const goal = targets || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const calPct = goal.calories > 0 ? Math.min(100, (dayTotals.calories / goal.calories) * 100) : 0
  const calRemaining = Math.max(0, goal.calories - dayTotals.calories)
  const calOver = dayTotals.calories > goal.calories && goal.calories > 0

  // SVG ring calculations
  const ringRadius = 52
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (calPct / 100) * ringCircumference

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>

      {/* ═══ TOP BAR: ← date → X ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button onClick={() => navigateDay(-1)} style={{
          width: '36px', height: '36px', borderRadius: '6px',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0
        }}>
          <ChevronLeft size={16} />
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: '#fff', textTransform: 'capitalize' }}>
            {formatDateLabel(selectedDate)}
          </div>
        </div>

        <button onClick={() => navigateDay(1)} style={{
          width: '36px', height: '36px', borderRadius: '6px',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0, marginRight: '0.375rem'
        }}>
          <ChevronRight size={16} />
        </button>

        {onClose && (
          <button onClick={onClose} style={{
            width: '36px', height: '36px', borderRadius: '6px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ═══ CALORIE RING + MACRO BARS ═══ */}
      <div style={{
        padding: isMobile ? '1.25rem 1rem' : '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: isMobile ? '1.25rem' : '1.5rem'
      }}>
        {/* Big ring */}
        <div style={{ position: 'relative', width: isMobile ? '110px' : '130px', height: isMobile ? '110px' : '130px', flexShrink: 0 }}>
          <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            {/* Progress circle */}
            <circle cx="60" cy="60" r={ringRadius} fill="none"
              stroke={calOver ? '#ef4444' : '#10b981'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '900', color: '#fff', lineHeight: 1, letterSpacing: '-0.03em'
            }}>
              {Math.round(dayTotals.calories)}
            </div>
            <div style={{
              fontSize: '0.45rem', fontWeight: '600',
              color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
              marginTop: '0.1rem'
            }}>
              van {Math.round(goal.calories)} kcal
            </div>
            <div style={{
              fontSize: '0.4rem', fontWeight: '700',
              color: calOver ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.5)',
              marginTop: '0.1rem'
            }}>
              {calOver ? `+${Math.round(dayTotals.calories - goal.calories)} over` : `nog ${Math.round(calRemaining)}`}
            </div>
          </div>
        </div>

        {/* Macro bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            { label: 'Eiwit', value: Math.round(dayTotals.protein), goal: Math.round(goal.protein || 0), color: '#10b981', unit: 'g' },
            { label: 'Koolh', value: Math.round(dayTotals.carbs), goal: Math.round(goal.carbs || 0), color: '#ef4444', unit: 'g' },
            { label: 'Vet', value: Math.round(dayTotals.fat), goal: Math.round(goal.fat || 0), color: '#8b5cf6', unit: 'g' }
          ].map(m => {
            const pct = m.goal > 0 ? Math.min(100, (m.value / m.goal) * 100) : 0
            const over = m.value > m.goal && m.goal > 0
            const diff = Math.abs(m.value - m.goal)
            return (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '800', color: '#fff' }}>{m.value}</span>
                    <span style={{ fontSize: '0.45rem', fontWeight: '600', color: 'rgba(255,255,255,0.2)' }}>/ {m.goal}{m.unit}</span>
                  </div>
                  <span style={{
                    fontSize: '0.4rem', fontWeight: '700',
                    color: over ? 'rgba(239,68,68,0.5)' : `${m.color}80`
                  }}>
                    {over ? `+${Math.round(diff)} over` : `nog ${Math.round(diff)}`}
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: '2px',
                    background: over ? '#ef4444' : m.color,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══ WEEK AVERAGE — compact line ═══ */}
      {weekAvg && (
        <div style={{
          padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.25rem'
        }}>
          <div style={{ fontSize: '0.5rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>
            WEEKGEM. ({weekAvg.days}/7 dagen)
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { l: 'kcal', v: weekAvg.calories, g: Math.round(goal.calories) },
              { l: 'E', v: weekAvg.protein, g: Math.round(goal.protein || 0) },
              { l: 'K', v: weekAvg.carbs, g: Math.round(goal.carbs || 0) },
              { l: 'V', v: weekAvg.fat, g: Math.round(goal.fat || 0) }
            ].map(m => {
              const diff = m.v - m.g
              const over = diff > 0 && m.g > 0
              return (
                <span key={m.l} style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ fontWeight: '800', color: over ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.5)' }}>{m.v}</span>
                  <span style={{ fontSize: '0.4rem', marginLeft: '0.05rem' }}>{m.l}</span>
                  <span style={{ fontSize: '0.35rem', color: over ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)', marginLeft: '0.1rem' }}>
                    {over ? `+${Math.round(diff)}` : `${Math.round(diff)}`}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ ADD BUTTON ═══ */}
      <button onClick={() => setShowFoodLog(true)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.25rem', width: '100%',
        padding: isMobile ? '0.5rem 0' : '0.625rem 0',
        background: 'rgba(16,185,129,0.04)', border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        color: '#10b981', fontSize: isMobile ? '0.65rem' : '0.7rem',
        fontWeight: '700', cursor: 'pointer', minHeight: '36px',
        touchAction: 'manipulation'
      }}>
        <Plus size={13} strokeWidth={2.5} /> Maaltijd loggen
      </button>

      {/* ═══ MEALS PER MOMENT ═══ */}
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Laden...</div>
        ) : consumedMeals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>
            Nog geen maaltijden gelogd
          </div>
        ) : (
          MOMENT_ORDER.map(moment => {
            const meals = grouped[moment]
            if (!meals || meals.length === 0) return null
            const momentCal = meals.reduce((s, m) => s + (m.calories || 0), 0)
            return (
              <div key={moment}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem',
                  background: 'rgba(255,255,255,0.015)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '800', color: '#fff' }}>{MOMENT_LABELS[moment]}</div>
                  <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>{momentCal}</div>
                </div>
                {meals.map(meal => (
                  <div key={meal.id} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ width: isMobile ? '44px' : '50px', height: isMobile ? '44px' : '50px', flexShrink: 0, background: `url(${getMealImage(meal)}) center/cover` }} />
                    <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '0.35rem 0.5rem' : '0.4rem 0.625rem', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.05rem' }}>
                        <span style={{ fontSize: '0.4rem', fontWeight: '600', color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                          <Clock size={7} /> {formatTime(meal.consumed_at)}
                        </span>
                        {meal.source === 'plan_check' && <span style={{ fontSize: '0.35rem', fontWeight: '700', color: 'rgba(16,185,129,0.4)', textTransform: 'uppercase' }}>PLAN</span>}
                      </div>
                      <div style={{ fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.1rem' }}>
                        {meal.meal_name || 'Maaltijd'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[{ val: meal.calories, l: 'kcal' }, { val: meal.protein, l: 'E' }, { val: meal.carbs, l: 'K' }, { val: meal.fat, l: 'V' }]
                          .filter(m => m.val > 0).map(m => (
                          <span key={m.l} style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                            <span style={{ fontWeight: '800', color: 'rgba(255,255,255,0.45)' }}>{Math.round(parseFloat(m.val))}</span>
                            <span style={{ fontSize: '0.35rem', marginLeft: '0.05rem' }}>{m.l}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteMeal(meal.id)} style={{
                      width: '36px', flexShrink: 0, background: 'transparent', border: 'none',
                      borderLeft: '1px solid rgba(255,255,255,0.03)', color: 'rgba(239,68,68,0.25)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation'
                    }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {showFoodLog && (
        <FoodLogModal isOpen={showFoodLog} onClose={() => setShowFoodLog(false)}
          client={client} db={db} targets={targets} consumedToday={dayTotals} onMealLogged={handleMealLogged} />
      )}
    </div>
  )
}
