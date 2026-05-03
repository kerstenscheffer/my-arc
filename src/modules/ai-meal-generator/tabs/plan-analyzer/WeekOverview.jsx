// src/modules/ai-meal-generator/tabs/plan-analyzer/WeekOverview.jsx
// v2.0 — timing zichtbaar, slot kleuren, betere meal cards, drag & drop

import React, { useState, useRef } from 'react'
import { Dumbbell, Plus } from 'lucide-react'

const DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3']

const SLOT_CONFIG = {
  breakfast: { label: 'Ontbijt',    short: 'OB', color: '#f59e0b', icon: '🌅' },
  snack1:    { label: 'Snack 1',    short: 'S1', color: '#6b7280', icon: '🥤' },
  lunch:     { label: 'Lunch',      short: 'LU', color: '#10b981', icon: '🍱' },
  snack2:    { label: 'Snack 2',    short: 'S2', color: '#f97316', icon: '⚡' },
  dinner:    { label: 'Diner',      short: 'DI', color: '#3b82f6', icon: '🍽️' },
  snack3:    { label: 'Voor bed',   short: 'S3', color: '#a855f7', icon: '🌙' },
}

export default function WeekOverview({
  weekData, targets, trainingDays, activeDay,
  onSelectDay, onMoveMeal, onAddMeal, isMobile
}) {
  const [dragSource, setDragSource] = useState(null)
  const [dragOver, setDragOver]     = useState(null)
  const [touchDrag, setTouchDrag]   = useState(null)
  const containerRef = useRef(null)
  const m = isMobile

  if (!weekData) return null

  const usedSlots = SLOTS.filter(slot => weekData.some(day => day.meals[slot]))
  if (usedSlots.length === 0) return null

  const isTraining = (dayIndex) => {
    if (weekData[dayIndex]?.is_training_day) return true
    if (trainingDays?.length > 0) {
      const dayMap = { 0: 'ma', 1: 'di', 2: 'wo', 3: 'do', 4: 'vr', 5: 'za', 6: 'zo' }
      return trainingDays.includes(dayMap[dayIndex])
    }
    return false
  }

  const getDayTotals = (dayIndex) => {
    const t = weekData[dayIndex]?.totals
    return { cal: t?.kcal || t?.calories || 0, prot: t?.protein || 0 }
  }

  const getDayPct = (dayIndex) => {
    if (!targets?.calories) return 100
    const { cal } = getDayTotals(dayIndex)
    return Math.round((cal / targets.calories) * 100)
  }

  const pctColor = (pct) => {
    if (pct < 85) return '#ef4444'
    if (pct > 115) return '#f59e0b'
    return '#10b981'
  }

  // ── Drag & drop ──
  const handleDragStart = (dayIndex, slot, e) => {
    setDragSource({ dayIndex, slot })
    if (e?.dataTransfer) { e.dataTransfer.effectAllowed = 'move' }
  }
  const handleDragOver = (dayIndex, slot, e) => {
    e?.preventDefault?.()
    if (dragSource && (dragSource.dayIndex !== dayIndex || dragSource.slot !== slot)) {
      setDragOver({ dayIndex, slot })
    }
  }
  const handleDrop = (dayIndex, slot) => {
    if (dragSource && onMoveMeal) onMoveMeal(dragSource.dayIndex, dragSource.slot, dayIndex, slot)
    setDragSource(null); setDragOver(null)
  }
  const handleDragEnd = () => { setDragSource(null); setDragOver(null) }

  // ── Touch drag ──
  const handleTouchStart = (dayIndex, slot, e) => {
    const touch = e.touches[0]
    setTouchDrag({ dayIndex, slot, startX: touch.clientX, startY: touch.clientY, active: false })
  }
  const handleTouchMove = (e) => {
    if (!touchDrag) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchDrag.startX)
    const dy = Math.abs(touch.clientY - touchDrag.startY)
    if (dx > 10 || dy > 10) {
      setTouchDrag(prev => ({ ...prev, active: true }))
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      if (el?.dataset?.dayindex !== undefined && el?.dataset?.slot) {
        setDragOver({ dayIndex: parseInt(el.dataset.dayindex), slot: el.dataset.slot })
      }
    }
  }
  const handleTouchEnd = () => {
    if (touchDrag?.active && dragOver && onMoveMeal) {
      onMoveMeal(touchDrag.dayIndex, touchDrag.slot, dragOver.dayIndex, dragOver.slot)
    }
    setTouchDrag(null); setDragOver(null)
  }

  return (
    <div
      ref={containerRef}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: m ? '0.25rem' : '0.5rem 0.5rem 0.75rem' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: `52px repeat(7, 1fr)`,
        gap: '3px',
        minWidth: m ? '680px' : 'auto'
      }}>

        {/* ── HEADER ROW ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.35rem', fontWeight: 700, color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>SLOT</span>
        </div>

        {DAYS_SHORT.map((day, i) => {
          const pct      = getDayPct(i)
          const training = isTraining(i)
          const isActive = i === activeDay
          const { cal, prot } = getDayTotals(i)
          const color    = pctColor(pct)

          return (
            <button key={i} onClick={() => onSelectDay(i)} style={{
              padding: '0.35rem 0.25rem 0.3rem',
              background: isActive ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: '5px', cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              textAlign: 'center', position: 'relative'
            }}>
              {/* Dag naam */}
              <div style={{ fontSize: '0.5rem', fontWeight: 800, color: isActive ? '#FFD700' : 'rgba(255,255,255,0.4)', marginBottom: '0.15rem' }}>
                {day}
              </div>
              {/* Kcal groot */}
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color, lineHeight: 1 }}>
                {Math.round(cal)}
              </div>
              {/* Eiwit klein */}
              <div style={{ fontSize: '0.38rem', fontWeight: 700, color: '#10b981', marginTop: '0.05rem' }}>
                {Math.round(prot)}E
              </div>
              {/* Pct bar */}
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', margin: '0.2rem 0 0.1rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '1px', transition: 'width 0.3s ease' }} />
              </div>
              {/* Training badge */}
              {training && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.1rem' }}>
                  <Dumbbell size={7} color="#f97316" />
                  <span style={{ fontSize: '0.32rem', color: '#f97316', fontWeight: 700 }}>training</span>
                </div>
              )}
            </button>
          )
        })}

        {/* ── MEAL ROWS ── */}
        {usedSlots.map(slot => {
          const cfg = SLOT_CONFIG[slot]
          return (
            <React.Fragment key={slot}>
              {/* Slot label kolom */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.1rem', padding: '0.2rem 0',
              }}>
                <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{cfg.icon}</span>
                <span style={{ fontSize: '0.35rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.8 }}>
                  {cfg.short}
                </span>
              </div>

              {/* Meal cards per dag */}
              {weekData.map((day, dayIndex) => {
                const meal        = day.meals[slot]
                const isDragSrc   = dragSource?.dayIndex === dayIndex && dragSource?.slot === slot
                const isDragTgt   = dragOver?.dayIndex === dayIndex && dragOver?.slot === slot
                const timing      = meal?.timing && typeof meal.timing === 'string' ? meal.timing : null

                return (
                  <div
                    key={`${dayIndex}-${slot}`}
                    data-dayindex={dayIndex}
                    data-slot={slot}
                    draggable={!!meal}
                    onDragStart={e => meal && handleDragStart(dayIndex, slot, e)}
                    onDragOver={e => handleDragOver(dayIndex, slot, e)}
                    onDrop={() => handleDrop(dayIndex, slot)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={e => meal && handleTouchStart(dayIndex, slot, e)}
                    onClick={() => { if (!meal && onAddMeal) onAddMeal(dayIndex, slot) }}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      background: isDragTgt
                        ? `${cfg.color}15`
                        : meal
                          ? 'rgba(255,255,255,0.03)'
                          : 'transparent',
                      border: `1px solid ${
                        isDragTgt ? cfg.color + '40'
                        : meal ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.02)'}`,
                      borderLeft: meal ? `2px solid ${cfg.color}60` : '2px solid transparent',
                      borderRadius: '4px',
                      opacity: isDragSrc ? 0.35 : 1,
                      cursor: meal ? 'grab' : 'pointer',
                      minHeight: '52px',
                      transition: 'all 0.1s ease',
                      padding: meal ? '0.25rem 0.3rem' : '0',
                    }}
                  >
                    {meal ? (
                      <>
                        {/* Timing badge */}
                        {timing && (
                          <div style={{
                            fontSize: '0.32rem', fontWeight: 800,
                            color: cfg.color, marginBottom: '0.15rem',
                            letterSpacing: '0.02em', opacity: 0.9
                          }}>
                            {timing}
                          </div>
                        )}

                        {/* Meal naam */}
                        <div style={{
                          fontSize: '0.48rem', fontWeight: 700, color: '#fff',
                          lineHeight: 1.25, marginBottom: '0.15rem',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {meal.name || meal.meal_name || '—'}
                        </div>

                        {/* Macros */}
                        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.42rem', fontWeight: 800, color: '#FFD700' }}>
                            {Math.round(meal.calories || 0)}
                          </span>
                          <span style={{ fontSize: '0.38rem', fontWeight: 700, color: '#10b981' }}>
                            {Math.round(meal.protein || 0)}E
                          </span>
                          {meal.carbs > 0 && (
                            <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.2)' }}>
                              {Math.round(meal.carbs)}K
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '52px', color: 'rgba(255,255,255,0.06)'
                      }}>
                        <Plus size={10} />
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}

        {/* ── TOTALS ROW ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.35rem', fontWeight: 700, color: 'rgba(255,255,255,0.1)',
          textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>TOT</div>

        {weekData.map((day, i) => {
          const { cal, prot } = getDayTotals(i)
          const pct = getDayPct(i)
          return (
            <div key={`total-${i}`} style={{
              padding: '0.25rem 0.2rem',
              background: 'rgba(255,215,0,0.02)',
              border: '1px solid rgba(255,215,0,0.06)',
              borderRadius: '4px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: pctColor(pct) }}>{Math.round(cal)}</div>
              <div style={{ fontSize: '0.38rem', fontWeight: 700, color: '#10b981' }}>{Math.round(prot)}E</div>
              <div style={{ fontSize: '0.32rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.05rem' }}>{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
