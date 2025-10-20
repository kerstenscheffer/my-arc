// src/modules/workout/components/planning/ActivityDropdown.jsx
// RESPONSIVE: Desktop Dropdown / Mobile Fullscreen Modal 🔥

import { useState, useRef, useEffect } from 'react'
import { Dumbbell, Moon, Heart, Waves, ChevronDown } from 'lucide-react'
import ActivitySelectorModal from './ActivitySelectorModal'

export default function ActivityDropdown({ 
  selectedValue, 
  selectedData,
  workoutOptions, 
  activityTypes, 
  onChange, 
  isMobile,
  onOpenChange
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [hoveredOption, setHoveredOption] = useState(null)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Notify parent when dropdown opens/closes
  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen || showModal)
  }, [isOpen, showModal, onOpenChange])
  
  const getActivityIcon = (value) => {
    switch(value) {
      case 'rest': return Moon
      case 'cardio': return Heart
      case 'swimming': return Waves
      default: return Dumbbell
    }
  }
  
  const getActivityColor = (value) => {
    switch(value) {
      case 'rest': return '#6b7280'
      case 'cardio': return '#ef4444'
      case 'swimming': return '#3b82f6'
      default: return '#f97316'
    }
  }
  
  const handleClick = () => {
    if (isMobile) {
      setShowModal(true)
    } else {
      setIsOpen(!isOpen)
    }
  }
  
  const handleChange = (value) => {
    onChange(value)
    setIsOpen(false)
  }
  
  return (
    <>
      <div 
        ref={dropdownRef}
        style={{ 
          flex: 1, 
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Trigger Button - SAME FOR BOTH */}
        <button
          onClick={handleClick}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(5px)'
          }}
        >
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {selectedData && (
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '6px',
                background: `${getActivityColor(selectedValue)}20`,
                border: `1px solid ${getActivityColor(selectedValue)}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {(() => {
                  const Icon = getActivityIcon(selectedValue)
                  return <Icon size={10} color={getActivityColor(selectedValue)} />
                })()}
              </span>
            )}
            {selectedData 
              ? selectedData.label || selectedData.value
              : 'Kies activiteit...'}
          </span>
          <ChevronDown 
            size={16} 
            color="rgba(255, 255, 255, 0.5)"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              flexShrink: 0
            }}
          />
        </button>
        
        {/* DESKTOP DROPDOWN - Only show on desktop when open */}
        {!isMobile && isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            borderRadius: '12px',
            zIndex: 10000,
            maxHeight: '320px',
            overflowY: 'auto',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(249, 115, 22, 0.1)',
            backdropFilter: 'blur(20px)',
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            animation: 'slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            {/* Top glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.5) 50%, transparent 100%)'
            }} />
            
            {/* Rest Option */}
            <button
              onClick={() => handleChange('rest')}
              onMouseEnter={() => setHoveredOption('rest')}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                width: '100%',
                padding: '1rem 1.125rem',
                background: selectedValue === 'rest' || !selectedValue
                  ? 'rgba(249, 115, 22, 0.12)'
                  : hoveredOption === 'rest'
                    ? 'rgba(249, 115, 22, 0.08)'
                    : 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(107, 114, 128, 0.15)',
                border: '1px solid rgba(107, 114, 128, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Moon size={14} color="#6b7280" />
              </div>
              <span style={{ flex: 1 }}>Rust</span>
              {(selectedValue === 'rest' || !selectedValue) && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#f97316',
                  boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
                }} />
              )}
            </button>
            
            {/* Activity Options */}
            {activityTypes.filter(a => a.value !== 'rest').map(activity => {
              const IconComponent = getActivityIcon(activity.value)
              return (
                <button
                  key={activity.value}
                  onClick={() => handleChange(activity.value)}
                  onMouseEnter={() => setHoveredOption(activity.value)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.125rem',
                    background: selectedValue === activity.value
                      ? 'rgba(249, 115, 22, 0.12)'
                      : hoveredOption === activity.value
                        ? 'rgba(249, 115, 22, 0.08)'
                        : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minHeight: '44px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${activity.color}20`,
                    border: `1px solid ${activity.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={14} color={activity.color} />
                  </div>
                  <span style={{ flex: 1 }}>{activity.label}</span>
                  {selectedValue === activity.value && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#f97316',
                      boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)'
                    }} />
                  )}
                </button>
              )
            })}
            
            {/* Workouts Section Header */}
            {workoutOptions.length > 0 && (
              <div style={{
                padding: '0.75rem 1.125rem',
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: '800',
                borderBottom: '1px solid rgba(249, 115, 22, 0.15)',
                background: 'rgba(249, 115, 22, 0.06)'
              }}>
                🏋️ Workouts
              </div>
            )}
            
            {/* Workout Options */}
            {workoutOptions.map(workout => (
              <button
                key={workout.value}
                onClick={() => handleChange(workout.value)}
                onMouseEnter={() => setHoveredOption(workout.value)}
                onMouseLeave={() => setHoveredOption(null)}
                style={{
                  width: '100%',
                  padding: '1rem 1.125rem',
                  background: selectedValue === workout.value
                    ? 'rgba(249, 115, 22, 0.12)'
                    : hoveredOption === workout.value
                      ? 'rgba(249, 115, 22, 0.08)'
                      : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(249, 115, 22, 0.2)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Dumbbell size={14} color="#f97316" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.15rem' }}>{workout.label}</div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontWeight: '500'
                  }}>
                    {workout.focus} • {workout.exercises} oefeningen
                  </div>
                </div>
                {selectedValue === workout.value && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#f97316',
                    boxShadow: '0 0 8px rgba(249, 115, 22, 0.6)',
                    flexShrink: 0
                  }} />
                )}
              </button>
            ))}
          </div>
        )}
        
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
      
      {/* MOBILE FULLSCREEN MODAL */}
      {isMobile && showModal && (
        <ActivitySelectorModal
          selectedValue={selectedValue}
          workoutOptions={workoutOptions}
          activityTypes={activityTypes}
          onChange={(value) => {
            onChange(value)
            setShowModal(false)
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
