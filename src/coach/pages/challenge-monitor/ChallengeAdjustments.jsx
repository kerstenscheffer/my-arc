import { useState, useEffect } from 'react'
import { Settings, CheckCircle, AlertCircle } from 'lucide-react'
import RequirementCard from './adjustments/RequirementCard'
import { workoutConfig, loadWorkoutData, addWorkout, removeWorkout } from './adjustments/WorkoutAdjustment'
import { mealConfig, loadMealData, addMeal, removeMeal } from './adjustments/MealAdjustment'
import { weightConfig, loadWeightData, addWeight, removeWeight } from './adjustments/WeightAdjustment'
import { callsConfig, loadCallsData, addCall, removeCall } from './adjustments/CallsAdjustment'
import { photosConfig, loadPhotosData, addPhoto, removePhoto } from './adjustments/PhotosAdjustment'

export default function ChallengeAdjustments({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requirements, setRequirements] = useState({
    workout: { current: 0, lastEntry: null, lastEntryData: null },
    meal: { current: 0, lastEntry: null, lastEntryData: null },
    weight: { current: 0, lastEntry: null, lastEntryData: null },
    calls: { current: 0, lastEntry: null, lastEntryData: null },
    photos: { current: 0, lastEntry: null, lastEntryData: null }
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (client?.id && challengeData) {
      loadAllData()
    }
  }, [client?.id, challengeData])

  async function loadAllData() {
    setLoading(true)
    try {
      const [workoutData, mealData, weightData, callsData, photosData] = await Promise.all([
        loadWorkoutData(db, client.id, challengeData),
        loadMealData(db, client.id, challengeData),
        loadWeightData(db, client.id, challengeData),
        loadCallsData(db, client.id, challengeData),
        loadPhotosData(db, client.id, challengeData)
      ])
      
      setRequirements({
        workout: workoutData || { current: 0, lastEntry: null, lastEntryData: null },
        meal: mealData || { current: 0, lastEntry: null, lastEntryData: null },
        weight: weightData || { current: 0, lastEntry: null, lastEntryData: null },
        calls: callsData || { current: 0, lastEntry: null, lastEntryData: null },
        photos: photosData || { current: 0, lastEntry: null, lastEntryData: null }
      })
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(type) {
    if (saving) return
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      let result
      
      switch (type) {
        case 'workout':
          result = await addWorkout(db, client.id, challengeData)
          break
        case 'meal':
          result = await addMeal(db, client.id, challengeData)
          break
        case 'weight':
          result = await addWeight(db, client.id, challengeData)
          break
        case 'calls':
          result = await addCall(db, client.id, challengeData)
          break
        case 'photos':
          result = await addPhoto(db, client.id, challengeData)
          break
        default:
          throw new Error('Unknown requirement type')
      }
      
      if (result.success) {
        await loadAllData()
        setSuccess(`✅ ${result.message}`)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error(`Error adding ${type}:`, err)
      setError(err.message || `Failed to add ${type}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(type) {
    if (saving) return
    
    const lastEntryData = requirements[type]?.lastEntryData
    if (!lastEntryData) return
    
    let confirmMessage
    switch (type) {
      case 'workout':
        confirmMessage = `Remove workout from ${new Date(lastEntryData.workout_date || lastEntryData.date).toLocaleDateString()}?`
        break
      case 'meal':
        confirmMessage = `Remove meal tracking from ${new Date(lastEntryData.date).toLocaleDateString()}?`
        break
      case 'weight':
        confirmMessage = `Remove weigh-in from ${new Date(lastEntryData.date).toLocaleDateString()} (${lastEntryData.weight}kg)?`
        break
      case 'calls':
        confirmMessage = `Remove ${lastEntryData.call_title || 'call'} from ${new Date(lastEntryData.scheduled_date).toLocaleDateString()}?`
        break
      case 'photos':
        const photoDate = Array.isArray(lastEntryData) ? lastEntryData[0]?.date : lastEntryData?.date
        confirmMessage = `Remove photo set from ${new Date(photoDate).toLocaleDateString()}?`
        break
      default:
        confirmMessage = 'Remove this entry?'
    }
    
    if (!confirm(confirmMessage)) return
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      let result
      
      switch (type) {
        case 'workout':
          result = await removeWorkout(db, client.id, lastEntryData)
          break
        case 'meal':
          result = await removeMeal(db, client.id, lastEntryData)
          break
        case 'weight':
          result = await removeWeight(db, client.id, lastEntryData)
          break
        case 'calls':
          result = await removeCall(db, client.id, lastEntryData)
          break
        case 'photos':
          result = await removePhoto(db, client.id, lastEntryData)
          break
        default:
          throw new Error('Unknown requirement type')
      }
      
      if (result.success) {
        await loadAllData()
        setSuccess(`✅ ${result.message}`)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error(`Error removing ${type}:`, err)
      setError(err.message || `Failed to remove ${type}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        Loading adjustment data...
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: isMobile ? '1.25rem' : '1.5rem'
      }}>
        <Settings size={24} color="#ef4444" />
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            Manual Adjustments
          </h2>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            Handmatig requirements aanpassen voor {client?.first_name}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#10b981',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '500'
        }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#ef4444',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '500'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Requirements Grid - 3 columns on desktop, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* WORKOUT CARD */}
        <RequirementCard
          icon={workoutConfig.icon}
          title={workoutConfig.title}
          color={workoutConfig.color}
          current={requirements.workout.current}
          required={workoutConfig.required}
          lastEntry={requirements.workout.lastEntry}
          onAdd={() => handleAdd('workout')}
          onRemove={() => handleRemove('workout')}
          saving={saving}
          isMobile={isMobile}
        />

        {/* MEAL CARD */}
        <RequirementCard
          icon={mealConfig.icon}
          title={mealConfig.title}
          color={mealConfig.color}
          current={requirements.meal.current}
          required={mealConfig.required}
          lastEntry={requirements.meal.lastEntry}
          onAdd={() => handleAdd('meal')}
          onRemove={() => handleRemove('meal')}
          saving={saving}
          isMobile={isMobile}
        />

        {/* WEIGHT CARD */}
        <RequirementCard
          icon={weightConfig.icon}
          title={weightConfig.title}
          color={weightConfig.color}
          current={requirements.weight.current}
          required={weightConfig.required}
          lastEntry={requirements.weight.lastEntry}
          onAdd={() => handleAdd('weight')}
          onRemove={() => handleRemove('weight')}
          saving={saving}
          isMobile={isMobile}
        />

        {/* CALLS CARD */}
        <RequirementCard
          icon={callsConfig.icon}
          title={callsConfig.title}
          color={callsConfig.color}
          current={requirements.calls.current}
          required={callsConfig.required}
          lastEntry={requirements.calls.lastEntry}
          onAdd={() => handleAdd('calls')}
          onRemove={() => handleRemove('calls')}
          saving={saving}
          isMobile={isMobile}
        />
        
        {/* PHOTOS CARD */}
        <RequirementCard
          icon={photosConfig.icon}
          title={photosConfig.title}
          color={photosConfig.color}
          current={requirements.photos.current}
          required={photosConfig.required}
          lastEntry={requirements.photos.lastEntry}
          onAdd={() => handleAdd('photos')}
          onRemove={() => handleRemove('photos')}
          saving={saving}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}
