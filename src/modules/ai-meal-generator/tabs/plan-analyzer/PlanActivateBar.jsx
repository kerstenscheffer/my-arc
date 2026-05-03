// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanActivateBar.jsx
// Activate/concept status bar with activate button
// v1.0

import React, { useState } from 'react'
import { Play, Check, AlertTriangle } from 'lucide-react'

export default function PlanActivateBar({ db, planMeta, onActivated, isMobile }) {
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(planMeta?.isActive || false)
  const m = isMobile

  if (!planMeta) return null

  const handleActivate = async () => {
    if (!planMeta.id) return
    setActivating(true)
    try {
      // Deactivate existing active plans
      await db.supabase
        .from('client_meal_plans')
        .update({ is_active: false })
        .eq('client_id', planMeta.clientId)
        .eq('is_active', true)

      // Activate this plan
      const { error } = await db.supabase
        .from('client_meal_plans')
        .update({ is_active: true })
        .eq('id', planMeta.id)

      if (error) throw error

      setActivated(true)
      if (onActivated) onActivated(planMeta.id)
    } catch (err) {
      console.error('Activate failed:', err)
      alert('Activeren mislukt: ' + err.message)
    }
    setActivating(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: m ? '0.5rem 0.75rem' : '0.625rem 1rem',
      background: activated ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 215, 0, 0.03)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      {/* Left: plan info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: m ? '0.4rem' : '0.45rem', fontWeight: 700,
          color: activated ? '#10b981' : '#FFD700',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: '0.1rem'
        }}>
          {activated ? '✓ PLAN ACTIEF' : planMeta.isActive ? '✓ ACTIEF' : '⏳ CONCEPT — REVIEW & ACTIVEER'}
        </div>
        <div style={{
          fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {planMeta.name}
        </div>
        {planMeta.stats?.smartScaling && (
          <div style={{
            fontSize: m ? '0.45rem' : '0.5rem', color: 'rgba(255,255,255,0.2)',
            marginTop: '0.05rem'
          }}>
            {planMeta.stats.smartScaling.replacements} vervangingen · {planMeta.stats.smartScaling.addedMeals} snacks
          </div>
        )}
      </div>

      {/* Right: activate button */}
      {!planMeta.isActive && !activated && (
        <button
          onClick={handleActivate}
          disabled={activating}
          style={{
            padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem',
            background: activating ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
            border: 'none', borderRadius: '6px',
            color: '#fff',
            fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 800,
            cursor: activating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            flexShrink: 0, minHeight: '36px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
          }}
        >
          {activating ? '...' : <><Play size={13} /> Activeer</>}
        </button>
      )}

      {activated && (
        <div style={{
          padding: '0.35rem 0.65rem', borderRadius: '6px',
          background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
          fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: '0.25rem'
        }}>
          <Check size={13} /> Actief
        </div>
      )}
    </div>
  )
}
