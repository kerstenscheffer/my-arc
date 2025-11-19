// src/modules/meal-plan/components/wizard/slides/Slide2MacroGoals.jsx
// FIXED: Haalt targets uit active meal plan, met client fallback

import { useState, useEffect } from 'react'
import { Zap, Flame, Wheat, Droplet, Target } from 'lucide-react'
import CoachBubble from '../shared/CoachBubble'

export default function Slide2MacroGoals({ client, isMobile }) {
  const [goals, setGoals] = useState({
    calories: 2200,
    protein: 165,
    carbs: 220,
    fat: 70
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMacroGoals()
  }, [client])

  const loadMacroGoals = async () => {
    try {
      // Try to get from active meal plan first
      const { data: activePlan, error } = await window.db.supabase
        .from('client_meal_plans')
        .select('daily_calories, daily_protein, daily_carbs, daily_fat')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .single()

      if (!error && activePlan) {
        console.log('✅ [Slide2] Loaded targets from active meal plan:', activePlan)
        setGoals({
          calories: activePlan.daily_calories || 2200,
          protein: activePlan.daily_protein || 165,
          carbs: activePlan.daily_carbs || 220,
          fat: activePlan.daily_fat || 70
        })
      } else {
        // Fallback to client object
        console.log('⚠️ [Slide2] No active plan, using client fallback')
        setGoals({
          calories: client?.daily_calories || client?.macro_goals?.calories || 2200,
          protein: client?.daily_protein || client?.macro_goals?.protein || 165,
          carbs: client?.daily_carbs || client?.macro_goals?.carbs || 220,
          fat: client?.daily_fat || client?.macro_goals?.fat || 70
        })
      }
    } catch (err) {
      console.error('❌ [Slide2] Error loading goals:', err)
      // Use client fallback on error
      setGoals({
        calories: client?.daily_calories || client?.macro_goals?.calories || 2200,
        protein: client?.daily_protein || client?.macro_goals?.protein || 165,
        carbs: client?.daily_carbs || client?.macro_goals?.carbs || 220,
        fat: client?.daily_fat || client?.macro_goals?.fat || 70
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        padding: isMobile ? '2rem 1rem' : '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          ⏳
        </div>
        <div style={{
          fontSize: isMobile ? '1rem' : '1.125rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Laden van jouw doelen...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      padding: '0'
    }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.75rem' : '0 1rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em'
        }}>
          Jouw Doelen
        </h1>
        
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '0',
          fontWeight: '500',
          lineHeight: '1.4'
        }}>
          Check je dagelijkse targets. We maken een plan dat hier perfect bij past.
        </p>
      </div>

      {/* Goals Overview - 2x2 GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.625rem' : '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        {/* Calories Card */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '1rem 0.75rem' : '1.5rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: isMobile ? '12px' : '14px',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            opacity: 0.6,
            zIndex: 2
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: isMobile ? '32px' : '48px',
              height: isMobile ? '32px' : '48px',
              margin: '0 auto 0.5rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
            }}>
              <Zap 
                size={isMobile ? 16 : 24} 
                color="#10b981"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))' }}
              />
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.8rem',
              fontWeight: '700',
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.375rem'
            }}>
              Dagelijks
            </div>
            <div style={{
              fontSize: isMobile ? '1.75rem' : '3rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              marginBottom: '0.25rem',
              textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
            }}>
              {goals.calories}
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '600'
            }}>
              kcal
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '0.875rem 0.75rem' : '1.125rem 1rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              margin: '0 auto 0.625rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)'
            }}>
              <Flame 
                size={isMobile ? 16 : 20} 
                color="#ef4444"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' }}
              />
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.375rem'
            }}>
              Eiwit
            </div>
            <div style={{
              fontSize: isMobile ? '1.625rem' : '2rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              marginBottom: '0.25rem'
            }}>
              {goals.protein}g
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              per dag
            </div>
          </div>
        </div>

        {/* Carbs Card */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '0.875rem 0.75rem' : '1.125rem 1rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              margin: '0 auto 0.625rem',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)'
            }}>
              <Wheat 
                size={isMobile ? 16 : 20} 
                color="#f59e0b"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' }}
              />
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.375rem'
            }}>
              Koolhydraten
            </div>
            <div style={{
              fontSize: isMobile ? '1.625rem' : '2rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              marginBottom: '0.25rem'
            }}>
              {goals.carbs}g
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              per dag
            </div>
          </div>
        </div>

        {/* Fats Card */}
        <div style={{
          position: 'relative',
          padding: isMobile ? '0.875rem 0.75rem' : '1.125rem 1rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: isMobile ? '10px' : '12px',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: isMobile ? '32px' : '40px',
              height: isMobile ? '32px' : '40px',
              margin: '0 auto 0.625rem',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)'
            }}>
              <Droplet 
                size={isMobile ? 16 : 20} 
                color="#a855f7"
                strokeWidth={2.5}
                style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))' }}
              />
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: '700',
              color: '#a855f7',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.375rem'
            }}>
              Vetten
            </div>
            <div style={{
              fontSize: isMobile ? '1.625rem' : '2rem',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 1,
              marginBottom: '0.25rem'
            }}>
              {goals.fat}g
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              per dag
            </div>
          </div>
        </div>
      </div>

      {/* Coach Bubble */}
      <div style={{
        marginBottom: isMobile ? '0.875rem' : '1rem',
        padding: isMobile ? '0 0.5rem' : '0'
      }}>
        <CoachBubble 
          message="Dit zijn jouw dagelijkse targets. We gaan nu een plan maken dat perfect aansluit op deze doelen."
          variant="default"
        />
      </div>

      {/* Info Box */}
      <div style={{
        position: 'relative',
        padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: isMobile ? '10px' : '12px',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)',
        overflow: 'hidden',
        margin: isMobile ? '0 0.5rem' : '0'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '0.875rem',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
          }}>
            <Target 
              size={isMobile ? 16 : 18} 
              color="#10b981"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: '700',
              color: '#10b981',
              margin: '0 0 0.375rem 0'
            }}>
              Jouw Basis
            </h4>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.5',
              margin: 0,
              fontWeight: '500'
            }}>
              Deze targets zijn afgestemd op jouw doel. Het plan past hier automatisch op.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
