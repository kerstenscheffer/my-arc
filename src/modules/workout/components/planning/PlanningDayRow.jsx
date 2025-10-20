// src/modules/workout/components/planning/PlanningDayRow.jsx
// PREMIUM STYLING - Z-INDEX FIX 🔥

import { useState } from 'react'
import ActivityDropdown from './ActivityDropdown'
import WorkoutPreview from './WorkoutPreview'

export default function PlanningDayRow({ 
  day, 
  dayDutch, 
  selectedValue, 
  selectedData,
  workoutOptions, 
  activityTypes, 
  onChange, 
  isMobile 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(249, 115, 22, 0.15)',
      borderRadius: '12px',
      padding: isMobile ? '1rem' : '1.125rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'visible',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      zIndex: dropdownOpen ? 100 : 1
    }}>
      {/* Subtle left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: '2px',
        background: 'linear-gradient(180deg, transparent 0%, rgba(249, 115, 22, 0.4) 50%, transparent 100%)',
        opacity: selectedValue ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }} />
      
      {/* Day header with selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.875rem' : '1rem'
      }}>
        {/* Day label - PREMIUM */}
        <div style={{
          width: isMobile ? '85px' : '105px',
          flexShrink: 0,
          padding: isMobile ? '0.5rem 0.625rem' : '0.625rem 0.75rem',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: '10px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.15rem',
            letterSpacing: '-0.01em'
          }}>
            {dayDutch}
          </div>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: '700'
          }}>
            {day}
          </div>
        </div>
        
        {/* Dropdown */}
        <ActivityDropdown
          selectedValue={selectedValue}
          selectedData={selectedData}
          workoutOptions={workoutOptions}
          activityTypes={activityTypes}
          onChange={onChange}
          isMobile={isMobile}
          onOpenChange={setDropdownOpen}
        />
      </div>
      
      {/* Preview */}
      <WorkoutPreview 
        selectedData={selectedData} 
        isMobile={isMobile} 
      />
    </div>
  )
}
