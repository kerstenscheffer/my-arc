// src/modules/weight-tracker/components/WeightHistory.jsx
// v3.0 AINextMeal DNA — flush rows, borderBottom, compact filter bar
// Props IDENTIEK: { history, isMobile, maxItems }

import React, { useState, useEffect } from 'react'
import { Clock, Star } from 'lucide-react'

export default function WeightHistory({ history = [], isMobile = false, maxItems = 50 }) {
  const [filterType, setFilterType] = useState('week')
  const [filteredHistory, setFilteredHistory] = useState(history)
  
  const filters = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Maand' },
    { value: 'all', label: 'Alles' }
  ]
  
  useEffect(() => {
    let f = [...history]
    const today = new Date()
    if (filterType === 'week') {
      const ago = new Date(); ago.setDate(today.getDate() - 7)
      f = history.filter(e => new Date(e.date) >= ago)
    } else if (filterType === 'month') {
      const ago = new Date(); ago.setDate(today.getDate() - 30)
      f = history.filter(e => new Date(e.date) >= ago)
    } else {
      f = history.slice(0, maxItems)
    }
    setFilteredHistory(f)
  }, [filterType, history, maxItems])
  
  return (
    <div style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      overflow: 'hidden'
    }}>
      {/* ── Header bar — flush, with filter pills ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={isMobile ? 12 : 13} color="rgba(255,255,255,0.3)" />
          <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>
            Historie
          </span>
          <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', color: 'rgba(255,255,255,0.2)' }}>
            ({filteredHistory.length})
          </span>
        </div>
        
        {/* Filter bar — flush pills like AINextMeal action bar */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
          {filters.map((f, i) => (
            <button key={f.value} onClick={() => setFilterType(f.value)}
              style={{
                padding: isMobile ? '0.2rem 0.4rem' : '0.25rem 0.5rem',
                background: filterType === f.value ? '#FFD700' : 'transparent',
                border: 'none',
                borderRight: i < filters.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                color: filterType === f.value ? '#000' : 'rgba(255,255,255,0.35)',
                fontSize: isMobile ? '0.5rem' : '0.55rem',
                fontWeight: filterType === f.value ? '800' : '600',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* ── Rows — flush, borderBottom each ── */}
      <div style={{
        maxHeight: isMobile ? '200px' : '250px', overflowY: 'auto'
      }}>
        {filteredHistory.map((entry, index) => {
          const prev = filteredHistory[index + 1]
          const change = prev ? entry.weight - prev.weight : 0
          const d = new Date(entry.date)
          const isFri = entry.is_friday_weighin
          
          return (
            <div key={entry.id || index} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
              background: isFri ? 'rgba(139, 92, 246, 0.04)' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.625rem' : '0.75rem' }}>
                {/* Date */}
                <div style={{ minWidth: isMobile ? '48px' : '56px' }}>
                  <div style={{ fontSize: isMobile ? '0.6rem' : '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
                    {d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: isMobile ? '0.45rem' : '0.5rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.08rem' }}>
                    {d.toLocaleDateString('nl-NL', { weekday: 'short' })}
                  </div>
                </div>
                
                {/* Weight — key element, slightly brighter */}
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '700', color: '#fff'
                }}>
                  {entry.weight.toFixed(1)}
                  <span style={{ fontSize: isMobile ? '0.5rem' : '0.55rem', fontWeight: '500', opacity: 0.35, marginLeft: '0.1rem' }}>kg</span>
                </span>
                
                {isFri && <Star size={isMobile ? 9 : 10} color="#8b5cf6" style={{ opacity: 0.4 }} />}
              </div>
              
              {/* Change */}
              {change !== 0 && (
                <span style={{
                  padding: '0.1rem 0.25rem',
                  fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: '700',
                  color: change > 0 ? '#dc2626' : '#10b981'
                }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              )}
            </div>
          )
        })}
        
        {filteredHistory.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '1.5rem',
            color: 'rgba(255,255,255,0.2)', fontSize: isMobile ? '0.65rem' : '0.7rem'
          }}>
            Geen wegingen gevonden
          </div>
        )}
      </div>
    </div>
  )
}
