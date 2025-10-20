// src/modules/meal-plan/components/AIDailyGoals.jsx
import React, { useState } from 'react'
import { 
  Flame, Target, Droplets, Plus, Calendar,
  Frown, Meh, CircleSlash, Smile, SmilePlus,
  TrendingUp, Zap, Activity, Utensils, Apple,
  Wheat, Beef
} from 'lucide-react'

export default function AIDailyGoals({ 
  dailyTotals, 
  waterIntake, 
  todayMood,
  onUpdateWater,
  onLogMood,
  onQuickIntake,
  db 
}) {
  const isMobile = window.innerWidth <= 768
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [selectedMoodScore, setSelectedMoodScore] = useState(todayMood?.mood_score || null)
  
  // Calculate progress for all 4 macros
  const caloriesPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.calories || 0) / (dailyTotals?.targets?.calories || 2200)) * 100
  ))
  const proteinPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.protein || 0) / (dailyTotals?.targets?.protein || 165)) * 100
  ))
  const carbsPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.carbs || 0) / (dailyTotals?.targets?.carbs || 220)) * 100
  ))
  const fatPercent = Math.min(100, Math.round(
    ((dailyTotals?.consumed?.fat || 0) / (dailyTotals?.targets?.fat || 73)) * 100
  ))
  const waterPercent = Math.min(100, Math.round((waterIntake / 2000) * 100))
  
  // Mood icons with Lucide
  const moodIcons = [
    { icon: Frown, color: '#ef4444', label: 'Slecht' },
    { icon: Meh, color: '#f97316', label: 'Matig' },
    { icon: CircleSlash, color: '#eab308', label: 'Neutraal' },
    { icon: Smile, color: '#84cc16', label: 'Goed' },
    { icon: SmilePlus, color: '#10b981', label: 'Geweldig' }
  ]
  
  const handleWaterClick = () => {
    const newAmount = waterIntake >= 3000 ? 0 : waterIntake + 200
    onUpdateWater(newAmount)
  }
  
  const handleMoodSelect = async (score) => {
    console.log('🎯 Selecting mood:', score)
    
    // Update local state immediately for UI feedback
    setSelectedMoodScore(score)
    setShowMoodSelector(false)
    
    // Save to database
    const result = await onLogMood({ score, reason: null })
    
    // If save failed, revert to previous state
    if (!result) {
      console.error('❌ Failed to save mood, reverting')
      setSelectedMoodScore(todayMood?.mood_score || null)
    }
  }

  // Helper function for macro card
  const MacroCard = ({ label, icon: Icon, value, target, unit, percent, color, iconSize = 16 }) => {
    const isGood = percent >= 90
    const isOk = percent >= 70
    
    return (
      <div style={{
        background: isGood 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)'
          : isOk
          ? `linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, ${color}08 100%)`
          : `linear-gradient(135deg, ${color}12 0%, ${color}04 100%)`,
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '0.75rem' : '1rem',
        border: isGood 
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : isOk
          ? '1px solid rgba(16, 185, 129, 0.15)'
          : `1px solid ${color}20`,
        position: 'relative',
        backdropFilter: 'blur(20px)',
        boxShadow: isGood
          ? '0 4px 16px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.02)',
        minHeight: isMobile ? '90px' : '100px',
        overflow: 'hidden'
      }}>
        {/* Glass overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.3rem' : '0.4rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Icon size={isMobile ? 12 : 13} color={isOk ? '#10b981' : color} style={{ opacity: 0.8 }} />
            <span style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              color: 'rgba(255, 255, 255, 0.35)',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {label}
            </span>
          </div>
          
          <div style={{
            background: isGood 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)'
              : isOk
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
              : `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            padding: '0.1rem 0.3rem',
            borderRadius: '4px',
            fontSize: isMobile ? '0.55rem' : '0.6rem',
            fontWeight: '700',
            color: isOk ? '#10b981' : color,
            border: `1px solid ${isOk ? 'rgba(16, 185, 129, 0.3)' : color + '25'}`,
            backdropFilter: 'blur(10px)'
          }}>
            {percent}%
          </div>
        </div>
        
        {/* Value */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.25rem',
          marginBottom: '0.3rem'
        }}>
          <span style={{
            fontSize: isMobile ? '1.1rem' : '1.3rem',
            fontWeight: '800',
            color: isOk ? '#10b981' : color,
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}>
            {value}
          </span>
          <span style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            color: 'rgba(255, 255, 255, 0.25)',
            fontWeight: '500'
          }}>
            / {target}{unit}
          </span>
        </div>
        
        {/* Progress bar */}
        <div style={{
          height: '5px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '2.5px',
          overflow: 'hidden',
          border: '0.5px solid rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: isGood
              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              : isOk
              ? 'linear-gradient(90deg, #84cc16 0%, #10b981 100%)'
              : `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOk 
              ? '0 0 10px rgba(16, 185, 129, 0.4)'
              : `0 0 8px ${color}40`
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: isMobile ? '0.75rem' : '1.5rem'
    }}>
      {/* Header - Compact with green gradient */}
      <div style={{
        marginBottom: isMobile ? '0.5rem' : '1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.15rem'
        }}>
          Dagelijkse Doelen
        </h2>
        <p style={{
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          color: 'rgba(16, 185, 129, 0.5)',
          margin: 0,
          fontWeight: '500'
        }}>
          {dailyTotals?.mealsConsumed || 0} van {dailyTotals?.mealsPlanned || 4} maaltijden • {new Date().toLocaleDateString('nl-NL', { weekday: 'long' })}
        </p>
      </div>
      
      {/* Primary Goals Cards - 2x2 GRID voor alle 4 macros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // 2x2 grid
        gap: isMobile ? '0.5rem' : '1rem',
        marginBottom: isMobile ? '0.625rem' : '1rem'
      }}>
        {/* Calories */}
        <MacroCard
          label="Calorieën"
          icon={Activity}
          value={dailyTotals?.consumed?.calories || 0}
          target={dailyTotals?.targets?.calories || 2200}
          unit=""
          percent={caloriesPercent}
          color="#f97316"
        />
        
        {/* Protein */}
        <MacroCard
          label="Eiwitten"
          icon={Zap}
          value={dailyTotals?.consumed?.protein || 0}
          target={dailyTotals?.targets?.protein || 165}
          unit="g"
          percent={proteinPercent}
          color="#8b5cf6"
        />
        
        {/* Carbs */}
        <MacroCard
          label="Koolhydraten"
          icon={Wheat}
          value={dailyTotals?.consumed?.carbs || 0}
          target={dailyTotals?.targets?.carbs || 220}
          unit="g"
          percent={carbsPercent}
          color="#3b82f6"
        />
        
        {/* Fat */}
        <MacroCard
          label="Vetten"
          icon={Beef}
          value={dailyTotals?.consumed?.fat || 0}
          target={dailyTotals?.targets?.fat || 73}
          unit="g"
          percent={fatPercent}
          color="#fbbf24"
        />
      </div>
      
      {/* Action Bar - Premium Glass with MORE green accents */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        {/* Water Intake - 50% - GREEN when good */}
        <button
          onClick={handleWaterClick}
          style={{
            background: waterPercent >= 80
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%)',
            borderRadius: '14px',
            padding: isMobile ? '0.75rem' : '0.875rem',
            border: waterPercent >= 80
              ? '1px solid rgba(16, 185, 129, 0.2)'
              : '1px solid rgba(59, 130, 246, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Droplets size={16} color={waterPercent >= 80 ? '#10b981' : '#3b82f6'} />
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: '0.6rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.1rem'
              }}>
                Water
              </div>
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                color: waterPercent >= 80 ? '#10b981' : '#3b82f6'
              }}>
                {(waterIntake / 1000).toFixed(1)}L
              </div>
            </div>
          </div>
          
          {/* Mini circular progress - GREEN when good */}
          <div style={{
            width: '36px',
            height: '36px',
            position: 'relative'
          }}>
            <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={waterPercent >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'}
                strokeWidth="2"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={waterPercent >= 80 ? '#10b981' : '#3b82f6'}
                strokeWidth="2"
                strokeDasharray={`${waterPercent * 0.94} 94`}
                strokeLinecap="round"
                style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '0.6rem',
              fontWeight: '700',
              color: waterPercent >= 80 ? '#10b981' : '#3b82f6'
            }}>
              {waterPercent}%
            </div>
          </div>
        </button>
        
        {/* Mood Log - 25% ALWAYS CLICKABLE - GREEN when selected */}
        <button
          onClick={() => setShowMoodSelector(true)}
          style={{
            background: selectedMoodScore 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.04) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
            borderRadius: '14px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.875rem 0.625rem',
            border: '1px solid ' + (selectedMoodScore ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.2rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
        >
          {selectedMoodScore ? (
            React.createElement(moodIcons[selectedMoodScore - 1].icon, {
              size: isMobile ? 20 : 22,
              color: moodIcons[selectedMoodScore - 1].color
            })
          ) : (
            <SmilePlus size={isMobile ? 20 : 22} color="rgba(255, 255, 255, 0.4)" />
          )}
          <div style={{
            fontSize: '0.6rem',
            color: selectedMoodScore ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {selectedMoodScore ? moodIcons[selectedMoodScore - 1].label : 'Mood?'}
          </div>
        </button>
        
        {/* Quick Log - 25% STRONG GREEN */}
        <button
          onClick={() => setShowIntakeModal(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderRadius: '14px',
            padding: isMobile ? '0.75rem 0.5rem' : '0.875rem 0.625rem',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.2rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
          }}
        >
          <Plus size={isMobile ? 18 : 20} color="#10b981" />
          <div style={{
            fontSize: '0.6rem',
            color: '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            Quick
          </div>
        </button>
      </div>
      
      {/* Mood Selector Popup - Shows current mood highlighted */}
      {showMoodSelector && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
          backdropFilter: 'blur(30px)',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          padding: '1.25rem',
          zIndex: 100,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          {moodIcons.map((mood, index) => (
            <button
              key={index}
              onClick={() => handleMoodSelect(index + 1)}
              style={{
                background: selectedMoodScore === (index + 1)
                  ? `${mood.color}20`
                  : 'rgba(255, 255, 255, 0.03)',
                border: selectedMoodScore === (index + 1)
                  ? `2px solid ${mood.color}`
                  : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                padding: '0.75rem',
                borderRadius: '12px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                transform: selectedMoodScore === (index + 1) ? 'scale(1.1)' : 'scale(1)',
                boxShadow: selectedMoodScore === (index + 1) ? `0 8px 20px ${mood.color}30` : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'
                e.currentTarget.style.background = `${mood.color}15`
                e.currentTarget.style.borderColor = mood.color
                e.currentTarget.style.boxShadow = `0 8px 20px ${mood.color}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = selectedMoodScore === (index + 1) ? 'scale(1.1)' : 'scale(1)'
                e.currentTarget.style.background = selectedMoodScore === (index + 1) 
                  ? `${mood.color}20`
                  : 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = selectedMoodScore === (index + 1)
                  ? mood.color
                  : 'rgba(255, 255, 255, 0.08)'
                e.currentTarget.style.boxShadow = selectedMoodScore === (index + 1) ? `0 8px 20px ${mood.color}30` : 'none'
              }}
            >
              {React.createElement(mood.icon, {
                size: 24,
                color: mood.color
              })}
            </button>
          ))}
          
          {/* Close button */}
          <button
            onClick={() => setShowMoodSelector(false)}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '18px',
              fontWeight: '300',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Quick Intake Modal */}
      {showIntakeModal && (
        <QuickIntakeModal
          onClose={() => setShowIntakeModal(false)}
          onSave={onQuickIntake}
          targets={dailyTotals?.targets}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// Quick Intake Modal - Premium Glass with GREEN theme
function QuickIntakeModal({ onClose, onSave, targets, isMobile }) {
  const [selectedType, setSelectedType] = useState('percentage')
  const [percentage, setPercentage] = useState(null)
  const [exactValues, setExactValues] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  
  const percentageOptions = [
    { value: 100, label: '100%', color: '#10b981' },
    { value: 80, label: '80%', color: '#84cc16' },
    { value: 60, label: '60%', color: '#fbbf24' },
    { value: 40, label: '40%', color: '#f97316' }
  ]
  
  const handleSave = () => {
    if (selectedType === 'percentage' && percentage) {
      onSave({
        type: 'percentage',
        percentage: percentage,
        calories: Math.round((targets?.calories || 2200) * (percentage / 100)),
        protein: Math.round((targets?.protein || 165) * (percentage / 100)),
        carbs: Math.round((targets?.carbs || 220) * (percentage / 100)),
        fat: Math.round((targets?.fat || 73) * (percentage / 100))
      })
    } else if (selectedType === 'exact' && exactValues.calories) {
      onSave({
        type: 'exact',
        calories: parseInt(exactValues.calories),
        protein: parseInt(exactValues.protein) || 0,
        carbs: parseInt(exactValues.carbs) || 0,
        fat: parseInt(exactValues.fat) || 0
      })
    }
    onClose()
  }
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%)',
        borderRadius: isMobile ? '20px' : '24px',
        padding: isMobile ? '1.5rem' : '2rem',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1.5rem'
        }}>
          Quick Intake Log
        </h3>
        
        {/* Type Selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setSelectedType('percentage')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedType === 'percentage' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid ' + (selectedType === 'percentage' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'),
              borderRadius: '12px',
              color: selectedType === 'percentage' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Percentage
          </button>
          <button
            onClick={() => setSelectedType('exact')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedType === 'exact' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid ' + (selectedType === 'exact' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'),
              borderRadius: '12px',
              color: selectedType === 'exact' ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Exacte Waardes
          </button>
        </div>
        
        {/* Content */}
        {selectedType === 'percentage' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            {percentageOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setPercentage(option.value)}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: percentage === option.value 
                    ? `linear-gradient(135deg, ${option.color}15 0%, ${option.color}08 100%)`
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${percentage === option.value ? option.color : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: percentage === option.value ? 'scale(1.02)' : 'scale(1)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  backdropFilter: 'blur(10px)',
                  boxShadow: percentage === option.value ? `0 8px 20px ${option.color}20` : 'none'
                }}
              >
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  color: percentage === option.value ? option.color : 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.25rem'
                }}>
                  {option.label}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  {Math.round((targets?.calories || 2200) * (option.value / 100))} kcal
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="number"
              value={exactValues.calories}
              onChange={(e) => setExactValues(prev => ({ ...prev, calories: e.target.value }))}
              placeholder="Calorieën"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              }}
            />
            <input
              type="number"
              value={exactValues.protein}
              onChange={(e) => setExactValues(prev => ({ ...prev, protein: e.target.value }))}
              placeholder="Eiwitten (g)"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              }}
            />
            <input
              type="number"
              value={exactValues.carbs}
              onChange={(e) => setExactValues(prev => ({ ...prev, carbs: e.target.value }))}
              placeholder="Koolhydraten (g)"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              }}
            />
            <input
              type="number"
              value={exactValues.fat}
              onChange={(e) => setExactValues(prev => ({ ...prev, fat: e.target.value }))}
              placeholder="Vetten (g)"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                backdropFilter: 'blur(10px)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.15)'
              }}
            />
          </div>
        )}
        
        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={selectedType === 'percentage' ? !percentage : !exactValues.calories}
            style={{
              flex: 1,
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: (selectedType === 'percentage' ? !percentage : !exactValues.calories) ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              if (!(selectedType === 'percentage' ? !percentage : !exactValues.calories)) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}
