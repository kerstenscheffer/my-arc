// src/modules/meal-plan/components/SaveIndicator.jsx
// 🔄 Subtiele save indicator component

import React from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'

export default function SaveIndicator({ status = 'idle', lastSaved = null }) {
  // Status kan zijn: 'idle', 'saving', 'saved', 'error'
  
  if (status === 'idle' && !lastSaved) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 10000,
      animation: 'slideIn 0.3s ease'
    }}>
      {/* Saving State */}
      {status === 'saving' && (
        <div style={{
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            position: 'relative'
          }}>
            <Loader2 
              size={16} 
              style={{ 
                color: '#10b981',
                animation: 'spin 1s linear infinite',
                position: 'absolute'
              }} 
            />
          </div>
          <span style={{
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: '500',
            letterSpacing: '0.02em'
          }}>
            Opslaan
          </span>
        </div>
      )}
      
      {/* Saved State */}
      {status === 'saved' && (
        <div style={{
          background: 'rgba(15, 15, 15, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          animation: 'fadeSuccess 2s ease'
        }}>
          <Check 
            size={16} 
            style={{ 
              color: '#10b981',
              animation: 'checkIn 0.3s ease'
            }} 
          />
          <span style={{
            color: 'rgba(16, 185, 129, 0.9)',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Opgeslagen
          </span>
        </div>
      )}
      
      {/* Error State */}
      {status === 'error' && (
        <div style={{
          background: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <AlertCircle 
            size={16} 
            style={{ color: '#ef4444' }} 
          />
          <span style={{
            color: '#ef4444',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Fout bij opslaan
          </span>
        </div>
      )}
      
      {/* Idle with Last Saved */}
      {status === 'idle' && lastSaved && (
        <div style={{
          background: 'rgba(15, 15, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '8px 14px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          opacity: 0.7,
          transition: 'opacity 0.3s ease',
          cursor: 'default'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.8)',
              animation: 'pulse 2s ease infinite'
            }} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              fontWeight: '400'
            }}>
              {lastSaved.toLocaleTimeString('nl-NL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes checkIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fadeSuccess {
          0% { opacity: 0; transform: scale(0.9); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

// Usage in MealPlanMain:
/*
import SaveIndicator from './components/SaveIndicator'

// In state:
const [saveStatus, setSaveStatus] = useState('idle') // 'idle', 'saving', 'saved', 'error'

// In render:
<SaveIndicator status={saveStatus} lastSaved={lastSaved} />

// When saving:
setSaveStatus('saving')
// After success:
setSaveStatus('saved')
setTimeout(() => setSaveStatus('idle'), 2000)
// On error:
setSaveStatus('error')
setTimeout(() => setSaveStatus('idle'), 3000)
*/
