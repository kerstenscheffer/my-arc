// src/modules/goals/components/GoalCard.jsx - FIXED VERSION
import React from 'react'
import { Target, ChevronRight } from 'lucide-react'
import { goalCategories } from '../config'
import { calculateProgress, getDaysRemaining, getProgressRingValues } from '../utils'
import { isMobile } from '../config'

export function GoalCard({ goal, isExpanded, onToggle, renderTrackingInput }) {
  const mobile = isMobile()
  const progress = calculateProgress(goal)
  const daysLeft = getDaysRemaining(goal.target_date)
  const category = goalCategories[goal.category || goal.main_category] || goalCategories.structuur
  
  // Get progress ring values from utils
  const ringValues = getProgressRingValues(progress, mobile ? 50 : 60)
  
  return (
    <div 
      style={{
        background: category.darkGradient,
        border: `1px solid ${category.color}33`,
        borderRadius: '12px',
        padding: mobile ? '1rem' : '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      onClick={() => onToggle(goal.id)}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? '0.75rem' : '1rem' }}>
          <div style={{
            width: mobile ? '40px' : '50px',
            height: mobile ? '40px' : '50px',
            borderRadius: '12px',
            background: category.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Target size={mobile ? 20 : 24} color="#fff" />
          </div>
          <div>
            <h4 style={{ 
              fontSize: mobile ? '1rem' : '1.1rem', 
              fontWeight: 'bold', 
              marginBottom: '0.25rem',
              color: '#fff'
            }}>
              {goal.title}
            </h4>
            <div style={{ 
              fontSize: mobile ? '0.8rem' : '0.875rem', 
              color: 'rgba(255,255,255,0.6)' 
            }}>
              {goal.current_value || 0} / {goal.target_value} {goal.unit}
            </div>
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          {/* Progress Ring SVG */}
          <svg 
            width={ringValues.size} 
            height={ringValues.size} 
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={ringValues.size / 2}
              cy={ringValues.size / 2}
              r={ringValues.radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={ringValues.strokeWidth}
              fill="none"
            />
            <circle
              cx={ringValues.size / 2}
              cy={ringValues.size / 2}
              r={ringValues.radius}
              stroke={category.color}
              strokeWidth={ringValues.strokeWidth}
              fill="none"
              strokeDasharray={ringValues.circumference}
              strokeDashoffset={ringValues.strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: mobile ? '0.75rem' : '0.875rem',
            fontWeight: 'bold',
            color: category.color
          }}>
            {progress}%
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: mobile ? '0.8rem' : '0.875rem',
        color: 'rgba(255,255,255,0.6)'
      }}>
        <span>
          {daysLeft > 0 ? `${daysLeft} dagen te gaan` : 'Deadline bereikt'}
        </span>
        <ChevronRight size={16} style={{
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 0.2s'
        }} />
      </div>
      
      {isExpanded && (
        <div 
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${category.color}20`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {renderTrackingInput(goal)}
        </div>
      )}
    </div>
  )
}
