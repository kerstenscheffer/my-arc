import React, { useState } from 'react'
import { Pin, X, AlertCircle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import ActivityTimeline from './ActivityTimeline'
import CoachNotes from './CoachNotes'
import StatusOverride from './StatusOverride'
import QuickStats from './QuickStats'
import CallPlanning from './CallPlanning'

export default function ClientCard({ 
  client, 
  status, 
  issues, 
  metrics,
  isPinned,
  onTogglePin,
  isMobile,
  db
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status) => {
    switch(status) {
      case 'red': return '#ef4444'
      case 'yellow': return '#f59e0b'
      case 'green': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'red': return <AlertCircle size={isMobile ? 18 : 20} />
      case 'yellow': return <Clock size={isMobile ? 18 : 20} />
      case 'green': return <CheckCircle size={isMobile ? 18 : 20} />
      default: return null
    }
  }

  return (
    <div
      style={{
        background: 'rgba(17, 17, 17, 0.9)',
        border: `2px solid ${getStatusColor(status)}`,
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isPinned ? `0 0 20px ${getStatusColor(status)}40` : '0 4px 12px rgba(0,0,0,0.3)',
        cursor: isExpanded ? 'default' : 'pointer'
      }}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true)
      }}
    >
      {/* PIN BADGE */}
      {isPinned && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '12px',
          background: '#10b981',
          color: '#000',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: '600',
          zIndex: 10
        }}>
          📌 PINNED
        </div>
      )}

      {/* COLLAPSED VIEW - HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isExpanded ? '1.5rem' : 0
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          flex: 1,
          minWidth: 0 
        }}>
          {/* STATUS ICON */}
          <div style={{
            color: getStatusColor(status),
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}>
            {getStatusIcon(status)}
          </div>

          {/* CLIENT NAME */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.2rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {client.first_name} {client.last_name}
            </h3>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              Streak: {metrics.workoutStreak} 🔥
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {/* PIN BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin(client.id)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: isPinned ? '#10b981' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Pin size={isMobile ? 18 : 20} fill={isPinned ? '#10b981' : 'none'} />
          </button>

          {/* EXPAND/COLLAPSE BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            style={{
              background: isExpanded ? '#10b981' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: isExpanded ? '#000' : '#fff',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isExpanded ? (
              <ChevronUp size={isMobile ? 18 : 20} />
            ) : (
              <ChevronDown size={isMobile ? 18 : 20} />
            )}
          </button>
        </div>
      </div>

      {/* COLLAPSED VIEW - ISSUES PREVIEW */}
      {!isExpanded && issues.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: isMobile ? '0.6rem' : '0.75rem',
          marginTop: '1rem'
        }}>
          {issues.slice(0, 2).map((issue, idx) => (
            <div key={idx} style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: '#fca5a5',
              marginBottom: idx === 0 && issues.length > 1 ? '0.3rem' : 0
            }}>
              ⚠️ {issue}
            </div>
          ))}
          {issues.length > 2 && (
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(252, 165, 165, 0.6)',
              marginTop: '0.3rem'
            }}>
              +{issues.length - 2} more issues
            </div>
          )}
        </div>
      )}

      {/* EXPANDED VIEW - FULL DETAILS */}
      {isExpanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* ISSUES SECTION */}
          {issues.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: isMobile ? '0.75rem' : '1rem'
            }}>
              <h4 style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                color: '#ef4444',
                marginBottom: '0.75rem'
              }}>
                ⚠️ Issues Detected
              </h4>
              {issues.map((issue, idx) => (
                <div key={idx} style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: '#fca5a5',
                  marginBottom: idx < issues.length - 1 ? '0.5rem' : 0,
                  paddingLeft: '1.5rem',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0
                  }}>•</span>
                  {issue}
                </div>
              ))}
            </div>
          )}

          {/* MODULE 1: CALL PLANNING - Top Priority 📞 */}
          <CallPlanning 
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
            isMobile={isMobile}
          />

          {/* MODULE 2: QUICK STATS - Overview ⚡ */}
          <QuickStats 
            clientId={client.id}
            db={db}
            isMobile={isMobile}
          />

          {/* MODULE 3: STATUS OVERRIDE - Manual Control 🎯 */}
          <StatusOverride 
            clientId={client.id}
            db={db}
            isMobile={isMobile}
            currentStatus={{
              status: status,
              isManual: false
            }}
            onStatusChange={() => {
              console.log('✅ Status override changed for:', client.id)
            }}
          />

          {/* MODULE 4: COACH NOTES - Quick Notes 📝 */}
          <CoachNotes 
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
            db={db}
            isMobile={isMobile}
          />

          {/* MODULE 5: ACTIVITY TIMELINE - 7-Day Grid 📊 */}
          <ActivityTimeline 
            clientId={client.id}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}
