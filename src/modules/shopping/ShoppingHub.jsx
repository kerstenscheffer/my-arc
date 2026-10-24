// src/modules/shopping/ShoppingHub.jsx - V3 STYLING GUIDE COMPLIANT
// v3.1 — PageVideoWidget toegevoegd (pageContext="boodschappen")
import React, { useState, useEffect } from 'react'
import ShoppingService from './ShoppingService'
import { weekplanVoorWeek, lokaleDatum } from '../meal-plan/DayTemplateService'
import { ShoppingCart } from 'lucide-react'

import WeekShoppingTab from './tabs/WeekShoppingTab'
// Skelet in de vorm van de lijst; staat bij de andere paginaskeletten zodat
// het dashboard hem al toont terwijl deze code nog laadt.
import { BoodschappenSkelet } from '../../client/PaginaSkeletten'
import usePaginaTerug from '../../client/usePaginaTerug'


// Blijft bewaard tussen tabbladwissels: terugkomen toont de lijst meteen
// (en ververst op de achtergrond). Een uit het weekschema berekende lijst
// wordt per plan + wijzigingsmoment bewaard, zodat die niet elke keer opnieuw
// wordt opgebouwd.
let laatsteStand = null // { clientId, data }
const berekendeLijsten = new Map()

export default function ShoppingHub({ client, db, onNavigate }) {
  const [service] = useState(() => new ShoppingService(db))
  const isMobile = window.innerWidth <= 768
  const uitCache = laatsteStand?.clientId === client?.id ? laatsteStand.data : null
  const [loading, setLoading] = useState(!uitCache)
  const [shoppingData, setShoppingDataState] = useState(uitCache)
  const setShoppingData = (data) => {
    laatsteStand = { clientId: client?.id, data }
    setShoppingDataState(data)
  }
  
  useEffect(() => {
    if (client?.id) {
      loadShoppingData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])
  
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
  }, [client?.id])
  // Terug op Boodschappen: een wissel op Voeding kan de lijst veranderd hebben.
  usePaginaTerug('boodschappen', () => { if (client?.id) loadShoppingData() })
  
  // Alleen de eerste keer het skelet. Verversen (na een planwijziging of
  // via onRefresh) laat de lijst staan tot de nieuwe er is, in plaats van
  // hem weg te halen voor een laadscherm.
  const loadShoppingData = async () => {
    try {
      const activePlan = await service.getActiveMealPlan(client.id)

      // Het weekplan van déze week: wijkt een dag af (coach paste deze week
      // aan, of de klant koos een dagsjabloon), dan telt die dag mee in de
      // lijst in plaats van de basisdag.
      const maandag = new Date(); maandag.setHours(0, 0, 0, 0)
      maandag.setDate(maandag.getDate() - ((maandag.getDay() + 6) % 7))
      const dezeWeek = activePlan?.week_structure
        ? await weekplanVoorWeek(db.supabase, client.id, activePlan.week_structure, maandag)
        : null
      const wijktAf = !!dezeWeek && dezeWeek !== activePlan.week_structure

      let shoppingList = null
      if (activePlan?.shopping_list && !wijktAf) {
        shoppingList = typeof activePlan.shopping_list === 'string' 
          ? JSON.parse(activePlan.shopping_list)
          : activePlan.shopping_list
      }
      
      if (!shoppingList && dezeWeek) {
        const sleutel = `${activePlan.id}:${activePlan.updated_at || ''}:${wijktAf ? lokaleDatum(maandag) + JSON.stringify(dezeWeek).length : ''}`
        shoppingList = berekendeLijsten.get(sleutel)
        if (!shoppingList) {
          shoppingList = await service.generateShoppingList(dezeWeek)
          if (shoppingList) berekendeLijsten.set(sleutel, shoppingList)
        }
      }
      
      const progress = await service.getShoppingProgress(client.id, activePlan?.id)
      
      setShoppingData({
        activePlan,
        shoppingList,
        progress,
        weekStructure: dezeWeek || activePlan?.week_structure
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
