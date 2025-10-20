// src/modules/meal-plan/components/MealSlot.jsx
import React, { useState } from 'react'
import { Plus, Scale, Info, X } from 'lucide-react'
import PortionScaleModal from './PortionScaleModal'

export default function MealSlot({
  slot,
  slotData,
  day,
  client,
  db,
  expandedView,
  onMealUpdate,
  onScalePortion,
  onDragStart,
  onDrop,
  onDragEnd,
  isDragging,
  isSource
}) {
  const isMobile = window.innerWidth <= 768
  
  const [isDragOver, setIsDragOver] = useState(false)
  const [showScaleModal, setShowScaleModal] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  
  const slotLabels = {
    breakfast: '🍳 Ontbijt',
    lunch: '🥗 Lunch',
    dinner: '🍽️ Diner',
    snacks: '🍎 Snacks'
  }
  
  const handleDragStart = (e) => {
    if (!slotData) return
    
    e.dataTransfer.effectAllowed = 'move'
    onDragStart(slotData, day, slot)
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }
  
  const handleDragLeave = () => {
    setIsDragOver(false)
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(day, slot)
  }
  
  const handleRemoveMeal = async () => {
    if (!confirm('Maaltijd verwijderen?')) return
    
    await onMealUpdate(day, slot, null)
  }
  
  const handleScalePortion = async (newScaleFactor) => {
    await onScalePortion(day, slot, newScaleFactor)
    setShowScaleModal(false)
  }
  
  // Empty slot
  if (!slotData || !slotData.meal_id) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: isMobile ? '0.875rem' : '1rem',
          background: isDragOver
            ? 'rgba(59, 130, 246, 0.2)'
            : 'rgba(255, 255, 255, 0.03)',
          border: isDragOver
            ? '2px dashed rgba(59, 130, 246, 0.6)'
            : '2px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          minHeight: '60px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onClick={() => setShowSelectModal(true)}
      >
        <Plus size={16} color="rgba(255, 255, 255, 0.3)" />
        <span style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.3)',
          fontWeight: '500'
        }}>
          {slotLabels[slot]}
        </span>
      </div>
    )
  }
  
  // Filled slot
  return (
    <>
      <div
        draggable={!isMobile}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: isMobile ? '0.875rem' : '1rem',
          background: isSource
            ? 'rgba(59, 130, 246, 0.15)'
            : isDragOver
            ? 'rgba(59, 130, 246, 0.2)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: isDragOver
            ? '2px solid rgba(59, 130, 246, 0.6)'
            : isSource
            ? '2px solid rgba(59, 130, 246, 0.5)'
            : '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          cursor: isMobile ? 'default' : 'move',
          transition: 'all 0.3s ease',
          opacity: isSource ? 0.6 : 1,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isMobile && !isDragging) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Slot Label */}
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: '600'
        }}>
          {slotLabels[slot]}
        </div>
        
        {/* Meal Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.5rem'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.25rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {slotData.meal_name}
            </div>
            
            {slotData.scale_factor && slotData.scale_factor !== 1 && (
              <div style={{
                fontSize: '0.7rem',
                color: '#3b82f6',
                fontWeight: '600',
                marginBottom: '0.25rem'
              }}>
                ⚖️ {Math.round(slotData.scale_factor * 100)}% portie
              </div>
            )}
            
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span>{slotData.calories} kcal</span>
              <span>{slotData.protein}g P</span>
              {expandedView && (
                <>
                  <span>{slotData.carbs}g K</span>
                  <span>{slotData.fat}g V</span>
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            marginLeft: '0.5rem'
          }}>
            <button
              onClick={() => setShowScaleModal(true)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              }}
            >
              <Scale size={14} color="#3b82f6" />
            </button>
            
            <button
              onClick={handleRemoveMeal}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
              }}
            >
              <X size={14} color="#ef4444" />
            </button>
          </div>
        </div>
        
        {/* Drag hint (desktop only) */}
        {!isMobile && !isDragging && (
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            right: '0.5rem',
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.3)',
            pointerEvents: 'none'
          }}>
            ⋮⋮
          </div>
        )}
      </div>
      
      {/* Scale Modal */}
      {showScaleModal && (
        <PortionScaleModal
          isOpen={showScaleModal}
          onClose={() => setShowScaleModal(false)}
          meal={slotData}
          currentScale={slotData.scale_factor || 1}
          onScale={handleScalePortion}
          isMobile={isMobile}
        />
      )}
    </>
  )
}
