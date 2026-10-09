// src/modules/shopping/ShoppingHub.jsx - V3 STYLING GUIDE COMPLIANT
// v3.1 — PageVideoWidget toegevoegd (pageContext="boodschappen")
import React, { useState, useEffect } from 'react'
import ShoppingService from './ShoppingService'
import { ShoppingCart } from 'lucide-react'

import WeekShoppingTab, { SHOPPING_BANNER_URL } from './tabs/WeekShoppingTab'
import { SkeletStijl, SkeletBlok } from '../../ui/Skelet'

// Laden in de vorm van de lijst, zoals Meal en Workout (9 okt 2026): de echte
// bannerfoto staat er meteen, daaronder de balk Deze dag / Hele week, de titel
// en een paar categorieën met regels. Zelfde maten als WeekShoppingTab en
// CompactShoppingCategory, zodat er niets verspringt als de lijst er is.
function BoodschappenSkelet({ isMobile }) {
  const zij = isMobile ? '1rem' : '1.5rem'
  const lijn = '1px solid rgba(255,255,255,0.1)'
  const puls = { animation: 'skeletPuls 1.4s ease-in-out infinite' }
  return (
    <div aria-hidden style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <SkeletStijl />
      <div style={{ position: 'relative', height: isMobile ? 124 : 165 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${SHOPPING_BANNER_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.12) 18%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.88) 72%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: isMobile ? 10 : 14, display: 'flex', justifyContent: 'center' }}>
          <SkeletBlok breedte={isMobile ? 150 : 190} hoogte={isMobile ? 22 : 26} radius={8} />
        </div>
      </div>
      <div style={{ height: isMobile ? 44 : 48, borderBottom: lijn, margin: isMobile ? '0.25rem 0 0' : '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: 16, padding: `0 ${zij}` }}>
        <SkeletBlok breedte={70} hoogte={14} /><SkeletBlok breedte={70} hoogte={14} />
        <div style={{ flex: 1 }} />
        <SkeletBlok breedte={48} hoogte={14} /><SkeletBlok breedte={56} hoogte={14} />
      </div>
      <div style={{ padding: `0 ${zij}`, marginTop: isMobile ? '0.9rem' : '1.1rem' }}>
        <SkeletBlok breedte="52%" hoogte={isMobile ? 22 : 26} radius={7} />
      </div>
      {[5, 4, 3].map((regels, c) => (
        <div key={c} style={{ marginTop: isMobile ? '1.4rem' : '1.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `0 ${zij} 0.55rem`, borderBottom: lijn }}>
            <SkeletBlok breedte="34%" hoogte={18} />
            <div style={{ flex: 1 }} />
            <SkeletBlok breedte={34} hoogte={34} radius={10} /><SkeletBlok breedte={34} hoogte={34} radius={10} />
          </div>
          {Array.from({ length: regels }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: `0 ${zij}`, borderBottom: i < regels - 1 ? lijn : 'none', ...puls }}>
              <SkeletBlok breedte={22} hoogte={22} radius={11} />
              <SkeletBlok breedte={`${46 + ((i * 17) % 30)}%`} hoogte={13} />
              <div style={{ flex: 1 }} />
              <SkeletBlok breedte={46} hoogte={13} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

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
  
  // Alleen de eerste keer het skelet. Verversen (na een planwijziging of
  // via onRefresh) laat de lijst staan tot de nieuwe er is, in plaats van
  // hem weg te halen voor een laadscherm.
  const loadShoppingData = async () => {
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
  
  if (loading && !shoppingData) return <BoodschappenSkelet isMobile={isMobile} />

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
