// src/modules/weight-tracker/components/WeightHistory.jsx
// v5.0 — toggle "Bekijk week progressie" laadt weekgemiddeldes (week 1, 2, 3…)
// met delta-tov-vorige-week ipv individuele dag-logs. Default ALLES.
// Props identiek: { history, isMobile, maxItems }

import React, { useState, useEffect, useMemo } from 'react'
import { Clock, Star, TrendingUp } from 'lucide-react'

// Bucket alle logs per kalenderweek (maandag-zondag). Geeft oudste week eerst
// terug zodat we weeknummering correct kunnen tellen (week 1 = eerste week
// met een meting). De UI tonen we daarna reverse-chronologisch.
function buildWeekAverages(history) {
  if (!history || history.length === 0) return []
  const mondayOf = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date))
  const buckets = new Map()
  for (const e of sorted) {
    const monday = mondayOf(e.date)
    const key = monday.toISOString().split('T')[0]
    if (!buckets.has(key)) {
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      buckets.set(key, { monday, sunday, weights: [] })
    }
    buckets.get(key).weights.push(parseFloat(e.weight))
  }
  const weeks = [...buckets.values()]
    .map((b, idx) => ({
      weekNum: idx + 1,
      monday: b.monday,
      sunday: b.sunday,
      avg: parseFloat((b.weights.reduce((s, w) => s + w, 0) / b.weights.length).toFixed(1)),
      count: b.weights.length,
    }))
  // Bereken delta tov vorige week
  for (let i = 0; i < weeks.length; i++) {
    weeks[i].delta = i === 0 ? null : parseFloat((weeks[i].avg - weeks[i - 1].avg).toFixed(1))
  }
  // Reverse: nieuwste week bovenaan
  return weeks.reverse()
}

export default function WeightHistory({ history = [], isMobile = false, maxItems = 200 }) {
  const [view, setView] = useState('all')  // 'all' | 'weeks'
  const [filteredHistory, setFilteredHistory] = useState(history)

  useEffect(() => {
    setFilteredHistory(history.slice(0, maxItems))
  }, [history, maxItems])

  const weekAverages = useMemo(() => buildWeekAverages(history), [history])
  const isWeekView = view === 'weeks'
  const totalCount = isWeekView ? weekAverages.length : filteredHistory.length

  return (
    <div style={{
      margin: isMobile ? '0 1rem' : '0 1.5rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* ── Header: titel links, toggle-knop rechts ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Clock size={isMobile ? 15 : 17} color="#FFD700" strokeWidth={2.4} />
          <span style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.015em',
          }}>
            {isWeekView ? 'Week progressie' : 'Historie'}
          </span>
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.78rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            · {totalCount}
          </span>
        </div>

        <button
          onClick={() => setView(isWeekView ? 'all' : 'weeks')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '0.45rem 0.7rem' : '0.5rem 0.85rem',
            background: isWeekView
              ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
              : 'rgba(255,215,0,0.1)',
            color: isWeekView ? '#0a0a0a' : '#FFD700',
            border: isWeekView ? 'none' : '1px solid rgba(255,215,0,0.35)',
            borderRadius: 10,
            fontSize: isMobile ? '0.68rem' : '0.74rem',
            fontWeight: 900,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            whiteSpace: 'nowrap',
            boxShadow: isWeekView ? '0 6px 14px rgba(255,215,0,0.3)' : 'none',
          }}
        >
          <TrendingUp size={isMobile ? 12 : 13} strokeWidth={2.6} />
          {isWeekView ? 'Bekijk alles' : 'Bekijk week progressie'}
        </button>
      </div>

      {/* ── Week-view: weekgemiddeldes met delta tov vorige week ── */}
      {isWeekView && (
        <div style={{
          maxHeight: isMobile ? '320px' : '380px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          {weekAverages.map((w, index) => {
            const fmt = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
            const isLatest = index === 0
            return (
              <div key={w.monday.toISOString()} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: isMobile ? '0.7rem 1rem' : '0.85rem 1.15rem',
                borderBottom: index < weekAverages.length - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
                background: isLatest ? 'rgba(255,215,0,0.04)' : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '0.95rem', minWidth: 0 }}>
                  {/* Week-nummer + range */}
                  <div style={{ minWidth: isMobile ? 64 : 74 }}>
                    <div style={{
                      fontSize: isMobile ? '0.85rem' : '0.92rem',
                      fontWeight: 900, color: '#fff', lineHeight: 1,
                      letterSpacing: '-0.015em',
                    }}>
                      Week {w.weekNum}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.58rem' : '0.62rem',
                      color: 'rgba(255,255,255,0.45)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginTop: 3,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                    }}>
                      {fmt(w.monday)}–{fmt(w.sunday)}
                    </div>
                  </div>

                  {/* Gemiddelde */}
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      fontSize: isMobile ? '1.1rem' : '1.25rem',
                      fontWeight: 900,
                      color: isLatest ? '#FFD700' : '#fff',
                      letterSpacing: '-0.02em',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {w.avg.toFixed(1)}
                      <span style={{
                        fontSize: isMobile ? '0.62rem' : '0.68rem',
                        fontWeight: 700, opacity: 0.45, marginLeft: 3,
                      }}>
                        kg
                      </span>
                    </span>
                    <div style={{
                      fontSize: isMobile ? '0.6rem' : '0.66rem',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 2,
                    }}>
                      {w.count} meting{w.count === 1 ? '' : 'en'}
                    </div>
                  </div>
                </div>

                {/* Delta tov vorige week */}
                {w.delta !== null && w.delta !== 0 ? (
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 7,
                    background: w.delta > 0
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(16,185,129,0.12)',
                    border: w.delta > 0
                      ? '1px solid rgba(239,68,68,0.32)'
                      : '1px solid rgba(16,185,129,0.32)',
                    fontSize: isMobile ? '0.82rem' : '0.92rem',
                    fontWeight: 900,
                    color: w.delta > 0 ? '#ef4444' : '#10b981',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}>
                    {w.delta > 0 ? '+' : ''}{w.delta.toFixed(1)} kg
                  </span>
                ) : w.delta === 0 ? (
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: isMobile ? '0.72rem' : '0.78rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                  }}>
                    gelijk
                  </span>
                ) : (
                  <span style={{
                    fontSize: isMobile ? '0.6rem' : '0.66rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    start
                  </span>
                )}
              </div>
            )
          })}
          {weekAverages.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '2rem 1rem',
              color: 'rgba(255,255,255,0.35)',
              fontSize: isMobile ? '0.85rem' : '0.92rem',
              fontWeight: 600,
            }}>
              Nog geen weken om te tonen
            </div>
          )}
        </div>
      )}

      {/* ── All-view: alle dag-logs ── */}
      {!isWeekView && (
      <div style={{
        maxHeight: isMobile ? '260px' : '320px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {filteredHistory.map((entry, index) => {
          const prev = filteredHistory[index + 1]
          const change = prev ? entry.weight - prev.weight : 0
          const d = new Date(entry.date)
          const isFri = entry.is_friday_weighin

          return (
            <div key={entry.id || index} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: isMobile ? '0.65rem 1rem' : '0.75rem 1.15rem',
              borderBottom: index < filteredHistory.length - 1
                ? '1px solid rgba(255,255,255,0.04)'
                : 'none',
              background: isFri ? 'rgba(255,215,0,0.03)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '0.95rem' }}>
                {/* Datum */}
                <div style={{ minWidth: isMobile ? 56 : 64 }}>
                  <div style={{
                    fontSize: isMobile ? '0.78rem' : '0.85rem',
                    fontWeight: 800, color: '#fff', lineHeight: 1,
                  }}>
                    {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.58rem' : '0.62rem',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 3,
                    fontWeight: 700,
                  }}>
                    {d.toLocaleDateString('nl-NL', { weekday: 'short' })}
                  </div>
                </div>

                {/* Gewicht — fel wit, groot */}
                <span style={{
                  fontSize: isMobile ? '1.05rem' : '1.18rem',
                  fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {entry.weight.toFixed(1)}
                  <span style={{
                    fontSize: isMobile ? '0.62rem' : '0.68rem',
                    fontWeight: 700, opacity: 0.45, marginLeft: 3,
                  }}>
                    kg
                  </span>
                </span>

                {isFri && <Star size={isMobile ? 11 : 12} color="#FFD700" strokeWidth={2.4} fill="#FFD700" style={{ opacity: 0.85 }} />}
              </div>

              {/* Verschil — fel groen/rood, leesbaar */}
              {change !== 0 && (
                <span style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: 6,
                  background: change > 0
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(16,185,129,0.12)',
                  border: change > 0
                    ? '1px solid rgba(239,68,68,0.3)'
                    : '1px solid rgba(16,185,129,0.3)',
                  fontSize: isMobile ? '0.75rem' : '0.82rem',
                  fontWeight: 900,
                  color: change > 0 ? '#ef4444' : '#10b981',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              )}
            </div>
          )
        })}

        {filteredHistory.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '2rem 1rem',
            color: 'rgba(255,255,255,0.35)',
            fontSize: isMobile ? '0.85rem' : '0.92rem',
            fontWeight: 600,
          }}>
            Nog geen wegingen
          </div>
        )}
      </div>
      )}
    </div>
  )
}
