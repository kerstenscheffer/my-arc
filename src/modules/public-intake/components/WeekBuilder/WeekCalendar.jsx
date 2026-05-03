// src/modules/public-intake/components/WeekBuilder/WeekCalendar.jsx
// Pure kalender display — ontvangt week_schedule als prop, geen eigen state
// Toont 7 dagen als kolommen met tijdsbalkjes op een 06:00–24:00 as

import React from 'react'
import { DAYS, DAY_LABELS, BLOCK_TYPES } from './useWeekBuilder'

const MIN_H = 6   // 06:00
const MAX_H = 24  // 24:00
const RANGE = MAX_H - MIN_H

function timeToY(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  // Over-middernacht (bijv. slaap eindigt om 07:00 na 23:00)
  let hours = h + m / 60
  if (hours < MIN_H) hours += 24
  return Math.max(0, Math.min(100, ((hours - MIN_H) / RANGE) * 100))
}

function blockHeight(start, end) {
  const sy = timeToY(start)
  const ey = timeToY(end)
  return Math.max(4, ey - sy)
}

const HOUR_LINES = [6, 9, 12, 15, 18, 21, 24]

export default function WeekCalendar({ schedule, isMobile, highlightDays = [] }) {
  const gridH = isMobile ? 160 : 200

  return (
    <div style={{ width: '100%' }}>
      {/* Dag headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
        <div />
        {DAYS.map(day => (
          <div key={day} style={{
            textAlign: 'center',
            fontSize: isMobile ? '0.48rem' : '0.5rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: highlightDays.includes(day) ? '#FFD700' : 'rgba(255,255,255,0.3)',
            paddingBottom: '2px',
            borderBottom: highlightDays.includes(day)
              ? '1.5px solid rgba(255,215,0,0.4)'
              : '1px solid rgba(255,255,255,0.04)'
          }}>
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(7, 1fr)', gap: '3px' }}>
        {/* Uur labels */}
        <div style={{ position: 'relative', height: gridH }}>
          {HOUR_LINES.map(h => {
            const pct = ((h - MIN_H) / RANGE) * 100
            return (
              <div key={h} style={{
                position: 'absolute',
                top: `${pct}%`,
                right: 0,
                fontSize: '0.38rem',
                color: 'rgba(255,255,255,0.15)',
                fontWeight: 600,
                transform: 'translateY(-50%)',
                lineHeight: 1
              }}>
                {h === 24 ? '0' : h}
              </div>
            )
          })}
        </div>

        {/* Dag kolommen */}
        {DAYS.map(day => {
          const blocks = schedule?.[day] || []
          const isEmpty = blocks.length === 0

          return (
            <div key={day} style={{
              position: 'relative',
              height: gridH,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              {/* Uur lijnen */}
              {HOUR_LINES.map(h => {
                const pct = ((h - MIN_H) / RANGE) * 100
                return (
                  <div key={h} style={{
                    position: 'absolute',
                    left: 0, right: 0,
                    top: `${pct}%`,
                    borderTop: h === 12
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(255,255,255,0.03)'
                  }} />
                )
              })}

              {/* Leeg = vrij label */}
              {isEmpty && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '0.38rem',
                    color: 'rgba(255,255,255,0.12)',
                    fontWeight: 600
                  }}>vrij</span>
                </div>
              )}

              {/* Blokken */}
              {blocks.map((block, i) => {
                const t = BLOCK_TYPES[block.type] || BLOCK_TYPES.anders
                const top = timeToY(block.start)
                const h = blockHeight(block.start, block.end)

                return (
                  <div key={i} style={{
                    position: 'absolute',
                    left: '2px', right: '2px',
                    top: `${top}%`,
                    height: `${h}%`,
                    minHeight: '4px',
                    background: t.bg,
                    borderLeft: `2px solid ${t.color}`,
                    borderRadius: '0 2px 2px 0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '1px 2px'
                  }}>
                    {h > 8 && (
                      <div style={{
                        fontSize: '0.38rem',
                        fontWeight: 800,
                        color: t.color,
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.label}
                      </div>
                    )}
                    {h > 14 && (
                      <div style={{
                        fontSize: '0.35rem',
                        color: t.color,
                        opacity: 0.7,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap'
                      }}>
                        {block.start}–{block.end}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div style={{
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        marginTop: '6px', paddingTop: '6px',
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        {Object.entries(BLOCK_TYPES)
          .filter(([k]) => k !== 'vrij')
          .map(([key, t]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{
                width: '7px', height: '7px',
                borderRadius: '1px',
                background: t.color,
                opacity: 0.8
              }} />
              <span style={{
                fontSize: '0.38rem',
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 600
              }}>{t.label}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
