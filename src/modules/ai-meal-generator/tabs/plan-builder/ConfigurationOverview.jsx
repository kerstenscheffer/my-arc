// src/modules/ai-meal-generator/tabs/plan-builder/ConfigurationOverview.jsx
// Configuration display component - Shows client info, targets, and preferences

import { Target, Heart, Ban } from 'lucide-react'

export default function ConfigurationOverview({
  selectedClient,
  clientProfile,
  dailyTargets,
  mealsPerDay,
  mealPreferences,
  forcedMeals,
  selectedIngredients,
  excludedIngredients,
  isMobile
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      padding: isMobile ? '1rem' : '1.25rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: '600',
        color: '#10b981',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Target size={18} />
        AI Configuratie
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        {/* Client Profile */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            Client Profiel
          </div>
          <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>
            {selectedClient.first_name} {selectedClient.last_name}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.25rem' }}>
            {clientProfile?.primary_goal === 'muscle_gain' ? '💪 Spieropbouw' :
             clientProfile?.primary_goal === 'fat_loss' ? '🔥 Vetverlies' :
             clientProfile?.primary_goal === 'maintain' ? '⚖️ Onderhoud' : 
             '🎯 Algemeen'}
          </div>
        </div>
        
        {/* Daily Targets */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            Dagelijkse Targets
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            fontSize: '0.8rem'
          }}>
            <div>
              <strong style={{ color: '#fff' }}>{dailyTargets.calories}</strong>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>kcal</div>
            </div>
            <div>
              <strong style={{ color: '#10b981' }}>{dailyTargets.protein}g</strong>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>eiwit</div>
            </div>
            <div>
              <strong style={{ color: '#3b82f6' }}>{dailyTargets.carbs}g</strong>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>carbs</div>
            </div>
            <div>
              <strong style={{ color: '#f59e0b' }}>{dailyTargets.fat}g</strong>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>vet</div>
            </div>
          </div>
        </div>
        
        {/* AI Settings */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            AI Optimalisatie
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fff' }}>
            {mealPreferences.avoidRepeats && '✓ Maximum variatie'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#fff' }}>
            {mealPreferences.optimizeShopping && '✓ Efficiënte boodschappen'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
            ✓ AI Scoring Engine Actief
          </div>
        </div>
        
        {/* Constraints */}
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
            Beperkingen & Voorkeuren
          </div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
            {forcedMeals.length} verplichte maaltijden
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
            {selectedIngredients.length} gewenste ingrediënten
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>
            {excludedIngredients.length} uitgesloten ingrediënten
          </div>
          <div style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>
            {mealsPerDay} maaltijden per dag
          </div>
        </div>
      </div>
      
      {/* Selected Ingredients Display */}
      {selectedIngredients.length > 0 && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Heart size={16} style={{ color: '#10b981' }} />
            <span style={{
              fontSize: '0.85rem',
              color: '#10b981',
              fontWeight: '600'
            }}>
              Gewenste Ingrediënten ({selectedIngredients.length})
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            {selectedIngredients.slice(0, 10).map((ing, index) => (
              <span key={index} style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                {ing.name || ing.label || ing.id}
              </span>
            ))}
            {selectedIngredients.length > 10 && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                +{selectedIngredients.length - 10} meer...
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Excluded Ingredients Display */}
      {excludedIngredients.length > 0 && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Ban size={16} style={{ color: '#ef4444' }} />
            <span style={{
              fontSize: '0.85rem',
              color: '#ef4444',
              fontWeight: '600'
            }}>
              Uitgesloten Ingrediënten ({excludedIngredients.length})
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            {excludedIngredients.slice(0, 10).map((ing, index) => (
              <span key={index} style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                {ing.name || ing.label || ing.id}
              </span>
            ))}
            {excludedIngredients.length > 10 && (
              <span style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                +{excludedIngredients.length - 10} meer...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
