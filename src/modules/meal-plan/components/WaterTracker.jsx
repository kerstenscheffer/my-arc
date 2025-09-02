// src/modules/meal-plan/components/WaterTracker.jsx
import React from 'react'
import { Droplet } from 'lucide-react'

export default function WaterTracker({ waterIntake, onUpdateWater }) {
  const glasses = Math.floor(waterIntake * 4)
  const maxGlasses = 8
  const targetLiters = 2.0
  const percentage = Math.min(100, Math.round((waterIntake / targetLiters) * 100))
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
      borderRadius: '16px',
      padding: '1rem',
      margin: '0 1rem 1rem',
      border: '1px solid rgba(59, 130, 246, 0.1)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplet size={18} style={{ color: '#3b82f6' }} />
          <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '600' }}>
            Water Intake
          </span>
        </div>
        <span style={{
          color: '#3b82f6',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {waterIntake.toFixed(1)}L / {targetLiters}L
        </span>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        height: '6px',
        overflow: 'hidden',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          height: '100%',
          width: `${percentage}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
        }} />
      </div>
      
      {/* Glass Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '0.5rem'
      }}>
        {Array.from({ length: maxGlasses }).map((_, i) => (
          <GlassButton
            key={i}
            index={i}
            isFilled={i < glasses}
            onClick={() => onUpdateWater((i + 1) * 0.25)}
          />
        ))}
      </div>
      
      {/* Motivational Text */}
      {percentage >= 100 && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <span style={{
            color: '#10b981',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            🎉 Dagelijks doel bereikt!
          </span>
        </div>
      )}
    </div>
  )
}

function GlassButton({ index, isFilled, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1',
        background: isFilled 
          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          : 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isFilled) {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isFilled) {
          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
          e.currentTarget.style.transform = 'scale(1)'
        }
      }}
    >
      {isFilled && (
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '-10px',
          right: '-10px',
          height: '70%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
          borderRadius: '50%',
          animation: `wave ${2 + index * 0.1}s ease-in-out infinite`
        }} />
      )}
      
      <Droplet 
        size={16} 
        style={{ 
          color: isFilled ? '#fff' : 'rgba(59, 130, 246, 0.3)',
          fill: isFilled ? '#fff' : 'none',
          position: 'relative',
          zIndex: 1
        }} 
      />
      
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </button>
  )
}
