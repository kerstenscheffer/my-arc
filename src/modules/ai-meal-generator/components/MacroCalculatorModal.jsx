// src/modules/ai-meal-generator/components/MacroCalculatorModal.jsx
// INTELLIGENT MACRO CALCULATOR - Complete versie met alle features

import { useState, useEffect } from 'react'
import { X, Calculator, TrendingUp, Activity, Zap, Target, Info, Check } from 'lucide-react'

export default function MacroCalculatorModal({
  client,
  onClose,
  onSave,
  isMobile
}) {
  // Steps: 1=basics, 2=activity, 3=goal, 4=results
  const [step, setStep] = useState(1)
  
  // Form data
  const [formData, setFormData] = useState({
    // Basics
    weight: client?.current_weight || 75,
    height: client?.height || 180,
    age: client?.age || 30,
    gender: client?.gender || 'male',
    bodyFat: '15-20', // Default: fit
    
    // Activity
    trainingFrequency: '4-5', // times per week
    cardioFrequency: '1-2',
    jobType: 'sedentary',
    
    // Metabolism
    metabolismType: 'normal',
    
    // Goal
    goalType: client?.primary_goal || 'maintain',
    goalAmount: 3, // kg to gain/lose
    goalSpeed: 'moderate' // aggressive/moderate/conservative
  })
  
  // Calculated results
  const [results, setResults] = useState(null)
  
  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // Calculate everything
  const calculate = () => {
    const { weight, height, age, gender, bodyFat, trainingFrequency, cardioFrequency, 
            jobType, metabolismType, goalType, goalSpeed } = formData
    
    // STEP 1: Calculate BMR (Mifflin-St Jeor)
    let bmr = gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    // STEP 2: Calculate Activity Multiplier
    let activityMultiplier = 1.2 // Base sedentary
    
    // Training impact
    if (trainingFrequency === '2-3') activityMultiplier += 0.1
    if (trainingFrequency === '4-5') activityMultiplier += 0.2
    if (trainingFrequency === '6-7') activityMultiplier += 0.3
    
    // Cardio impact
    if (cardioFrequency === '1-2') activityMultiplier += 0.05
    if (cardioFrequency === '3-4') activityMultiplier += 0.1
    if (cardioFrequency === '5+') activityMultiplier += 0.15
    
    // Job impact
    if (jobType === 'light') activityMultiplier += 0.1
    if (jobType === 'active') activityMultiplier += 0.2
    if (jobType === 'very_active') activityMultiplier += 0.3
    
    // Calculate TDEE
    let tdee = Math.round(bmr * activityMultiplier)
    
    // STEP 3: Metabolism adjustment
    if (metabolismType === 'slow') tdee = Math.round(tdee * 0.95)
    if (metabolismType === 'fast') tdee = Math.round(tdee * 1.10)
    
    // STEP 4: Apply goal adjustment
    let targetCalories = tdee
    let surplus = 0
    let deficit = 0
    
    if (goalType === 'muscle_gain' || goalType === 'bulk') {
      if (goalSpeed === 'aggressive') surplus = 600 // +4-6kg in 3 months
      if (goalSpeed === 'moderate') surplus = 350 // +2-3kg in 3 months
      if (goalSpeed === 'conservative') surplus = 225 // +1-1.5kg in 3 months
      targetCalories = tdee + surplus
    } else if (goalType === 'fat_loss' || goalType === 'cut') {
      if (goalSpeed === 'aggressive') deficit = 1000 // -6-8kg in 3 months
      if (goalSpeed === 'moderate') deficit = 600 // -4-5kg in 3 months
      if (goalSpeed === 'conservative') deficit = 350 // -2-3kg in 3 months
      targetCalories = tdee - deficit
    }
    
    // STEP 5: Calculate Protein
    let proteinPerKg = 1.6 // Base
    
    // Body fat based adjustment
    if (bodyFat === '0-10' || bodyFat === '10-15') proteinPerKg = 2.2 // High muscle mass
    if (bodyFat === '15-20') proteinPerKg = 1.9
    if (bodyFat === '20-25') proteinPerKg = 1.7
    if (bodyFat === '25-30' || bodyFat === '30+') proteinPerKg = 1.6
    
    // Extra protein for cutting
    if (goalType === 'fat_loss' || goalType === 'cut') {
      proteinPerKg = Math.max(proteinPerKg, 2.0)
    }
    
    const protein = Math.round(weight * proteinPerKg)
    
    // STEP 6: Calculate Fat (minimum for hormones)
    const fat = Math.round(weight * 1.0) // 1g per kg
    
    // STEP 7: Calculate Carbs (remaining calories)
    const proteinCals = protein * 4
    const fatCals = fat * 9
    const carbCals = targetCalories - proteinCals - fatCals
    const carbs = Math.round(carbCals / 4)
    
    // Prepare results
    setResults({
      tdee,
      targetCalories,
      surplus,
      deficit,
      protein,
      carbs,
      fat,
      proteinPerKg: proteinPerKg.toFixed(1),
      breakdown: {
        proteinCals,
        carbCals,
        fatCals
      }
    })
    
    setStep(4) // Go to results
  }
  
  // Save and close
  const handleSave = () => {
    if (results) {
      onSave({
        calories: results.targetCalories,
        protein: results.protein,
        carbs: results.carbs,
        fat: results.fat
      })
      onClose()
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '2px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: isMobile ? '100%' : '700px',
        maxHeight: isMobile ? '90vh' : '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          padding: isMobile ? '1.25rem' : '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calculator size={isMobile ? 24 : 28} style={{ color: '#fff' }} />
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#fff',
                margin: 0
              }}>
                Macro Calculator
              </h2>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: 'rgba(255,255,255,0.8)',
                margin: 0
              }}>
                {client?.first_name} {client?.last_name}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(139, 92, 246, 0.05)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
        }}>
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Activiteit' },
            { num: 3, label: 'Doel' },
            { num: 4, label: 'Resultaat' }
          ].map(s => (
            <div
              key={s.num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                flex: 1,
                opacity: step >= s.num ? 1 : 0.4
              }}
            >
              <div style={{
                width: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                borderRadius: '50%',
                background: step >= s.num 
                  ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                  : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: '700',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                {step > s.num ? <Check size={isMobile ? 16 : 20} /> : s.num}
              </div>
              <div style={{
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                fontWeight: '600',
                color: step >= s.num ? '#a855f7' : 'rgba(255,255,255,0.5)'
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Basis Gegevens
              </h3>
              
              {/* Weight, Height, Age Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Lengte (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField('height', parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>
                    Leeftijd (jaar)
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              
              {/* Gender */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.75rem',
                  display: 'block'
                }}>
                  Geslacht
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: 'male', label: '♂️ Man' },
                    { value: 'female', label: '♀️ Vrouw' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('gender', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.gender === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.gender === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Body Fat % */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.75rem',
                  display: 'block'
                }}>
                  Body Fat Percentage (schatting)
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: '0-10', label: '0-10%', desc: 'Zeer gespierd' },
                    { value: '10-15', label: '10-15%', desc: 'Gespierd' },
                    { value: '15-20', label: '15-20%', desc: 'Fit' },
                    { value: '20-25', label: '20-25%', desc: 'Gemiddeld' },
                    { value: '25-30', label: '25-30%', desc: 'Boven gem.' },
                    { value: '30+', label: '30%+', desc: 'Hoog' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('bodyFat', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.bodyFat === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.bodyFat === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {option.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 2: ACTIVITY */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Activiteit Level
              </h3>
              
              {/* Training Frequency */}
              <div>
                <label style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.75rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  🏋️ Training per week
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: '2-3', label: '2-3x' },
                    { value: '4-5', label: '4-5x' },
                    { value: '6-7', label: '6-7x' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('trainingFrequency', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.trainingFrequency === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.trainingFrequency === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Cardio Frequency */}
              <div>
                <label style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.75rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  🏃 Cardio per week
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: 'none', label: 'Geen' },
                    { value: '1-2', label: '1-2x' },
                    { value: '3-4', label: '3-4x' },
                    { value: '5+', label: '5+x' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('cardioFrequency', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.cardioFrequency === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.cardioFrequency === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Job Type */}
              <div>
                <label style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.75rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  💼 Baan Type
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: 'sedentary', label: 'Zittend', desc: 'Kantoor, thuiswerk' },
                    { value: 'light', label: 'Licht actief', desc: 'Leraar, winkel' },
                    { value: 'active', label: 'Actief', desc: 'Verpleging, bezorger' },
                    { value: 'very_active', label: 'Zeer actief', desc: 'Bouw, fitness coach' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('jobType', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.jobType === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.jobType === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {option.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Metabolism */}
              <div>
                <label style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.75rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  ⚡ Metabolisme
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: 'slow', label: 'Langzaam', desc: 'Moeilijk afvallen' },
                    { value: 'normal', label: 'Normaal', desc: 'Gemiddeld' },
                    { value: 'fast', label: 'Snel', desc: 'Moeilijk aankomen' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('metabolismType', option.value)}
                      style={{
                        padding: '0.875rem',
                        background: formData.metabolismType === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.metabolismType === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {option.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 3: GOAL */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '700',
                color: '#fff',
                margin: 0
              }}>
                Doel Bepalen
              </h3>
              
              {/* Goal Type */}
              <div>
                <label style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '0.75rem',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Wat is het doel?
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.75rem'
                }}>
                  {[
                    { value: 'muscle_gain', label: 'Massa Opbouwen', icon: '💪' },
                    { value: 'fat_loss', label: 'Vet Verliezen', icon: '🔥' },
                    { value: 'maintain', label: 'Hetzelfde', icon: '⚖️' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('goalType', option.value)}
                      style={{
                        padding: '1rem',
                        background: formData.goalType === option.value
                          ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: formData.goalType === option.value
                          ? '2px solid #a855f7'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {option.icon}
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Goal Speed (only if not maintain) */}
              {formData.goalType !== 'maintain' && (
                <div>
                  <label style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '0.75rem',
                    display: 'block',
                    fontWeight: '600'
                  }}>
                    {formData.goalType === 'muscle_gain' ? 'Hoe snel wil je aankomen?' : 'Hoe snel wil je afvallen?'}
                  </label>
                  
                  {/* BULK OPTIONS */}
                  {formData.goalType === 'muscle_gain' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {[
                        { value: 'aggressive', label: 'Agressief (Dirty Bulk)', result: '+4-6kg in 3 maanden', surplus: '+600-750 cal', desc: 'Meer vet erbij, snellere gains' },
                        { value: 'moderate', label: 'Gemiddeld (Clean Bulk)', result: '+2-3kg in 3 maanden', surplus: '+300-400 cal', desc: 'Minimaal vet, steady gains' },
                        { value: 'conservative', label: 'Conservatief (Lean Bulk)', result: '+1-1.5kg in 3 maanden', surplus: '+200-250 cal', desc: 'Bijna geen vet, clean' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateField('goalSpeed', option.value)}
                          style={{
                            padding: '1rem',
                            background: formData.goalSpeed === option.value
                              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                              : 'rgba(255,255,255,0.03)',
                            border: formData.goalSpeed === option.value
                              ? '2px solid #10b981'
                              : '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
                            {option.label}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.7)',
                            marginBottom: '0.5rem'
                          }}>
                            <span>{option.result}</span>
                            <span style={{ color: '#10b981' }}>{option.surplus}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* CUT OPTIONS */}
                  {formData.goalType === 'fat_loss' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {[
                        { value: 'aggressive', label: 'Agressief (Rapid Cut)', result: '-6-8kg in 3 maanden', deficit: '-1000 cal', desc: 'Meer spierverlies, moeilijk' },
                        { value: 'moderate', label: 'Gemiddeld (Standard Cut)', result: '-4-5kg in 3 maanden', deficit: '-500-700 cal', desc: 'Minimaal spierverlies, goed vol te houden' },
                        { value: 'conservative', label: 'Conservatief (Gentle Cut)', result: '-2-3kg in 3 maanden', deficit: '-300-400 cal', desc: 'Bijna geen spierverlies, makkelijk' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateField('goalSpeed', option.value)}
                          style={{
                            padding: '1rem',
                            background: formData.goalSpeed === option.value
                              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
                              : 'rgba(255,255,255,0.03)',
                            border: formData.goalSpeed === option.value
                              ? '2px solid #ef4444'
                              : '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.5rem' }}>
                            {option.label}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.7)',
                            marginBottom: '0.5rem'
                          }}>
                            <span>{option.result}</span>
                            <span style={{ color: '#ef4444' }}>{option.deficit}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* STEP 4: RESULTS */}
          {step === 4 && results && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                padding: isMobile ? '1.5rem' : '2rem',
                borderRadius: '16px',
                border: '2px solid rgba(139, 92, 246, 0.4)'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  color: '#fff',
                  marginBottom: '0.5rem'
                }}>
                  Jouw Macro Plan
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '1.5rem'
                }}>
                  {formData.goalType === 'muscle_gain' && `Massa opbouwen - ${formData.goalSpeed === 'aggressive' ? 'Agressief' : formData.goalSpeed === 'moderate' ? 'Gemiddeld' : 'Conservatief'}`}
                  {formData.goalType === 'fat_loss' && `Vet verliezen - ${formData.goalSpeed === 'aggressive' ? 'Agressief' : formData.goalSpeed === 'moderate' ? 'Gemiddeld' : 'Conservatief'}`}
                  {formData.goalType === 'maintain' && 'Hetzelfde gewicht houden'}
                </p>
                
                {/* Main Calories */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '0.5rem'
                  }}>
                    🔥 DAGELIJKSE CALORIEËN
                  </div>
                  <div style={{
                    fontSize: isMobile ? '2rem' : '2.5rem',
                    fontWeight: '900',
                    color: '#a855f7',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem'
                  }}>
                    {results.targetCalories}
                    <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>kcal</span>
                  </div>
                  {results.surplus > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.5rem' }}>
                      +{results.surplus} cal surplus
                    </div>
                  )}
                  {results.deficit > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.5rem' }}>
                      -{results.deficit} cal deficit
                    </div>
                  )}
                </div>
                
                {/* Macros Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem'
                }}>
                  {/* Protein */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                      💪 PROTEIN
                    </div>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#a855f7' }}>
                      {results.protein}g
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      {results.proteinPerKg}g per kg
                    </div>
                  </div>
                  
                  {/* Carbs */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                      🍞 CARBS
                    </div>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#a855f7' }}>
                      {results.carbs}g
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      {Math.round(results.breakdown.carbCals)} kcal
                    </div>
                  </div>
                  
                  {/* Fat */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                      🥑 FAT
                    </div>
                    <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#a855f7' }}>
                      {results.fat}g
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      {Math.round(results.breakdown.fatCals)} kcal
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Why these macros */}
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.1rem' }} />
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <strong style={{ color: '#3b82f6' }}>Waarom deze macro's?</strong><br/>
                    • TDEE: {results.tdee} kcal (je dagelijkse verbruik)<br/>
                    • Protein: {results.proteinPerKg}g per kg voor {formData.bodyFat} body fat<br/>
                    • Fats: 1.0g per kg voor hormonale balans<br/>
                    • Carbs: Rest van calorieën voor energie
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Buttons */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          gap: '1rem',
          justifyContent: step === 1 ? 'flex-end' : 'space-between'
        }}>
          {step > 1 && step < 4 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Vorige
            </button>
          )}
          
          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px',
                flex: step === 1 ? '0 0 auto' : 1
              }}
            >
              Volgende
            </button>
          )}
          
          {step === 3 && (
            <button
              onClick={calculate}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px',
                flex: 1
              }}
            >
              Bereken Macro's
            </button>
          )}
          
          {step === 4 && (
            <button
              onClick={handleSave}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px',
                flex: 1
              }}
            >
              Opslaan & Gebruiken
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
