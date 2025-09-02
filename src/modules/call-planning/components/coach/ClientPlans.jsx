import React, { useState } from 'react'
import { 
  Calendar, Users, CheckCircle, Clock, TrendingUp, 
  MoreVertical, Eye, Play, Check, X, AlertCircle,
  Phone, Video, MapPin, FileText, ChevronRight
} from 'lucide-react'
import CallPlanningService from '../../CallPlanningService'

export default function ClientPlans({ plans, onRefresh }) {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [selectedTab, setSelectedTab] = useState('active')
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [completingCall, setCompletingCall] = useState(null)
  const [completeNotes, setCompleteNotes] = useState('')
  const [loading, setLoading] = useState(false)
  
  const isMobile = window.innerWidth <= 768
  
  const filteredPlans = plans.filter(plan => 
    selectedTab === 'active' ? plan.status === 'active' : plan.status !== 'active'
  )
  
  const getProgressPercentage = (plan) => {
    if (!plan.client_calls || plan.client_calls.length === 0) return 0
    const completed = plan.client_calls.filter(c => c.status === 'completed').length
    return Math.round((completed / plan.client_calls.length) * 100)
  }

  const handleCompleteCall = async (callId, planId) => {
    if (!completeNotes.trim()) {
      alert('Voeg notities toe over deze call')
      return
    }

    setLoading(true)
    try {
      // Complete the call
      await CallPlanningService.completeCall(callId, completeNotes)
      
      // Auto-unlock next call
      const plan = plans.find(p => p.id === planId)
      if (plan && plan.client_calls) {
        const completedCall = plan.client_calls.find(c => c.id === callId)
        if (completedCall) {
          const nextCall = plan.client_calls.find(c => 
            c.call_number === completedCall.call_number + 1 && 
            c.status === 'locked'
          )
          
          if (nextCall) {
            // Update next call to available
            await CallPlanningService.supabase
              .from('client_calls')
              .update({ status: 'available' })
              .eq('id', nextCall.id)
          }
        }
      }
      
      // Reset state
      setCompletingCall(null)
      setCompleteNotes('')
      
      // Refresh data
      if (onRefresh) onRefresh()
      
    } catch (error) {
      console.error('Error completing call:', error)
      alert('Er ging iets mis bij het afronden van de call')
    } finally {
      setLoading(false)
    }
  }

  const getCallStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981'
      case 'scheduled': return '#3b82f6'
      case 'available': return '#fbbf24'
      case 'locked': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getCallStatusIcon = (status) => {
    switch(status) {
      case 'completed': return CheckCircle
      case 'scheduled': return Calendar
      case 'available': return Play
      case 'locked': return Clock
      default: return Clock
    }
  }
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Premium Header */}
      <div style={{
        marginBottom: '1.5rem',
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0
          }}>
            <div style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={isMobile ? 18 : 20} style={{ color: '#8b5cf6' }} />
            </div>
            Client Call Plans
          </h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto'
          }}>
            {['active', 'inactive'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '0.5rem' : '0.5rem 1rem',
                  background: selectedTab === tab 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedTab === tab ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '10px',
                  color: selectedTab === tab ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {tab === 'active' ? 'Actief' : 'Inactief'}
              </button>
            ))}
          </div>
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          margin: 0
        }}>
          {filteredPlans.length} {selectedTab === 'active' ? 'actieve' : 'inactieve'} call trajecten
        </p>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gap: isMobile ? '1rem' : '1.5rem',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))'
      }}>
        {filteredPlans.map((plan, index) => {
          const progress = getProgressPercentage(plan)
          const isExpanded = expandedPlan === plan.id
          const isHovered = hoveredCard === plan.id
          
          return (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: isHovered 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isHovered ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '20px',
                padding: isMobile ? '1.25rem' : '1.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isHovered 
                  ? '0 20px 40px rgba(139, 92, 246, 0.2)'
                  : '0 10px 30px rgba(0, 0, 0, 0.2)',
                animation: `slideInUp ${300 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                opacity: 0,
                position: 'relative',
                overflow: 'hidden'
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
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              
              {/* Client Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {plan.clients?.name || 'Client'}
                  </h3>
                  <p style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {plan.call_templates?.template_name || 'Custom Plan'}
                  </p>
                </div>
                
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <ChevronRight size={18} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '500'
                  }}>
                    Voortgang
                  </span>
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: '#8b5cf6',
                    fontWeight: '600'
                  }}>
                    {progress}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '10px',
                    transition: 'width 0.5s ease',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                  }} />
                </div>
              </div>
              
              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {[
                  { label: 'Gepland', value: plan.client_calls?.filter(c => c.status === 'scheduled').length || 0, color: '#3b82f6' },
                  { label: 'Voltooid', value: plan.client_calls?.filter(c => c.status === 'completed').length || 0, color: '#10b981' },
                  { label: 'Totaal', value: plan.client_calls?.length || 0, color: '#8b5cf6' }
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: isMobile ? '0.5rem' : '0.625rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: 'bold',
                      color: stat.color,
                      marginBottom: '0.125rem'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Expanded Call Details */}
              {isExpanded && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  animation: 'slideDown 0.3s ease'
                }}>
                  <h4 style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.75rem'
                  }}>
                    Call Overzicht
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {plan.client_calls?.sort((a, b) => a.call_number - b.call_number).map(call => {
                      const StatusIcon = getCallStatusIcon(call.status)
                      const isCompleting = completingCall === call.id
                      
                      return (
                        <div
                          key={call.id}
                          style={{
                            padding: isMobile ? '0.75rem' : '1rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            border: `1px solid ${call.status === 'scheduled' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <StatusIcon 
                                size={isMobile ? 16 : 18} 
                                style={{ color: getCallStatusColor(call.status) }} 
                              />
                              <span style={{
                                fontSize: isMobile ? '0.8rem' : '0.85rem',
                                fontWeight: '600',
                                color: '#fff'
                              }}>
                                Call {call.call_number}: {call.call_title}
                              </span>
                            </div>
                            
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: `${getCallStatusColor(call.status)}20`,
                              borderRadius: '6px',
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              fontWeight: '600',
                              color: getCallStatusColor(call.status),
                              border: `1px solid ${getCallStatusColor(call.status)}30`
                            }}>
                              {call.status}
                            </span>
                          </div>
                          
                          {/* Show complete button for scheduled calls */}
                          {call.status === 'scheduled' && !isCompleting && (
                            <button
                              onClick={() => setCompletingCall(call.id)}
                              style={{
                                padding: isMobile ? '0.5rem' : '0.625rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.3s ease',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent',
                                minHeight: '44px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              <Check size={isMobile ? 14 : 16} />
                              Markeer als Afgerond
                            </button>
                          )}
                          
                          {/* Complete form */}
                          {isCompleting && (
                            <div style={{
                              padding: isMobile ? '0.75rem' : '1rem',
                              background: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                              <label style={{
                                display: 'block',
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: '0.5rem',
                                fontWeight: '500'
                              }}>
                                Coach notities over deze call:
                              </label>
                              <textarea
                                value={completeNotes}
                                onChange={(e) => setCompleteNotes(e.target.value)}
                                placeholder="Wat is besproken? Belangrijke punten? Acties?"
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  padding: isMobile ? '0.5rem' : '0.75rem',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                                  resize: 'vertical'
                                }}
                              />
                              
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginTop: '0.75rem'
                              }}>
                                <button
                                  onClick={() => handleCompleteCall(call.id, plan.id)}
                                  disabled={loading}
                                  style={{
                                    flex: 1,
                                    padding: isMobile ? '0.5rem' : '0.625rem',
                                    background: loading 
                                      ? 'rgba(107, 114, 128, 0.5)'
                                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                    minHeight: '44px'
                                  }}
                                >
                                  {loading ? 'Bezig...' : 'Bevestig Afronding'}
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setCompletingCall(null)
                                    setCompleteNotes('')
                                  }}
                                  disabled={loading}
                                  style={{
                                    padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    touchAction: 'manipulation',
                                    WebkitTapHighlightColor: 'transparent',
                                    minHeight: '44px'
                                  }}
                                >
                                  Annuleer
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Show scheduled date if available */}
                          {call.scheduled_date && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.25rem'
                            }}>
                              <Calendar size={14} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                              <span style={{
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                color: 'rgba(255, 255, 255, 0.5)'
                              }}>
                                {new Date(call.scheduled_date).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Empty State */}
      {filteredPlans.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <AlertCircle size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', marginBottom: '1rem' }} />
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.5rem'
          }}>
            Geen {selectedTab === 'active' ? 'actieve' : 'inactieve'} plannen
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {selectedTab === 'active' 
              ? 'Wijs een call template toe aan een client om te beginnen'
              : 'Er zijn momenteel geen inactieve plannen'}
          </p>
        </div>
      )}

      {/* Animations */}
      <style>{`
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
        
        @keyframes slideDown {
          from {
            opacity: 0;
            maxHeight: 0;
          }
          to {
            opacity: 1;
            maxHeight: 500px;
          }
        }
      `}</style>
    </div>
  )
}
