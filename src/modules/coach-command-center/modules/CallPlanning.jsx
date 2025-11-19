// src/modules/coach-command-center/modules/CallPlanning.jsx
// Call planning and preparation for clients in Command Center
// Shows next scheduled call, prep notes, and quick actions

import React, { useState, useEffect } from 'react'
import { Phone, Calendar, Clock, Edit2, Save, X, CheckCircle } from 'lucide-react'
import DatabaseService from '../../../services/DatabaseService'

export default function CallPlanning({ clientId, clientName, isMobile }) {
  const [nextCall, setNextCall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [prepNotes, setPrepNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadNextCall()
  }, [clientId])

  const loadNextCall = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await DatabaseService.supabase
        .from('client_calls')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', now)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setNextCall(data)
        setPrepNotes(data.preparation_notes || '')
      } else {
        setNextCall(null)
      }

      console.log('✅ [CallPlanning] Next call loaded for:', clientId)
    } catch (error) {
      console.error('❌ [CallPlanning] Load failed:', error)
      setNextCall(null)
    }
    setLoading(false)
  }

  const handleSaveNotes = async () => {
    if (!nextCall) return

    setSaving(true)
    try {
      const { error } = await DatabaseService.supabase
        .from('client_calls')
        .update({
          preparation_notes: prepNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', nextCall.id)

      if (error) throw error

      console.log('✅ [CallPlanning] Prep notes saved')
      setNextCall({ ...nextCall, preparation_notes: prepNotes })
      setIsEditingNotes(false)
    } catch (error) {
      console.error('❌ [CallPlanning] Save failed:', error)
      alert('Error saving notes')
    }
    setSaving(false)
  }

  const getDaysUntilCall = (scheduledDate) => {
    const now = new Date()
    const callDate = new Date(scheduledDate)
    const diffTime = callDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return { text: 'TODAY', color: '#ef4444', urgent: true }
    if (diffDays === 1) return { text: 'TOMORROW', color: '#f59e0b', urgent: true }
    if (diffDays <= 3) return { text: `in ${diffDays} days`, color: '#f59e0b', urgent: true }
    if (diffDays <= 7) return { text: `in ${diffDays} days`, color: '#10b981', urgent: false }
    return { text: `in ${diffDays} days`, color: 'rgba(255,255,255,0.5)', urgent: false }
  }

  const formatCallDate = (date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div style={{
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#3b82f6',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading call info...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    )
  }

  // NO CALL SCHEDULED
  if (!nextCall) {
    return (
      <div style={{
        background: 'rgba(107, 114, 128, 0.05)',
        border: '1px solid rgba(107, 114, 128, 0.2)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        textAlign: 'center'
      }}>
        <Phone size={isMobile ? 32 : 40} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 0.75rem' }} />
        <div style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '0.5rem'
        }}>
          No Call Scheduled
        </div>
        <div style={{
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: 'rgba(255,255,255,0.4)'
        }}>
          Schedule a call with {clientName}
        </div>
      </div>
    )
  }

  // CALL SCHEDULED
  const daysInfo = getDaysUntilCall(nextCall.scheduled_date)

  return (
    <div style={{
      background: daysInfo.urgent 
        ? 'rgba(239, 68, 68, 0.05)' 
        : 'rgba(59, 130, 246, 0.05)',
      border: `1px solid ${daysInfo.urgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '0.875rem' : '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Phone size={isMobile ? 16 : 18} color="#3b82f6" />
            <h4 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#3b82f6',
              margin: 0
            }}>
              Next Call
            </h4>
          </div>
          
          {/* Call Title */}
          <div style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {nextCall.call_title || 'Call Scheduled'}
          </div>

          {/* Date & Time */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <Calendar size={14} />
            {formatCallDate(nextCall.scheduled_date)}
          </div>

          {/* Duration */}
          {nextCall.duration_minutes && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '0.25rem'
            }}>
              <Clock size={14} />
              {nextCall.duration_minutes} minutes
            </div>
          )}
        </div>

        {/* Days Until Badge */}
        <div style={{
          background: `${daysInfo.color}20`,
          border: `1px solid ${daysInfo.color}40`,
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          textAlign: 'center',
          minWidth: isMobile ? '70px' : '80px'
        }}>
          <div style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: daysInfo.color,
            lineHeight: '1'
          }}>
            {daysInfo.urgent ? '⚠️' : '📅'}
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: daysInfo.color,
            marginTop: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {daysInfo.text}
          </div>
        </div>
      </div>

      {/* Preparation Notes */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginTop: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isEditingNotes ? '0.75rem' : '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.7)'
          }}>
            📝 Preparation Notes
          </div>
          
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                minHeight: '32px',
                minWidth: '32px'
              }}
            >
              <Edit2 size={14} color="#10b981" />
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div>
            <textarea
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Topics to discuss, questions to ask, goals to review..."
              rows={4}
              maxLength={500}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.75rem',
              textAlign: 'right'
            }}>
              {prepNotes.length}/500
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: saving ? 'rgba(16, 185, 129, 0.5)' : '#10b981',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                onClick={() => {
                  setIsEditingNotes(false)
                  setPrepNotes(nextCall.preparation_notes || '')
                }}
                disabled={saving}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: prepNotes ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
            lineHeight: '1.5',
            fontStyle: prepNotes ? 'normal' : 'italic',
            whiteSpace: 'pre-wrap'
          }}>
            {prepNotes || 'No preparation notes yet. Click edit to add topics to discuss.'}
          </div>
        )}
      </div>
    </div>
  )
}
