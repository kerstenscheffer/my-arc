// src/modules/meal-plan/MealPlanMain.jsx
// MINIMAL VERSION - Routes to AI Dashboard when AI plan detected
import React, { useState, useEffect } from 'react'
import MealPlanService from './MealPlanService'
import AIMealDashboard from './AIMealDashboard'

export default function MealPlanMain({ client, onNavigate, db }) {
  const [service] = useState(() => new MealPlanService(db))
  const [loading, setLoading] = useState(true)
  const [hasAIPlan, setHasAIPlan] = useState(false)
  
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
        background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    )
  }
  
  // Route to AI Dashboard if AI plan exists
  if (hasAIPlan) {
    return <AIMealDashboard client={client} onNavigate={onNavigate} db={db} />
  }
  
  // Fallback - No meal plan
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'white',
          marginBottom: '1rem'
        }}>
          Geen Meal Plan Actief
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '2rem'
        }}>
          Vraag je coach om een AI meal plan voor je te genereren!
        </p>
        <button
          onClick={() => onNavigate('home')}
          style={{
            padding: '0.875rem 2rem',
            background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Terug naar Home
        </button>
      </div>
    </div>
  )
}
