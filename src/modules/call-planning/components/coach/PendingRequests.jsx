import React, { useState } from 'react'
import { Clock, AlertCircle, CheckCircle, X, User, Calendar, ChevronRight, Zap, Star } from 'lucide-react'

export default function PendingRequests({ requests, onApprove, onReject, loading }) {
  const [processingId, setProcessingId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [hoveredCard, setHoveredCard] = useState(null)

  const handleApprove = async (request) => {
    setProcessingId(request.id)
    try {
      await onApprove(request.id, 'Goedgekeurd voor extra begeleiding')
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    
    setProcessingId(showRejectModal.id)
    try {
      await onReject(showRejectModal.id, rejectReason)
      setShowRejectModal(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getUrgencyGradient = (urgency) => {
    switch(urgency) {
      case 'high': 
        return {
          gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
          lightGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
          color: '#ef4444',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        }
      default: 
        return {
          gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(30, 64, 175, 0.9) 100%)',
          lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 64, 175, 0.1) 100%)',
          color: '#3b82f6',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const then = new Date(date)
    const hours = Math.floor((now - then) / (1000 * 60 * 60))
    
    if (hours < 1) return 'Zojuist'
    if (hours < 24) return `${hours} uur geleden`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Gisteren'
    return `${days} dagen geleden`
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        animation: 'fadeIn 0.5s ease'
      }}>
        {[1, 2].map(i => (
          <div 
            key={i} 
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '20px',
              height: '180px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              animation: 'shimmer 2s infinite'
            }} />
          </div>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background circle */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
        }} />
        
        <CheckCircle 
          size={48} 
          style={{ 
            color: '#10b981',
            margin: '0 auto 1rem',
            filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))'
          }} 
        />
        <p style={{ 
          color: '#fff', 
          fontSize: '1.1rem',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Geen openstaande aanvragen
        </p>
        <p style={{ 
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.9rem'
        }}>
          Alle bonus calls zijn afgehandeld
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Header met premium styling */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(251, 146, 60, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ 
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(234, 88, 12, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(251, 146, 60, 0.2)'
            }}>
              <AlertCircle size={20} style={{ color: '#fb923c' }} />
            </div>
            Openstaande Aanvragen
          </h3>
          <span style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
            color: '#fff',
            padding: '0.35rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
          }}>
            {requests.length}
          </span>
        </div>
      </div>

      {/* Request Cards met premium dark theme */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.map((request, index) => {
          const urgencyStyle = getUrgencyGradient(request.urgency)
          const isHovered = hoveredCard === request.id
          
          return (
            <div
              key={request.id}
              onMouseEnter={() => setHoveredCard(request.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: isHovered 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered 
                  ? '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 10px 30px rgba(0,0,0,0.2)',
                animation: `slideInUp ${300 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                opacity: 0,
                position: 'relative'
              }}
            >
              {/* Decorative gradient orb */}
              <div style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: urgencyStyle.gradient,
                opacity: 0.1,
                filter: 'blur(30px)'
              }} />
              
              {/* Card Header met gradient achtergrond */}
              <div style={{
                padding: '1.25rem',
                background: urgencyStyle.lightGradient,
                borderBottom: `1px solid ${urgencyStyle.color}15`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: urgencyStyle.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${urgencyStyle.color}40`,
                      transform: isHovered ? 'scale(1.05) rotate(3deg)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}>
                      <User size={24} style={{ color: '#fff' }} />
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '0.25rem'
                      }}>
                        {request.clients?.full_name || request.clients?.name || 'Client'}
                      </h4>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(255,255,255,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Clock size={14} />
                        {getTimeAgo(request.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Urgency Badge met glassmorphism */}
                  <span className={urgencyStyle.badge} style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid'
                  }}>
                    {request.urgency === 'high' ? '🔥 Urgent' : '⚡ Normaal'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem' }}>
                {/* Reason met premium styling */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: urgencyStyle.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <Zap size={12} />
                    Reden aanvraag
                  </label>
                  <p style={{
                    color: '#fff',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {request.reason || 'Geen reden opgegeven'}
                  </p>
                </div>

                {/* Extra info met icons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {request.requested_date && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '10px',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <Calendar size={14} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        {new Date(request.requested_date).toLocaleDateString('nl-NL')}
                      </span>
                    </div>
                  )}
                  
                  {request.client_call_plans?.call_templates?.template_name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '10px',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                      <Star size={14} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        {request.client_call_plans.call_templates.template_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons met premium gradient styling */}
              <div style={{
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                  style={{
                    flex: 1,
                    background: processingId === request.id
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(5, 150, 105, 0.5) 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    opacity: processingId === request.id ? 0.7 : 1,
                    transform: processingId !== request.id ? 'scale(1)' : 'scale(0.98)'
                  }}
                  onMouseEnter={(e) => {
                    if (processingId !== request.id) {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (processingId !== request.id) {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }
                  }}
                >
                  {processingId === request.id ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Goedkeuren
                </button>
                
                <button
                  onClick={() => setShowRejectModal(request)}
                  disabled={processingId === request.id}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)',
                    color: '#ef4444',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: processingId === request.id ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (processingId !== request.id) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (processingId !== request.id) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)'
                      e.currentTarget.style.color = '#ef4444'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <X size={18} />
                  Afwijzen
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reject Modal met glassmorphism */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            maxWidth: '450px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.05) 100%)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Aanvraag afwijzen
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                Van: {showRejectModal.clients?.full_name || showRejectModal.clients?.name}
              </p>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.5rem'
                }}>
                  Reden voor afwijzing
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    resize: 'none',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(239, 68, 68, 0.5)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.1)'
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  rows={4}
                  placeholder="Leg uit waarom de aanvraag wordt afgewezen..."
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setShowRejectModal(null)
                    setRejectReason('')
                  }}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processingId === showRejectModal.id}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: !rejectReason.trim() || processingId === showRejectModal.id
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.3) 100%)'
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: !rejectReason.trim() || processingId === showRejectModal.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: !rejectReason.trim() || processingId === showRejectModal.id ? 0.5 : 1
                  }}
                >
                  {processingId === showRejectModal.id ? 'Bezig...' : 'Afwijzen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
