// ManageAssignmentsModal.jsx - Video assignment management met unassign functionaliteit
import React, { useState, useEffect } from 'react'
import useIsMobile from '../../hooks/useIsMobile'
import { 
  X, Users, Trash2, Calendar, Eye, Clock, Star, 
  CheckCircle, XCircle, AlertCircle, Home, Dumbbell, 
  Apple, Phone, Trophy, Loader
} from 'lucide-react'
import videoService from './VideoService'

// Page context config
const PAGE_CONTEXTS = {
  home: { label: 'Home', icon: Home, color: '#3b82f6' },
  workout: { label: 'Workout', icon: Dumbbell, color: '#f97316' },
  meals: { label: 'Meals', icon: Apple, color: '#10b981' },
  calls: { label: 'Calls', icon: Phone, color: '#3b82f6' },
  challenges: { label: 'Challenges', icon: Trophy, color: '#dc2626' }
}

export default function ManageAssignmentsModal({ video, onClose, onUpdate }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignments, setSelectedAssignments] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [unassigning, setUnassigning] = useState(false)
  const [filter, setFilter] = useState('all') // all, pending, viewed, completed
  
  const isMobile = useIsMobile()
  
  useEffect(() => {
    loadAssignments()
  }, [video.id])
  
  const loadAssignments = async () => {
    setLoading(true)
    try {
      const data = await videoService.getVideoAssignments(video.id)
      setAssignments(data)
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelectAll = () => {
    const filteredAssignments = getFilteredAssignments()
    if (selectAll) {
      setSelectedAssignments([])
    } else {
      setSelectedAssignments(filteredAssignments.map(a => a.id))
    }
    setSelectAll(!selectAll)
  }
  
  const handleToggleAssignment = (assignmentId) => {
    if (selectedAssignments.includes(assignmentId)) {
      setSelectedAssignments(selectedAssignments.filter(id => id !== assignmentId))
    } else {
      setSelectedAssignments([...selectedAssignments, assignmentId])
    }
  }
  
  const handleUnassign = async () => {
    if (selectedAssignments.length === 0) {
      alert('Selecteer minimaal 1 client om te verwijderen')
      return
    }
    
    if (!confirm(`Weet je zeker dat je deze video wilt verwijderen van ${selectedAssignments.length} client(s)?`)) {
      return
    }
    
    setUnassigning(true)
    try {
      // Get client IDs from selected assignments
      const clientIds = assignments
        .filter(a => selectedAssignments.includes(a.id))
        .map(a => a.client_id)
      
      const result = await videoService.unassignVideo(video.id, clientIds)
      
      if (result.success) {
        alert(`Video verwijderd van ${clientIds.length} client(s)`)
        setSelectedAssignments([])
        setSelectAll(false)
        await loadAssignments()
        if (onUpdate) onUpdate()
      } else {
        alert('Er ging iets mis: ' + result.error)
      }
    } catch (error) {
      console.error('Error unassigning:', error)
      alert('Er ging iets mis bij het verwijderen')
    } finally {
      setUnassigning(false)
    }
  }
  
  const handleUnassignAll = async () => {
    if (!confirm('Weet je zeker dat je deze video van ALLE clients wilt verwijderen?')) {
      return
    }
    
    setUnassigning(true)
    try {
      const result = await videoService.unassignAllClients(video.id)
      
      if (result.success) {
        alert('Video verwijderd van alle clients')
        setAssignments([])
        if (onUpdate) onUpdate()
      } else {
        alert('Er ging iets mis: ' + result.error)
      }
    } catch (error) {
      console.error('Error unassigning all:', error)
      alert('Er ging iets mis bij het verwijderen')
    } finally {
      setUnassigning(false)
    }
  }
  
  const getFilteredAssignments = () => {
    if (filter === 'all') return assignments
    return assignments.filter(a => a.status === filter)
  }
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'viewed':
        return <Eye size={14} color="#10b981" />
      case 'completed':
        return <CheckCircle size={14} color="#10b981" />
      case 'pending':
        return <Clock size={14} color="#f59e0b" />
      default:
        return <AlertCircle size={14} color="#6b7280" />
    }
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'viewed':
      case 'completed':
        return '#10b981'
      case 'pending':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }
  
  const filteredAssignments = getFilteredAssignments()
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={20} style={{ color: '#10b981' }} />
            Manage Assignments
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Video Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {video.title}
          </h4>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span>Totaal Assigned: {assignments.length}</span>
            <span>Bekeken: {assignments.filter(a => a.status === 'viewed').length}</span>
            <span>Pending: {assignments.filter(a => a.status === 'pending').length}</span>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          overflowX: 'auto'
        }}>
          {[
            { value: 'all', label: 'Alle' },
            { value: 'pending', label: 'Pending' },
            { value: 'viewed', label: 'Bekeken' },
            { value: 'completed', label: 'Voltooid' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === tab.value
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === tab.value ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                color: filter === tab.value ? '#10b981' : 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              {tab.label}
              {tab.value !== 'all' && (
                <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                  ({assignments.filter(a => tab.value === 'all' || a.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Action Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={handleSelectAll}
              disabled={filteredAssignments.length === 0}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                cursor: filteredAssignments.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: filteredAssignments.length === 0 ? 0.5 : 1
              }}
            >
              {selectAll ? 'Deselecteer Alle' : 'Selecteer Alle'}
            </button>
            
            {selectedAssignments.length > 0 && (
              <span style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                {selectedAssignments.length} geselecteerd
              </span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {selectedAssignments.length > 0 && (
              <button
                onClick={handleUnassign}
                disabled={unassigning}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: unassigning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.3s ease',
                  opacity: unassigning ? 0.5 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {unassigning ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Verwijder ({selectedAssignments.length})
              </button>
            )}
            
            {assignments.length > 0 && (
              <button
                onClick={handleUnassignAll}
                disabled={unassigning}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: unassigning ? 'not-allowed' : 'pointer',
                  opacity: unassigning ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                Verwijder Alle
              </button>
            )}
          </div>
        </div>
        
        {/* Assignments List */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.02)'
        }}>
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)'
            }}>
              <Loader size={24} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
              Assignments laden...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)'
            }}>
              {filter === 'all' 
                ? 'Deze video is nog niet assigned aan clients'
                : `Geen ${filter} assignments gevonden`}
            </div>
          ) : (
            <div>
              {filteredAssignments.map(assignment => {
                const clientName = assignment.client?.first_name && assignment.client?.last_name
                  ? `${assignment.client.first_name} ${assignment.client.last_name}`
                  : assignment.client?.first_name || assignment.client?.last_name || assignment.client?.email || 'Onbekende Client'
                
                const pageConfig = PAGE_CONTEXTS[assignment.page_context] || PAGE_CONTEXTS.home
                const PageIcon = pageConfig.icon
                
                return (
                  <div
                    key={assignment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: selectedAssignments.includes(assignment.id)
                        ? 'rgba(16, 185, 129, 0.05)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleToggleAssignment(assignment.id)}
                    onMouseEnter={(e) => {
                      if (!isMobile && !selectedAssignments.includes(assignment.id)) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile && !selectedAssignments.includes(assignment.id)) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedAssignments.includes(assignment.id)}
                      onChange={() => handleToggleAssignment(assignment.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginRight: '1rem',
                        cursor: 'pointer'
                      }}
                    />
                    
                    {/* Client Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.95rem',
                        color: '#fff',
                        fontWeight: '500',
                        marginBottom: '0.25rem',
                        textTransform: 'capitalize'
                      }}>
                        {clientName}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.4)'
                      }}>
                        {/* Status */}
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: getStatusColor(assignment.status)
                        }}>
                          {getStatusIcon(assignment.status)}
                          <span style={{ textTransform: 'capitalize' }}>
                            {assignment.status}
                          </span>
                        </span>
                        
                        {/* Page Context */}
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <PageIcon size={12} color={pageConfig.color} />
                          {pageConfig.label}
                        </span>
                        
                        {/* Scheduled Date */}
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Calendar size={12} />
                          {formatDate(assignment.scheduled_for)}
                        </span>
                        
                        {/* View Date if viewed */}
                        {assignment.viewed_at && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Eye size={12} />
                            Bekeken: {formatDate(assignment.viewed_at)}
                          </span>
                        )}
                        
                        {/* Rating if available */}
                        {assignment.client_rating && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Star size={12} color="#f59e0b" />
                            {assignment.client_rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
