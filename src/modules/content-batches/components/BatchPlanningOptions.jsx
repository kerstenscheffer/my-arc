// src/modules/content-batches/components/BatchPlanningOptions.jsx
// Step 3: Choose planning type - Recurring, Manual, or Ready to Post

import { Calendar, Clock, CheckCircle } from 'lucide-react'
import { WEEKDAYS } from '../constants'
import { GOLD } from '../../output-planning/components/week-planning/constants'

export default function BatchPlanningOptions({
  planningType,
  recurringPattern,
  manualDates,
  itemCount,
  onPlanningTypeChange,
  onRecurringPatternChange,
  onManualDatesChange,
  isMobile = false
}) {
  
  const handleRecurringTypeChange = (type) => {
    if (type === 'daily') {
      onRecurringPatternChange({
        type: 'daily',
        time: '12:00'
      })
    } else if (type === 'weekly') {
      onRecurringPatternChange({
        type: 'weekly',
        day: 'wednesday',
        time: '18:00'
      })
    }
  }

  const handleRecurringDayChange = (day) => {
    onRecurringPatternChange({
      ...recurringPattern,
      day
    })
  }

  const handleRecurringTimeChange = (time) => {
    onRecurringPatternChange({
      ...recurringPattern,
      time
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Header */}
      <div>
        <h3 style={{
          margin: '0 0 0.5rem',
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          color: '#fff'
        }}>
          Hoe Wil Je Inplannen?
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          {itemCount} items moeten ingepland worden
        </p>
      </div>

      {/* Planning Type Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        {/* Recurring */}
        <button
          onClick={() => onPlanningTypeChange('recurring')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            background: planningType === 'recurring'
              ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`
              : 'rgba(255, 255, 255, 0.03)',
            border: planningType === 'recurring'
              ? `2px solid ${GOLD.primary}`
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: planningType === 'recurring'
              ? `${GOLD.primary}30`
              : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.75rem' }}>🔄</span>
          </div>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: planningType === 'recurring' ? GOLD.primary : '#fff',
              marginBottom: '0.25rem'
            }}>
              Recurring
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.4'
            }}>
              Automatisch wekelijks of dagelijks
            </div>
          </div>
        </button>

        {/* Manual */}
        <button
          onClick={() => onPlanningTypeChange('manual')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            background: planningType === 'manual'
              ? `linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(0,0,0,0.4) 100%)`
              : 'rgba(255, 255, 255, 0.03)',
            border: planningType === 'manual'
              ? '2px solid #3b82f6'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: planningType === 'manual'
              ? 'rgba(59, 130, 246, 0.3)'
              : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={28} color={planningType === 'manual' ? '#3b82f6' : 'rgba(255, 255, 255, 0.6)'} />
          </div>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: planningType === 'manual' ? '#3b82f6' : '#fff',
              marginBottom: '0.25rem'
            }}>
              Handmatig
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.4'
            }}>
              Kies zelf de dagen
            </div>
          </div>
        </button>

        {/* Ready to Post */}
        <button
          onClick={() => onPlanningTypeChange('ready')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            background: planningType === 'ready'
              ? `linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0,0,0,0.4) 100%)`
              : 'rgba(255, 255, 255, 0.03)',
            border: planningType === 'ready'
              ? '2px solid #10b981'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: planningType === 'ready'
              ? 'rgba(16, 185, 129, 0.3)'
              : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={28} color={planningType === 'ready' ? '#10b981' : 'rgba(255, 255, 255, 0.6)'} />
          </div>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: planningType === 'ready' ? '#10b981' : '#fff',
              marginBottom: '0.25rem'
            }}>
              Ready to Post
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.4'
            }}>
              Klaar, plan later in
            </div>
          </div>
        </button>
      </div>

      {/* Recurring Options */}
      {planningType === 'recurring' && (
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          background: `${GOLD.background}`,
          border: `1px solid ${GOLD.border}`,
          borderRadius: '12px'
        }}>
          <h4 style={{
            margin: '0 0 1.5rem',
            fontSize: '1rem',
            fontWeight: '700',
            color: GOLD.primary
          }}>
            🔄 Recurring Instellingen
          </h4>

          {/* Pattern Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem'
            }}>
              Herhaalpatroon
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => handleRecurringTypeChange('daily')}
                style={{
                  padding: '0.75rem',
                  background: recurringPattern?.type === 'daily'
                    ? GOLD.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: recurringPattern?.type === 'daily'
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: recurringPattern?.type === 'daily' ? '#000' : '#fff',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Dagelijks
              </button>
              <button
                onClick={() => handleRecurringTypeChange('weekly')}
                style={{
                  padding: '0.75rem',
                  background: recurringPattern?.type === 'weekly'
                    ? GOLD.primary
                    : 'rgba(255, 255, 255, 0.05)',
                  border: recurringPattern?.type === 'weekly'
                    ? 'none'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: recurringPattern?.type === 'weekly' ? '#000' : '#fff',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Wekelijks
              </button>
            </div>
          </div>

          {/* Weekly Day Selection */}
          {recurringPattern?.type === 'weekly' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.75rem'
              }}>
                Dag van de week
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)',
                gap: '0.5rem'
              }}>
                {WEEKDAYS.map(day => (
                  <button
                    key={day.id}
                    onClick={() => handleRecurringDayChange(day.id)}
                    style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '0.75rem',
                      background: recurringPattern?.day === day.id
                        ? GOLD.primary
                        : 'rgba(255, 255, 255, 0.05)',
                      border: recurringPattern?.day === day.id
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: recurringPattern?.day === day.id ? '#000' : '#fff',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.75rem'
            }}>
              <Clock size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Tijdstip
            </label>
            <input
              type="time"
              value={recurringPattern?.time || '12:00'}
              onChange={(e) => handleRecurringTimeChange(e.target.value)}
              style={{
                width: isMobile ? '100%' : '200px',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Preview */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <div style={{
              fontWeight: '700',
              color: GOLD.primary,
              marginBottom: '0.5rem'
            }}>
              📅 Planning Preview
            </div>
            {recurringPattern?.type === 'daily' ? (
              <div>
                {itemCount} items worden dagelijks gepost om {recurringPattern.time}
              </div>
            ) : (
              <div>
                {itemCount} items worden wekelijks op {WEEKDAYS.find(d => d.id === recurringPattern?.day)?.label} gepost om {recurringPattern?.time}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Planning Info */}
      {planningType === 'manual' && (
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px'
        }}>
          <h4 style={{
            margin: '0 0 1rem',
            fontSize: '1rem',
            fontWeight: '700',
            color: '#3b82f6'
          }}>
            📅 Handmatig Inplannen
          </h4>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.6'
          }}>
            Na het opslaan van de batch kun je elke item handmatig in de week planning slepen.
            <br /><br />
            • Items verschijnen in "Ready to Post" tab<br />
            • Sleep naar gewenste dag/tijd<br />
            • Flexibel aanpassen wanneer je wilt
          </div>
        </div>
      )}

      {/* Ready to Post Info */}
      {planningType === 'ready' && (
        <div style={{
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px'
        }}>
          <h4 style={{
            margin: '0 0 1rem',
            fontSize: '1rem',
            fontWeight: '700',
            color: '#10b981'
          }}>
            ✅ Ready to Post
          </h4>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.6'
          }}>
            Items worden klaargezet maar niet automatisch ingepland.
            <br /><br />
            Perfect voor:
            <br />
            • Flexibel blijven met planning<br />
            • Content voorbereiden voor spontane momenten<br />
            • Batch maken zonder directe deadline
            <br /><br />
            <strong style={{ color: '#10b981' }}>
              Je kunt items later alsnog inplannen vanuit de "Ready to Post" tab
            </strong>
          </div>
        </div>
      )}
    </div>
  )
}
