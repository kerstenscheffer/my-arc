// src/modules/ai-meal-generator/tabs/meal-selector/ForcedMealsSection.jsx
import ForcedMealCard from './ForcedMealCard'
import SlotPreview from './SlotPreview'
import { Zap, Info, AlertTriangle, Settings } from 'lucide-react'

export default function ForcedMealsSection({
  forcedMealsConfig,
  setForcedMealsConfig,
  mealsPerDay,
  isMobile
}) {
  // Handler functions
  const updateMealFrequency = (index, newFrequency) => {
    const updated = [...forcedMealsConfig]
    updated[index] = {
      ...updated[index],
      frequency: newFrequency
    }
    setForcedMealsConfig(updated)
  }
  
  const toggleTiming = (index, timing, checked) => {
    const updated = [...forcedMealsConfig]
    const currentTimings = updated[index].allowedTimings
    
    if (checked) {
      // Add timing
      updated[index] = {
        ...updated[index],
        allowedTimings: [...currentTimings, timing]
      }
    } else {
      // Remove timing (but keep at least one)
      const newTimings = currentTimings.filter(t => t !== timing)
      if (newTimings.length > 0) {
        updated[index] = {
          ...updated[index],
          allowedTimings: newTimings
        }
      }
    }
    
    setForcedMealsConfig(updated)
  }
  
  const removeForcedMeal = (index) => {
    const updated = forcedMealsConfig.filter((_, i) => i !== index)
    setForcedMealsConfig(updated)
  }
  
  const toggleLocked = (index) => {
    const updated = [...forcedMealsConfig]
    updated[index] = {
      ...updated[index],
      locked: !updated[index].locked
    }
    setForcedMealsConfig(updated)
  }
  
  // Calculate slot usage
  const calculateSlotUsage = () => {
    const totalSlots = 7 * mealsPerDay
    const forcedSlots = forcedMealsConfig.reduce((sum, config) => sum + config.frequency, 0)
    const remainingSlots = Math.max(0, totalSlots - forcedSlots)
    const percentage = Math.round((forcedSlots / totalSlots) * 100)
    
    return { totalSlots, forcedSlots, remainingSlots, percentage }
  }
  
  // Quick actions
  const distributeEvenly = () => {
    const totalSlots = 7 * mealsPerDay
    const mealsCount = forcedMealsConfig.length
    if (mealsCount === 0) return
    
    const baseFrequency = Math.floor(totalSlots / mealsCount)
    const extraSlots = totalSlots % mealsCount
    
    const updated = forcedMealsConfig.map((config, index) => ({
      ...config,
      frequency: baseFrequency + (index < extraSlots ? 1 : 0)
    }))
    
    setForcedMealsConfig(updated)
  }
  
  const resetAllFrequencies = () => {
    const updated = forcedMealsConfig.map(config => ({
      ...config,
      frequency: 7 // Reset to 1x per day
    }))
    setForcedMealsConfig(updated)
  }
  
  const setAllTimings = () => {
    const updated = forcedMealsConfig.map(config => ({
      ...config,
      allowedTimings: ['breakfast', 'lunch', 'dinner', 'snack']
    }))
    setForcedMealsConfig(updated)
  }
  
  const slotUsage = calculateSlotUsage()
  
  // Empty state
  if (forcedMealsConfig.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '2rem 1rem' : '3rem',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
        borderRadius: '12px',
        border: '1px dashed rgba(245, 158, 11, 0.3)'
      }}>
        <Zap size={48} style={{ 
          marginBottom: '1rem',
          color: 'rgba(245, 158, 11, 0.3)'
        }} />
        
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '0.5rem'
        }}>
          Geen Verplichte Maaltijden
        </h3>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255,255,255,0.5)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          Gebruik de <span style={{ color: '#f59e0b' }}>⚡ Zap knop</span> bij maaltijden om ze toe te voegen als verplicht.
          Je kunt dan exact bepalen hoe vaak ze in de week voorkomen.
        </p>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <strong style={{ color: '#3b82f6' }}>💡 Tip:</strong> Forced meals garanderen dat je favoriete maaltijden 
          in het weekplan komen. Perfect voor meal prep of speciale voedingsbehoeften!
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.25rem'
    }}>
      {/* Header with count and actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '700',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Zap size={24} />
          Verplichte Maaltijden
          <span style={{
            padding: '0.2rem 0.6rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {forcedMealsConfig.length}
          </span>
        </h3>
        
        {/* Quick actions dropdown */}
        <div style={{ position: 'relative' }}>
          <details style={{ position: 'relative' }}>
            <summary style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              listStyle: 'none',
              minHeight: '40px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <Settings size={16} />
              Quick Actions
            </summary>
            
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              minWidth: '200px',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '0.5rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 10
            }}>
              <button
                onClick={distributeEvenly}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  color: '#10b981',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 Verdeel Gelijkmatig ({Math.floor((7 * mealsPerDay) / forcedMealsConfig.length)}× each)
              </button>
              
              <button
                onClick={resetAllFrequencies}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '6px',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '0.25rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Reset naar 1×/dag
              </button>
              
              <button
                onClick={setAllTimings}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  transition: 'all 0.2s ease'
                }}
              >
                ⏰ Alle Timings Toestaan
              </button>
            </div>
          </details>
        </div>
      </div>
      
      {/* Info box */}
      <div style={{
        padding: '0.75rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
        borderRadius: '10px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem'
      }}>
        <Info size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>Frequency Control:</strong> Stel per maaltijd in hoe vaak deze voorkomt in je weekplan.
          De AI respecteert deze frequencies en vult de overgebleven slots intelligent op.
          Met {mealsPerDay} maaltijden per dag heb je {7 * mealsPerDay} totale slots te verdelen.
        </div>
      </div>
      
      {/* Forced meal cards */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {forcedMealsConfig.map((config, index) => (
          <ForcedMealCard
            key={`${config.meal.id}-${index}`}
            config={config}
            index={index}
            mealsPerDay={mealsPerDay}
            onUpdateFrequency={updateMealFrequency}
            onToggleTiming={toggleTiming}
            onRemove={removeForcedMeal}
            isMobile={isMobile}
          />
        ))}
      </div>
      
      {/* Slot preview */}
      <SlotPreview
        slotUsage={slotUsage}
        forcedMealsConfig={forcedMealsConfig}
        mealsPerDay={mealsPerDay}
        isMobile={isMobile}
      />
      
      {/* Optimization tips */}
      {slotUsage.remainingSlots < 7 && slotUsage.remainingSlots > 0 && (
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong>Let op:</strong> Je hebt nog maar {slotUsage.remainingSlots} slots over voor AI-vulling.
            Dit beperkt de variatie. Overweeg frequencies te verlagen voor meer AI-flexibiliteit.
          </div>
        </div>
      )}
    </div>
  )
}
