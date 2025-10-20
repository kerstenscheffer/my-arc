// src/modules/shopping/ShoppingHub.jsx
import React, { useState, useEffect } from 'react'
import ShoppingService from './ShoppingService'
import { 
  ShoppingCart, Package, BookOpen, Sparkles, 
  ChevronRight, TrendingUp, Zap, Clock, Euro,
  ShoppingBag, Target, Award
} from 'lucide-react'

// Tab Components
import WeekShoppingTab from './tabs/WeekShoppingTab'
import TemplatesTab from './tabs/TemplatesTab'
import KnowledgeTab from './tabs/KnowledgeTab'
import BuilderTab from './tabs/BuilderTab'

export default function ShoppingHub({ client, db, onNavigate }) {
  const [service] = useState(() => new ShoppingService(db))
  const isMobile = window.innerWidth <= 768
  const [activeTab, setActiveTab] = useState('week')
  const [loading, setLoading] = useState(true)
  const [shoppingData, setShoppingData] = useState(null)
  const [animateStats, setAnimateStats] = useState(false)
  
  // Load shopping data on mount
  useEffect(() => {
    if (client?.id) {
      loadShoppingData()
    }
  }, [client])
  
  // Trigger animations after data loads
  useEffect(() => {
    if (shoppingData?.shoppingList) {
      setTimeout(() => setAnimateStats(true), 100)
    }
  }, [shoppingData])
  
  const loadShoppingData = async () => {
    setLoading(true)
    try {
      // Get active meal plan with shopping list
      const activePlan = await service.getActiveMealPlan(client.id)
      
      // Parse shopping list if exists
      let shoppingList = null
      if (activePlan?.shopping_list) {
        shoppingList = typeof activePlan.shopping_list === 'string' 
          ? JSON.parse(activePlan.shopping_list)
          : activePlan.shopping_list
      }
      
      // Get any saved progress
      const progress = await service.getShoppingProgress(client.id, activePlan?.id)
      
      setShoppingData({
        activePlan,
        shoppingList,
        progress,
        weekStructure: activePlan?.week_structure
      })
    } catch (error) {
      console.error('Failed to load shopping data:', error)
      setShoppingData({
        activePlan: null,
        shoppingList: null,
        progress: null
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate progress
  const calculateProgress = () => {
    if (!shoppingData?.progress?.purchased_items || !shoppingData?.shoppingList?.items) return 0
    const checkedCount = Object.values(shoppingData.progress.purchased_items).filter(Boolean).length
    return Math.round((checkedCount / shoppingData.shoppingList.items.length) * 100)
  }
  
  // Tab configuration with enhanced styling
  const tabs = [
    {
      id: 'week',
      label: 'Week Plan',
      sublabel: '7 dagen',
      icon: ShoppingCart,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      available: true
    },
    {
      id: 'templates',
      label: 'Smart Lists',
      sublabel: 'AI powered',
      icon: Package,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
      available: false,
      comingSoon: true
    },
    {
      id: 'knowledge',
      label: 'Shop Tips',
      sublabel: 'Bespaar €€',
      icon: BookOpen,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
      available: true
    },
    {
      id: 'builder',
      label: 'Custom',
      sublabel: 'Zelf maken',
      icon: Sparkles,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      lightGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
      available: false,
      comingSoon: true
    }
  ]
  
  const activeTabConfig = tabs.find(t => t.id === activeTab)
  const progress = calculateProgress()
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <div style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '500'
          }}>
            Shopping laden...
          </div>
        </div>
        <style>{`
          @keyframes spin { 
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      paddingBottom: isMobile ? '6rem' : '2rem',
      position: 'relative'
    }}>
      {/* Animated Background Particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        overflow: 'hidden',
        opacity: 0.5,
        pointerEvents: 'none'
      }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
              background: activeTabConfig.gradient,
              borderRadius: '50%',
              filter: 'blur(40px)',
              top: `${20 + i * 15}%`,
              left: `${10 + i * 20}%`,
              animation: `float ${15 + i * 5}s ease-in-out infinite`,
              animationDelay: `${i * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Premium Header Section */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Main Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              background: activeTabConfig.gradient,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 12px 32px ${activeTabConfig.color}40`,
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <ShoppingBag size={isMobile ? 24 : 28} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '1.875rem',
                fontWeight: '800',
                background: activeTabConfig.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.03em',
                margin: 0,
                lineHeight: 1.1
              }}>
                Smart Shopping
              </h1>
              {shoppingData?.activePlan && (
                <p style={{
                  fontSize: isMobile ? '0.825rem' : '0.925rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0.25rem 0 0 0',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}>
                  <Clock size={12} style={{ opacity: 0.7 }} />
                  Week {new Date().toLocaleDateString('nl-NL', { week: 'long' }).split(' ')[1]}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Premium Stats Cards */}
        {shoppingData?.shoppingList && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1.5rem'
          }}>
            {/* Total Cost Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.25rem',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: animateStats ? 'scale(1)' : 'scale(0.95)',
              opacity: animateStats ? 1 : 0,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                animation: 'rotate 20s linear infinite'
              }} />
              
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Euro size={16} style={{ color: '#10b981', opacity: 0.8 }} />
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(16, 185, 129, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Totaal
                  </span>
                </div>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '800',
                  color: '#10b981',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  €{shoppingData.shoppingList?.totalCost?.toFixed(0) || '0'}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '0.25rem'
                }}>
                  Geschat bedrag
                </div>
              </div>
            </div>
            
            {/* Items Count Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.25rem',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: animateStats ? 'scale(1)' : 'scale(0.95)',
              opacity: animateStats ? 1 : 0,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
            }}>
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Package size={16} style={{ color: '#8b5cf6', opacity: 0.8 }} />
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(139, 92, 246, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Items
                  </span>
                </div>
                <div style={{
                  fontSize: isMobile ? '1.75rem' : '2rem',
                  fontWeight: '800',
                  color: '#8b5cf6',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  {shoppingData.shoppingList?.itemCount || 0}
                </div>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.825rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '0.25rem'
                }}>
                  Unieke producten
                </div>
              </div>
            </div>
            
            {/* Progress Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.25rem',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: animateStats ? 'scale(1)' : 'scale(0.95)',
              opacity: animateStats ? 1 : 0,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              display: isMobile ? 'none' : 'block'
            }}>
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Target size={16} style={{ color: '#f59e0b', opacity: 0.8 }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(245, 158, 11, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Progress
                  </span>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#f59e0b',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  {progress}%
                </div>
                <div style={{
                  fontSize: '0.825rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '0.25rem'
                }}>
                  Afgevinkt
                </div>
              </div>
            </div>
            
            {/* Savings Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.25rem',
              border: '1px solid rgba(236, 72, 153, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              transform: animateStats ? 'scale(1)' : 'scale(0.95)',
              opacity: animateStats ? 1 : 0,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              display: isMobile ? 'none' : 'block'
            }}>
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Award size={16} style={{ color: '#ec4899', opacity: 0.8 }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(236, 72, 153, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Besparing
                  </span>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#ec4899',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  €12
                </div>
                <div style={{
                  fontSize: '0.825rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '0.25rem'
                }}>
                  Met bulk korting
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Premium Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.625rem' : '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          WebkitScrollbar: { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => tab.available && setActiveTab(tab.id)}
                disabled={!tab.available}
                style={{
                  flex: isMobile ? '0 0 auto' : 1,
                  minWidth: isMobile ? '110px' : 'auto',
                  padding: isMobile ? '0.875rem' : '1rem 1.25rem',
                  background: isActive
                    ? tab.lightGradient
                    : 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(17, 17, 17, 0.3) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isActive ? tab.color + '25' : 'rgba(255, 255, 255, 0.05)'}`,
                  borderRadius: '14px',
                  color: isActive ? tab.color : tab.available ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.25)',
                  cursor: tab.available ? 'pointer' : 'not-allowed',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.375rem',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  opacity: tab.available ? 1 : 0.4,
                  transform: isActive ? 'scale(1)' : 'scale(0.98)',
                  animation: `slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  if (tab.available && !isActive) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'
                    e.currentTarget.style.background = tab.lightGradient
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab.available && !isActive) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(17, 17, 17, 0.3) 100%)'
                  }
                }}
                onTouchStart={(e) => {
                  if (tab.available && isMobile) {
                    e.currentTarget.style.transform = 'scale(0.95)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (tab.available && isMobile) {
                    e.currentTarget.style.transform = isActive ? 'scale(1)' : 'scale(0.98)'
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: isActive ? tab.gradient : 'transparent',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem',
                  transition: 'all 0.4s ease'
                }}>
                  <Icon size={18} color={isActive ? 'white' : tab.color} />
                </div>
                
                <div>
                  <div style={{
                    fontSize: isMobile ? '0.825rem' : '0.925rem',
                    fontWeight: '700',
                    letterSpacing: '-0.01em'
                  }}>
                    {tab.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    opacity: 0.6,
                    marginTop: '0.125rem'
                  }}>
                    {tab.sublabel}
                  </div>
                </div>
                
                {tab.comingSoon && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    padding: '0.125rem 0.375rem',
                    background: tab.gradient,
                    borderRadius: '6px',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: `0 4px 12px ${tab.color}40`
                  }}>
                    Soon
                  </span>
                )}
                
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '20%',
                    right: '20%',
                    height: '3px',
                    background: tab.gradient,
                    borderRadius: '3px 3px 0 0',
                    animation: 'expandWidth 0.3s ease'
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Tab Content with Animation */}
      <div style={{ 
        animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '60vh',
        position: 'relative',
        zIndex: 1
      }}>
        {activeTab === 'week' && (
          <WeekShoppingTab
            shoppingData={shoppingData}
            service={service}
            client={client}
            onRefresh={loadShoppingData}
            db={db}
          />
        )}
        
        {activeTab === 'templates' && (
          <TemplatesTab />
        )}
        
        {activeTab === 'knowledge' && (
          <KnowledgeTab
            db={db}
            client={client}
          />
        )}
        
        {activeTab === 'builder' && (
          <BuilderTab />
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(0.98);
          }
        }
        
        @keyframes expandWidth {
          from { width: 0; }
          to { width: 60%; }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% { 
            transform: translateY(-20px) translateX(10px) rotate(5deg);
          }
          50% { 
            transform: translateY(10px) translateX(-10px) rotate(-5deg);
          }
          75% { 
            transform: translateY(-10px) translateX(15px) rotate(3deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 16px 40px rgba(16, 185, 129, 0.5);
          }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
