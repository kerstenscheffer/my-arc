// src/modules/meal-plan/components/WeekPlannerGrid.jsx
import React, { useState } from 'react'
import DayColumn from './DayColumn'

export default function WeekPlannerGrid({
  weekStructure,
  activePlan,
  client,
  db,
  expandedView,
  onMealUpdate,
  onCopyDay,
  onScalePortion,
  targets // ← NEW: Receive targets
}) {
  const isMobile = window.innerWidth <= 768
  
  const [draggedMeal, setDraggedMeal] = useState(null)
  const [dragSource, setDragSource] = useState(null) // { day, slot }
  
  const days = [
    { key: 'monday', label: 'Ma', fullLabel: 'Maandag' },
    { key: 'tuesday', label: 'Di', fullLabel: 'Dinsdag' },
    { key: 'wednesday', label: 'Wo', fullLabel: 'Woensdag' },
    { key: 'thursday', label: 'Do', fullLabel: 'Donderdag' },
    { key: 'friday', label: 'Vr', fullLabel: 'Vrijdag' },
    { key: 'saturday', label: 'Za', fullLabel: 'Zaterdag' },
    { key: 'sunday', label: 'Zo', fullLabel: 'Zondag' }
  ]
  
  const handleDragStart = (meal, sourceDay, sourceSlot) => {
    setDraggedMeal(meal)
    setDragSource({ day: sourceDay, slot: sourceSlot })
  }
  
  const handleDrop = async (targetDay, targetSlot) => {
    if (!draggedMeal || !dragSource) return
    
    try {
      // If dropping in same position, do nothing
      if (dragSource.day === targetDay && dragSource.slot === targetSlot) {
        setDraggedMeal(null)
        setDragSource(null)
        return
      }
      
      // Update target slot with dragged meal
      await onMealUpdate(targetDay, targetSlot, draggedMeal)
      
      // Optionally: Clear source slot if moving (not copying)
      // await onMealUpdate(dragSource.day, dragSource.slot, null)
      
    } catch (error) {
      console.error('Drop failed:', error)
    } finally {
      setDraggedMeal(null)
      setDragSource(null)
    }
  }
  
  const handleDragEnd = () => {
    setDraggedMeal(null)
    setDragSource(null)
  }
  
  // Mobile: Show 1 column at a time
  if (isMobile && !expandedView) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {days.map(day => {
          const dayData = weekStructure[day.key]
          if (!dayData || Object.keys(dayData).length === 0) return null
          
          return (
            <DayColumn
              key={day.key}
              day={day}
              dayData={dayData}
              activePlan={activePlan}
              client={client}
              db={db}
              expandedView={expandedView}
              onMealUpdate={onMealUpdate}
              onCopyDay={onCopyDay}
              onScalePortion={onScalePortion}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={!!draggedMeal}
              dragSource={dragSource}
              targets={targets} // ← PASS TARGETS
            />
          )
        })}
      </div>
    )
  }
  
  // Desktop: Show horizontal scroll with all days
  return (
    <div style={{
      position: 'relative'
    }}>
      {/* Horizontal scroll container */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(255, 255, 255, 0.1)'
      }}>
        {days.map(day => {
          const dayData = weekStructure[day.key] || {}
          
          return (
            <DayColumn
              key={day.key}
              day={day}
              dayData={dayData}
              activePlan={activePlan}
              client={client}
              db={db}
              expandedView={expandedView}
              onMealUpdate={onMealUpdate}
              onCopyDay={onCopyDay}
              onScalePortion={onScalePortion}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={!!draggedMeal}
              dragSource={dragSource}
              targets={targets} // ← PASS TARGETS
            />
          )
        })}
      </div>
      
      {/* Scroll hint */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(10, 10, 10, 0.95) 100%)',
          padding: '2rem 1rem',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.5rem',
          opacity: 0.5
        }}>
          →
        </div>
      )}
      
      {/* Drag overlay indicator */}
      {draggedMeal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.95)',
            padding: '1rem 2rem',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)'
          }}>
            🍽️ Sleep naar gewenste dag/slot
          </div>
        </div>
      )}
      
      <style>{`
        /* Custom scrollbar */
        div::-webkit-scrollbar {
          height: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  )
}
