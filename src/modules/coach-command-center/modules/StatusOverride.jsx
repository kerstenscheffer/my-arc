 // src/modules/coach-command-center/modules/StatusOverride.jsx
// Manual status override for clients in Command Center
// Allows coach to manually set red/yellow/green status with reason

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, X, Edit2, RotateCcw } from 'lucide-react'
import NotesService from '../../notes/NotesService'

export default function StatusOverride({ 
  clientId, 
  db, 
  isMobile, 
  currentStatus,  // { status: 'red'|'yellow'|'green', isManual: bool, reason: string }
  onStatusChange  // Callback to refresh parent
}) {
  const [overrideData, setOverrideData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus?.status || 'green')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOverride()
  }, [clientId])

  const loadOverride = async () => {
    try {
      const notesService = new NotesService(db)
      const notes = await notesService.getNotes(clientId, { 
        category: 'status_override',
        status: 'active'
      })
      
      if (notes && notes.length > 0) {
        const latestOverride = notes[0]
        const content = latestOverride.content || {}
        setOverrideData({
          id: latestOverride.id,
          status: content.override_status || 'green',
          reason: content.reason || '',
          autoStatus: content.auto_status || 'green',
          createdAt: latestOverride.created_at
        })
      } else {
        setOverrideData(null)
      }
    } catch (error) {
      console.error('❌ [StatusOverride] Load failed:', error)
      setOverrideData(null)
    }
  }

  const handleSaveOverride = async () => {
    if (!reason.trim()) {
      alert('Voeg een reden toe voor de override')
      return
    }

    setLoading(true)
    try {
      const notesService = new NotesService(db)
      
      // Delete old override if exists
      if (overrideData?.id) {
        await notesService.deleteNote(overrideData.id)
      }

      // Create new override
      await notesService.createNote(clientId, {
        title: `Manual Status: ${selectedStatus.toUpperCase()}`,
        subtitle: reason,
        category: 'status_override',
        content: {
          sections: [],
          override_status: selectedStatus,
          reason: reason,
          auto_status: currentStatus?.status || 'green'
        },
        note_date: new Date().toISOString().split('T')[0],
        priority: selectedStatus === 'red' ? 'high' : selectedStatus === 'yellow' ? 'medium' : 'low',
        status: 'active',
        tags: ['manual-status']
      })

      console.log('✅ [StatusOverride] Override saved:', selectedStatus)
      
      // Reload and close
      await loadOverride()
      setIsEditing(false)
      setReason('')
      
      // Notify parent to refresh
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('❌ [StatusOverride] Save failed:', error)
      alert('Error saving status override')
    }
    setLoading(false)
  }

  const handleClearOverride = async () => {
    if (!confirm('Terug naar automatische status?')) return

    setLoading(true)
    try {
      if (overrideData?.id) {
        const notesService = new NotesService(db)
        await notesService.deleteNote(overrideData.id)
        
        console.log('✅ [StatusOverride] Override cleared')
        
        setOverrideData(null)
        
        // Notify parent to refresh
        if (onStatusChange) {
          onStatusChange()
        }
      }
    } catch (error) {
      console.error('❌ [StatusOverride] Clear failed:', error)
      alert('Error clearing override')
    }
    setLoading(false)
  }

  const statusColors = {
    red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', icon: AlertCircle },
    yellow: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24', icon: AlertTriangle },
    green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', icon: CheckCircle }
  }

  // Edit Mode
  if (isEditing) {
    return (
      <div style={{
        background: 'rgba(17, 17, 17, 0.95)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginTop: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            color: '#10b981',
            margin: 0
          }}>
            Manual Status Override
          </h4>
          <button
            onClick={() => {
              setIsEditing(false)
              setReason('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              touchAction: 'manipulation'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: isMobile ? '0.5rem' : '0.75rem',
          marginBottom: '1rem'
        }}>
          {['red', 'yellow', 'green'].map(status => {
            const colors = statusColors[status]
            const Icon = colors.icon
            const isSelected = selectedStatus === status

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  background: isSelected ? colors.bg : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isSelected ? colors.border : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  padding: isMobile ? '0.75rem 0.5rem' : '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  touchAction: 'manipulation',
                  minHeight: '44px'
                }}
              >
                <Icon size={isMobile ? 20 : 24} color={isSelected ? colors.text : 'rgba(255, 255, 255, 0.4)'} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected ? colors.text : 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase'
                }}>
                  {status}
                </span>
              </button>
            )
          })}
        </div>

        {/* Reason Input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem',
            fontWeight: '500'
          }}>
            Waarom deze status? *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv: No show op call - needs immediate follow up"
            maxLength={200}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.75rem' : '0.875rem',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              touchAction: 'manipulation'
            }}
          />
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginTop: '0.25rem',
            textAlign: 'right'
          }}>
            {reason.length}/200
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={handleSaveOverride}
            disabled={loading || !reason.trim()}
            style={{
              flex: 1,
              background: loading || !reason.trim() 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              padding: isMobile ? '0.75rem' : '0.875rem',
              color: loading || !reason.trim() ? 'rgba(16, 185, 129, 0.5)' : '#10b981',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '600',
              cursor: loading || !reason.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            {loading ? 'Saving...' : 'Save Override'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setReason('')
            }}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: isMobile ? '0.75rem' : '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              minHeight: '44px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Display Mode
  const activeStatus = overrideData ? overrideData.status : currentStatus?.status || 'green'
  const isManual = !!overrideData
  const colors = statusColors[activeStatus]
  const Icon = colors.icon

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '0.875rem' : '1rem',
      marginTop: '0.75rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isManual ? '0.75rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <Icon size={isMobile ? 18 : 20} color={colors.text} />
          <div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              color: colors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {activeStatus}
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '0.125rem'
            }}>
              {isManual ? '🔧 Manual Override' : '⚡ Auto Status'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {isManual && (
            <button
              onClick={handleClearOverride}
              disabled={loading}
              title="Clear override (terug naar auto)"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                minHeight: '32px',
                minWidth: '32px'
              }}
            >
              <RotateCcw size={14} color="rgba(255, 255, 255, 0.7)" />
            </button>
          )}
          <button
            onClick={() => setIsEditing(true)}
            disabled={loading}
            title="Edit status override"
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              padding: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
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
        </div>
      </div>

      {/* Manual Override Reason */}
      {isManual && overrideData.reason && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: isMobile ? '0.625rem' : '0.75rem',
          marginTop: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '0.25rem',
            fontWeight: '500'
          }}>
            Override Reason:
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.4'
          }}>
            {overrideData.reason}
          </div>
          {overrideData.autoStatus && (
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.5rem'
            }}>
              Auto status was: <span style={{ 
                color: statusColors[overrideData.autoStatus].text,
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {overrideData.autoStatus}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
