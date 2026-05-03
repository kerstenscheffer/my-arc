// src/client/widgets/ClientCallsWidget.jsx
import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react'
import { PhoneCall, Calendar, Clock, ChevronRight, Video, Trophy, Sparkles } from 'lucide-react'
import CallPlanningService from "../../modules/call-planning/CallPlanningService"

const callTypeNames = {
  1: 'Kennismaking',
  2: 'Plan Pitch',
  3: 'Check-in',
  4: 'Halfway',
  5: 'Final Sprint',
  6: 'Celebration'
}

export default function ClientCallsWidget({ client, onNavigate }) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [nextCall, setNextCall] = useState(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCalls, setTotalCalls] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => { loadCallData() }, [client])

  const loadCallData = async () => {
    if (!client?.id) return
    try {
      setLoading(true)
      const plansData = await CallPlanningService.getClientPlans(client.id)
      if (plansData && plansData.length > 0) {
        const activePlan = plansData.find(p => p.status === 'active') || plansData[0]
        if (activePlan.client_calls) {
          let callsData = activePlan.client_calls.map(call => {
            if (call.call_number === 1 && call.status === 'locked') return { ...call, status: 'available' }
            if (call.call_number > 1 && call.status === 'locked') {
              const prev = activePlan.client_calls.find(c => c.call_number === call.call_number - 1)
              if (prev?.status === 'completed') return { ...call, status: 'available' }
            }
            return call
          })
          setCalls(callsData)
          setTotalCalls(callsData.length)
          setNextCall(callsData.find(c => c.status === 'available' || c.status === 'scheduled'))
          setCompletedCount(callsData.filter(c => c.status === 'completed').length)
        }
      }
    } catch (error) {
      console.error('Error loading calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilCall = (scheduledDate) => {
    if (!scheduledDate) return null
    return Math.ceil((new Date(scheduledDate) - new Date()) / (1000 * 60 * 60 * 24))
  }

  const cardStyle = {
    background: '#0a0a0a',
    border: '1px solid rgba(255, 215, 0, 0.15)',
    borderLeft: '3px solid #FFD700',
    borderRadius: isMobile ? '10px' : '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent'
  }

  if (loading) {
    return (
      <div style={{ ...cardStyle, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(255, 215, 0, 0.15)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  // All completed
  if (completedCount === totalCalls && totalCalls > 0) {
    return (
      <div style={cardStyle} onClick={() => onNavigate?.('calls')}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Trophy size={18} color="#FFD700" />
            <div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', color: '#fff' }}>
                Journey compleet
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '0.1rem' }}>
                Alle {totalCalls} calls voltooid
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
        </div>
      </div>
    )
  }

  // No calls yet
  if (!nextCall && completedCount === 0) {
    return (
      <div style={cardStyle} onClick={() => onNavigate?.('calls')}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PhoneCall size={18} color="#FFD700" />
            <div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '800', color: '#fff' }}>
                Coaching calls
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '0.1rem' }}>
                Plan je eerste call
              </div>
            </div>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
        </div>
      </div>
    )
  }

  // Main — next call
  const days = getDaysUntilCall(nextCall?.scheduled_date)

  return (
    <div style={cardStyle} onClick={() => onNavigate?.('calls')}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(255, 215, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <PhoneCall size={13} color="#FFD700" />
          <span style={{
            fontSize: '0.7rem', fontWeight: '800', color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {nextCall?.status === 'scheduled' ? 'Volgende call' : 'Call inplannen'}
          </span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
          {calls.slice(0, 6).map((call, i) => (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: call.status === 'completed'
                ? '#FFD700'
                : call.status === 'scheduled'
                ? 'rgba(255, 215, 0, 0.4)'
                : 'rgba(255,255,255,0.1)'
            }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem'
      }}>
        <div>
          <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '800', color: '#fff', marginBottom: '0.3rem' }}>
            Call #{nextCall?.call_number} · {callTypeNames[nextCall?.call_number] || 'Call'}
          </div>

          {nextCall?.status === 'scheduled' && nextCall.scheduled_date ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={12} color="rgba(255,255,255,0.35)" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                {new Date(nextCall.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {days !== null && days >= 0 && (
                <span style={{
                  padding: '0.1rem 0.4rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.65rem', fontWeight: '700',
                  color: '#FFD700'
                }}>
                  {days === 0 ? 'Vandaag' : days === 1 ? 'Morgen' : `${days}d`}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
              Klik om te plannen
            </div>
          )}
        </div>

        {/* Zoom link OR chevron */}
        {nextCall?.status === 'scheduled' && nextCall.zoom_link ? (
          <a
            href={nextCall.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '6px',
              color: '#FFD700', fontWeight: '700', fontSize: '0.75rem',
              textDecoration: 'none', flexShrink: 0
            }}
          >
            <Video size={13} />
            Join
          </a>
        ) : (
          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
