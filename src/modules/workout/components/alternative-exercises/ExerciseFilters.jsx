// src/modules/workout/components/alternative-exercises/ExerciseFilters.jsx
import { Filter, Dumbbell, Activity, Home, Users, Zap, Award } from 'lucide-react'

/**
 * EXERCISE FILTERS
 * 
 * Equipment and difficulty filter pills
 * Collapsible on mobile
 */

const EQUIPMENT_TYPES = {
  bodyweight: { label: 'Bodyweight', icon: Home },
  dumbbell: { label: 'Dumbbell', icon: Dumbbell },
  barbell: { label: 'Barbell', icon: Activity },
  cable: { label: 'Cable', icon: Zap },
  machine: { label: 'Machine', icon: Users }
}

const DIFFICULTY_LEVELS = {
  beginner: { label: 'Beginner', color: '#10b981' },
  intermediate: { label: 'Intermediate', color: '#f59e0b' },
  advanced: { label: 'Gevorderd', color: '#ef4444' }
}

export default function ExerciseFilters({
  selectedEquipment,
  onEquipmentChange,
  selectedDifficulty,
  onDifficultyChange,
  isMobile
}) {
  const [showFilters, setShowFilters] = useState(false)
  
  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: showFilters
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${showFilters ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.15)'}`,
          borderRadius: '12px',
          color: showFilters ? '#f97316' : 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '48px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: showFilters
            ? '0 8px 24px rgba(249, 115, 22, 0.2)'
            : '0 4px 16px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          <Filter size={isMobile ? 16 : 18} strokeWidth={2.5} />
          <span>Filters</span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          zIndex: 2
        }}>
          {(selectedEquipment !== 'all' || selectedDifficulty !== 'all') && (
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#f97316',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(selectedEquipment !== 'all' ? 1 : 0) + (selectedDifficulty !== 'all' ? 1 : 0)}
            </div>
          )}
          <ChevronDown 
            size={isMobile ? 16 : 18} 
            strokeWidth={2.5}
            style={{
              transition: 'transform 0.3s ease',
              transform: showFilters ? 'rotate(180deg)' : 'rotate(0)'
            }}
          />
        </div>
      </button>
      
      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          marginTop: '0.75rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          animation: 'slideDown 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          
          {/* Equipment Filters */}
          <div style={{ marginBottom: '1.25rem', position: 'relative', zIndex: 2 }}>
            <label style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <Dumbbell size={14} color="rgba(249, 115, 22, 0.5)" strokeWidth={2.5} />
              Equipment
            </label>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '0.5rem'
            }}>
              {/* All button */}
              <button
                onClick={() => onEquipmentChange('all')}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: selectedEquipment === 'all'
                    ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedEquipment === 'all' ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: selectedEquipment === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                Alle
              </button>
              
              {/* Equipment buttons */}
              {Object.entries(EQUIPMENT_TYPES).map(([key, { label, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => onEquipmentChange(key)}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: selectedEquipment === key
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selectedEquipment === key ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    color: selectedEquipment === key ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                >
                  <Icon size={isMobile ? 16 : 18} strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty Filters */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <label style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <Award size={14} color="rgba(249, 115, 22, 0.5)" strokeWidth={2.5} />
              Moeilijkheid
            </label>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '0.5rem'
            }}>
              {/* All button */}
              <button
                onClick={() => onDifficultyChange('all')}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: selectedDifficulty === 'all'
                    ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedDifficulty === 'all' ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: selectedDifficulty === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                Alle
              </button>
              
              {/* Difficulty buttons */}
              {Object.entries(DIFFICULTY_LEVELS).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => onDifficultyChange(key)}
                  style={{
                    padding: isMobile ? '0.75rem' : '0.875rem',
                    background: selectedDifficulty === key
                      ? `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${selectedDifficulty === key ? color : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    color: selectedDifficulty === key ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                >
                  <Award size={12} strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Missing import
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
