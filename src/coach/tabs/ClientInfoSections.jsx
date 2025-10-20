// src/coach/tabs/ClientInfoSections.jsx
// Section Components for ClientInfoTab

import { useState } from 'react'

// SECTION 1: Basic Information
export function BasicInfoSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Personal Information
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="First Name" value={formData.firstName} onChange={(v) => setFormData({...formData, firstName: v})} isEditing={isEditing} />
          <Field label="Last Name" value={formData.lastName} onChange={(v) => setFormData({...formData, lastName: v})} isEditing={isEditing} />
          <Field label="Email" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} isEditing={isEditing} type="email" />
          <Field label="Phone" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} isEditing={isEditing} />
          <Field label="Date of Birth" value={formData.dateOfBirth} onChange={(v) => setFormData({...formData, dateOfBirth: v})} isEditing={isEditing} type="date" />
          <Field 
            label="Gender" 
            value={formData.gender} 
            onChange={(v) => setFormData({...formData, gender: v})} 
            isEditing={isEditing} 
            type="select"
            options={[
              { value: '', label: 'Select...' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Emergency Contact
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Contact Name" value={formData.emergencyContactName} onChange={(v) => setFormData({...formData, emergencyContactName: v})} isEditing={isEditing} />
          <Field label="Contact Phone" value={formData.emergencyContactPhone} onChange={(v) => setFormData({...formData, emergencyContactPhone: v})} isEditing={isEditing} />
          <Field label="Relationship" value={formData.emergencyRelationship} onChange={(v) => setFormData({...formData, emergencyRelationship: v})} isEditing={isEditing} />
        </div>
      </div>
    </div>
  )
}

// SECTION 2: Physical Stats
export function PhysicalSection({ formData, setFormData, isEditing, isMobile, profile }) {
  const calculateBMI = () => {
    if (formData.currentWeight && formData.height) {
      return (formData.currentWeight / Math.pow(formData.height/100, 2)).toFixed(1)
    }
    return '-'
  }
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Body Stats
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Height (cm)" value={formData.height} onChange={(v) => setFormData({...formData, height: v})} isEditing={isEditing} type="number" />
          <Field label="Current Weight (kg)" value={formData.currentWeight} onChange={(v) => setFormData({...formData, currentWeight: v})} isEditing={isEditing} type="number" step="0.1" />
          <Field label="Target Weight (kg)" value={formData.targetWeight} onChange={(v) => setFormData({...formData, targetWeight: v})} isEditing={isEditing} type="number" step="0.1" />
          <Field label="Body Fat %" value={formData.bodyFat} onChange={(v) => setFormData({...formData, bodyFat: v})} isEditing={isEditing} type="number" step="0.1" />
          <Field label="Muscle Mass (kg)" value={formData.muscleMass} onChange={(v) => setFormData({...formData, muscleMass: v})} isEditing={isEditing} type="number" step="0.1" />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Calculated Stats
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <StatCard label="BMI" value={calculateBMI()} />
          <StatCard label="TDEE" value={profile?.tdee || '-'} unit="kcal" />
          <StatCard label="Age" value={profile?.age || '-'} unit="years" />
          <StatCard label="Weight to Goal" value={
            formData.currentWeight && formData.targetWeight 
              ? (formData.targetWeight - formData.currentWeight).toFixed(1) 
              : '-'
          } unit="kg" />
        </div>
        
        {formData.currentWeight && formData.targetWeight && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <span>Progress to Goal</span>
              <span>{Math.abs(((formData.currentWeight - formData.targetWeight) / formData.targetWeight * 100)).toFixed(0)}%</span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, Math.abs((formData.currentWeight - formData.targetWeight) / formData.targetWeight * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// SECTION 3: Goals & Timeline
export function GoalsSection({ formData, setFormData, isEditing, isMobile, profile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Goal Settings
        </h3>
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
          />
          <Field label="Goal Deadline" value={formData.goalDeadline} onChange={(v) => setFormData({...formData, goalDeadline: v})} isEditing={isEditing} type="date" />
          <Field label="Weekly Weight Goal (kg)" value={formData.weeklyWeightGoal} onChange={(v) => setFormData({...formData, weeklyWeightGoal: v})} isEditing={isEditing} type="number" step="0.1" />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Macro Targets (Auto-calculated)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Target Calories" value={formData.targetCalories} onChange={(v) => setFormData({...formData, targetCalories: v})} isEditing={isEditing} type="number" />
          <Field label="Target Protein (g)" value={formData.targetProtein} onChange={(v) => setFormData({...formData, targetProtein: v})} isEditing={isEditing} type="number" />
          <Field label="Target Carbs (g)" value={formData.targetCarbs} onChange={(v) => setFormData({...formData, targetCarbs: v})} isEditing={isEditing} type="number" />
          <Field label="Target Fat (g)" value={formData.targetFat} onChange={(v) => setFormData({...formData, targetFat: v})} isEditing={isEditing} type="number" />
        </div>
        
        {formData.weeklyWeightGoal && formData.targetWeight && formData.currentWeight && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>
              Estimated Time to Goal
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#10b981' }}>
              {Math.abs((formData.targetWeight - formData.currentWeight) / formData.weeklyWeightGoal).toFixed(0)} weeks
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// SECTION 4: Lifestyle & Activity
export function LifestyleSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Activity & Training
        </h3>
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
          />
          <Field label="Workout Days/Week" value={formData.workoutDaysPerWeek} onChange={(v) => setFormData({...formData, workoutDaysPerWeek: v})} isEditing={isEditing} type="number" min="0" max="7" />
          <Field 
            label="Workout Type" 
            value={formData.workoutType} 
            onChange={(v) => setFormData({...formData, workoutType: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select type...' },
              { value: 'strength', label: 'Strength Training' },
              { value: 'cardio', label: 'Cardio' },
              { value: 'crossfit', label: 'CrossFit' },
              { value: 'bodybuilding', label: 'Bodybuilding' },
              { value: 'mixed', label: 'Mixed' }
            ]}
          />
          <Field 
            label="Job Type" 
            value={formData.jobType} 
            onChange={(v) => setFormData({...formData, jobType: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select job type...' },
              { value: 'desk', label: 'Desk/Office' },
              { value: 'light_physical', label: 'Light Physical' },
              { value: 'heavy_physical', label: 'Heavy Physical' }
            ]}
          />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Lifestyle Factors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Avg Sleep (hours)" value={formData.sleepHours} onChange={(v) => setFormData({...formData, sleepHours: v})} isEditing={isEditing} type="number" step="0.5" min="4" max="12" />
          <Field 
            label="Stress Level" 
            value={formData.stressLevel} 
            onChange={(v) => setFormData({...formData, stressLevel: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select stress level...' },
              { value: 'low', label: 'Low' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'high', label: 'High' }
            ]}
          />
          <Field label="Water Intake (L/day)" value={formData.waterIntake} onChange={(v) => setFormData({...formData, waterIntake: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field 
            label="Alcohol Frequency" 
            value={formData.alcoholFrequency} 
            onChange={(v) => setFormData({...formData, alcoholFrequency: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select frequency...' },
              { value: 'never', label: 'Never' },
              { value: 'rarely', label: 'Rarely' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'daily', label: 'Daily' }
            ]}
          />
        </div>
      </div>
    </div>
  )
}

// SECTION 5: Health & Medical
export function HealthSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Medical Conditions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Medical Conditions" value={formData.medicalConditions} onChange={(v) => setFormData({...formData, medicalConditions: v})} isEditing={isEditing} type="textarea" />
          <Field label="Current Medications" value={formData.medications} onChange={(v) => setFormData({...formData, medications: v})} isEditing={isEditing} type="textarea" />
          <Field label="Previous Injuries" value={formData.injuries} onChange={(v) => setFormData({...formData, injuries: v})} isEditing={isEditing} type="textarea" />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Special Considerations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field 
            label="Pregnant" 
            value={formData.pregnant} 
            onChange={(v) => setFormData({...formData, pregnant: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: false, label: 'No' },
              { value: true, label: 'Yes' }
            ]}
          />
          <Field 
            label="Breastfeeding" 
            value={formData.breastfeeding} 
            onChange={(v) => setFormData({...formData, breastfeeding: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: false, label: 'No' },
              { value: true, label: 'Yes' }
            ]}
          />
          <Field label="Supplements" value={formData.supplements} onChange={(v) => setFormData({...formData, supplements: v})} isEditing={isEditing} type="textarea" placeholder="List current supplements..." />
        </div>
      </div>
    </div>
  )
}

// SECTION 6: Nutrition Preferences
export function NutritionSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Dietary Preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field 
            label="Dietary Type" 
            value={formData.dietaryType} 
            onChange={(v) => setFormData({...formData, dietaryType: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Standard' },
              { value: 'vegetarian', label: 'Vegetarian' },
              { value: 'vegan', label: 'Vegan' },
              { value: 'pescatarian', label: 'Pescatarian' },
              { value: 'keto', label: 'Keto' },
              { value: 'paleo', label: 'Paleo' }
            ]}
          />
          <Field label="Allergies" value={formData.allergies} onChange={(v) => setFormData({...formData, allergies: v})} isEditing={isEditing} type="textarea" placeholder="List allergies (e.g. nuts, dairy, gluten)..." />
          <Field label="Food Intolerances" value={formData.intolerances} onChange={(v) => setFormData({...formData, intolerances: v})} isEditing={isEditing} type="textarea" placeholder="List intolerances..." />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Food Preferences
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Loved Foods" value={formData.lovedFoods} onChange={(v) => setFormData({...formData, lovedFoods: v})} isEditing={isEditing} type="textarea" placeholder="Foods they love..." />
          <Field label="Hated Foods" value={formData.hatedFoods} onChange={(v) => setFormData({...formData, hatedFoods: v})} isEditing={isEditing} type="textarea" placeholder="Foods to avoid..." />
          <Field label="Favorite Cuisines" value={formData.favoriteCuisines} onChange={(v) => setFormData({...formData, favoriteCuisines: v})} isEditing={isEditing} placeholder="Italian, Asian, Mexican..." />
          <Field 
            label="Meal Prep Preference" 
            value={formData.mealPrepPreference} 
            onChange={(v) => setFormData({...formData, mealPrepPreference: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select preference...' },
              { value: 'daily_fresh', label: 'Cook Daily Fresh' },
              { value: 'partial_prep', label: 'Some Prep, Some Fresh' },
              { value: 'full_prep', label: 'Full Sunday Prep' },
              { value: 'mixed', label: 'Flexible' }
            ]}
          />
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem',
        gridColumn: isMobile ? '1' : 'span 2'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Practical Constraints
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '0.75rem' 
        }}>
          <Field label="Budget/Week (€)" value={formData.budgetPerWeek} onChange={(v) => setFormData({...formData, budgetPerWeek: v})} isEditing={isEditing} type="number" />
          <Field 
            label="Cooking Skill" 
            value={formData.cookingSkill} 
            onChange={(v) => setFormData({...formData, cookingSkill: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select skill...' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
              { value: 'chef', label: 'Chef' }
            ]}
          />
          <Field label="Cooking Time/Day (min)" value={formData.cookingTime} onChange={(v) => setFormData({...formData, cookingTime: v})} isEditing={isEditing} type="number" />
        </div>
      </div>
    </div>
  )
}

// SECTION 7: Measurements
export function MeasurementsSection({ formData, setFormData, isEditing, isMobile, db, clientId }) {
  const [saving, setSaving] = useState(false)
  
  const saveMeasurements = async () => {
    setSaving(true)
    try {
      await db.saveBodyMeasurements(clientId, {
        chest: formData.chestCm,
        waist: formData.waistCm,
        hips: formData.hipsCm,
        arm: formData.armCm,
        thigh: formData.thighCm,
        calf: formData.calfCm
      }, new Date())
      alert('✅ Measurements saved!')
    } catch (error) {
      console.error('Error saving measurements:', error)
      alert('❌ Error saving measurements')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: '1.5rem'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Body Measurements (cm)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field label="Chest" value={formData.chestCm} onChange={(v) => setFormData({...formData, chestCm: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field label="Waist" value={formData.waistCm} onChange={(v) => setFormData({...formData, waistCm: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field label="Hips" value={formData.hipsCm} onChange={(v) => setFormData({...formData, hipsCm: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field label="Arm (Bicep)" value={formData.armCm} onChange={(v) => setFormData({...formData, armCm: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field label="Thigh" value={formData.thighCm} onChange={(v) => setFormData({...formData, thighCm: v})} isEditing={isEditing} type="number" step="0.5" />
          <Field label="Calf" value={formData.calfCm} onChange={(v) => setFormData({...formData, calfCm: v})} isEditing={isEditing} type="number" step="0.5" />
        </div>
        
        {isEditing && (
          <button
            onClick={saveMeasurements}
            disabled={saving}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.75rem',
              background: saving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              minHeight: '44px'
            }}
          >
            {saving ? 'Saving...' : 'Save Measurements'}
          </button>
        )}
      </div>
      
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          Progress Tracking
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field 
            label="Tracking Method" 
            value={formData.trackingMethod} 
            onChange={(v) => setFormData({...formData, trackingMethod: v})} 
            isEditing={isEditing}
            type="select"
            options={[
              { value: '', label: 'Select method...' },
              { value: 'strict', label: 'Strict Tracking' },
              { value: 'flexible', label: 'Flexible Tracking' },
              { value: 'intuitive', label: 'Intuitive Eating' }
            ]}
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
          />
          <Field label="Progress Photo Frequency" value={formData.photoFrequency} onChange={(v) => setFormData({...formData, photoFrequency: v})} isEditing={isEditing} />
        </div>
      </div>
    </div>
  )
}

// SECTION 8: Notes
export function NotesSection({ formData, setFormData, isEditing, isMobile }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      padding: isMobile ? '1rem' : '1.5rem'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: '#10b981',
        marginBottom: '1rem'
      }}>
        Coach Notes & Observations
      </h3>
      <Field 
        label="Notes" 
        value={formData.coachNotes} 
        onChange={(v) => setFormData({...formData, coachNotes: v})} 
        isEditing={isEditing} 
        type="textarea"
        rows={8}
        placeholder="Add notes about this client, special considerations, personality traits, motivation strategies, etc..."
      />
      <Field 
        label="AI Instructions" 
        value={formData.aiNotes} 
        onChange={(v) => setFormData({...formData, aiNotes: v})} 
        isEditing={isEditing} 
        type="textarea"
        rows={4}
        placeholder="Special instructions for AI meal/workout generation..."
      />
    </div>
  )
}

// Helper Components
export function Field({ label, value, onChange, isEditing, type = 'text', options, ...props }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '0.25rem',
        fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500'
      }}>
        {label}
      </label>
      {isEditing ? (
        type === 'select' ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            {...props}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            {...props}
          />
        )
      ) : (
        <div style={{
          padding: isMobile ? '0.5rem' : '0.6rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '6px',
          color: value ? '#fff' : 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.9rem',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: type === 'textarea' ? 'pre-wrap' : 'normal'
        }}
        >
          {value || '-'}
        </div>
      )}
    </div>
  )
}

export function StatCard({ label, value, unit }) {
  return (
    <div style={{
      padding: '0.75rem',
      background: 'rgba(16, 185, 129, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(16, 185, 129, 0.1)'
    }}>
      <div style={{
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.4)',
        marginBottom: '0.25rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#10b981'
      }}>
        {value}
        {unit && <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem', color: 'rgba(16, 185, 129, 0.7)' }}>{unit}</span>}
      </div>
    </div>
  )
}
