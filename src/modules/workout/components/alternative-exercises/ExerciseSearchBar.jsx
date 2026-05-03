// src/modules/workout/components/alternative-exercises/ExerciseSearchBar.jsx
import { Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'

/**
 * ULTRA COMPACT SEARCH BAR
 * - Compact search input
 * - Single-line muscle dropdown (label + selected inline)
 * - Minimal padding/margins
 */

const MUSCLE_GROUPS = [
  { value: 'all', label: 'Alle' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'legs', label: 'Legs' },
  { value: 'abs', label: 'Abs' }
]

export default function ExerciseSearchBar({ 
  searchTerm, 
  onSearchChange, 
  selectedMuscle, 
  onMuscleChange,
  isMobile 
}) {
  const [showDropdown, setShowDropdown] = useState(false)
  
  const selectedGroup = MUSCLE_GROUPS.find(g => g.value === selectedMuscle) || MUSCLE_GROUPS[0]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Search input - compact */}
      <div style={{ position: 'relative' }}>
        <Search 
          size={16} 
          color="rgba(249, 115, 22, 0.5)"
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Zoek oefening..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.625rem 0.75rem 0.625rem 2.5rem' : '0.7rem 0.875rem 0.7rem 2.75rem',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '500',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'}
        />
      </div>
      
      {/* Muscle dropdown - SINGLE LINE with label inline */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            width: '100%',
            padding: isMobile ? '0.5rem 0.75rem' : '0.55rem 0.875rem',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'border-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.2)'}
        >
          {/* Label + Selected inline */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Spiergroep:
            </span>
            <span style={{ 
              color: '#f97316',
              fontWeight: '700'
            }}>
              {selectedGroup.label}
            </span>
          </div>
          
          <ChevronDown 
            size={14} 
            color="#f97316"
            style={{
              transition: 'transform 0.2s ease',
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </button>
        
        {/* Dropdown menu - clean and simple */}
        {showDropdown && (
          <>
            <div 
              onClick={() => setShowDropdown(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100
              }}
            />
            
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              background: '#171717',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '10px',
              overflow: 'hidden',
              zIndex: 101,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}>
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group.value}
                  onClick={() => {
                    onMuscleChange(group.value)
                    setShowDropdown(false)
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.625rem 0.75rem' : '0.7rem 0.875rem',
                    background: selectedMuscle === group.value 
                      ? 'rgba(249, 115, 22, 0.15)' 
                      : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    color: selectedMuscle === group.value ? '#f97316' : '#fff',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: selectedMuscle === group.value ? '700' : '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMuscle !== group.value) {
                      e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.08)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMuscle !== group.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
