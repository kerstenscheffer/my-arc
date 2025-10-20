// src/modules/progress-photos/components/UploadSection.jsx
import React, { useState, useRef } from 'react'
import { Camera, Upload, Image, Utensils, Dumbbell, Trophy, ArrowRight, Check } from 'lucide-react'

export default function UploadSection({ 
  onUpload, 
  todayData = {}, 
  isFriday = false,
  isMobile = false 
}) {
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const fileInputRef = useRef(null)
  
  const { counts = {}, hasCompleteFriday = false } = todayData

  // Daily goals
  const goals = [
    { type: 'progress', required: isFriday ? 2 : 0, current: counts.progress || 0, color: '#8b5cf6', icon: Camera },
    { type: 'meal', required: 3, current: counts.meal || 0, color: '#10b981', icon: Utensils },
    { type: 'workout', required: 1, current: counts.workout || 0, color: '#f97316', icon: Dumbbell }
  ].filter(g => g.required > 0)

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedType) return
    
    setUploading(true)
    try {
      await onUpload(file, selectedType)
      setSelectedType(null)
      fileInputRef.current.value = ''
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const openUpload = () => {
    if (!selectedType) {
      alert('Selecteer eerst een foto type!')
      return
    }
    fileInputRef.current?.click()
  }

  // Get button text based on selection
  const getButtonText = () => {
    if (uploading) return 'Uploading...'
    if (!selectedType) return 'UPLOAD FOTO'
    
    const typeLabels = {
      progress: 'PROGRESS',
      meal: 'MAALTIJD',
      workout: 'WORKOUT',
      victory: 'VICTORY'
    }
    
    return `UPLOAD JOUW ${typeLabels[selectedType]} FOTO`
  }

  // Get button color based on selection
  const getButtonGradient = () => {
    if (!selectedType) return 'linear-gradient(135deg, #3b82f6, #2563eb)'
    
    const gradients = {
      progress: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      meal: 'linear-gradient(135deg, #10b981, #059669)',
      workout: 'linear-gradient(135deg, #f97316, #ea580c)',
      victory: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    }
    
    return gradients[selectedType]
  }

  const photoTypes = [
    { type: 'progress', icon: Camera, label: 'Progress', color: '#8b5cf6' },
    { type: 'meal', icon: Utensils, label: 'Meal', color: '#10b981' },
    { type: 'workout', icon: Dumbbell, label: 'Workout', color: '#f97316' },
    { type: 'victory', icon: Trophy, label: 'Victory', color: '#fbbf24' }
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      position: 'relative'
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Friday Alert Bar */}
      {isFriday && !hasCompleteFriday && (
        <div style={{
          background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <Camera size={18} />
          <span style={{ fontWeight: '600' }}>
            VRIJDAG! Upload je front & side progress foto's vandaag
          </span>
        </div>
      )}

      {/* Main Upload Button */}
      <button
        onClick={openUpload}
        disabled={uploading}
        style={{
          width: '100%',
          height: isMobile ? '80px' : '100px',
          background: getButtonGradient(),
          border: 'none',
          borderRadius: '16px',
          color: 'white',
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 'bold',
          cursor: uploading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          boxShadow: selectedType 
            ? '0 10px 30px rgba(0, 0, 0, 0.3)' 
            : '0 10px 30px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          opacity: !selectedType && !uploading ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = selectedType 
            ? '0 10px 30px rgba(0, 0, 0, 0.3)' 
            : '0 10px 30px rgba(59, 130, 246, 0.3)'
        }}
      >
        {uploading ? (
          <>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={24} />
            {getButtonText()}
            <ArrowRight size={20} />
          </>
        )}

        {/* Shimmer effect */}
        {selectedType && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmer 3s ease-in-out infinite'
          }} />
        )}
      </button>

      {/* Instruction Text */}
      <div style={{
        textAlign: 'center',
        margin: '1rem 0 0.75rem 0',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255,255,255,0.6)',
        fontStyle: 'italic'
      }}>
        {selectedType 
          ? `${photoTypes.find(t => t.type === selectedType)?.label} foto geselecteerd - Klik upload om door te gaan`
          : 'Selecteer wat voor foto je wilt uploaden'
        }
      </div>

      {/* Type Selection Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem'
      }}>
        {photoTypes.map(item => {
          const Icon = item.icon
          const isSelected = selectedType === item.type
          const isHighlight = isFriday && item.type === 'progress' && !hasCompleteFriday
          
          return (
            <button
              key={item.type}
              onClick={() => setSelectedType(item.type)}
              disabled={uploading}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${item.color}30, ${item.color}20)`
                  : isHighlight 
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))'
                    : 'rgba(255,255,255,0.05)',
                border: isSelected
                  ? `2px solid ${item.color}`
                  : isHighlight
                    ? '1px solid rgba(139, 92, 246, 0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                position: 'relative',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!uploading && !isSelected) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.borderColor = item.color
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = isHighlight 
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))'
                    : 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = isHighlight
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Icon size={isMobile ? 18 : 20} color={isSelected ? item.color : 'white'} />
              <span style={{
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: isSelected ? item.color : 'white',
                fontWeight: isSelected ? '600' : '400'
              }}>
                {item.label}
              </span>
              
              {/* Selected Indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 8px ${item.color}50`
                }}>
                  <Check size={12} color="white" />
                </div>
              )}
              
              {/* Friday Pulse */}
              {isHighlight && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Daily Goals Progress */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Vandaag's Progress
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          {goals.map(goal => {
            const Icon = goal.icon
            const progress = Math.min(100, (goal.current / goal.required) * 100)
            const isComplete = goal.current >= goal.required
            
            return (
              <div
                key={goal.type}
                style={{
                  flex: 1,
                  minWidth: isMobile ? '80px' : '100px',
                  padding: '0.5rem',
                  background: isComplete 
                    ? `linear-gradient(135deg, ${goal.color}20, ${goal.color}10)`
                    : 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  border: `1px solid ${isComplete ? goal.color : 'rgba(255,255,255,0.05)'}`,
                  textAlign: 'center'
                }}
              >
                <Icon size={16} color={goal.color} style={{ marginBottom: '0.25rem' }} />
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: isComplete ? goal.color : 'white'
                }}>
                  {goal.current}/{goal.required}
                </div>
                <div style={{
                  height: '2px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '1px',
                  overflow: 'hidden',
                  marginTop: '0.25rem'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: goal.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          to { left: 100%; }
        }
      `}</style>
    </div>
  )
}
