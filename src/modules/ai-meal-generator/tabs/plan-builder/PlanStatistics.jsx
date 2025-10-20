// src/modules/ai-meal-generator/tabs/plan-builder/PlanStatistics.jsx
// Plan statistics display - Shows AI scores, budget, and ingredient usage

import { Award, Heart, Ban, ShoppingCart } from 'lucide-react'

export default function PlanStatistics({
  currentPlan,
  planStats,
  isMobile
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      padding: isMobile ? '1rem' : '1.25rem'
    }}>
      <h3 style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: '600',
        color: '#8b5cf6',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Award size={18} />
        AI Plan Statistieken
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Gem. Accuracy</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
            {currentPlan.stats?.averageAccuracy || 0}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Variatie Score</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>
            {currentPlan.stats?.varietyScore || 0}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Compliance</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
            {currentPlan.stats?.complianceScore || 0}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>AI Score</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8b5cf6' }}>
            {currentPlan.aiAnalysis?.averageScore || 0}
          </div>
        </div>
      </div>
      
      {/* Ingredient Usage Stats */}
      {(planStats?.selectedIngredientsUsed > 0 || planStats?.excludedIngredientsAvoided > 0) && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          {planStats?.selectedIngredientsUsed > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Heart size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                {planStats.selectedIngredientsUsed} gewenste ingrediënten gebruikt
              </span>
            </div>
          )}
          {planStats?.excludedIngredientsAvoided > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Ban size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                {planStats.excludedIngredientsAvoided} ingrediënten vermeden
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Budget Analysis */}
      {planStats?.shoppingList && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShoppingCart size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
              Geschatte kosten per week:
            </span>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>
            €{planStats.shoppingList.totalCost}
          </span>
        </div>
      )}
    </div>
  )
}
