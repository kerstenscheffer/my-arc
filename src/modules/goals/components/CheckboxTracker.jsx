
// ============================================
// src/modules/goals/components/CheckboxTracker.jsx
// ============================================
import React from 'react'
import { CalendarCheck, Check, Save, RefreshCw } from 'lucide-react'
import { goalCategories } from '../config'
import { getDayInfo } from '../utils'
import { isMobile } from '../config'

export function CheckboxTracker({ goal, checkedDays, weeklyProgress, loading, onChange, onSave }) {
  const mobile = isMobile()
  const categoryConfig = goalCategories[goal.category || goal.main_category] || goalCategories.structuur
  const dayInfo = getDayInfo()
  const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1
  
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <label style={{ fontSize: mobile ? '0.8rem' : '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
          Deze week ({checkedDays.length}/{goal.frequency_target} dagen)
        </label>
        <div style={{
          fontSize: mobile ? '0.7rem' : '0.75rem',
          padding: '0.25rem 0.75rem',
          background: categoryConfig.bgColor,
          borderRadius: '12px',
          color: categoryConfig.color,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CalendarCheck size={14} />
          {dayInfo.todayName}, {dayInfo.currentWeek}
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: mobile ? '0.25rem' : '0.25rem' 
      }}>
        {days.map((day, index) => {
          const isToday = index === todayIndex
          const isChecked = checkedDays.includes(index)
          const wasSaved = weeklyProgress[goal.id]?.includes(index)
          
          return (
            <div key={day} style={{ textAlign: 'center' }}>
              <button
                onClick={() => onChange(index, isChecked)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: mobile ? '0.5rem 0.25rem' : '0.75rem 0.25rem',
                  background: isChecked || wasSaved
                    ? categoryConfig.gradient
                    : 'rgba(255,255,255,0.1)',
                  border: isToday 
                    ? `2px solid ${categoryConfig.color}`
                    : 'none',
                  borderRadius: '8px',
                  color: isChecked || wasSaved ? '#000' : '#fff',
                  fontSize: mobile ? '0.7rem' : '0.75rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: wasSaved && !isChecked ? 0.7 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {day}
                {wasSaved && !isChecked && (
                  <Check size={10} style={{ marginLeft: '2px', display: 'inline' }} />
                )}
              </button>
              {isToday && (
                <div style={{
                  fontSize: mobile ? '0.55rem' : '0.6rem',
                  color: categoryConfig.color,
                  marginTop: '0.25rem'
                }}>
                  Vandaag
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <button
        onClick={onSave}
        disabled={loading}
        style={{
          marginTop: '0.75rem',
          width: '100%',
          padding: mobile ? '0.6rem' : '0.75rem',
          background: categoryConfig.gradient,
          border: 'none',
          borderRadius: '8px',
          color: '#000',
          fontWeight: 'bold',
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
      >
        {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
        Week Opslaan
      </button>
    </div>
  )
}
