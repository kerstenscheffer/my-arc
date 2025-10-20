import React from 'react'
import { Check, Loader2, Scale } from 'lucide-react'

const THEME = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  primaryLightest: '#93c5fd',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  gradientLight: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
  gradientSubtle: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
  success: '#10b981',
  friday: '#8b5cf6'
}

export default function WeightProgressRing({ 
  weight = 70,
  onWeightChange,
  onSave,
  saving = false,
  todayEntry = null,
  progressPercent = 0,
  isFriday = false,
  isMobile = false
}) {
  
  // Ring calculation
  const radius = isMobile ? 70 : 85
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference
  
  return (
    <div style={{
      background: THEME.gradientSubtle,
      borderRadius: '24px',
      padding: isMobile ? '1.5rem' : '2rem',
      backdropFilter: 'blur(20px)',
      border: `1px solid rgba(59, 130, 246, 0.2)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
    }}>
      {/* Background Scale Icon */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.03,
        pointerEvents: 'none'
      }}>
        <Scale size={isMobile ? 250 : 350} color={THEME.primary} />
      </div>
      
      {/* Floating Bubbles */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${THEME.primaryLight}20, transparent)`,
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '5%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${THEME.primary}15, transparent)`,
        animation: 'float 10s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '80%',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${THEME.primaryLightest}25, transparent)`,
        animation: 'float 6s ease-in-out infinite',
        animationDelay: '2s',
        pointerEvents: 'none'
      }} />
      
      {/* Progress Ring */}
      <div style={{
        position: 'relative',
        width: radius * 2,
        height: radius * 2,
        marginBottom: '1.5rem',
        filter: 'drop-shadow(0 8px 24px rgba(59, 130, 246, 0.25))'
      }}>
        <svg
          height={radius * 2}
          width={radius * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background circle */}
          <circle
            stroke="rgba(59, 130, 246, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={progressPercent >= 90 ? THEME.success : THEME.primary}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease',
              strokeLinecap: 'round',
              filter: `drop-shadow(0 0 ${progressPercent >= 90 ? '12px' : '8px'} ${progressPercent >= 90 ? THEME.success : THEME.primary}66)`
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Center content */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '50%',
          width: '80%',
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.15)'
        }}>
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            background: THEME.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1
          }}>
            {weight.toFixed(1)}
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            color: THEME.primaryLight,
            marginTop: '0.25rem',
            opacity: 0.8
          }}>
            kilogram
          </div>
        </div>
      </div>
      
      {/* Weight Input Controls */}
      <div style={{
        width: '100%',
        marginBottom: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={() => onWeightChange(Math.max(40, weight - 0.1))}
            disabled={todayEntry}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: todayEntry ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${todayEntry ? 'rgba(255,255,255,0.1)' : THEME.primary}`,
              color: todayEntry ? 'rgba(255,255,255,0.3)' : THEME.primary,
              fontSize: '1.5rem',
              cursor: todayEntry ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              if (!todayEntry) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!todayEntry) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            -
          </button>
          
          <div style={{
            flex: 1,
            position: 'relative',
            height: '36px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              type="range"
              min="40"
              max="150"
              step="0.1"
              value={weight}
              onChange={(e) => onWeightChange(parseFloat(e.target.value))}
              disabled={todayEntry}
              style={{
                width: '100%',
                height: '8px',
                appearance: 'none',
                background: 'rgba(59, 130, 246, 0.15)',
                borderRadius: '4px',
                outline: 'none',
                opacity: todayEntry ? 0.5 : 1,
                cursor: todayEntry ? 'not-allowed' : 'pointer'
              }}
            />
            {/* Slider Glow */}
            <div style={{
              position: 'absolute',
              left: `${((weight - 40) / (150 - 40)) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: THEME.primary,
              boxShadow: `0 0 20px ${THEME.primary}66`,
              pointerEvents: 'none',
              opacity: todayEntry ? 0.3 : 0.6
            }} />
          </div>
          
          <button
            onClick={() => onWeightChange(Math.min(150, weight + 0.1))}
            disabled={todayEntry}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: todayEntry ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${todayEntry ? 'rgba(255,255,255,0.1)' : THEME.primary}`,
              color: todayEntry ? 'rgba(255,255,255,0.3)' : THEME.primary,
              fontSize: '1.5rem',
              cursor: todayEntry ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              if (!todayEntry) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!todayEntry) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            +
          </button>
        </div>
        
        {/* Save button */}
        <button
          onClick={onSave}
          disabled={todayEntry || saving}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: isMobile ? '0.875rem' : '1rem',
            background: todayEntry ? 'rgba(255,255,255,0.05)' : THEME.gradient,
            border: todayEntry ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            cursor: todayEntry || saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            opacity: todayEntry ? 0.5 : 1,
            boxShadow: todayEntry ? 'none' : '0 8px 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!todayEntry && !saving) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (!todayEntry && !saving) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Opslaan...
            </>
          ) : todayEntry ? (
            <>
              <Check size={18} />
              Al Ingelogd
            </>
          ) : (
            'Gewicht Opslaan'
          )}
        </button>
      </div>
      
      {/* Friday Badge */}
      {isFriday && !todayEntry && (
        <div style={{
          padding: '0.5rem 1rem',
          background: `linear-gradient(135deg, ${THEME.friday}33, ${THEME.friday}11)`,
          border: `1px solid ${THEME.friday}55`,
          borderRadius: '10px',
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          color: THEME.friday,
          fontWeight: '600',
          boxShadow: `0 4px 12px ${THEME.friday}22`
        }}>
          🌟 Vrijdag Weging
        </div>
      )}
      
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: ${THEME.gradient};
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: ${THEME.gradient};
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transition: all 0.2s ease;
        }
        
        input[type="range"]:disabled::-webkit-slider-thumb,
        input[type="range"]:disabled::-moz-range-thumb {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
