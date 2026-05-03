// src/modules/ai-meal-generator/tabs/plan-analyzer/DayNavigator.jsx
// Compact day selector with training/rest indicators and per-day macro health
// v1.1 — fix: trainingDays uit intake heeft prioriteit boven weekData.is_training_day

import React from 'react'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'

const DAYS = [
  { id: 'monday',    label: 'Ma', full: 'Maandag'   },
  { id: 'tuesday',   label: 'Di', full: 'Dinsdag'   },
  { id: 'wednesday', label: 'Wo', full: 'Woensdag'  },
  { id: 'thursday',  label: 'Do', full: 'Donderdag' },
  { id: 'friday',    label: 'Vr', full: 'Vrijdag'   },
  { id: 'saturday',  label: 'Za', full: 'Zaterdag'  },
  { id: 'sunday',    label: 'Zo', full: 'Zondag'    }
]

const DAY_CODE_MAP = { 0: 'ma', 1: 'di', 2: 'wo', 3: 'do', 4: 'vr', 5: 'za', 6: 'zo' }

export default function DayNavigator({
  activeDay,
  setActiveDay,
  weekData,
  targets,
  trainingDays,
  isMobile
}) {
  const m = isMobile

  const isTrainingDay = (dayIndex) => {
    // PRIORITEIT 1: trainingDays uit nutrition_preferences intake (meest accuraat)
    // Dit zijn dag-codes zoals ['ma','di','wo','do','vr']
    if (trainingDays?.length > 0) {
      return trainingDays.includes(DAY_CODE_MAP[dayIndex])
    }
    // PRIORITEIT 2: is_training_day vlag in weekData (fallback voor old-style plans)
    if (weekData?.[dayIndex]?.is_training_day !== undefined) {
      return !!weekData[dayIndex].is_training_day
    }
    return false
  }

  const getDayHealth = (dayIndex) => {
    if (!weekData?.[dayIndex] || !targets?.calories) return 'neutral'
    const t = weekData[dayIndex].totals
    const cal = t?.kcal || t?.calories || 0
    if (cal === 0) return 'empty'
    const pct = cal / targets.calories
    if (pct >= 0.85 && pct <= 1.15) return 'good'
    if (pct >= 0.70 && pct <= 1.30) return 'warn'
    return 'bad'
  }

  const healthColors = {
    good:    '#10b981',
    warn:    '#f59e0b',
    bad:     '#ef4444',
    empty:   'rgba(255,255,255,0.1)',
    neutral: 'rgba(255,255,255,0.25)'
  }

  return (
    <div>
      {/* Day buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        padding: m ? '0.4rem 0' : '0.5rem 0'
      }}>
        <button
          onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
          disabled={activeDay === 0}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: activeDay === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            cursor: activeDay === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0
          }}
        >
          <ChevronLeft size={14} />
        </button>

        <div style={{ flex: 1, display: 'flex', gap: '0.2rem' }}>
          {DAYS.map((day, i) => {
            const isActive  = i === activeDay
            const isTraining = isTrainingDay(i)
            const health     = getDayHealth(i)
            const healthColor = healthColors[health]

            return (
              <button
                key={day.id}
                onClick={() => setActiveDay(i)}
                style={{
                  flex: 1,
                  padding: m ? '0.3rem 0' : '0.35rem 0',
                  background: isActive ? 'rgba(255,215,0,0.06)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(255,215,0,0.3)'
                    : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '0.1rem', position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  fontSize: m ? '0.55rem' : '0.6rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#FFD700' : 'rgba(255,255,255,0.35)'
                }}>
                  {day.label}
                </span>

                {/* Health dot */}
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: healthColor }} />

                {/* Training indicator — alleen als het écht een trainingsdag is */}
                {isTraining && (
                  <div style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#f97316',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Dumbbell size={5} color="#fff" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setActiveDay(Math.min(6, activeDay + 1))}
          disabled={activeDay === 6}
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: activeDay === 6 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            cursor: activeDay === 6 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: m ? '0.3rem 0' : '0.4rem 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            fontSize: m ? '1rem' : '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em'
          }}>
            {DAYS[activeDay].full}
          </span>
          {isTrainingDay(activeDay) ? (
            <span style={{
              fontSize: '0.4rem', fontWeight: 800, color: '#f97316',
              background: 'rgba(249,115,22,0.08)',
              padding: '0.08rem 0.3rem', borderRadius: '3px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid rgba(249,115,22,0.15)'
            }}>
              TRAININGSDAG
            </span>
          ) : (
            <span style={{
              fontSize: '0.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.15)',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              RUSTDAG
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export { DAYS }
