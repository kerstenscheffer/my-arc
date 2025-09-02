// src/modules/goals/GoalsManager.jsx
import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

// Import config and utils
import { goalCategories, durationPresets, isMobile } from './config'
import { getDayInfo, calculateDeadline, calculateProgress } from './utils'

// Import components
import { CategorySelector } from './components/CategorySelector'
import { GoalCard } from './components/GoalCard'
import { CheckboxTracker } from './components/CheckboxTracker'
import { NumberTracker } from './components/NumberTracker'
import { AddGoalModal } from './components/AddGoalModal'

// Main Component
export default function GoalsManager({ client, db, goals = [], onRefresh }) {
  const mobile = isMobile()
  const dayInfo = getDayInfo()
  
  // State
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [activeGoalId, setActiveGoalId] = useState(null)
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [trackingData, setTrackingData] = useState({})
  const [selectedDuration, setSelectedDuration] = useState('4_weeks')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Goal form
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: null,
    subcategory: null,
    measurement_type: 'checkbox',
    target_value: '',
    unit: '',
    frequency_target: 5,
    target_date: '',
    notes: ''
  })
  
  // Load weekly progress on mount
  useEffect(() => {
    if (client?.id && db) {
      loadWeeklyProgress()
    }
  }, [client?.id, goals])
  
  // Load saved weekly progress
  const loadWeeklyProgress = async () => {
    if (!db?.loadWeeklyProgress) {
      console.warn('loadWeeklyProgress method not found in db')
      return
    }
    
    try {
      const progress = await db.loadWeeklyProgress(client.id)
      setWeeklyProgress(progress)
    } catch (error) {
      console.error('Load weekly progress error:', error)
    }
  }
  
  // Save goal
  const saveGoal = async () => {
    if (!goalForm.title || !goalForm.target_value) {
      alert('Vul alle verplichte velden in')
      return
    }
    
    let targetDate = goalForm.target_date
    if (!showCustomDate && selectedDuration !== 'custom') {
      targetDate = calculateDeadline(selectedDuration, durationPresets)
    }
    
    if (!targetDate) {
      alert('Kies een deadline voor je doel')
      return
    }
    
    setLoading(true)
    try {
      const categoryConfig = goalCategories[goalForm.category]
      
      await db.saveGoal({
        client_id: client.id,
        title: goalForm.title,
        goal_type: 'custom',
        category: goalForm.category,
        main_category: goalForm.category,
        subcategory: goalForm.subcategory,
        measurement_type: goalForm.measurement_type,
        target_value: parseFloat(goalForm.target_value),
        current_value: 0,
        target_date: targetDate,
        unit: goalForm.unit,
        frequency: 'weekly',
        frequency_target: goalForm.frequency_target,
        notes: goalForm.notes,
        status: 'active',
        color: categoryConfig.color,
        icon: 'target',
        measurement_config: {
          start_date: dayInfo.tomorrow.toISOString().split('T')[0]
        }
      })
      
      alert(`✅ Doel opgeslagen! Start vanaf morgen (${dayInfo.tomorrowName})`)
      
      setShowAddGoal(false)
      resetForm()
      
      if (typeof onRefresh === 'function') {
        onRefresh()
      }
    } catch (error) {
      console.error('Save goal error:', error)
      alert('Fout bij opslaan')
    } finally {
      setLoading(false)
    }
  }
  
  // Reset form
  const resetForm = () => {
    setGoalForm({
      title: '',
      category: null,
      subcategory: null,
      measurement_type: 'checkbox',
      target_value: '',
      unit: '',
      frequency_target: 5,
      target_date: '',
      notes: ''
    })
    setSelectedCategory(null)
    setSelectedDuration('4_weeks')
    setShowCustomDate(false)
  }
  
  // Update week progress
  const updateWeekProgress = async (goal, checkedDays) => {
    setLoading(true)
    try {
      if (!db?.saveWeekProgress) {
        throw new Error('saveWeekProgress method not found')
      }
      
      await db.saveWeekProgress(goal.id, client.id, checkedDays)
      
      setWeeklyProgress({
        ...weeklyProgress,
        [goal.id]: checkedDays
      })
      
      alert(`✅ Week opgeslagen! ${checkedDays.filter(Boolean).length}/${goal.frequency_target} dagen voltooid`)
      
      if (typeof onRefresh === 'function') {
        onRefresh()
      }
    } catch (error) {
      console.error('Update week progress error:', error)
      alert('Fout bij opslaan week progress')
    } finally {
      setLoading(false)
    }
  }
  
  // Update other goal types
  const updateProgress = async (goal, value) => {
    setLoading(true)
    try {
      await db.updateGoalProgress(goal.id, {
        client_id: client.id,
        value: value,
        notes: trackingData[goal.id]?.notes || ''
      })
      
      const progress = calculateProgress({ ...goal, current_value: value })
      if (progress >= 100 && goal.status !== 'completed') {
        await db.completeGoal(goal.id)
        alert('🎉 Doel bereikt! Gefeliciteerd!')
      }
      
      if (typeof onRefresh === 'function') {
        onRefresh()
      }
    } catch (error) {
      console.error('Update progress error:', error)
      alert('Fout bij bijwerken')
    } finally {
      setLoading(false)
    }
  }
  
  // Render tracking input
  const renderTrackingInput = (goal) => {
    const currentValue = trackingData[goal.id]?.value || goal.current_value || 0
    
    switch (goal.measurement_type) {
      case 'checkbox':
        const checkedDays = trackingData[goal.id]?.checkedDays || weeklyProgress[goal.id] || []
        
        return (
          <CheckboxTracker
            goal={goal}
            checkedDays={checkedDays}
            weeklyProgress={weeklyProgress}
            loading={loading}
            onChange={(index, isChecked) => {
              const newChecked = isChecked
                ? checkedDays.filter(d => d !== index)
                : [...checkedDays, index]
              setTrackingData({
                ...trackingData,
                [goal.id]: { ...trackingData[goal.id], checkedDays: newChecked }
              })
            }}
            onSave={() => updateWeekProgress(goal, checkedDays)}
          />
        )
      
      case 'number':
      case 'counter':
      case 'timer':
        return (
          <NumberTracker
            goal={goal}
            currentValue={currentValue}
            loading={loading}
            onChange={(value) => setTrackingData({
              ...trackingData,
              [goal.id]: { ...trackingData[goal.id], value: value }
            })}
            onUpdate={() => updateProgress(goal, currentValue)}
          />
        )
      
      default:
        return null
    }
  }
  
  return (
    <div>
      {/* Header Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
        borderRadius: mobile ? '12px' : '16px',
        padding: mobile ? '1rem' : '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ 
            fontSize: mobile ? '1rem' : '1.1rem', 
            fontWeight: 'bold', 
            color: '#fff' 
          }}>
            {dayInfo.todayName}, {dayInfo.todayDate}
          </h3>
          <div style={{
            padding: mobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            fontSize: mobile ? '0.8rem' : '0.875rem',
            color: '#fff'
          }}>
            {dayInfo.currentWeek}
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: mobile ? '0.75rem' : '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: mobile ? '1.25rem' : '1.5rem', 
              fontWeight: 'bold', 
              color: '#fff' 
            }}>
              {goals.filter(g => g.status === 'active').length}
            </div>
            <div style={{ 
              fontSize: mobile ? '0.7rem' : '0.75rem', 
              color: 'rgba(255,255,255,0.8)' 
            }}>
              Actieve Doelen
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: mobile ? '1.25rem' : '1.5rem', 
              fontWeight: 'bold', 
              color: '#fff' 
            }}>
              {goals.filter(g => g.status === 'completed').length}
            </div>
            <div style={{ 
              fontSize: mobile ? '0.7rem' : '0.75rem', 
              color: 'rgba(255,255,255,0.8)' 
            }}>
              Voltooid
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Goal Button */}
      <button
        onClick={() => setShowCategorySelector(true)}
        disabled={loading}
        style={{
          width: '100%',
          padding: mobile ? '0.75rem' : '1rem',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: mobile ? '1rem' : '1.1rem',
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
          transition: 'transform 0.2s',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px'
        }}
        onMouseEnter={(e) => !loading && !mobile && (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => !mobile && (e.currentTarget.style.transform = 'translateY(0)')}
        onTouchStart={(e) => mobile && (e.currentTarget.style.transform = 'scale(0.98)')}
        onTouchEnd={(e) => mobile && (e.currentTarget.style.transform = 'scale(1)')}
      >
        <Plus size={mobile ? 20 : 24} />
        Nieuw Doel Stellen
      </button>
      
      {/* Category Selector */}
      {showCategorySelector && (
        <CategorySelector
          onSelect={(category) => {
            setSelectedCategory(category)
            setGoalForm({ ...goalForm, category: category })
            setShowAddGoal(true)
            setShowCategorySelector(false)
          }}
          onClose={() => {
            setShowCategorySelector(false)
            setSelectedCategory(null)
          }}
        />
      )}
      
      {/* Active Goals */}
      {Object.entries(goalCategories).map(([categoryKey, category]) => {
        const categoryGoals = goals.filter(g => 
          (g.category === categoryKey || g.main_category === categoryKey) && 
          g.status === 'active'
        )
        if (categoryGoals.length === 0) return null
        
        const IconComponent = category.icon
        
        return (
          <div key={categoryKey} style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: mobile ? '1rem' : '1.1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: category.color
            }}>
              <IconComponent size={mobile ? 18 : 20} />
              {category.name} ({categoryGoals.length})
            </h3>
            
            <div style={{ display: 'grid', gap: mobile ? '0.75rem' : '1rem' }}>
              {categoryGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isExpanded={activeGoalId === goal.id}
                  onToggle={setActiveGoalId}
                  renderTrackingInput={renderTrackingInput}
                />
              ))}
            </div>
          </div>
        )
      })}
      
      {/* Add Goal Modal */}
      {showAddGoal && selectedCategory && (
        <AddGoalModal
          selectedCategory={selectedCategory}
          goalForm={goalForm}
          setGoalForm={setGoalForm}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          showCustomDate={showCustomDate}
          setShowCustomDate={setShowCustomDate}
          loading={loading}
          onSave={saveGoal}
          onClose={() => {
            setShowAddGoal(false)
            resetForm()
          }}
        />
      )}
      
      {/* Animation Styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
