import React, { useState, useEffect } from 'react'
import { 
  Phone, Calendar, Clock, AlertCircle, Plus, CheckCircle, 
  X, ChevronRight, Users, Zap, FileText, Star, ArrowRight,
  Info, TrendingUp, Activity, Award
} from 'lucide-react'
import CallPlanningService from '../../../../modules/call-planning/CallPlanningService'
export default function CallAssignV2({ db, client, refreshData, isMobile }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [templates, setTemplates] = useState([])
  const [assignedPlan, setAssignedPlan] = useState(null)
  const [clientCalls, setClientCalls] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningTemplate, setAssigningTemplate] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [stats, setStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    upcomingCalls: 0,
    pendingRequests: 0
  })

  useEffect(() => {
    loadCallData()
  }, [client])

  const loadCallData = async () => {
    setLoading(true)
    try {
      // DEBUG: Log current user
      const currentUser = await CallPlanningService.initUser()
      console.log('Current user:', currentUser)
      
      // Gebruik de CORRECTE methode uit CallPlanningService
      const templatesData = await CallPlanningService.getCoachTemplates()
      console.log('Templates loaded:', templatesData)
      
      // Check of templates call_template_items hebben
      if (templatesData && templatesData.length > 0) {
        console.log('First template structure:', templatesData[0])
        console.log('Template items:', templatesData[0].call_template_items)
      }
      
      setTemplates(templatesData || [])

      // Laad client plans - gebruik getClientPlans met clientId
      const plansData = await CallPlanningService.getClientPlans(client.id)
      console.log('Client plans loaded:', plansData)
      
      // Check of er een actief plan is
      const activePlan = plansData?.find(p => p.status === 'active')
      setAssignedPlan(activePlan || null)

      // Haal calls uit het actieve plan
      const callsData = activePlan?.client_calls || []
      setClientCalls(callsData)

      // Laad pending requests voor deze client
      const requestsData = await CallPlanningService.getClientRequests(client.id)
      console.log('Client requests loaded:', requestsData)
      setPendingRequests(requestsData || [])

      // Calculate stats
      const upcoming = callsData?.filter(c => 
        c.scheduled_date && new Date(c.scheduled_date) > new Date() && c.status === 'scheduled'
      ).length || 0

      const completed = callsData?.filter(c => c.status === 'completed').length || 0

      setStats({
        totalCalls: callsData?.length || 0,
        completedCalls: completed,
        upcomingCalls: upcoming,
        pendingRequests: requestsData?.filter(r => r.status === 'pending').length || 0
      })
    } catch (error) {
      console.error('Error loading call data:', error)
      // Toon meer specifieke error
      alert(`Fout bij laden data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTemplate = async () => {
    if (!selectedTemplate) {
      alert('Selecteer eerst een template')
      return
    }
    
    setAssigningTemplate(true)
    try {
      console.log('Assigning template:', selectedTemplate.id, 'to client:', client.id)
      
      // CORRECTE VOLGORDE volgens CallPlanningService.js regel 207:
      // async assignTemplateToClient(clientId, templateId, startDate = null)
      // Let op: clientId EERST, templateId TWEEDE!
      await CallPlanningService.assignTemplateToClient(
        client.id,           // clientId eerst
        selectedTemplate.id, // templateId tweede
        null                // optionele startDate
      )
      
      console.log('Template assigned successfully')
      
      // Refresh data
      await loadCallData()
      setSelectedTemplate(null)
      
      // Success feedback
      alert(`Template "${selectedTemplate.template_name}" succesvol toegewezen aan ${client.first_name}!`)
      
      if (refreshData) await refreshData()
    } catch (error) {
      console.error('Error assigning template:', error)
      if (error.message === 'Actie geannuleerd') {
        // User cancelled the action
        console.log('User cancelled template assignment')
      } else {
        alert(`Fout bij toewijzen: ${error.message || 'Onbekende fout'}`)
      }
    } finally {
      setAssigningTemplate(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      // Gebruik de CORRECTE methode uit CallPlanningService
      await CallPlanningService.approveRequest(requestId, 'Goedgekeurd door coach')
      await loadCallData()
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Fout bij goedkeuren aanvraag')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      // Gebruik de CORRECTE methode uit CallPlanningService
      await CallPlanningService.rejectRequest(requestId, 'Afgewezen door coach')
      await loadCallData()
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Fout bij afwijzen aanvraag')
    }
  }

  // Tab configuratie
  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Activity, color: '#8b5cf6' },
    { id: 'assign', label: 'Toewijzen', icon: Plus, color: '#10b981' },
    { id: 'calls', label: 'Calls', icon: Phone, color: '#3b82f6' },
    { id: 'requests', label: 'Aanvragen', icon: AlertCircle, color: '#fb923c', badge: stats.pendingRequests }
  ]

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#fff'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Call data laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      position: 'relative'
    }}>
      {/* Header met Client Info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        padding: isMobile ? '1rem' : '1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Client Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: isMobile ? '1rem' : '1.5rem'
          }}>
            <div style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Phone size={isMobile ? 20 : 24} style={{ color: '#fff' }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: 0
              }}>
                Call Planning
              </h2>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                margin: 0
              }}>
                {client.first_name} {client.last_name}
              </p>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: isMobile ? 'none' : 'flex',
              gap: '1rem'
            }}>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.completedCalls}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                  Voltooid
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {stats.upcomingCalls}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                  Gepland
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? '0.25rem' : '0.5rem',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: isActive 
                      ? `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? tab.color : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onTouchStart={(e) => {
                    if (isMobile && !isActive) {
                      e.currentTarget.style.transform = 'scale(0.98)'
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile) {
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <Icon size={isMobile ? 16 : 18} />
                  {!isMobile && <span>{tab.label}</span>}
                  {tab.badge > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Current Plan Status */}
            <div style={{
              background: assignedPlan 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
              border: `1px solid ${assignedPlan ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 146, 60, 0.2)'}`,
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {assignedPlan ? (
                    <>
                      <CheckCircle size={20} style={{ color: '#10b981' }} />
                      Actief Call Plan
                    </>
                  ) : (
                    <>
                      <AlertCircle size={20} style={{ color: '#fb923c' }} />
                      Geen Call Plan
                    </>
                  )}
                </h3>
                
                {!assignedPlan && (
                  <button
                    onClick={() => setActiveTab('assign')}
                    style={{
                      padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    <Plus size={16} />
                    Toewijzen
                  </button>
                )}
              </div>
              
              {assignedPlan ? (
                <div>
                  <p style={{
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    Template: {assignedPlan.call_templates?.template_name}
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.85rem'
                  }}>
                    Status: {assignedPlan.status}
                  </p>
                </div>
              ) : (
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
                }}>
                  Deze client heeft nog geen call planning. Wijs een template toe om te beginnen.
                </p>
              )}
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {[
                { 
                  title: 'Totaal Calls',
                  value: stats.totalCalls,
                  icon: Phone,
                  color: '#8b5cf6',
                  gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
                },
                { 
                  title: 'Voltooid',
                  value: stats.completedCalls,
                  icon: CheckCircle,
                  color: '#10b981',
                  gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                },
                { 
                  title: 'Gepland',
                  value: stats.upcomingCalls,
                  icon: Calendar,
                  color: '#3b82f6',
                  gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 64, 175, 0.05) 100%)'
                },
                { 
                  title: 'Aanvragen',
                  value: stats.pendingRequests,
                  icon: AlertCircle,
                  color: '#fb923c',
                  gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)'
                }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: hoveredCard === index ? stat.gradient : 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${hoveredCard === index ? stat.color + '30' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '16px',
                      padding: isMobile ? '1rem' : '1.25rem',
                      transition: 'all 0.3s ease',
                      transform: hoveredCard === index && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
                      cursor: 'default'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: isMobile ? '36px' : '40px',
                        height: isMobile ? '36px' : '40px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={isMobile ? 18 : 20} style={{ color: stat.color }} />
                      </div>
                      <span style={{
                        fontSize: isMobile ? '1.5rem' : '1.75rem',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}>
                        {stat.value}
                      </span>
                    </div>
                    <p style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      color: 'rgba(255,255,255,0.6)',
                      margin: 0
                    }}>
                      {stat.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Assign Tab - VERBETERD */}
        {activeTab === 'assign' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header met info */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '12px',
              padding: isMobile ? '0.75rem' : '1rem',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Phone size={20} />
                Call Templates Toewijzen
              </h3>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                Selecteer een template om aan {client.first_name} toe te wijzen. 
                {templates.length > 0 && ` (${templates.length} beschikbaar)`}
              </p>
            </div>
            
            {templates.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center'
              }}>
                <Phone size={48} style={{ 
                  color: 'rgba(139, 92, 246, 0.3)',
                  marginBottom: '1rem'
                }} />
                <h4 style={{
                  color: '#fff',
                  fontSize: '1.1rem',
                  marginBottom: '0.5rem'
                }}>
                  Geen Templates Gevonden
                </h4>
                <p style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  marginBottom: '1.5rem'
                }}>
                  Er zijn nog geen call templates aangemaakt. 
                  Ga naar de Call Planning sectie om templates te maken.
                </p>
                <button
                  onClick={() => window.location.href = '/coach#calls'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Templates Maken
                </button>
              </div>
            ) : (
              <>
                {/* Template Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem'
                }}>
                  {templates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id
                    const itemCount = template.call_template_items?.length || template.items?.length || 0
                    
                    return (
                      <div
                        key={template.id}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                          border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '16px',
                          padding: isMobile ? '1rem' : '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        onClick={() => setSelectedTemplate(template)}
                        onMouseEnter={(e) => {
                          if (!isMobile && !isSelected) {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.25)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile && !isSelected) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                        onTouchStart={(e) => {
                          if (isMobile) {
                            e.currentTarget.style.transform = 'scale(0.98)'
                          }
                        }}
                        onTouchEnd={(e) => {
                          if (isMobile) {
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                          }}>
                            <CheckCircle size={16} style={{ color: '#fff' }} />
                          </div>
                        )}
                        
                        {/* Template content */}
                        <h4 style={{
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          fontWeight: 'bold',
                          color: isSelected ? '#8b5cf6' : '#fff',
                          marginBottom: '0.5rem',
                          paddingRight: isSelected ? '3rem' : '0'
                        }}>
                          {template.template_name || template.name || 'Naamloos Template'}
                        </h4>
                        
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255,255,255,0.6)',
                          marginBottom: '1rem',
                          lineHeight: '1.5',
                          minHeight: '2.5rem'
                        }}>
                          {template.description || 'Geen beschrijving beschikbaar'}
                        </p>
                        
                        {/* Template stats */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            background: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Phone size={12} />
                            {itemCount} {itemCount === 1 ? 'call' : 'calls'}
                          </span>
                          
                          {template.duration_weeks && (
                            <span style={{
                              padding: '0.35rem 0.75rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Calendar size={12} />
                              {template.duration_weeks} {template.duration_weeks === 1 ? 'week' : 'weken'}
                            </span>
                          )}
                          
                          {template.is_active && (
                            <span style={{
                              padding: '0.35rem 0.75rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}>
                              Actief
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Fixed Assignment Button */}
                {selectedTemplate && (
                  <div style={{
                    position: isMobile ? 'fixed' : 'sticky',
                    bottom: isMobile ? '1rem' : 'auto',
                    left: isMobile ? '1rem' : 'auto',
                    right: isMobile ? '1rem' : 'auto',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.98) 0%, rgba(5, 150, 105, 0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                    zIndex: 50,
                    animation: 'slideInUp 0.3s ease'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: '#fff',
                        fontWeight: '600',
                        marginBottom: '0.25rem',
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}>
                        Template Geselecteerd
                      </p>
                      <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: isMobile ? '0.75rem' : '0.8rem'
                      }}>
                        {selectedTemplate.template_name} - {selectedTemplate.call_template_items?.length || 0} calls
                      </p>
                    </div>
                    <button
                      onClick={handleAssignTemplate}
                      disabled={assigningTemplate}
                      style={{
                        padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.75rem',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#059669',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '700',
                        cursor: assigningTemplate ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: assigningTemplate ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile && !assigningTemplate) {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      {assigningTemplate ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #059669',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                          Bezig...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Toewijzen aan {client.first_name}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Calls Tab */}
        {activeTab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Call Overzicht
            </h3>
            
            {clientCalls.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <Calendar size={48} style={{ 
                  color: 'rgba(255,255,255,0.2)',
                  marginBottom: '1rem'
                }} />
                <p style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  Nog geen calls gepland
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {clientCalls.map((call) => (
                  <div
                    key={call.id}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: isMobile ? '1rem' : '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.transform = 'translateX(4px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                        e.currentTarget.style.transform = 'translateX(0)'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: call.status === 'completed'
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {call.status === 'completed' ? (
                          <CheckCircle size={20} style={{ color: '#10b981' }} />
                        ) : (
                          <Clock size={20} style={{ color: '#3b82f6' }} />
                        )}
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.25rem'
                        }}>
                          {call.title || 'Call'}
                        </p>
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          {new Date(call.scheduled_date).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      background: call.status === 'completed'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.15) 100%)',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: call.status === 'completed' ? '#10b981' : '#3b82f6',
                      border: `1px solid ${call.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    }}>
                      {call.status === 'completed' ? 'Voltooid' : 'Gepland'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem'
            }}>
              Bonus Call Aanvragen
            </h3>
            
            {pendingRequests.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <AlertCircle size={48} style={{ 
                  color: 'rgba(255,255,255,0.2)',
                  marginBottom: '1rem'
                }} />
                <p style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  Geen openstaande aanvragen
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
                      border: '1px solid rgba(251, 146, 60, 0.2)',
                      borderRadius: '16px',
                      padding: isMobile ? '1rem' : '1.25rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#fff',
                          marginBottom: '0.5rem'
                        }}>
                          Bonus Call Aanvraag
                        </h4>
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255,255,255,0.6)',
                          marginBottom: '0.25rem'
                        }}>
                          {new Date(request.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(251, 146, 60, 0.2)',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#fb923c',
                        border: '1px solid rgba(251, 146, 60, 0.3)'
                      }}>
                        {request.urgency || 'Normaal'}
                      </span>
                    </div>
                    
                    <p style={{
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem',
                      marginBottom: '1rem'
                    }}>
                      {request.reason || 'Geen reden opgegeven'}
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem'
                    }}>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        <CheckCircle size={18} />
                        Goedkeuren
                      </button>
                      
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                          color: '#ef4444',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          }
                        }}
                      >
                        <X size={18} />
                        Afwijzen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
