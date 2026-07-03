// src/modules/shopping/ShoppingHub.jsx - V3 STYLING GUIDE COMPLIANT
// v3.1 — PageVideoWidget toegevoegd (pageContext="boodschappen")
import React, { useState, useEffect } from 'react'
import ShoppingService from './ShoppingService'
import { ShoppingCart } from 'lucide-react'

import WeekShoppingTab from './tabs/WeekShoppingTab'

export default function ShoppingHub({ client, db, onNavigate }) {
  const [service] = useState(() => new ShoppingService(db))
  const isMobile = window.innerWidth <= 768
  const [loading, setLoading] = useState(true)
  const [shoppingData, setShoppingData] = useState(null)
  
  useEffect(() => {
    if (client?.id) {
      loadShoppingData()
    }
  }, [client])
  
  // Auto-refresh when meal plan changes
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
      
      if (!shoppingList && activePlan?.week_structure) {
        console.log('🛒 No saved shopping list found, generating from week_structure...')
        shoppingList = await service.generateShoppingList(activePlan.week_structure)
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
  
  // Loading state — minimal spinner, no glow/pulse/glassmorphism
  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255, 215, 0, 0.15)',
            borderTopColor: '#FFD700',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Boodschappenlijst laden...
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      paddingBottom: isMobile ? '100px' : '2rem'
    }}>
      <WeekShoppingTab
        shoppingData={shoppingData}
        service={service}
        client={client}
        onRefresh={loadShoppingData}
        db={db}
      />

      {/* Coach video's gemigreerd naar centrale WidgetSidebar in ClientDashboard. */}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}
