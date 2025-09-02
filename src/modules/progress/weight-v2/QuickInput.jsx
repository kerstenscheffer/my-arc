import React, { useState, useEffect } from 'react'
import { Save, Minus, Plus, Check } from 'lucide-react'

export default function QuickInput({ currentValue, onSave, isMobile, theme }) {
  const [value, setValue] = useState(currentValue || 70)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    if (currentValue) setValue(currentValue)
  }, [currentValue])
  
  const handleSave = async () => {
    setSaving(true)
    const saved = await onSave(value)
    setSaving(false)
    
    if (saved) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }
  
  const adjust = (amount) => {
    setValue(prev => Math.max(30, Math.min(200, prev + amount)))
  }
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${theme.light} 0%, rgba(37, 99, 235, 0.05) 100%)`,
      borderRadius: '20px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: '1.5rem',
      border: `1px solid ${theme.border}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: theme.gradient,
        opacity: 0.1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '-30px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: theme.gradient,
        opacity: 0.08
      }} />
      
      {/* Main Ring Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '1.5rem' : '2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Progress Ring */}
        <div style={{
          position: 'relative',
          width: isMobile ? '160px' : '200px',
          height: isMobile ? '160px' : '200px'
        }}>
          <svg 
            width={isMobile ? 160 : 200} 
            height={isMobile ? 160 : 200}
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={isMobile ? 80 : 100}
              cy={isMobile ? 80 : 100}
              r={isMobile ? 70 : 88}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx={isMobile ? 80 : 100}
              cy={isMobile ? 80 : 100}
              r={isMobile ? 70 : 88}
              stroke={theme.primary}
              strokeWidth="12"
              fill="none"
              strokeDasharray={isMobile ? 440 : 553}
              strokeDashoffset={100}
              strokeLinecap="round"
              style={{
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 4px 20px ${theme.primary}66)`
              }}
            />
          </svg>
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '2.5rem' : '3rem',
              fontWeight: 'bold',
              color: '#fff',
              lineHeight: 1
            }}>
              {value.toFixed(1)}
            </div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '0.25rem'
            }}>
              kilogram
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '1rem' : '1.5rem',
          width: '100%',
          justifyContent: 'center'
        }}>
          {/* Decrease Button */}
          <button
            onClick={() => adjust(-0.5)}
            style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Minus size={20} />
          </button>
          
          {/* Slider */}
          <div style={{
            flex: 1,
            maxWidth: '200px',
            position: 'relative'
          }}>
            <input
              type="range"
              min="30"
              max="200"
              step="0.1"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                background: `linear-gradient(to right, ${theme.primary} 0%, ${theme.primary} ${((value - 30) / 170) * 100}%, rgba(255,255,255,0.1) ${((value - 30) / 170) * 100}%, rgba(255,255,255,0.1) 100%)`,
                borderRadius: '3px',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: ${theme.primary};
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
              }
              
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: ${theme.primary};
                border-radius: 50%;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
              }
            `}</style>
          </div>
          
          {/* Increase Button */}
          <button
            onClick={() => adjust(0.5)}
            style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Plus size={20} />
          </button>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            maxWidth: '250px',
            padding: isMobile ? '0.875rem' : '1rem',
            background: success ? theme.success : saving ? 'rgba(255,255,255,0.1)' : theme.gradient,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: success ? '0 8px 24px rgba(16, 185, 129, 0.3)' : '0 4px 16px rgba(59, 130, 246, 0.3)'
          }}
        >
          {success ? (
            <>
              <Check size={20} />
              Opgeslagen!
            </>
          ) : saving ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Opslaan...
            </>
          ) : (
            <>
              <Save size={20} />
              Quick Save
            </>
          )}
        </button>
      </div>
    </div>
  )
}
