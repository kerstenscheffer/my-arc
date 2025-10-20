// src/modules/ai-meal-generator/tabs/meal-selector/SlotPreview.jsx
import { Grid3x3, Target, Zap, TrendingUp, AlertCircle } from 'lucide-react'

export default function SlotPreview({ 
  slotUsage, 
  forcedMealsConfig, 
  mealsPerDay,
  isMobile 
}) {
  const progressPercentage = Math.min(100, slotUsage.percentage)
  const isOverbooked = slotUsage.forcedSlots > slotUsage.totalSlots
  
  // Calculate distribution by timing
  const timingDistribution = calculateTimingDistribution(forcedMealsConfig, mealsPerDay)
  
  return (
    <div style={{
      marginTop: '1.5rem',
      padding: isMobile ? '1rem' : '1.25rem',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
      borderRadius: isMobile ? '12px' : '14px',
      border: `1px solid ${isOverbooked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.02) 50%, transparent 100%)',
        animation: 'slideGradient 8s ease infinite',
        pointerEvents: 'none'
      }} />
      
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h4 style={{ 
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '700',
          color: isOverbooked ? '#ef4444' : '#3b82f6',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Grid3x3 size={20} />
          Slot Preview
          {isOverbooked && (
            <span style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: '#ef4444',
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              OVERBOOKED!
            </span>
          )}
        </h4>
        
        {/* Main Progress Bar */}
        <div style={{ 
          position: 'relative',
          height: isMobile ? '50px' : '60px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
          borderRadius: '12px',
          marginBottom: '1.25rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Progress fill */}
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            background: isOverbooked 
              ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #ef4444 100%)'
              : progressPercentage >= 90
                ? 'linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #3b82f6 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease infinite',
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}>
            {/* Gloss effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
          </div>
          
          {/* Center text */}
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontWeight: '800',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {slotUsage.forcedSlots} / {slotUsage.totalSlots}
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '600'
            }}>
              slots ({slotUsage.percentage}%)
            </div>
          </div>
        </div>
        
        {/* Statistics Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
              Total Slots
            </div>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {slotUsage.totalSlots}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              {mealsPerDay}×7 dagen
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
              Forced
            </div>
            <div style={{ 
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: isOverbooked ? '#ef4444' : '#10b981'
            }}>
              {slotUsage.forcedSlots}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              verplicht
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
              AI Fill
            </div>
            <div style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
              {Math.max(0, slotUsage.remainingSlots)}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              vrije slots
            </div>
          </div>
        </div>
        
        {/* Timing Distribution */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h5 style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Target size={14} />
            Timing Verdeling
          </h5>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            fontSize: '0.75rem'
          }}>
            {Object.entries(timingDistribution).map(([timing, count]) => (
              <div key={timing} style={{
                textAlign: 'center',
                padding: '0.4rem',
                background: count > 7 
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: `1px solid ${count > 7 
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(255,255,255,0.05)'}`
              }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
                  {timing}
                </div>
                <div style={{ 
                  color: count > 7 ? '#f59e0b' : '#fff',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  {count}×
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Per-meal breakdown */}
        {forcedMealsConfig.length > 0 && (
          <div style={{ 
            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
            paddingTop: '1rem'
          }}>
            <h5 style={{ 
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <TrendingUp size={14} />
              Maaltijd Breakdown
            </h5>
            
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {forcedMealsConfig.map((config, index) => (
                <div 
                  key={config.meal.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.85rem',
                      color: '#fff',
                      fontWeight: '500',
                      marginBottom: '0.25rem'
                    }}>
                      {config.meal.name.length > 25 
                        ? config.meal.name.substring(0, 25) + '...'
                        : config.meal.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      {config.allowedTimings.map(t => (
                        <span key={t} style={{
                          padding: '0.1rem 0.3rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          borderRadius: '4px',
                          color: '#10b981',
                          fontSize: '0.65rem'
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{ 
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#10b981',
                      minWidth: '35px',
                      textAlign: 'right'
                    }}>
                      {config.frequency}×
                    </div>
                    
                    {/* Mini progress bar */}
                    <div style={{
                      width: '50px',
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(config.frequency / slotUsage.totalSlots) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Warning messages */}
        {isOverbooked && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>
              Je hebt {slotUsage.forcedSlots - slotUsage.totalSlots} slots te veel! 
              Verminder frequencies of verwijder maaltijden.
            </span>
          </div>
        )}
        
        {slotUsage.remainingSlots === 0 && !isOverbooked && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={16} />
            Perfect! Alle slots zijn exact gevuld met forced meals.
          </div>
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        @keyframes slideGradient {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

// Helper function to calculate timing distribution
function calculateTimingDistribution(forcedMealsConfig, mealsPerDay) {
  const distribution = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0
  }
  
  forcedMealsConfig.forEach(config => {
    const frequencyPerTiming = config.frequency / config.allowedTimings.length
    config.allowedTimings.forEach(timing => {
      distribution[timing] = Math.round((distribution[timing] || 0) + frequencyPerTiming)
    })
  })
  
  return distribution
}
