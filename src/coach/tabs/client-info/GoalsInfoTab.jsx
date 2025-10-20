// src/coach/tabs/client-info/GoalsInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, Target, Calendar, TrendingUp, Zap } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function GoalsInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const service = new ClientIntelligenceService(db)
  
  useEffect(() => {
    if (client) {
      loadClientData()
    }
  }, [client?.id])
  
  const loadClientData = async () => {
    setLoading(true)
    try {
      const profile = await service.getCompleteProfile(client.id)
      setFormData({
        primaryGoal: profile.primaryGoal || '',
        goalUrgency: profile.goalUrgency || '',
        goalDeadline: profile.goalDeadline || '',
        weeklyWeightGoal: profile.weeklyWeightGoal || '',
        strengthGoals: client.strength_goals || '',
        visualGoals: client.visual_goals || '',
        targetCalories: profile.targetCalories || '',
        targetProtein: profile.targetProtein || '',
        targetCarbs: profile.targetCarbs || '',
        targetFat: profile.targetFat || ''
      })
    } catch (error) {
      console.error('Error loading goals data:', error)
      setFormData({
        primaryGoal: client.primary_goal || '',
        goalUrgency: client.goal_urgency || '',
        goalDeadline: client.goal_deadline || '',
        weeklyWeightGoal: client.weekly_weight_goal || '',
        strengthGoals: client.strength_goals || '',
        visualGoals: client.visual_goals || '',
        targetCalories: client.target_calories || '',
        targetProtein: client.target_protein || '',
        targetCarbs: client.target_carbs || '',
        targetFat: client.target_fat || ''
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await service.updateProfile(client.id, formData)
      await onRefresh()
      setIsEditing(false)
      alert('✅ Goals updated successfully!')
    } catch (error) {
      console.error('Error saving goals:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    loadClientData()
    setIsEditing(false)
  }
  
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  return (
    <div>
      {/* Edit/Save Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.3s ease',
              transform: 'translateZ(0)'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Edit2 size={16} />
            Edit Goals
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.85rem',
                cursor: 'pointer',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
                background: saving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.85rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
      
      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Primary Goals */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Target size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Primary Goals
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Primary Goal" 
              value={formData.primaryGoal} 
              onChange={(v) => setFormData({...formData, primaryGoal: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select goal...' },
                { value: 'muscle_gain', label: '💪 Muscle Gain' },
                { value: 'fat_loss', label: '🔥 Fat Loss' },
                { value: 'body_recomp', label: '⚖️ Body Recomp' },
                { value: 'maintain', label: '✅ Maintain' },
                { value: 'performance', label: '🏃 Performance' },
                { value: 'health', label: '❤️ Health' }
              ]}
              required
              isMobile={isMobile}
            />
            
            <Field 
              label="Goal Urgency" 
              value={formData.goalUrgency} 
              onChange={(v) => setFormData({...formData, goalUrgency: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select urgency...' },
                { value: 'relaxed', label: 'Relaxed (No rush)' },
                { value: 'moderate', label: 'Moderate (3-6 months)' },
                { value: 'urgent', label: 'Urgent (<3 months)' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Goal Deadline" 
              value={formData.goalDeadline} 
              onChange={(v) => setFormData({...formData, goalDeadline: v})} 
              isEditing={isEditing} 
              type="date"
              isMobile={isMobile}
            />
            
            <Field 
              label="Weekly Weight Goal (kg/week)" 
              value={formData.weeklyWeightGoal} 
              onChange={(v) => setFormData({...formData, weeklyWeightGoal: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="0.5"
              min="-1"
              max="1"
              isMobile={isMobile}
            />
            
            <Field 
              label="Strength Goals" 
              value={formData.strengthGoals} 
              onChange={(v) => setFormData({...formData, strengthGoals: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="e.g., Bench 100kg, Squat 140kg..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Visual Goals" 
              value={formData.visualGoals} 
              onChange={(v) => setFormData({...formData, visualGoals: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="e.g., Visible abs, defined arms..."
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Macro Targets */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Zap size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Macro Targets
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Target Calories (kcal)" 
              value={formData.targetCalories} 
              onChange={(v) => setFormData({...formData, targetCalories: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="2500"
              min="1000"
              max="5000"
              isMobile={isMobile}
            />
            
            <Field 
              label="Target Protein (g)" 
              value={formData.targetProtein} 
              onChange={(v) => setFormData({...formData, targetProtein: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="150"
              min="50"
              max="400"
              isMobile={isMobile}
            />
            
            <Field 
              label="Target Carbs (g)" 
              value={formData.targetCarbs} 
              onChange={(v) => setFormData({...formData, targetCarbs: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="250"
              min="50"
              max="600"
              isMobile={isMobile}
            />
            
            <Field 
              label="Target Fat (g)" 
              value={formData.targetFat} 
              onChange={(v) => setFormData({...formData, targetFat: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="80"
              min="20"
              max="200"
              isMobile={isMobile}
            />
            
            {/* Macro calculator hint */}
            {formData.targetCalories && formData.targetProtein && formData.targetCarbs && formData.targetFat && (
              <div style={{
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  📊 Calculated: {(formData.targetProtein * 4) + (formData.targetCarbs * 4) + (formData.targetFat * 9)} kcal
                </div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  P: {Math.round((formData.targetProtein * 4) / formData.targetCalories * 100)}% | 
                  C: {Math.round((formData.targetCarbs * 4) / formData.targetCalories * 100)}% | 
                  F: {Math.round((formData.targetFat * 9) / formData.targetCalories * 100)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
