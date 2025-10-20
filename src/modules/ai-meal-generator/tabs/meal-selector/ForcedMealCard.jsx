// src/modules/ai-meal-generator/tabs/meal-selector/ForcedMealCard.jsx
import { X, Clock, Zap, Info } from 'lucide-react'

export default function ForcedMealCard({
  config,
  index,
  mealsPerDay,
  onUpdateFrequency,
  onToggleTiming,
  onRemove,
  isMobile
}) {
  const { meal, frequency, allowedTimings, locked } = config
  const maxFrequency = 7 * mealsPerDay
  const frequencyPercentage = (frequency / maxFrequency) * 100
  
  // Calculate how this translates to daily appearances
  const dailyAppearances = (frequency / 7).toFixed(1)
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      padding: isMobile ? '1rem' : '1.25rem',
      position: 'relative',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Meal Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem' 
      }}>
        <div style={{ flex: 1, paddingRight: '0.5rem' }}>
          <h4 style={{ 
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={16} style={{ color: '#f59e0b' }} />
            {meal.name}
          </h4>
          
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            {/* Macro badges */}
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#ef4444',
              fontWeight: '600'
            }}>
              {meal.calories} kcal
            </span>
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              {meal.protein}g P
            </span>
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#3b82f6',
              fontWeight: '600'
            }}>
              {meal.carbs}g C
            </span>
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#f59e0b',
              fontWeight: '600'
            }}>
              {meal.fat}g F
            </span>
          </div>
          
          {/* AI Score if available */}
          {meal.aiScore && (
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Info size={12} />
              AI Score: {meal.aiScore}
            </div>
          )}
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(index)}
          style={{
            padding: '0.5rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#ef4444',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.95)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
            }
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* FREQUENCY SLIDER SECTION */}
      <div style={{ 
        marginBottom: '1.25rem',
        padding: '1rem',
        background: 'rgba(16, 185, 129, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem' 
        }}>
          <label style={{ 
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Clock size={16} />
            Frequency
          </label>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: isMobile ? '1.1rem' : '1.2rem',
              fontWeight: '700',
              color: '#10b981'
            }}>
              {frequency}× per week
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              ≈ {dailyAppearances}× per dag
            </div>
          </div>
        </div>
        
        {/* Custom Slider */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <input
            type="range"
            min="0"
            max={maxFrequency}
            value={frequency}
            onChange={(e) => onUpdateFrequency(index, parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${frequencyPercentage}%, rgba(255,255,255,0.1) ${frequencyPercentage}%, rgba(255,255,255,0.1) 100%)`,
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none',
              outline: 'none'
            }}
          />
          
          {/* Custom thumb styling via CSS */}
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border: 2px solid #fff;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              border: 2px solid #fff;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
          `}</style>
        </div>
        
        {/* Scale indicators */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)'
        }}>
          <span>0</span>
          <span>{Math.floor(maxFrequency / 2)}</span>
          <span>{maxFrequency} (max)</span>
        </div>
        
        {/* Frequency interpretation */}
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center'
        }}>
          {frequency === 0 && 'Niet gebruikt in plan'}
          {frequency > 0 && frequency <= 7 && `Ongeveer 1× per dag`}
          {frequency > 7 && frequency <= 14 && `1-2× per dag`}
          {frequency > 14 && frequency <= 21 && `2-3× per dag`}
          {frequency > 21 && `${Math.floor(frequency/7)}× per dag (heavy rotation)`}
        </div>
      </div>
      
      {/* TIMING CHECKBOXES */}
      <div>
        <label style={{ 
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          color: '#f59e0b',
          display: 'block',
          marginBottom: '0.75rem'
        }}>
          Toegestane Tijden:
        </label>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '0.5rem'
        }}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(timing => {
            const isChecked = allowedTimings.includes(timing)
            const timingLabels = {
              breakfast: '🌅 Ontbijt',
              lunch: '☀️ Lunch',
              dinner: '🌙 Diner',
              snack: '🍎 Snack'
            }
            
            return (
              <label
                key={timing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.6rem' : '0.75rem',
                  background: isChecked
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: isChecked
                    ? '1.5px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: isChecked ? '#10b981' : 'rgba(255,255,255,0.6)',
                  fontWeight: isChecked ? '600' : '400',
                  transition: 'all 0.2s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  overflow: 'hidden'
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
              >
                {/* Gradient overlay for checked state */}
                {isChecked && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, transparent 0%, rgba(16, 185, 129, 0.05) 100%)',
                    pointerEvents: 'none'
                  }} />
                )}
                
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onToggleTiming(index, timing, e.target.checked)}
                  style={{ 
                    cursor: 'pointer',
                    width: '16px',
                    height: '16px',
                    accentColor: '#10b981'
                  }}
                />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {timingLabels[timing]}
                </span>
              </label>
            )
          })}
        </div>
        
        {/* Warning if no timings selected */}
        {allowedTimings.length === 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Info size={14} />
            Selecteer minimaal één timing!
          </div>
        )}
      </div>
      
      {/* Locked indicator (optional feature) */}
      {locked && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🔒 Deze maaltijd is vergrendeld en wordt niet verplaatst tijdens optimalisatie
        </div>
      )}
    </div>
  )
}
