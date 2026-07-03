// src/modules/meal-plan/MealPlanMain.jsx
// MINIMAL VERSION - Routes to AI Dashboard when AI plan detected
// v2 — PageVideoWidget toegevoegd aan fallback scherm (pageContext="meal")
import React, { useState, useEffect } from 'react'
import MealPlanService from './MealPlanService'
import AIMealDashboard from './AIMealDashboard'
import VoedingsGids from './VoedingsGids'
import GelegenhedenHub from './GelegenhedenHub'
import NutritionChoiceTrainer from '../lab/experiments/NutritionChoiceTrainer'

export default function MealPlanMain({ client, onNavigate, db }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [service] = useState(() => new MealPlanService(db))
  const [loading, setLoading] = useState(true)
  const [hasAIPlan, setHasAIPlan] = useState(false)
  // 'plan' = bestaand meal-plan, 'gids' = Voedingsgids (issue 19ee0bf7).
  const [tab, setTab] = useState('plan')
  
  // Check for AI plan
  useEffect(() => {
    checkForAIPlan()
  }, [client])
  
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
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(255, 215, 0, 0.2)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    )
  }
  
  // Plan-paneel: AI-dashboard als er een plan is, anders de fallback.
  const planPanel = hasAIPlan ? (
    <AIMealDashboard client={client} onNavigate={onNavigate} db={db} />
  ) : (
    <div style={{
      minHeight: '60vh',
      background: '#0a0a0a',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
          Geen Meal Plan Actief
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Vraag je coach om een AI meal plan voor je te genereren!
        </p>
      </div>
    </div>
  )

  // De tabs Voedingsgids / Gelegenheden / Slim kiezen zijn voor nu verborgen
  // (op verzoek). Alleen het plan wordt getoond. De componenten + 'tab'-state
  // blijven bestaan zodat we ze later weer kunnen aanzetten.
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {planPanel}
    </div>
  )
}
