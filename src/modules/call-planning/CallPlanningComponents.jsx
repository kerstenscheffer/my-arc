import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Calendar, Users, Clock, AlertCircle, Plus, BarChart3, Phone, Zap, TrendingUp, CheckCircle } from 'lucide-react'
import CallPlanningService from './CallPlanningService'
import PendingRequests from './components/coach/PendingRequests'

// Lazy load heavy components
const TemplateManager = lazy(() => import('./components/coach/TemplateManager'))
const ClientPlans = lazy(() => import('./components/coach/ClientPlans'))
const Analytics = lazy(() => import('./components/coach/Analytics'))

export function CallPlanningTab({ db, clients, currentUser }) {
  const [activeView, setActiveView] = useState('dashboard')
  const [templates, setTemplates] = useState([])
  const [plans, setPlans] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredNav, setHoveredNav] = useState(null)
  const [hoveredStat, setHoveredStat] = useState(null)

  // Load data on mount
  useEffect(() => {
    loadAllData()
    // Auto refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      refreshRequests()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [templatesData, plansData, requestsData] = await Promise.all([
        CallPlanningService.getCoachTemplates(),
        CallPlanningService.getCoachPlans(),
        CallPlanningService.getPendingRequests()
      ])
      
      setTemplates(templatesData)
      setPlans(plansData)
      setRequests(requestsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshRequests = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const newRequests = await CallPlanningService.getPendingRequests()
      setRequests(newRequests)
    } catch (error) {
      console.error('Error refreshing requests:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshing])

  const handleApproveRequest = useCallback(async (requestId, message) => {
    await CallPlanningService.approveRequest(requestId, message)
    await refreshRequests()
  }, [])

  const handleRejectRequest = useCallback(async (requestId, reason) => {
    await CallPlanningService.rejectRequest(requestId, reason)
    await refreshRequests()
  }, [])

  // Calculate stats
  const stats = {
    pendingRequests: requests.length,
    activePlans: plans.filter(p => p.status === 'active').length,
    completedCalls: plans.reduce((sum, p) => 
      sum + (p.client_calls?.filter(c => c.status === 'completed').length || 0), 0
    ),
    upcomingCalls: plans.reduce((sum, p) => 
      sum + (p.client_calls?.filter(c => c.status === 'scheduled').length || 0), 0
    )
  }

  // Premium styled navigation button
  const NavButton = ({ view, icon: Icon, label, badge }) => {
    const isActive = activeView === view
    const isHovered = hoveredNav === view
    
    const navConfig = {
      dashboard: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#3b82f6' },
      requests: { gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: '#fb923c' },
      plans: { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#8b5cf6' },
      templates: { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#10b981' }
    }
    
    const config = navConfig[view] || navConfig.dashboard
    
    return (
      <button
        onClick={() => setActiveView(view)}
        onMouseEnter={() => setHoveredNav(view)}
        onMouseLeave={() => setHoveredNav(null)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 0.5rem',
          background: isActive 
            ? config.gradient
            : isHovered 
              ? `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`
              : 'transparent',
          border: `1px solid ${isActive ? 'transparent' : isHovered ? config.color + '30' : 'transparent'}`,
          borderRadius: '16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          transform: isHovered && !isActive ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isActive 
            ? `0 10px 30px ${config.color}40`
            : isHovered 
              ? `0 5px 15px ${config.color}20`
              : 'none'
        }}
      >
        <Icon size={20} style={{ 
          color: isActive ? '#fff' : isHovered ? config.color : 'rgba(255,255,255,0.6)',
          filter: isActive ? `drop-shadow(0 0 10px rgba(255,255,255,0.3))` : 'none'
        }} />
        <span style={{ 
          fontSize: '0.75rem',
          fontWeight: '600',
          color: isActive ? '#fff' : isHovered ? config.color : 'rgba(255,255,255,0.6)'
        }}>
          {label}
        </span>
        {badge > 0 && (
          <span style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            animation: badge > 0 ? 'pulse 2s infinite' : 'none'
          }}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      position: 'relative'
    }}>
      {/* Decorative background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '500px',
        background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at top left, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      {/* Premium Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 64, 175, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
            }}>
              <Phone size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.025em'
              }}>
                Call Planning
              </h1>
              <p style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                margin: 0
              }}>
                Beheer je coaching calls
              </p>
            </div>
          </div>
        </div>
        
        {/* Premium Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0 1rem 1rem'
        }}>
          <NavButton view="dashboard" icon={BarChart3} label="Dashboard" />
          <NavButton view="requests" icon={AlertCircle} label="Aanvragen" badge={stats.pendingRequests} />
          <NavButton view="plans" icon={Calendar} label="Planningen" />
          <NavButton view="templates" icon={Phone} label="Templates" />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '20px',
                  height: '150px',
                  animation: `shimmer 2s infinite`,
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
        ) : (
          <>
            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Stats Grid - Premium Dark Theme */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {[
                    { 
                      title: 'Openstaand',
                      value: stats.pendingRequests,
                      icon: AlertCircle,
                      gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)',
                      lightGradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)',
                      color: '#fb923c',
                      onClick: () => setActiveView('requests'),
                      highlight: stats.pendingRequests > 0
                    },
                    {
                      title: 'Actieve Plans',
                      value: stats.activePlans,
                      icon: Users,
                      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(30, 64, 175, 0.9) 100%)',
                      lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 64, 175, 0.1) 100%)',
                      color: '#3b82f6',
                      onClick: () => setActiveView('plans')
                    },
                    {
                      title: 'Voltooid',
                      value: stats.completedCalls,
                      icon: CheckCircle,
                      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                      lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      color: '#10b981'
                    },
                    {
                      title: 'Gepland',
                      value: stats.upcomingCalls,
                      icon: Calendar,
                      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
                      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                      color: '#8b5cf6'
                    }
                  ].map((stat, index) => {
                    const Icon = stat.icon
                    const isHovered = hoveredStat === index
                    
                    return (
                      <div
                        key={index}
                        onClick={stat.onClick}
                        onMouseEnter={() => setHoveredStat(index)}
                        onMouseLeave={() => setHoveredStat(null)}
                        style={{
                          background: isHovered ? stat.gradient : stat.lightGradient,
                          backdropFilter: 'blur(20px)',
                          border: `1px solid ${isHovered ? stat.color + '40' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '20px',
                          padding: '1.5rem',
                          cursor: stat.onClick ? 'pointer' : 'default',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                          boxShadow: isHovered 
                            ? `0 20px 40px ${stat.color}30, inset 0 1px 0 rgba(255,255,255,0.1)` 
                            : '0 10px 30px rgba(0,0,0,0.2)',
                          position: 'relative',
                          overflow: 'hidden',
                          animation: `slideInUp ${300 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                          opacity: 0
                        }}
                      >
                        {/* Decorative orb */}
                        <div style={{
                          position: 'absolute',
                          top: '-30px',
                          right: '-30px',
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          background: stat.gradient,
                          opacity: 0.2,
                          filter: 'blur(30px)'
                        }} />
                        
                        <div style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem'
                          }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '14px',
                              background: `linear-gradient(135deg, ${stat.color}30 0%, ${stat.color}10 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
                              transition: 'transform 0.3s ease'
                            }}>
                              <Icon size={24} style={{ 
                                color: stat.color,
                                filter: stat.highlight ? `drop-shadow(0 0 10px ${stat.color}60)` : 'none'
                              }} />
                            </div>
                            <span style={{
                              fontSize: '2rem',
                              fontWeight: 'bold',
                              color: isHovered ? '#fff' : 'rgba(255,255,255,0.9)',
                              textShadow: stat.highlight ? `0 0 20px ${stat.color}60` : 'none'
                            }}>
                              {stat.value}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.9rem',
                            color: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                            fontWeight: '500',
                            margin: 0
                          }}>
                            {stat.title}
                          </p>
                          {stat.highlight && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              background: `${stat.color}20`,
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <Zap size={12} style={{ color: stat.color }} />
                              <span style={{ fontSize: '0.75rem', color: stat.color, fontWeight: '600' }}>
                                Actie vereist
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Urgent Actions Alert */}
                {stats.pendingRequests > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    backdropFilter: 'blur(10px)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-30px',
                      right: '-30px',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 70%)'
                    }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <AlertCircle size={24} style={{ color: '#fb923c' }} />
                        Actie Vereist
                      </h3>
                      <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '1rem'
                      }}>
                        Je hebt {stats.pendingRequests} openstaande bonus call aanvragen
                      </p>
                      <button
                        onClick={() => setActiveView('requests')}
                        style={{
                          background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
                          color: '#fff',
                          padding: '0.875rem 1.5rem',
                          borderRadius: '12px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 146, 60, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 146, 60, 0.3)'
                        }}
                      >
                        Bekijk Aanvragen
                        <AlertCircle size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Activity with Premium Styling */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <TrendingUp size={20} style={{ color: '#8b5cf6' }} />
                      Recente Activiteit
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {plans.slice(0, 3).map((plan, index) => (
                        <div 
                          key={plan.id}
                          style={{
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            animation: `slideInUp ${500 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                            opacity: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.transform = 'translateX(4px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                            e.currentTarget.style.transform = 'translateX(0)'
                          }}
                        >
                          <div>
                            <p style={{
                              fontWeight: '600',
                              color: '#fff',
                              marginBottom: '0.25rem'
                            }}>
                              {plan.clients?.name || 'Client'}
                            </p>
                            <p style={{
                              fontSize: '0.85rem',
                              color: 'rgba(255,255,255,0.5)'
                            }}>
                              {plan.call_templates?.template_name}
                            </p>
                          </div>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.15) 100%)',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            {plan.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Requests View */}
            {activeView === 'requests' && (
              <PendingRequests
                requests={requests}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                loading={refreshing}
              />
            )}

            {/* Plans View */}
            {activeView === 'plans' && (
              <Suspense fallback={<LoadingSpinner />}>
                <ClientPlans plans={plans} onRefresh={loadAllData} />
              </Suspense>
            )}

            {/* Templates View */}
            {activeView === 'templates' && (
              <Suspense fallback={<LoadingSpinner />}>
                <TemplateManager 
                  templates={templates} 
                  onRefresh={loadAllData}
                />
              </Suspense>
            )}
          </>
        )}
      </div>

      {/* Premium Floating Action Button */}
      <button
        onClick={() => setActiveView('templates')}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 20
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0)'
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)'
        }}
      >
        <Plus size={28} />
      </button>

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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

// Premium Loading Component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '4rem 0'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid rgba(16, 185, 129, 0.2)',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CallPlanningTab
