// src/modules/meal-plan/components/AIDailyGoals.jsx
// ✅ v7.2 - FOOD LOG: Pass client + targets to AIDaySchedule
import React, { useState } from 'react'
import { Flame, Apple, Wheat, Beef } from 'lucide-react'
import ViewConsumedMealsButton from './ViewConsumedMealsButton'
import AINextMeal from './AINextMeal'
import AIDaySchedule from './AIDaySchedule'
import MacroOverview from './MacroOverview'

export default function AIDailyGoals({ 
  dailyTotals, waterIntake, todayMood,
  onUpdateWater, onLogMood, onMealLogged, onQuickIntake,
  client, db, activePlan, todayMeals, todayProgress,
  onCheckMeal, onUncheckMeal, onOpenInfo, onOpenAlternatives,
  dayTemplates, onPlanUpdate, onNavigateToDay, selectedDay,
  nextMeal, onFinishMeal
}) {
  const isMobile = window.innerWidth <= 768
  const [showIntakeModal, setShowIntakeModal] = useState(false)
  
  const handleQuickIntake = async (intakeData) => {
    try {
      await onQuickIntake(intakeData)
      setShowIntakeModal(false)
    } catch (error) {
      alert('Opslaan mislukt. Probeer opnieuw.')
    }
  }

  return (
    <div style={{ padding: 0 }}>
      {/* ═══ ZONE 1: Macro Overview ═══ */}
      <MacroOverview
        consumed={dailyTotals?.consumed}
        targets={dailyTotals?.targets}
        isMobile={isMobile}
      />

      {/* ═══ NextMeal — bridge between zones ═══ */}
      <AINextMeal
        nextMeal={nextMeal}
        todayMeals={todayMeals}
        onOpenInfo={onOpenInfo}
        onOpenAlternatives={onOpenAlternatives}
        onFinishMeal={onFinishMeal}
        onOpenDaySchedule={() => {}}
        db={db}
      />
      
      {/* ═══ ZONE 2: Day Schedule — with food log integration ═══ */}
      <AIDaySchedule
        activePlan={activePlan}
        todayMeals={todayMeals}
        todayProgress={todayProgress}
        selectedDay={selectedDay}
        onDayChange={onNavigateToDay}
        onCheckMeal={onCheckMeal}
        onUncheckMeal={onUncheckMeal}
        onOpenInfo={onOpenInfo}
        onOpenAlternatives={onOpenAlternatives}
        dayTemplates={dayTemplates || []}
        db={db}
        onPlanUpdate={onPlanUpdate}
        dailyTotals={dailyTotals}
        // ✅ FOOD LOG: New props
        client={client}
        onMealLogged={onMealLogged}
        targets={dailyTotals?.targets}
      />

      {/* ═══ ZONE 3: Actions ═══ */}
      <ViewConsumedMealsButton
        client={client}
        db={db}
        onMealLogged={onMealLogged}
        onQuickIntake={onQuickIntake}
        targets={dailyTotals?.targets}
      />
      
      {showIntakeModal && (
        <QuickIntakeModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSave={handleQuickIntake}
          targets={dailyTotals?.targets}
          isMobile={isMobile}
        />
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Quick Intake Modal (unchanged) ──
const QuickIntakeModal = ({ isOpen, onClose, onSave, targets, isMobile }) => {
  const [selectedType, setSelectedType] = useState('percentage')
  const [percentage, setPercentage] = useState(100)
  const [exactValues, setExactValues] = useState({ calories: '', protein: '', carbs: '', fat: '' })

  const handleSave = () => {
    if (selectedType === 'percentage') {
      onSave({
        calories: Math.round((targets?.calories || 0) * (percentage / 100)),
        protein: Math.round((targets?.protein || 0) * (percentage / 100)),
        carbs: Math.round((targets?.carbs || 0) * (percentage / 100)),
        fat: Math.round((targets?.fat || 0) * (percentage / 100))
      })
    } else {
      onSave({
        calories: parseInt(exactValues.calories) || 0,
        protein: parseInt(exactValues.protein) || 0,
        carbs: parseInt(exactValues.carbs) || 0,
        fat: parseInt(exactValues.fat) || 0
      })
    }
  }
  if (!isOpen) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column',
      zIndex: 1000, animation: 'fadeIn 0.2s ease'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: isMobile ? '100%' : '500px', width: '100%',
        margin: '0 auto', background: '#0a0a0a', overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' }}>Quick Intake</div>
          <div style={{ display: 'flex' }}>
            {['percentage', 'exact'].map(m => (
              <button key={m} onClick={() => setSelectedType(m)} style={{
                flex: 1, padding: '0.5rem', background: 'transparent', border: 'none',
                borderBottom: selectedType === m ? '2px solid #10b981' : '2px solid transparent',
                color: selectedType === m ? '#fff' : 'rgba(255,255,255,0.35)',
                fontSize: '0.7rem', fontWeight: selectedType === m ? '800' : '600', cursor: 'pointer'
              }}>{m === 'percentage' ? 'Percentage' : 'Exacte waardes'}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {selectedType === 'percentage' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[100, 80, 60, 40].map(val => (
                <button key={val} onClick={() => setPercentage(val)} style={{
                  padding: '1.25rem 0',
                  background: percentage === val ? 'rgba(16,185,129,0.08)' : 'transparent',
                  border: percentage === val ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: percentage === val ? '#10b981' : 'rgba(255,255,255,0.5)' }}>{val}%</div>
                  {targets && <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem' }}>{Math.round((targets.calories || 0) * (val / 100))} kcal</div>}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[{ key: 'calories', label: 'Calorieën' }, { key: 'protein', label: 'Eiwit (g)' }, { key: 'carbs', label: 'Koolhydraten (g)' }, { key: 'fat', label: 'Vetten (g)' }].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: '0.55rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{f.label}</div>
                  <input type="number" placeholder="0" value={exactValues[f.key]}
                    onChange={e => setExactValues(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box', minHeight: '42px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', minHeight: '44px' }}>Annuleren</button>
          <button onClick={handleSave} style={{ flex: 2, background: 'rgba(16,185,129,0.12)', border: 'none', padding: '0.75rem', color: '#10b981', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', minHeight: '44px' }}>Opslaan</button>
        </div>
      </div>
    </div>
  )
}
