// src/modules/shopping/ShoppingHub.jsx
import React, { useState, useEffect } from 'react'
import ShoppingService from './ShoppingService'
import { 
  ShoppingCart, Package, BookOpen, Sparkles, 
  ChevronRight, TrendingUp, Zap, Clock, Euro,
  ShoppingBag, Target, Award, RefreshCw
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
  const [refreshing, setRefreshing] = useState(false)
  
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
  
  // 🔥 AUTO-REFRESH when meal plan changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'meal_plan_updated') {
        console.log('🔄 Meal plan changed, refreshing shopping list...')
        loadShoppingData()
        localStorage.removeItem('meal_plan_updated')
      }
    }
    
    const handleFocus = () => {
      const lastUpdate = localStorage.getItem('meal_plan_last_update')
      if (lastUpdate) {
        const timeSince = Date.now() - parseInt(lastUpdate)
        if (timeSince < 10000) {
          console.log('🔄 Recent update detected, refreshing...')
          loadShoppingData()
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [client])
  
  const loadShoppingData = async () => {
    setLoading(true)
    try {
      const activePlan = await service.getActiveMealPlan(client.id)
      
      let shoppingList = null
      if (activePlan?.shopping_list) {
        shoppingList = typeof activePlan.shopping_list === 'string' 
          ? JSON.parse(activePlan.shopping_list)
          : activePlan.shopping_list
      }
      
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
  
  // 🔥 MANUAL REFRESH with shopping list regeneration
  const handleManualRefresh = async () => {
    if (refreshing) return
    
    setRefreshing(true)
    
    try {
      if (shoppingData?.activePlan?.id) {
        console.log('🔄 Manually regenerating shopping list...')
        
        // Regenerate shopping list
        const newList = await service.generateShoppingList(shoppingData.activePlan.week_structure)
        
        // Update in database
        await db.supabase
          .from('client_meal_plans')
          .update({ 
            shopping_list: newList,
            updated_at: new Date().toISOString()
          })
          .eq('id', shoppingData.activePlan.id)
        
        // Update local state
        setShoppingData(prev => ({
          ...prev,
          shoppingList: newList
        }))
        
        // Success toast
        showToast('✅ Boodschappenlijst bijgewerkt!', 'success')
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error)
      showToast('❌ Vernieuwen mislukt', 'error')
    } finally {
      setRefreshing(false)
    }
  }
  
  // Toast helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      ${isMobile ? 'bottom: 80px' : 'top: 20px'};
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
      color: white;
      padding: ${isMobile ? '1rem 1.5rem' : '1rem 2rem'};
      border-radius: 16px;
      font-weight: 600;
      font-size: ${isMobile ? '0.9rem' : '1rem'};
      z-index: 9999;
      box-shadow: 0 10px 30px ${type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      animation: slideIn 0.3s ease;
    `
    
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-50%) ${isMobile ? 'translateY(20px)' : 'translateY(-20px)'};
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
      style.remove()
    }, 3000)
  }
  
  // Calculate progress
  const calculateProgress = () => {
    if (!shoppingData?.progress?.purchased_items || !shoppingData?.shoppingList?.items) return 0
    const checkedCount = Object.values(shoppingData.progress.purchased_items).filter(Boolean).length
    return Math.round((checkedCount / shoppingData.shoppingList.items.length) * 100)
  }
  
  // Tab configuration
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
  
  // Quick stats
  const progress = calculateProgress()
  const totalItems = shoppingData?.shoppingList?.items?.length || 0
  const totalCost = shoppingData?.shoppingList?.totalCost || '0.00'
  
  // 🔥 Format euro values to 2 decimalen
  const formatEuro = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #000 0%, #050505 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            marginBottom: '1.5rem',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <ShoppingCart size={32} color="#10b981" />
          </div>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '0.5rem'
          }}>
            Boodschappenlijst laden...
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Even geduld
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #000 0%, #050505 100%)',
      position: 'relative',
      paddingBottom: isMobile ? '80px' : '2rem'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />
      
      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0.75rem' : '1.5rem 1rem'
      }}>
        {/* 🔥 COMPACT: Header stats - smaller, cleaner */}
        {shoppingData?.shoppingList && (
          <div style={{
            marginBottom: isMobile ? '0.75rem' : '1rem',
            animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? '0.5rem' : '0.625rem'
            }}>
              {/* Items stat - COMPACT */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                transform: animateStats ? 'scale(1)' : 'scale(0.9)',
                opacity: animateStats ? 1 : 0,
                transition: 'all 0.4s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem'
                }}>
                  <ShoppingBag size={isMobile ? 12 : 14} color="#10b981" />
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Items
                  </div>
                </div>
                <div style={{
                  fontSize: isMobile ? '1.375rem' : '1.5rem',
                  fontWeight: '800',
                  color: '#10b981',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  {totalItems}
                </div>
              </div>
              
              {/* Cost stat - COMPACT */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                transform: animateStats ? 'scale(1)' : 'scale(0.9)',
                opacity: animateStats ? 1 : 0,
                transition: 'all 0.4s ease 0.1s'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem'
                }}>
                  <Euro size={isMobile ? 12 : 14} color="#f59e0b" />
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Totaal
                  </div>
                </div>
                <div style={{
                  fontSize: isMobile ? '1.125rem' : '1.25rem',
                  fontWeight: '800',
                  color: '#f59e0b',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  €{formatEuro(totalCost)}
                </div>
              </div>
              
              {/* Progress stat - COMPACT */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: isMobile ? '10px' : '12px',
                padding: isMobile ? '0.75rem' : '0.875rem',
                transform: animateStats ? 'scale(1)' : 'scale(0.9)',
                opacity: animateStats ? 1 : 0,
                transition: 'all 0.4s ease 0.2s'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem'
                }}>
                  <Target size={isMobile ? 12 : 14} color="#10b981" />
                  <div style={{
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700'
                  }}>
                    Voortgang
                  </div>
                </div>
                <div style={{
                  fontSize: isMobile ? '1.375rem' : '1.5rem',
                  fontWeight: '800',
                  color: '#10b981',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}>
                  {progress}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 🔥 COMPACT: Tabs met responsive grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.5rem' : '0.625rem',
          marginBottom: isMobile ? '0.75rem' : '1rem'
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
                  padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
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
                  animation: `slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (tab.available && !isActive && !isMobile) {
                    e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'
                    e.currentTarget.style.background = tab.lightGradient
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab.available && !isActive && !isMobile) {
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
                  width: isMobile ? '28px' : '32px',
                  height: isMobile ? '28px' : '32px',
                  background: isActive ? tab.gradient : 'transparent',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem',
                  transition: 'all 0.4s ease'
                }}>
                  <Icon size={isMobile ? 16 : 18} color={isActive ? 'white' : tab.color} />
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8125rem',
                    fontWeight: '700',
                    letterSpacing: '-0.01em'
                  }}>
                    {tab.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.625rem' : '0.65rem',
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
      
      {/* Tab Content */}
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
        
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'knowledge' && <KnowledgeTab db={db} client={client} />}
        {activeTab === 'builder' && <BuilderTab />}
      </div>
      
      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(0.98); }
        }
        
        @keyframes expandWidth {
          from { width: 0; }
          to { width: 60%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(5deg); }
          50% { transform: translateY(10px) translateX(-10px) rotate(-5deg); }
          75% { transform: translateY(-10px) translateX(15px) rotate(3deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 16px 40px rgba(16, 185, 129, 0.5); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
