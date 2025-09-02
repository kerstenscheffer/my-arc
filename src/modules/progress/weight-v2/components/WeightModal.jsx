import React, { useState } from 'react'
import { X, Save, Clock } from 'lucide-react'

export default function WeightModal({ onClose, onSave, isMobile, theme }) {
  const [weight, setWeight] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('morning')
  const [feeling, setFeeling] = useState('normal')
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    if (!weight || saving) return
    
    setSaving(true)
    const success = await onSave({
      weight: parseFloat(weight),
      timeOfDay,
      feeling,
      notes: ''
    })
    
    if (success) {
      onClose()
    }
    setSaving(false)
  }
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          width: isMobile ? '100%' : '420px',
          maxHeight: isMobile ? '75vh' : 'auto',
          overflowY: 'auto',
          animation: isMobile ? 'slideUp 0.3s ease' : 'scaleIn 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile */}
        {isMobile && (
          <div style={{
            width: '48px',
            height: '4px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            margin: '0 auto 1.5rem'
          }} />
        )}
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            Gewicht Invoeren
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.transform = 'rotate(90deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.transform = 'rotate(0deg)'
            }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>
        
        {/* Weight Input */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: `2px solid ${theme.primary}`,
          position: 'relative'
        }}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: isMobile ? '2.5rem' : '3rem',
              fontWeight: 'bold',
              color: '#fff',
              width: '100%',
              textAlign: 'center'
            }}
            autoFocus={!isMobile}
          />
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            marginTop: '0.5rem'
          }}>
            kilogram
          </div>
          
          {/* Decorative gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: theme.gradient,
            borderRadius: '16px 16px 0 0'
          }} />
        </div>
        
        {/* Time Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <Clock size={14} />
            Tijd van de dag
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            {[
              { id: 'morning', label: 'Ochtend', icon: '🌅' },
              { id: 'afternoon', label: 'Middag', icon: '☀️' },
              { id: 'evening', label: 'Avond', icon: '🌙' }
            ].map(time => (
              <button
                key={time.id}
                onClick={() => setTimeOfDay(time.id)}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: timeOfDay === time.id ? theme.gradient : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${timeOfDay === time.id ? theme.primary : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{time.icon}</span>
                <span>{time.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Feeling Selection */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem'
          }}>
            Hoe voel je je?
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            {[
              { id: 'great', emoji: '😊', label: 'Goed' },
              { id: 'normal', emoji: '😐', label: 'Normaal' },
              { id: 'tired', emoji: '😴', label: 'Moe' }
            ].map(mood => (
              <button
                key={mood.id}
                onClick={() => setFeeling(mood.id)}
                style={{
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: feeling === mood.id 
                    ? `${theme.primary}22`
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${feeling === mood.id ? theme.primary : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {mood.emoji}
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!weight || saving}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.125rem',
            background: weight && !saving ? theme.gradient : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '14px',
            color: weight && !saving ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            cursor: weight && !saving ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: weight && !saving ? '0 8px 24px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          {saving ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
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
              Opslaan
            </>
          )}
        </button>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
