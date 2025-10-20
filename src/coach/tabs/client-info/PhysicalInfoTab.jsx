// src/coach/tabs/client-info/PhysicalInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, Weight, Ruler, TrendingUp, Activity } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function PhysicalInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const service = new ClientIntelligenceService(db)
  
  // Load client data when client changes
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
        height: profile.height || '',
        currentWeight: profile.currentWeight || '',
        targetWeight: profile.targetWeight || '',
        startWeight: client.start_weight || profile.currentWeight || '',
        bodyFat: profile.bodyFat || '',
        muscleMass: profile.muscleMass || '',
        waterIntakeTarget: client.water_intake_target || 3.0
      })
    } catch (error) {
      console.error('Error loading physical data:', error)
      // Fallback to basic client data
      setFormData({
        height: client.height || '',
        currentWeight: client.current_weight || '',
        targetWeight: client.target_weight || '',
        startWeight: client.start_weight || client.current_weight || '',
        bodyFat: client.body_fat_percentage || '',
        muscleMass: client.muscle_mass || '',
        waterIntakeTarget: client.water_intake_target || 3.0
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      // Create clean update object with proper field names
      const updates = {
        height: formData.height,
        currentWeight: formData.currentWeight,
        targetWeight: formData.targetWeight,
        bodyFat: formData.bodyFat,
        muscleMass: formData.muscleMass,
        waterIntakeTarget: formData.waterIntakeTarget
      }
      
      // Also update start_weight directly via updateClient
      if (formData.startWeight !== undefined) {
        await db.updateClient(client.id, {
          start_weight: formData.startWeight === '' ? null : parseFloat(formData.startWeight) || null
        })
      }
      
      // Update other fields via service
      await service.updateProfile(client.id, updates)
      await onRefresh() // Refresh parent data
      setIsEditing(false)
      alert('✅ Physical information updated successfully!')
    } catch (error) {
      console.error('Error saving physical info:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    loadClientData() // Reset to original data
    setIsEditing(false)
  }
  
  // Calculate BMI
  const calculateBMI = () => {
    if (!formData.currentWeight || !formData.height) return null
    const heightInMeters = formData.height / 100
    const bmi = formData.currentWeight / (heightInMeters * heightInMeters)
    return bmi.toFixed(1)
  }
  
  // Calculate TDEE (using Mifflin-St Jeor)
  const calculateTDEE = () => {
    if (!formData.currentWeight || !formData.height || !client.age || !client.gender || !client.activity_level) {
      return null
    }
    
    let bmr
    if (client.gender === 'male') {
      bmr = (10 * formData.currentWeight) + (6.25 * formData.height) - (5 * client.age) + 5
    } else {
      bmr = (10 * formData.currentWeight) + (6.25 * formData.height) - (5 * client.age) - 161
    }
    
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderate': 1.55,
      'very_active': 1.725,
      'athlete': 1.9
    }
    
    const multiplier = activityMultipliers[client.activity_level] || 1.55
    return Math.round(bmr * multiplier)
  }
  
  // Get BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return { label: '-', color: 'rgba(255, 255, 255, 0.5)' }
    const value = parseFloat(bmi)
    if (value < 18.5) return { label: 'Underweight', color: '#3b82f6' }
    if (value < 25) return { label: 'Normal', color: '#10b981' }
    if (value < 30) return { label: 'Overweight', color: '#fbbf24' }
    return { label: 'Obese', color: '#ef4444' }
  }
  
  const bmi = calculateBMI()
  const bmiCategory = getBMICategory(bmi)
  const tdee = calculateTDEE()
  const weightToGoal = formData.targetWeight && formData.currentWeight 
    ? (formData.targetWeight - formData.currentWeight).toFixed(1) 
    : null
  const totalWeightLost = formData.startWeight && formData.currentWeight
    ? (formData.startWeight - formData.currentWeight).toFixed(1)
    : null
  
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
            Edit Physical Stats
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
        {/* Body Measurements */}
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
            <Ruler size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Body Measurements
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Height (cm)" 
              value={formData.height} 
              onChange={(v) => setFormData({...formData, height: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="180"
              required
              isMobile={isMobile}
            />
            <Field 
              label="Current Weight (kg)" 
              value={formData.currentWeight} 
              onChange={(v) => setFormData({...formData, currentWeight: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="75.0"
              required
              isMobile={isMobile}
            />
            <Field 
              label="Target Weight (kg)" 
              value={formData.targetWeight} 
              onChange={(v) => setFormData({...formData, targetWeight: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="70.0"
              required
              isMobile={isMobile}
            />
            <Field 
              label="Start Weight (kg)" 
              value={formData.startWeight} 
              onChange={(v) => setFormData({...formData, startWeight: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="80.0"
              isMobile={isMobile}
            />
            <Field 
              label="Body Fat %" 
              value={formData.bodyFat} 
              onChange={(v) => setFormData({...formData, bodyFat: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="20.0"
              min="3"
              max="50"
              isMobile={isMobile}
            />
            <Field 
              label="Muscle Mass (kg)" 
              value={formData.muscleMass} 
              onChange={(v) => setFormData({...formData, muscleMass: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.1"
              placeholder="35.0"
              isMobile={isMobile}
            />
            <Field 
              label="Daily Water Target (L)" 
              value={formData.waterIntakeTarget} 
              onChange={(v) => setFormData({...formData, waterIntakeTarget: v})} 
              isEditing={isEditing} 
              type="number" 
              step="0.5"
              min="1"
              max="6"
              placeholder="3.0"
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Calculated Stats & Progress */}
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
              Calculated Stats
            </h3>
          </div>
          
          {/* BMI Card */}
          <div style={{
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>BMI</span>
              <span style={{ 
                fontSize: isMobile ? '0.7rem' : '0.75rem', 
                color: bmiCategory.color,
                fontWeight: '600'
              }}>
                {bmiCategory.label}
              </span>
            </div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 'bold', color: '#10b981' }}>
              {bmi || '-'}
            </div>
          </div>
          
          {/* TDEE Card */}
          <div style={{
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.5rem' }}>
              Daily Calories (TDEE)
            </div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {tdee || '-'} 
              {tdee && <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', marginLeft: '0.25rem' }}>kcal</span>}
            </div>
          </div>
          
          {/* Progress Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div style={{
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>To Goal</div>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem', 
                fontWeight: '600', 
                color: weightToGoal && parseFloat(weightToGoal) > 0 ? '#ef4444' : '#10b981'
              }}>
                {weightToGoal ? `${weightToGoal > 0 ? '+' : ''}${weightToGoal}` : '-'} kg
              </div>
            </div>
            
            <div style={{
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Total Lost</div>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem', 
                fontWeight: '600', 
                color: totalWeightLost && parseFloat(totalWeightLost) > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.5)'
              }}>
                {totalWeightLost ? `${totalWeightLost > 0 ? '-' : '+'}${Math.abs(totalWeightLost)}` : '-'} kg
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
