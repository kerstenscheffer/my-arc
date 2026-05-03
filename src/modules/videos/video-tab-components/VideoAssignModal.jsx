// src/modules/videos/video-tab-components/VideoAssignModal.jsx
// v2.0 — Brand styling + page_context keys matchen ClientDashboard
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Send, X, Users, FileVideo, Calendar,
  Home, Dumbbell, Utensils, ShoppingCart, Camera, Phone, User
} from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'

const GOLD = '#FFD700'

// ── Keys moeten exact matchen met ClientDashboard currentView ──
// home, workout, meal, boodschappen, tracking, calls, profile
const PAGE_CONTEXT_OPTIONS = [
  { value: 'home',         label: 'Home',         icon: Home },
  { value: 'workout',      label: 'Workout',      icon: Dumbbell },
  { value: 'meal',         label: 'Meal',         icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',     icon: Camera },
  { value: 'calls',        label: 'Calls',        icon: Phone },
  { value: 'profile',      label: 'Profile',      icon: User }
]

export default function VideoAssignModal({ 
  video, 
  clients, 
  clientsLoading, 
  onClose, 
  onAssign 
}) {
  const [selectedClients, setSelectedClients] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [assignmentData, setAssignmentData] = useState({
    type: 'manual',
    scheduledFor: new Date().toISOString().split('T')[0],
    timeOfDay: 'anytime',
    pageContext: 'home',
    contextData: {},
    notes: ''
  })
  
  const isMobile = useIsMobile()

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }
  
  const handleClientToggle = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId))
    } else {
      setSelectedClients([...selectedClients, clientId])
    }
  }
  
  const handleAssign = () => {
    if (selectedClients.length === 0) {
      alert('Selecteer minimaal 1 client')
      return
    }
    onAssign(selectedClients, assignmentData)
  }

  // Shared styles
  const labelStyle = {
    display: 'block',
    fontSize: '0.4rem',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.4rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: '#000',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: '600',
    outline: 'none'
  }
  
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: isMobile ? '100%' : '560px',
          maxHeight: isMobile ? '92vh' : '88vh',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateZ(0)'
        }}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem'
            }}>
              Video Toewijzen
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {video.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY — scrollable */}
        <div
          className="assign-modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* ── PAGE CONTEXT ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <FileVideo size={10} />
              Welke pagina?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: '0.3rem'
            }}>
              {PAGE_CONTEXT_OPTIONS.map(option => {
                const Icon = option.icon
                const isActive = assignmentData.pageContext === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setAssignmentData({
                      ...assignmentData,
                      pageContext: option.value,
                      contextData: {}
                    })}
                    style={{
                      padding: '0.55rem 0.4rem',
                      background: isActive ? GOLD : 'transparent',
                      border: isActive
                        ? `1px solid ${GOLD}`
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: isActive ? '#000' : 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '40px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={12} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── SCHEDULE DATE ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Calendar size={10} />
              Zichtbaar vanaf
            </label>
            <input
              type="date"
              value={assignmentData.scheduledFor}
              onChange={(e) => setAssignmentData({
                ...assignmentData,
                scheduledFor: e.target.value
              })}
              style={{
                ...inputStyle,
                colorScheme: 'dark'
              }}
            />
          </div>

          {/* ── CLIENT SELECTION ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                ...labelStyle,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Users size={10} />
                Clients ({selectedClients.length}/{clients.length})
              </label>
              {clients.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '0.3rem 0.55rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    color: GOLD,
                    fontSize: '0.55rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {selectAll ? 'Deselecteer' : 'Alle'}
                </button>
              )}
            </div>

            <div style={{
              maxHeight: isMobile ? '180px' : '220px',
              overflowY: 'auto',
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px'
            }}>
              {clientsLoading ? (
                <div style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  Laden...
                </div>
              ) : clients.length === 0 ? (
                <div style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '0.7rem'
                }}>
                  Geen clients gevonden
                </div>
              ) : (
                clients.map((c, idx) => {
                  const name = c.first_name && c.last_name 
                    ? `${c.first_name} ${c.last_name}`
                    : c.first_name || c.last_name || c.email || `Client ${idx + 1}`
                  const isSelected = selectedClients.includes(c.id)

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleClientToggle(c.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.625rem',
                        background: isSelected ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: idx < clients.length - 1 
                          ? '1px solid rgba(255, 255, 255, 0.04)'
                          : 'none',
                        borderLeft: isSelected ? `3px solid ${GOLD}` : '3px solid transparent',
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        fontWeight: isSelected ? '700' : '600',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '40px',
                        transition: 'all 0.15s ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `1.5px solid ${isSelected ? GOLD : 'rgba(255, 255, 255, 0.2)'}`,
                        background: isSelected ? GOLD : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {name}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div style={{ height: '0.5rem' }} />
        </div>

        {/* ── ACTIONS (sticky bottom) ── */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.125rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
          background: '#0a0a0a'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Annuleer
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedClients.length === 0}
            style={{
              flex: 2,
              padding: '0.625rem',
              background: selectedClients.length === 0
                ? 'rgba(255, 215, 0, 0.2)'
                : GOLD,
              border: 'none',
              borderRadius: '6px',
              color: selectedClients.length === 0
                ? 'rgba(0, 0, 0, 0.4)'
                : '#000',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Send size={13} />
            {selectedClients.length === 0
              ? 'Selecteer client(s)'
              : `Toewijzen aan ${selectedClients.length}`}
          </button>
        </div>
      </div>

      <style>{`.assign-modal-body::-webkit-scrollbar { display: none; }`}</style>
    </div>,
    document.body
  )
}
