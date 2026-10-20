// src/modules/meal-plan/MealPlanMain.jsx
// MINIMAL VERSION - Routes to AI Dashboard when AI plan detected
// v2 — PageVideoWidget toegevoegd aan fallback scherm (pageContext="meal")
import React, { useState, useEffect } from 'react'
import MealPlanService from './MealPlanService'
import AIMealDashboard from './AIMealDashboard'
import VoedingsGids from './VoedingsGids'
import GelegenhedenHub from './GelegenhedenHub'
import NutritionChoiceTrainer from '../lab/experiments/NutritionChoiceTrainer'
import PaginaLader from '../../ui/PaginaLader'

// Laatste uitkomst bewaard: terug naar Voeding toont het scherm meteen in
// plaats van eerst te wachten op deze check (en daarna pas het dashboard).
let bekendPlan = null // { clientId, heeft }

export default function MealPlanMain({ client, onNavigate, db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [service] = useState(() => new MealPlanService(db))
  const bekend = bekendPlan?.clientId === client?.id ? bekendPlan : null
  const [loading, setLoading] = useState(!bekend)
  const [hasAIPlan, setHasAIPlanState] = useState(bekend?.heeft || false)
  const setHasAIPlan = (heeft) => { bekendPlan = { clientId: client?.id, heeft }; setHasAIPlanState(heeft) }
  // 'plan' = bestaand meal-plan, 'gids' = Voedingsgids (issue 19ee0bf7).
  const [tab, setTab] = useState('plan')
  
  // Check for AI plan
  useEffect(() => {
    checkForAIPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])
  
  const checkForAIPlan = async () => {
    if (!client?.id) return
    
    try {
      // Check if client has AI generated plan
      const { data } = await db.supabase
        .from('client_meal_plans')
        .select('id, ai_generated, is_active')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()
      
      setHasAIPlan(data?.ai_generated === true)
    } catch (error) {
      console.log('No active meal plan found')
      setHasAIPlan(false)
    } finally {
      setLoading(false)
    }
  }
  
  // Loading state
  if (loading) return <PaginaLader pagina="meal" hoogte="100vh" />
  
  // Altijd het dashboard, ook zonder plan: dan draait het in de vrije stand
  // (eten loggen, water, macro's uit het profiel). De oude melding "vraag je
  // coach om een plan" is weg (issue 9 okt 2026). `hasAIPlan` blijft alleen
  // voor de wikkel eromheen.
  const planPanel = <AIMealDashboard client={client} onNavigate={onNavigate} db={db} />

  // De tabs Voedingsgids / Gelegenheden / Slim kiezen zijn voor nu verborgen
  // (op verzoek). Alleen het plan wordt getoond. De componenten + 'tab'-state
  // blijven bestaan zodat we ze later weer kunnen aanzetten.
  // Het AI-dashboard is zelf een vast scherm (eigen scrollgebied), dus daar
  // hoeft hier geen extra volle-hoogte wikkel omheen.
  return hasAIPlan ? planPanel : (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {planPanel}
    </div>
  )
}
