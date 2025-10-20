// src/coach/tabs/client-info/LifestyleInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, Activity, Moon, Briefcase, Clock } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function LifestyleInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
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
        activityLevel: profile.activityLevel || '',
        workoutDaysPerWeek: profile.workoutDaysPerWeek || '',
        workoutType: profile.workoutType || '',
        currentTraining: client.current_training || '',
        minutesPerSession: client.minutes_per_session || '',
        jobType: profile.jobType || '',
        sleepHours: profile.sleepHours || '',
        stressLevel: profile.stressLevel || '',
        alcoholFrequency: profile.alcoholFrequency || '',
        trackingMethod: profile.trackingMethod || '',
        weighInFrequency: profile.weighInFrequency || ''
      })
    } catch (error) {
      console.error('Error loading lifestyle data:', error)
      setFormData({
        activityLevel: client.activity_level || '',
        workoutDaysPerWeek: client.workout_days_per_week || client.days_per_week || '',
        workoutType: client.workout_type || '',
        currentTraining: client.current_training || '',
        minutesPerSession: client.minutes_per_session || '',
        jobType: client.job_type || '',
        sleepHours: client.sleep_hours || '',
        stressLevel: client.stress_level || '',
        alcoholFrequency: client.alcohol_frequency || '',
        trackingMethod: client.tracking_method || '',
        weighInFrequency: client.weigh_in_frequency || ''
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
      alert('✅ Lifestyle information updated successfully!')
    } catch (error) {
      console.error('Error saving lifestyle:', error)
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
          >
            <Edit2 size={16} />
            Edit Lifestyle
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
        {/* Activity & Training */}
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
            <Activity size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Activity & Training
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Activity Level" 
              value={formData.activityLevel} 
              onChange={(v) => setFormData({...formData, activityLevel: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select activity level...' },
                { value: 'sedentary', label: 'Sedentary (<1x/week)' },
                { value: 'lightly_active', label: 'Lightly Active (1-2x/week)' },
                { value: 'moderate', label: 'Moderate (3-4x/week)' },
                { value: 'very_active', label: 'Very Active (5-6x/week)' },
                { value: 'athlete', label: 'Athlete (2x/day)' }
              ]}
              required
              isMobile={isMobile}
            />
            
            <Field 
              label="Workout Days/Week" 
              value={formData.workoutDaysPerWeek} 
              onChange={(v) => setFormData({...formData, workoutDaysPerWeek: v})} 
              isEditing={isEditing} 
              type="number" 
              min="0" 
              max="7"
              placeholder="4"
              isMobile={isMobile}
            />
            
            <Field 
              label="Minutes Per Session" 
              value={formData.minutesPerSession} 
              onChange={(v) => setFormData({...formData, minutesPerSession: v})} 
              isEditing={isEditing} 
              type="number" 
              min="10" 
              max="180"
              placeholder="60"
              isMobile={isMobile}
            />
            
            <Field 
              label="Workout Type" 
              value={formData.workoutType} 
              onChange={(v) => setFormData({...formData, workoutType: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select workout type...' },
                { value: 'strength', label: '💪 Strength Training' },
                { value: 'cardio', label: '🏃 Cardio' },
                { value: 'hybrid', label: '🎯 Hybrid (Strength + Cardio)' },
                { value: 'hiit', label: '⚡ HIIT' },
                { value: 'crossfit', label: '🏋️ CrossFit' },
                { value: 'bodybuilding', label: '🏆 Bodybuilding' },
                { value: 'powerlifting', label: '🦾 Powerlifting' },
                { value: 'calisthenics', label: '🤸 Calisthenics' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Current Training" 
              value={formData.currentTraining} 
              onChange={(v) => setFormData({...formData, currentTraining: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="Describe current training routine..."
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Lifestyle Factors */}
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
            <Moon size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Lifestyle Factors
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Job Type" 
              value={formData.jobType} 
              onChange={(v) => setFormData({...formData, jobType: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select job type...' },
                { value: 'sedentary', label: '💻 Desk Job' },
                { value: 'light_activity', label: '🚶 Light Activity' },
                { value: 'moderate_activity', label: '📦 Moderate Activity' },
                { value: 'heavy_labor', label: '🏗️ Heavy Labor' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Average Sleep (hours)" 
              value={formData.sleepHours} 
              onChange={(v) => setFormData({...formData, sleepHours: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.5" 
              min="4" 
              max="12"
              placeholder="7.5"
              isMobile={isMobile}
            />
            
            <Field 
              label="Stress Level" 
              value={formData.stressLevel} 
              onChange={(v) => setFormData({...formData, stressLevel: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select stress level...' },
                { value: 'low', label: '😌 Low' },
                { value: 'moderate', label: '😐 Moderate' },
                { value: 'high', label: '😰 High' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Alcohol Frequency" 
              value={formData.alcoholFrequency} 
              onChange={(v) => setFormData({...formData, alcoholFrequency: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select frequency...' },
                { value: 'never', label: 'Never' },
                { value: 'rarely', label: 'Rarely (1-2x/month)' },
                { value: 'moderate', label: 'Moderate (1-2x/week)' },
                { value: 'regular', label: 'Regular (3-4x/week)' },
                { value: 'daily', label: 'Daily' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Tracking Method" 
              value={formData.trackingMethod} 
              onChange={(v) => setFormData({...formData, trackingMethod: v})} 
              isEditing={isEditing}
              placeholder="e.g., MyFitnessPal, pen & paper..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Weigh-in Frequency" 
              value={formData.weighInFrequency} 
              onChange={(v) => setFormData({...formData, weighInFrequency: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select frequency...' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
