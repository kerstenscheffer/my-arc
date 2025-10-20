// src/modules/meal-plan/components/AIWeekPlanner.jsx
import React, { useState, useEffect } from 'react'
import { Calendar, Zap, Copy, RefreshCw } from 'lucide-react'
import WeekPlannerGrid from './WeekPlannerGrid'
import GenerateWeekModal from './GenerateWeekModal'
import WeekPlannerService from '../services/WeekPlannerService'

export default function AIWeekPlanner({ 
  activePlan, 
  client, 
  db,
  onWeekUpdated,
  dailyTotals
}) {
  const isMobile = window.innerWidth <= 768
  
  const [weekStructure, setWeekStructure] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [expandedView, setExpandedView] = useState(false)
  
  useEffect(() => {
    if (activePlan?.week_structure) {
      setWeekStructure(activePlan.week_structure)
    }
  }, [activePlan])
  
  const handleGenerateWeek = async (preferences) => {
    setLoading(true)
    
    try {
      console.log('🤖 Generating AI week with preferences:', preferences)
      
      // Use new WeekPlannerService
      const weekPlannerService = new WeekPlannerService(db)
      const result = await weekPlannerService.generateWeekPlan(client.id, preferences)
      
      // Update plan in database
      const { error } = await db.supabase
        .from('client_meal_plans')
        .update({
          week_structure: result.weekStructure,
          updated_at: new Date().toISOString()
        })
        .eq('id', activePlan.id)
      
      if (error) throw error
      
      setWeekStructure(result.weekStructure)
      setShowGenerateModal(false)
      
      if (onWeekUpdated) onWeekUpdated()
      
      alert('✅ Week plan gegenereerd met variatie!')
      
    } catch (error) {
      console.error('❌ Generate week failed:', error)
      alert('Fout bij genereren: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleMealUpdate = async (day, slot, mealData) => {
    try {
      await db.updateMealInWeek(activePlan.id, day, slot, mealData)
      
      // Reload week structure
      const { data: updatedPlan } = await db.supabase
        .from('client_meal_plans')
        .select('week_structure')
        .eq('id', activePlan.id)
        .single()
      
      if (updatedPlan) {
        setWeekStructure(updatedPlan.week_structure)
        if (onWeekUpdated) onWeekUpdated()
      }
      
    } catch (error) {
      console.error('❌ Update meal failed:', error)
      alert('Fout bij updaten')
    }
  }
  
  const handleCopyDay = async (sourceDay, targetDays) => {
    try {
      const updatedStructure = await db.copyDayToOtherDays(
        activePlan.id,
        sourceDay,
        targetDays
      )
      
      setWeekStructure(updatedStructure)
      if (onWeekUpdated) onWeekUpdated()
      
      alert(`✅ ${sourceDay} gekopieerd naar ${targetDays.length} dagen`)
      
    } catch (error) {
      console.error('❌ Copy day failed:', error)
      alert('Fout bij kopiëren')
    }
  }
  
  const handleScalePortion = async (day, slot, newScaleFactor) => {
    try {
      const updatedStructure = await db.scaleMealPortion(
        activePlan.id,
        day,
        slot,
        newScaleFactor
      )
      
      setWeekStructure(updatedStructure)
      if (onWeekUpdated) onWeekUpdated()
      
    } catch (error) {
      console.error('❌ Scale portion failed:', error)
      alert('Fout bij schalen')
    }
  }
  
  const calculateWeekTotals = () => {
    if (!weekStructure) return null
    
    const days = Object.values(weekStructure)
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      daysPlanned: 0
    }
    
    days.forEach(day => {
      if (day?.totals) {
        totals.calories += day.totals.kcal || 0
        totals.protein += day.totals.protein || 0
        totals.carbs += day.totals.carbs || 0
        totals.fat += day.totals.fat || 0
        totals.daysPlanned += 1
      }
    })
    
    const targets = dailyTotals?.targets || {
      calories: 2200,
      protein: 165,
      carbs: 220,
      fat: 73
    }
    
    return {
      ...totals,
      avgCalories: Math.round(totals.calories / (totals.daysPlanned || 1)),
      avgProtein: Math.round(totals.protein / (totals.daysPlanned || 1)),
      targets
    }
  }
  
  const weekTotals = calculateWeekTotals()
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        padding: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <Calendar size={isMobile ? 24 : 28} color="#3b82f6" />
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Week Planner
              </h2>
            </div>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0
            }}>
              Plan je hele week of laat AI het voor je doen
            </p>
          </div>
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowGenerateModal(true)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                background: loading 
                  ? 'rgba(59, 130, 246, 0.3)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              {loading ? (
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={18} />
              )}
              <span>{loading ? 'Bezig...' : 'Genereer Week'}</span>
            </button>
            
            <button
              onClick={() => setExpandedView(!expandedView)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: isMobile ? '0.875rem' : '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              {expandedView ? '📋 Compact' : '📊 Uitgebreid'}
            </button>
          </div>
        </div>
        
        {/* Week Stats */}
        {weekTotals && weekTotals.daysPlanned > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Dagen gepland
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#3b82f6'
              }}>
                {weekTotals.daysPlanned}/7
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. kcal/dag
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#f97316'
              }}>
                {weekTotals.avgCalories}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '0.125rem'
              }}>
                Target: {weekTotals.targets?.calories || 2200}
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Gem. eiwit/dag
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {weekTotals.avgProtein}g
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.4)',
                marginTop: '0.125rem'
              }}>
                Target: {weekTotals.targets?.protein || 165}g
              </div>
            </div>
            
            <div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Week totaal
              </div>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#10b981'
              }}>
                {Math.round(weekTotals.calories / 1000)}k
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Week Grid */}
      {weekStructure ? (
        <WeekPlannerGrid
          weekStructure={weekStructure}
          activePlan={activePlan}
          client={client}
          db={db}
          expandedView={expandedView}
          onMealUpdate={handleMealUpdate}
          onCopyDay={handleCopyDay}
          onScalePortion={handleScalePortion}
          targets={weekTotals?.targets}
        />
      ) : (
        <div style={{
          background: 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: isMobile ? '16px' : '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            📅
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Nog geen week plan
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '1.5rem'
          }}>
            Klik op "Genereer Week" om AI je week te laten plannen
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            style={{
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '1rem' : '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              minHeight: '44px',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
            }}
          >
            Start Planning
          </button>
        </div>
      )}
      
      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateWeekModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateWeek}
          client={client}
          activePlan={activePlan}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
