import React, { useState, useEffect } from 'react'
import { Clock, Star, Calendar, Filter } from 'lucide-react'

const THEME = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  success: '#10b981',
  danger: '#dc2626',
  friday: '#8b5cf6',
  border: 'rgba(59, 130, 246, 0.08)',
  borderActive: 'rgba(59, 130, 246, 0.15)'
}

export default function WeightHistory({ 
  history = [],
  isMobile = false,
  maxItems = 50 
}) {
  const [filterType, setFilterType] = useState('week') // Default week view
  const [filteredHistory, setFilteredHistory] = useState(history)
  
  // Simple filter options - alleen de belangrijkste
  const filterOptions = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Maand' },
    { value: 'all', label: 'Alles' }
  ]
  
  // Apply filters
  useEffect(() => {
    let filtered = [...history]
    const today = new Date()
    
    switch(filterType) {
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 7)
        filtered = history.filter(entry => 
          new Date(entry.date) >= weekAgo
        )
        break
        
      case 'month':
        const monthAgo = new Date()
        monthAgo.setDate(today.getDate() - 30)
        filtered = history.filter(entry => 
          new Date(entry.date) >= monthAgo
        )
        break
        
      default:
        filtered = history.slice(0, maxItems)
    }
    
    setFilteredHistory(filtered)
  }, [filterType, history, maxItems])
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '0.75rem' : '1rem',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${THEME.border}`
    }}>
      {/* Header met filter tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <Clock size={isMobile ? 14 : 16} color={THEME.primary} style={{ opacity: 0.7 }} />
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            Historie
          </span>
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            color: 'rgba(255,255,255,0.35)',
            marginLeft: '0.25rem'
          }}>
            ({filteredHistory.length})
          </span>
        </div>
        
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.125rem',
          borderRadius: '8px'
        }}>
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              style={{
                padding: isMobile ? '0.25rem 0.5rem' : '0.3rem 0.625rem',
                background: filterType === option.value ? THEME.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: filterType === option.value ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.6rem' : '0.65rem',
                fontWeight: filterType === option.value ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* History List - Compact */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        maxHeight: isMobile ? '200px' : '250px',
        overflowY: 'auto',
        paddingRight: '0.25rem'
      }}>
        {filteredHistory.map((entry, index) => {
          const prevEntry = filteredHistory[index + 1]
          const change = prevEntry ? entry.weight - prevEntry.weight : 0
          const entryDate = new Date(entry.date)
          const isEntryFriday = entry.is_friday_weighin
          
          return (
            <div
              key={entry.id || index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
                background: isEntryFriday ? 
                  'linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)' : 
                  'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                borderLeft: isEntryFriday ? `2px solid ${THEME.friday}` : `2px solid transparent`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isEntryFriday ? 
                  'linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)' : 
                  'rgba(59, 130, 246, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isEntryFriday ? 
                  'linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)' : 
                  'rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? '0.5rem' : '0.625rem' 
              }}>
                {/* Datum */}
                <div style={{
                  minWidth: isMobile ? '60px' : '70px'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '0.65rem' : '0.7rem', 
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1
                  }}>
                    {entryDate.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '0.55rem' : '0.6rem', 
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '0.125rem'
                  }}>
                    {entryDate.toLocaleDateString('nl-NL', {
                      weekday: 'short'
                    })}
                  </div>
                </div>
                
                {/* Gewicht */}
                <div style={{ 
                  fontSize: isMobile ? '0.95rem' : '1.05rem', 
                  fontWeight: '700', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.125rem'
                }}>
                  {entry.weight.toFixed(1)}
                  <span style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    fontWeight: '500',
                    opacity: 0.5
                  }}>
                    kg
                  </span>
                </div>
                
                {/* Friday badge */}
                {isEntryFriday && (
                  <Star 
                    size={isMobile ? 12 : 14} 
                    color={THEME.friday}
                    style={{ 
                      opacity: 0.7,
                      marginLeft: '0.25rem'
                    }}
                  />
                )}
              </div>
              
              {/* Change indicator */}
              {change !== 0 && (
                <span style={{
                  padding: isMobile ? '0.125rem 0.375rem' : '0.2rem 0.5rem',
                  background: change > 0 ? 
                    'rgba(220, 38, 38, 0.1)' : 
                    'rgba(16, 185, 129, 0.1)',
                  borderRadius: '4px',
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: change > 0 ? THEME.danger : THEME.success,
                  fontWeight: '600'
                }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}
                </span>
              )}
            </div>
          )
        })}
        
        {filteredHistory.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '1.5rem 1rem',
            color: 'rgba(255,255,255,0.35)',
            fontSize: isMobile ? '0.75rem' : '0.8rem'
          }}>
            Geen wegingen gevonden
          </div>
        )}
      </div>
      
      {/* Scroll indicator als er meer entries zijn */}
      {filteredHistory.length > 5 && (
        <div style={{
          textAlign: 'center',
          marginTop: '0.5rem',
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Scroll voor meer
        </div>
      )}
      
      <style>{`
        ::-webkit-scrollbar {
          width: 3px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${THEME.primary}33;
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${THEME.primary}55;
        }
      `}</style>
    </div>
  )
}
