import { useState } from 'react'
import { User, Weight, Target, Activity, Heart, ChevronRight, ChevronLeft, Check } from 'lucide-react'

export default function ClientOnboarding({ db, user }) {
  const isMobile = window.innerWidth <= 768
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    // Persoonlijke Info
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    age: '',
    gender: '',
    date_of_birth: '',
    
    // Lichamelijk
    height: '',
    current_weight: '',
    target_weight: '',
    
    // Doel
    primary_goal: '',
    
    // Gezondheid
    medical_conditions: '',
    injuries: '',
    allergies: '',
    
    // Leefstijl
    activity_level: '',
    workout_days_per_week: ''
  })
  
  const [errors, setErrors] = useState({})
  
  // Validation per step
  const validateStep = (currentStep) => {
    const newErrors = {}
    
    if (currentStep === 1) {
      if (!formData.first_name) newErrors.first_name = 'Verplicht'
      if (!formData.last_name) newErrors.last_name = 'Verplicht'
      if (!formData.email) newErrors.email = 'Verplicht'
      if (!formData.phone) newErrors.phone = 'Verplicht'
      if (!formData.age || formData.age < 16 || formData.age > 100) newErrors.age = 'Tussen 16-100'
      if (!formData.gender) newErrors.gender = 'Verplicht'
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Verplicht'
    }
    
    if (currentStep === 2) {
      if (!formData.height || formData.height < 100 || formData.height > 250) newErrors.height = 'Tussen 100-250cm'
      if (!formData.current_weight || formData.current_weight < 30 || formData.current_weight > 300) newErrors.current_weight = 'Tussen 30-300kg'
    }
    
    if (currentStep === 3) {
      if (!formData.primary_goal) newErrors.primary_goal = 'Verplicht'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const handlePrevious = () => {
    setStep(step - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleSubmit = async () => {
    if (!validateStep(step)) return
    
    setSaving(true)
    try {
      // Get client by email
      const client = await db.getClientByEmail(formData.email)
      
      if (!client) {
        alert('❌ Client account niet gevonden. Neem contact op met je coach.')
        return
      }
      
      // Update client with form data
      const updates = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        height: parseInt(formData.height),
        current_weight: parseFloat(formData.current_weight),
        target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
        primary_goal: formData.primary_goal,
        medical_conditions: formData.medical_conditions || null,
        injuries: formData.injuries || null,
        allergies: formData.allergies || null,
        activity_level: formData.activity_level || null,
        workout_days_per_week: formData.workout_days_per_week ? parseInt(formData.workout_days_per_week) : null
      }
      
      await db.updateClient(client.id, updates)
      
      setSaveSuccess(true)
      
    } catch (error) {
      console.error('Error saving:', error)
      alert('❌ Er ging iets mis. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }
  
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: null })
    }
  }
  
  // Step configuration
  const steps = [
    { number: 1, title: 'Persoonlijke Info', icon: User },
    { number: 2, title: 'Lichamelijk', icon: Weight },
    { number: 3, title: 'Doel', icon: Target },
    { number: 4, title: 'Gezondheid', icon: Heart },
    { number: 5, title: 'Leefstijl', icon: Activity }
  ]
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%'
      }}>
        
        {/* Progress Bar */}
        <div style={{
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            {steps.map((s) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              
              return (
                <div key={s.number} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: isMobile ? '40px' : '50px',
                    height: isMobile ? '40px' : '50px',
                    borderRadius: '50%',
                    background: isCompleted 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : isActive
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: isActive 
                      ? '2px solid #10b981'
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {isCompleted ? (
                      <Check size={isMobile ? 20 : 24} color="#fff" />
                    ) : (
                      <Icon size={isMobile ? 18 : 22} color={isActive ? '#10b981' : 'rgba(255, 255, 255, 0.3)'} />
                    )}
                  </div>
                  {!isMobile && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
                      fontWeight: isActive ? '600' : '400',
                      textAlign: 'center'
                    }}>
                      {s.title}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Progress line */}
          <div style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${(step / steps.length) * 100}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
              transition: 'width 0.4s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>
        
        {/* Form Card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(15px)',
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          borderRadius: '20px',
          padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          
          {/* Step 1: Persoonlijke Info */}
          {step === 1 && (
            <div style={{
              animation: 'fadeIn 0.4s ease'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Persoonlijke Informatie
              </h2>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isMobile ? '2rem' : '2.5rem'
              }}>
                Vertel ons over jezelf
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}>
                  <InputField
                    label="Voornaam"
                    value={formData.first_name}
                    onChange={(v) => updateField('first_name', v)}
                    error={errors.first_name}
                    required
                    isMobile={isMobile}
                  />
                  <InputField
                    label="Achternaam"
                    value={formData.last_name}
                    onChange={(v) => updateField('last_name', v)}
                    error={errors.last_name}
                    required
                    isMobile={isMobile}
                  />
                </div>
                
                <InputField
                  label="E-mailadres"
                  type="email"
                  value={formData.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                  required
                  placeholder="je@email.com"
                  isMobile={isMobile}
                />
                
                <InputField
                  label="Telefoonnummer"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => updateField('phone', v)}
                  error={errors.phone}
                  required
                  placeholder="+31 6 12345678"
                  isMobile={isMobile}
                />
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 2fr',
                  gap: '1rem'
                }}>
                  <InputField
                    label="Leeftijd"
                    type="number"
                    value={formData.age}
                    onChange={(v) => updateField('age', v)}
                    error={errors.age}
                    required
                    min="16"
                    max="100"
                    isMobile={isMobile}
                  />
                  
                  <SelectField
                    label="Geslacht"
                    value={formData.gender}
                    onChange={(v) => updateField('gender', v)}
                    error={errors.gender}
                    required
                    options={[
                      { value: '', label: 'Kies...' },
                      { value: 'male', label: 'Man' },
                      { value: 'female', label: 'Vrouw' },
                      { value: 'other', label: 'Anders' }
                    ]}
                    isMobile={isMobile}
                  />
                  
                  {!isMobile && (
                    <InputField
                      label="Geboortedatum"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(v) => updateField('date_of_birth', v)}
                      error={errors.date_of_birth}
                      required
                      isMobile={isMobile}
                    />
                  )}
                </div>
                
                {isMobile && (
                  <InputField
                    label="Geboortedatum"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(v) => updateField('date_of_birth', v)}
                    error={errors.date_of_birth}
                    required
                    isMobile={isMobile}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Lichamelijk */}
          {step === 2 && (
            <div style={{
              animation: 'fadeIn 0.4s ease'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Lichamelijke Gegevens
              </h2>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isMobile ? '2rem' : '2.5rem'
              }}>
                Je startpunt en doel
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <InputField
                  label="Lengte (cm)"
                  type="number"
                  value={formData.height}
                  onChange={(v) => updateField('height', v)}
                  error={errors.height}
                  required
                  min="100"
                  max="250"
                  placeholder="175"
                  isMobile={isMobile}
                />
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}>
                  <InputField
                    label="Huidig Gewicht (kg)"
                    type="number"
                    step="0.1"
                    value={formData.current_weight}
                    onChange={(v) => updateField('current_weight', v)}
                    error={errors.current_weight}
                    required
                    min="30"
                    max="300"
                    placeholder="75.5"
                    isMobile={isMobile}
                  />
                  
                  <InputField
                    label="Streefgewicht (kg)"
                    type="number"
                    step="0.1"
                    value={formData.target_weight}
                    onChange={(v) => updateField('target_weight', v)}
                    error={errors.target_weight}
                    min="30"
                    max="300"
                    placeholder="80.0 (optioneel)"
                    isMobile={isMobile}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Doel */}
          {step === 3 && (
            <div style={{
              animation: 'fadeIn 0.4s ease'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Jouw Doel
              </h2>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isMobile ? '2rem' : '2.5rem'
              }}>
                Wat wil je bereiken?
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                {[
                  { value: 'muscle_gain', label: 'Spieropbouw', emoji: '💪' },
                  { value: 'fat_loss', label: 'Vetverlies', emoji: '🔥' },
                  { value: 'maintain', label: 'Onderhoud', emoji: '⚖️' },
                  { value: 'general_fitness', label: 'Algemene Fitness', emoji: '🏃' }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => updateField('primary_goal', goal.value)}
                    style={{
                      padding: isMobile ? '1.5rem' : '2rem',
                      background: formData.primary_goal === goal.value
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: formData.primary_goal === goal.value
                        ? '2px solid #10b981'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: isMobile ? '1rem' : '1.1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (formData.primary_goal !== goal.value) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.primary_goal !== goal.value) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    <span style={{ fontSize: isMobile ? '2rem' : '2.5rem' }}>
                      {goal.emoji}
                    </span>
                    <span>{goal.label}</span>
                  </button>
                ))}
              </div>
              
              {errors.primary_goal && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  marginTop: '0.5rem'
                }}>
                  {errors.primary_goal}
                </p>
              )}
            </div>
          )}
          
          {/* Step 4: Gezondheid */}
          {step === 4 && (
            <div style={{
              animation: 'fadeIn 0.4s ease'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Gezondheid
              </h2>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isMobile ? '2rem' : '2.5rem'
              }}>
                Optioneel - help ons je beter te begeleiden
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <TextAreaField
                  label="Medische Aandoeningen"
                  value={formData.medical_conditions}
                  onChange={(v) => updateField('medical_conditions', v)}
                  placeholder="Diabetes, astma, etc. (optioneel)"
                  isMobile={isMobile}
                />
                
                <TextAreaField
                  label="Blessures"
                  value={formData.injuries}
                  onChange={(v) => updateField('injuries', v)}
                  placeholder="Knie, rug, schouder, etc. (optioneel)"
                  isMobile={isMobile}
                />
                
                <TextAreaField
                  label="Allergieën"
                  value={formData.allergies}
                  onChange={(v) => updateField('allergies', v)}
                  placeholder="Noten, lactose, gluten, etc. (optioneel)"
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
          
          {/* Step 5: Leefstijl */}
          {step === 5 && (
            <div style={{
              animation: 'fadeIn 0.4s ease'
            }}>
              <h2 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Leefstijl
              </h2>
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: isMobile ? '2rem' : '2.5rem'
              }}>
                Laatste informatie om je programma te personaliseren
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <SelectField
                  label="Activiteitsniveau"
                  value={formData.activity_level}
                  onChange={(v) => updateField('activity_level', v)}
                  options={[
                    { value: '', label: 'Kies... (optioneel)' },
                    { value: 'sedentary', label: 'Zittend (kantoorwerk)' },
                    { value: 'lightly_active', label: 'Licht Actief (1-3x/week)' },
                    { value: 'moderately_active', label: 'Matig Actief (3-5x/week)' },
                    { value: 'very_active', label: 'Zeer Actief (6-7x/week)' }
                  ]}
                  isMobile={isMobile}
                />
                
                <InputField
                  label="Trainingen per Week"
                  type="number"
                  value={formData.workout_days_per_week}
                  onChange={(v) => updateField('workout_days_per_week', v)}
                  min="0"
                  max="7"
                  placeholder="Bijvoorbeeld: 4 (optioneel)"
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div style={{
            marginTop: isMobile ? '2rem' : '3rem',
            display: 'flex',
            gap: '1rem',
            justifyContent: 'space-between'
          }}>
            {step > 1 && (
              <button
                onClick={handlePrevious}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <ChevronLeft size={18} />
                Vorige
              </button>
            )}
            
            {step < steps.length ? (
              <button
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  marginLeft: step === 1 ? 'auto' : '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Volgende
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving || saveSuccess}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
                  background: saveSuccess
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : saving 
                      ? 'rgba(16, 185, 129, 0.5)'
                      : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  cursor: saving || saveSuccess ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!saving && !saveSuccess) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                {saveSuccess ? 'Opgeslagen!' : saving ? 'Opslaan...' : 'Voltooien'}
                <Check size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Input Field Component
function InputField({ label, value, onChange, error, required, type = 'text', placeholder, disabled, min, max, step, isMobile }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: disabled ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.05)',
          border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: disabled ? 'rgba(255, 255, 255, 0.4)' : '#fff',
          fontSize: isMobile ? '0.95rem' : '1rem',
          outline: 'none',
          transition: 'all 0.2s ease',
          minHeight: '44px'
        }}
        onFocus={(e) => {
          if (!disabled && !error) {
            e.target.style.borderColor = '#10b981'
            e.target.style.background = 'rgba(255, 255, 255, 0.08)'
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
          }
        }}
      />
      {error && (
        <p style={{
          color: '#ef4444',
          fontSize: '0.8rem',
          marginTop: '0.25rem'
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

// Select Field Component
function SelectField({ label, value, onChange, error, required, options, isMobile }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: error ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: value ? '#fff' : 'rgba(255, 255, 255, 0.4)',
          fontSize: isMobile ? '0.95rem' : '1rem',
          outline: 'none',
          cursor: 'pointer',
          minHeight: '44px',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = '#10b981'
            e.target.style.background = 'rgba(255, 255, 255, 0.08)'
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{
          color: '#ef4444',
          fontSize: '0.8rem',
          marginTop: '0.25rem'
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

// TextArea Field Component
function TextAreaField({ label, value, onChange, placeholder, isMobile }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: isMobile ? '0.85rem' : '0.9rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          color: '#fff',
          fontSize: isMobile ? '0.95rem' : '1rem',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#10b981'
          e.target.style.background = 'rgba(255, 255, 255, 0.08)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          e.target.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
      />
    </div>
  )
}
