// src/modules/lead-pic-generator/components/EditPanels/RewardEditors/TimerEditor.jsx
import React from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

export default function TimerEditor({ content, updateContent, isMobile }) {
  
  const currentContent = {
    title: 'Deze lijst verdwijnt in:',
    hours: '23',
    minutes: '47',
    seconds: '12',
    cta: 'DM "NU" voordat het te laat is',
    warning: 'Nooit meer deze prijs',
    ...content
  }
  
  // Validate time input
  const validateTime = (value, max) => {
    const num = parseInt(value) || 0
    return Math.min(Math.max(0, num), max).toString().padStart(2, '0')
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <Clock size={20} style={{ color: '#ef4444' }} />
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#ef4444'
        }}>
          TIMER TEMPLATE
        </span>
      </div>
      
      {/* Title */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Timer Titel
        </label>
        <input
          value={currentContent.title}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            title: e.target.value 
          })}
          placeholder="Deze lijst verdwijnt in:"
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600',
            outline: 'none'
          }}
        />
      </div>
      
      {/* Timer Inputs */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px'
        }}>
          <Clock size={14} />
          Countdown Timer
        </label>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px'
        }}>
          {/* Hours */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px',
              textAlign: 'center'
            }}>
              Uren
            </label>
            <input
              type="number"
              value={currentContent.hours}
              onChange={(e) => updateContent({ 
                ...currentContent, 
                hours: validateTime(e.target.value, 99)
              })}
              min="0"
              max="99"
              style={{
                width: '100%',
                padding: '15px 10px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '24px',
                fontWeight: '800',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Minutes */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px',
              textAlign: 'center'
            }}>
              Minuten
            </label>
            <input
              type="number"
              value={currentContent.minutes}
              onChange={(e) => updateContent({ 
                ...currentContent, 
                minutes: validateTime(e.target.value, 59)
              })}
              min="0"
              max="59"
              style={{
                width: '100%',
                padding: '15px 10px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '24px',
                fontWeight: '800',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Seconds */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '6px',
              textAlign: 'center'
            }}>
              Seconden
            </label>
            <input
              type="number"
              value={currentContent.seconds}
              onChange={(e) => updateContent({ 
                ...currentContent, 
                seconds: validateTime(e.target.value, 59)
              })}
              min="0"
              max="59"
              style={{
                width: '100%',
                padding: '15px 10px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '2px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '24px',
                fontWeight: '800',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Warning Text */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          <AlertTriangle size={14} />
          Warning Tekst
        </label>
        <input
          value={currentContent.warning}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            warning: e.target.value 
          })}
          placeholder="Nooit meer deze prijs"
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            color: '#f59e0b',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* CTA */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '8px'
        }}>
          Call-to-Action
        </label>
        <input
          value={currentContent.cta}
          onChange={(e) => updateContent({ 
            ...currentContent, 
            cta: e.target.value 
          })}
          placeholder='DM "NU" voordat het te laat is'
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px' : '12px 15px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            outline: 'none',
            textAlign: 'center'
          }}
        />
      </div>
      
      {/* Live Preview */}
      <div style={{
        marginTop: '10px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Live Preview
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '15px'
          }}>
            {currentContent.title}
          </div>
          
          {/* Timer Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '15px 10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              minWidth: '60px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '900',
                color: '#ef4444',
                lineHeight: '1'
              }}>
                {currentContent.hours}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '2px'
              }}>
                UUR
              </div>
            </div>
            
            <span style={{
              fontSize: '24px',
              color: '#ef4444',
              fontWeight: '700'
            }}>:</span>
            
            <div style={{
              padding: '15px 10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              minWidth: '60px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '900',
                color: '#ef4444',
                lineHeight: '1'
              }}>
                {currentContent.minutes}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '2px'
              }}>
                MIN
              </div>
            </div>
            
            <span style={{
              fontSize: '24px',
              color: '#ef4444',
              fontWeight: '700'
            }}>:</span>
            
            <div style={{
              padding: '15px 10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              minWidth: '60px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '900',
                color: '#ef4444',
                lineHeight: '1'
              }}>
                {currentContent.seconds}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '2px'
              }}>
                SEC
              </div>
            </div>
          </div>
          
          {/* Warning */}
          {currentContent.warning && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '15px',
              fontSize: '13px',
              color: '#f59e0b'
            }}>
              <AlertTriangle size={14} />
              {currentContent.warning}
            </div>
          )}
          
          {/* CTA Button */}
          <div style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            borderRadius: '25px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '700',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}>
            {currentContent.cta}
          </div>
        </div>
      </div>
    </div>
  )
}
