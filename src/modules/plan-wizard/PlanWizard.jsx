// src/modules/plan-wizard/PlanWizard.jsx
// Main wizard orchestrator - 7 steps van client selectie tot plan export

import { useState, useEffect } from 'react'
import { 
  User, CheckCircle, Brain, Calculator, 
  Target, FileText, ChevronRight, ChevronLeft,
  AlertCircle, Loader
} from 'lucide-react'
import PlanWizardService from './PlanWizardService'
import { WorkoutSchemaAssignmentModal } from '../client-management/AssignmentModals'
import { MealPlanAssignModal, CallPlanAssignModal } from './WizardAssignmentModals'

export default function PlanWizard({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  
  // Core state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [planType, setPlanType] = useState(null)
  const [macros, setMacros] = useState(null)
  const [assignments, setAssignments] = useState({
    workout: false,
    meal: false,
    call: false
  })
  const [loading, setLoading] = useState(false)
  const [service, setService] = useState(null)

  // Initialize service
  useEffect(() => {
    const wizardService = new PlanWizardService(db)
    setService(wizardService)
  }, [db])

  const steps = [
    { num: 1, label: 'Client', icon: User },
    { num: 2, label: 'Data Check', icon: CheckCircle },
    { num: 3, label: 'Quiz', icon: Brain },
    { num: 4, label: 'Plan', icon: Target },
    { num: 5, label: 'Macro\'s', icon: Calculator },
    { num: 6, label: 'Assign', icon: Target },
    { num: 7, label: 'Export', icon: FileText }
  ]

  const canProgress = () => {
    if (currentStep === 1) return !!selectedClient
    if (currentStep === 2) return selectedClient && service?.validateClientData(selectedClient).isValid
    if (currentStep === 3) return Object.keys(quizAnswers).length >= 3
    if (currentStep === 4) return !!planType
    if (currentStep === 5) return !!macros
    return true
  }

  const handleNext = async () => {
    if (!canProgress()) return

    // Auto-calculations op bepaalde stappen
    if (currentStep === 3 && service && selectedClient) {
      // Na quiz: bepaal plan
      const determined = service.determinePlanType(selectedClient, quizAnswers)
      setPlanType(determined)
    }
    
    if (currentStep === 4 && service && selectedClient && planType) {
      // Na plan: bereken macro's
      const calculated = service.calculateMacros(selectedClient, planType, quizAnswers)
      setMacros(calculated)
    }

    if (currentStep === 5 && service && selectedClient) {
      // Na macro's: check bestaande assignments
      setLoading(true)
      const existing = await service.checkExistingAssignments(selectedClient.id)
      setAssignments({
        workout: existing.hasWorkout,
        meal: existing.hasMealPlan,
        call: false
      })
      setLoading(false)
    }

    setCurrentStep(prev => Math.min(prev + 1, 7))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSavePlan = async () => {
    if (!service || !selectedClient || !macros) return
    
    setLoading(true)
    const result = await service.saveClientPlan(selectedClient.id, macros, planType)
    setLoading(false)
    
    if (result.success) {
      alert('✅ Plan opgeslagen!')
      handleNext()
    } else {
      alert('❌ Fout bij opslaan: ' + result.error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.75rem' : '2.5rem',
          fontWeight: '800',
          backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          Plan Maker Wizard
        </h1>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Van client data naar compleet plan in 7 stappen
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.25rem' : '0.5rem',
          overflowX: 'auto',
          padding: '0.5rem 0'
        }}>
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isActive = currentStep === step.num
            const isComplete = currentStep > step.num
            
            return (
              <div key={step.num} style={{
                flex: 1,
                minWidth: isMobile ? '60px' : '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {/* Icon Circle */}
                <div style={{
                  width: isMobile ? '40px' : '50px',
                  height: isMobile ? '40px' : '50px',
                  borderRadius: '50%',
                  background: isComplete 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : isActive
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isActive ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon 
                    size={isMobile ? 18 : 22} 
                    color={isComplete || isActive ? '#fff' : 'rgba(255, 255, 255, 0.4)'}
                  />
                </div>
                
                {/* Label */}
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  color: isActive ? '#10b981' : 'rgba(255, 255, 255, 0.5)',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'center'
                }}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        minHeight: '500px',
        position: 'relative'
      }}>
        {/* Step Content */}
        {currentStep === 1 && (
          <StepClientSelector 
            clients={clients}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
            isMobile={isMobile}
          />
        )}

        {currentStep === 2 && selectedClient && service && (
          <StepDataCheck 
            client={selectedClient}
            service={service}
            onUpdate={setSelectedClient}
            isMobile={isMobile}
          />
        )}

        {currentStep === 3 && (
          <StepQuiz 
            answers={quizAnswers}
            onAnswer={setQuizAnswers}
            isMobile={isMobile}
          />
        )}

        {currentStep === 4 && selectedClient && service && planType && (
          <StepPlanDetermination 
            client={selectedClient}
            planType={planType}
            service={service}
            isMobile={isMobile}
          />
        )}

        {currentStep === 5 && selectedClient && service && macros && (
          <StepMacroCalculator 
            client={selectedClient}
            macros={macros}
            planType={planType}
            service={service}
            onSave={handleSavePlan}
            loading={loading}
            isMobile={isMobile}
          />
        )}

        {currentStep === 6 && (
          <StepAssignmentHub 
            assignments={assignments}
            onAssign={setAssignments}
            clientId={selectedClient?.id}
            db={db}
            isMobile={isMobile}
          />
        )}

        {currentStep === 7 && selectedClient && service && (
          <StepExport 
            client={selectedClient}
            planType={planType}
            macros={macros}
            service={service}
            isMobile={isMobile}
          />
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ChevronLeft size={18} />
            Terug
          </button>

          <button
            onClick={handleNext}
            disabled={!canProgress() || loading}
            style={{
              padding: isMobile ? '0.75rem 1.5rem' : '0.875rem 2rem',
              borderRadius: '12px',
              background: canProgress() 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: canProgress() ? 'pointer' : 'not-allowed',
              opacity: canProgress() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {loading ? (
              <>
                <Loader size={18} className="spin" />
                Laden...
              </>
            ) : (
              <>
                {currentStep === 7 ? 'Afronden' : 'Volgende'}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// STEP COMPONENTS - VOLLEDIG UITGEWERKT
// ============================================

// STEP 1: Client Selector
function StepClientSelector({ clients, selectedClient, onSelect, isMobile }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredClients = clients?.filter(c => 
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '0.5rem',
        fontWeight: '700'
      }}>
        Selecteer Client
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginBottom: '1.5rem',
        fontSize: isMobile ? '0.85rem' : '0.95rem'
      }}>
        Kies de client waarvoor je een plan wilt maken
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Zoek op naam of email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem' : '1rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '1rem',
          marginBottom: '1rem'
        }}
      />

      {/* Client Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {filteredClients.map(client => (
          <div
            key={client.id}
            onClick={() => onSelect(client)}
            style={{
              padding: isMobile ? '1rem' : '1.25rem',
              borderRadius: '12px',
              background: selectedClient?.id === client.id
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: selectedClient?.id === client.id
                ? '2px solid #10b981'
                : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (selectedClient?.id !== client.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedClient?.id !== client.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              }
            }}
          >
            <div style={{ 
              fontSize: isMobile ? '1rem' : '1.1rem', 
              fontWeight: '600', 
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {client.first_name} {client.last_name}
            </div>
            <div style={{ 
              fontSize: isMobile ? '0.8rem' : '0.85rem', 
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {client.email}
            </div>
            {client.primary_goal && (
              <div style={{ 
                fontSize: isMobile ? '0.75rem' : '0.8rem', 
                color: '#10b981',
                marginTop: '0.5rem'
              }}>
                Goal: {client.primary_goal}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// STEP 2: Data Check & Fill
function StepDataCheck({ client, service, onUpdate, isMobile }) {
  const validation = service.validateClientData(client)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ ...client })
  
  const handleSave = async () => {
    onUpdate(formData)
    setEditMode(false)
  }

  const requiredFields = [
    { key: 'height', label: 'Lengte (cm)', type: 'number' },
    { key: 'current_weight', label: 'Huidig gewicht (kg)', type: 'number' },
    { key: 'age', label: 'Leeftijd', type: 'number' },
    { key: 'gender', label: 'Geslacht', type: 'select', options: ['male', 'female'] },
    { key: 'activity_level', label: 'Activiteit level', type: 'select', 
      options: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'] },
    { key: 'primary_goal', label: 'Primair doel', type: 'select', 
      options: ['muscle_gain', 'fat_loss', 'general_fitness'] }
  ]

  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '0.5rem',
        fontWeight: '700'
      }}>
        Data Check: {client.first_name}
      </h2>
      
      {/* Progress Bar */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <span style={{ 
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: validation.isValid ? '#10b981' : '#f97316',
            fontWeight: '600'
          }}>
            Profiel {validation.completion}% compleet
          </span>
          {!validation.isValid && (
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid #10b981',
                color: '#10b981',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {editMode ? 'Annuleren' : 'Aanvullen'}
            </button>
          )}
        </div>
        <div style={{
          height: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${validation.completion}%`,
            height: '100%',
            background: validation.isValid 
              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              : 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Current Data Display */}
      {!editMode && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {requiredFields.map(field => (
            <div key={field.key} style={{
              padding: '1rem',
              borderRadius: '12px',
              background: client[field.key] 
                ? 'rgba(16, 185, 129, 0.05)' 
                : 'rgba(239, 68, 68, 0.05)',
              border: client[field.key]
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ 
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.25rem'
              }}>
                {field.label}
              </div>
              <div style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem',
                color: client[field.key] ? '#fff' : '#ef4444',
                fontWeight: '600'
              }}>
                {client[field.key] || 'Ontbreekt'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Mode */}
      {editMode && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1rem'
        }}>
          {requiredFields.map(field => (
            <div key={field.key}>
              <label style={{ 
                display: 'block',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem'
              }}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                >
                  <option value="">Selecteer...</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}
                />
              )}
            </div>
          ))}
          <button
            onClick={handleSave}
            style={{
              padding: isMobile ? '0.875rem' : '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            ✅ Opslaan
          </button>
        </div>
      )}
    </div>
  )
}

// STEP 3: Personalisatie Quiz
function StepQuiz({ answers, onAnswer, isMobile }) {
  const questions = [
    {
      id: 'experience',
      question: 'Wat is de training ervaring?',
      options: [
        { value: 'beginner', label: 'Beginner', desc: '0-1 jaar training' },
        { value: 'intermediate', label: 'Intermediate', desc: '1-3 jaar training' },
        { value: 'advanced', label: 'Gevorderd', desc: '3+ jaar training' }
      ]
    },
    {
      id: 'body_comp',
      question: 'Body compositie inschatting?',
      options: [
        { value: 'lean', label: 'Lean', desc: 'Zichtbare abs' },
        { value: 'average', label: 'Average', desc: 'Normaal body fat' },
        { value: 'higher_bf', label: 'Higher BF', desc: '> 20% (man) / > 30% (vrouw)' }
      ]
    },
    {
      id: 'supplements',
      question: 'Supplement gebruik?',
      options: [
        { value: 'none', label: 'Geen', desc: 'Geen supplementen' },
        { value: 'basic', label: 'Basics', desc: 'Eiwit/creatine' },
        { value: 'advanced', label: 'Uitgebreid', desc: 'Volledige stack' }
      ]
    }
  ]

  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '0.5rem',
        fontWeight: '700'
      }}>
        Personalisatie Quiz
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginBottom: '1.5rem',
        fontSize: isMobile ? '0.85rem' : '0.95rem'
      }}>
        Beantwoord deze vragen voor een accurater plan
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {questions.map((q, idx) => (
          <div key={q.id}>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#fff',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              {idx + 1}. {q.question}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '0.75rem'
            }}>
              {q.options.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => onAnswer({ ...answers, [q.id]: opt.value })}
                  style={{
                    padding: isMobile ? '1rem' : '1.25rem',
                    borderRadius: '12px',
                    background: answers[q.id] === opt.value
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: answers[q.id] === opt.value
                      ? '2px solid #10b981'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (answers[q.id] !== opt.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answers[q.id] !== opt.value) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    }
                  }}
                >
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    fontWeight: '600',
                    color: answers[q.id] === opt.value ? '#10b981' : '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {opt.label}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {opt.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// STEP 4: Plan Determination
function StepPlanDetermination({ client, planType, service, isMobile }) {
  const rationale = service.getPlanRationale(planType, client)
  const focusAreas = service.determineFocusAreas(client)
  
  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '1rem',
        fontWeight: '700'
      }}>
        Jouw Plan: {planType.replace(/_/g, ' ').toUpperCase()}
      </h2>

      {/* Rationale */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderRadius: '12px',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        marginBottom: '1.5rem'
      }}>
        <pre style={{ 
          color: '#fff', 
          whiteSpace: 'pre-wrap',
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          lineHeight: '1.6',
          margin: 0,
          fontFamily: 'inherit'
        }}>
          {rationale}
        </pre>
      </div>

      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <div>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            color: '#fff',
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            Action Points
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {focusAreas.map((focus, idx) => (
              <div key={idx} style={{
                padding: isMobile ? '0.875rem' : '1rem',
                borderRadius: '10px',
                background: focus.priority === 'HIGH'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : focus.priority === 'MEDIUM'
                  ? 'rgba(251, 146, 60, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${
                  focus.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' :
                  focus.priority === 'MEDIUM' ? 'rgba(251, 146, 60, 0.3)' :
                  'rgba(16, 185, 129, 0.3)'
                }`,
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                  {focus.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: focus.priority === 'HIGH' ? '#ef4444' :
                           focus.priority === 'MEDIUM' ? '#fb923c' : '#10b981',
                    fontWeight: '600',
                    marginBottom: '0.25rem'
                  }}>
                    {focus.priority} PRIORITY
                  </div>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    color: '#fff',
                    fontWeight: '500'
                  }}>
                    {focus.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// STEP 5: Macro Calculator
function StepMacroCalculator({ client, macros, planType, service, onSave, loading, isMobile }) {
  const rationale = service.getMacroRationale(macros, client, planType)
  
  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '1rem',
        fontWeight: '700'
      }}>
        Macro Calculator
      </h2>

      {/* Visual Macro Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          gridColumn: isMobile ? 'span 2' : 'auto'
        }}>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
            CALORIEËN
          </div>
          <div style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: '800', color: '#fff' }}>
            {macros.calories}
          </div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            kcal/dag
          </div>
        </div>

        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
            EIWIT
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff' }}>
            {macros.protein}g
          </div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            {macros.breakdown.proteinPerKg.toFixed(1)}g/kg
          </div>
        </div>

        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
            CARBS
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff' }}>
            {macros.carbs}g
          </div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            {Math.round(macros.breakdown.carbCals / macros.calories * 100)}%
          </div>
        </div>

        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)',
          border: '1px solid rgba(251, 146, 60, 0.3)'
        }}>
          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
            VETTEN
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: '800', color: '#fff' }}>
            {macros.fat}g
          </div>
          <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            {Math.round(macros.breakdown.fatCals / macros.calories * 100)}%
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderRadius: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <pre style={{ 
          color: '#fff', 
          whiteSpace: 'pre-wrap',
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          lineHeight: '1.6',
          margin: 0,
          fontFamily: 'monospace'
        }}>
          {rationale}
        </pre>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={loading}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: loading 
            ? 'rgba(255, 255, 255, 0.1)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          color: '#fff',
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
      >
        {loading ? (
          <>
            <Loader size={20} className="spin" />
            Opslaan...
          </>
        ) : (
          <>
            ✅ Macro's Opslaan naar Client Profiel
          </>
        )}
      </button>
    </div>
  )
}

// STEP 6: Assignment Hub met Modal Integration
function StepAssignmentHub({ assignments, onAssign, clientId, db, isMobile }) {
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false)
  const [mealModalOpen, setMealModalOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load client data for modals
  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)
      console.log('📊 StepAssignmentHub: Loading client data for ID:', clientId)
      console.log('🔍 DB object available:', !!db)
      console.log('🔍 DB.supabase available:', !!db?.supabase)
      
      const { data, error } = await db.supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error) {
        console.error('❌ Error loading client:', error)
        throw error
      }
      
      console.log('✅ Client data loaded:', data)
      setClient(data)
    } catch (error) {
      console.error('❌ Failed to load client in StepAssignmentHub:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkoutModalClose = async (success) => {
    console.log('🏋️ Workout modal closed, success:', success)
    setWorkoutModalOpen(false)
    if (success) {
      const updated = { ...assignments, workout: true }
      console.log('✅ Updating workout assignment:', updated)
      onAssign(updated)
      await loadClientData()
    }
  }

  const handleMealModalClose = async (success) => {
    console.log('🍽️ Meal modal closed, success:', success)
    setMealModalOpen(false)
    if (success) {
      const updated = { ...assignments, meal: true }
      console.log('✅ Updating meal assignment:', updated)
      onAssign(updated)
    }
  }

  const handleCallModalClose = async (success) => {
    console.log('📞 Call modal closed, success:', success)
    setCallModalOpen(false)
    if (success) {
      const updated = { ...assignments, call: true }
      console.log('✅ Updating call assignment:', updated)
      onAssign(updated)
    }
  }

  const assignmentTypes = [
    { 
      key: 'workout', 
      label: 'Workout Schema', 
      icon: '🏋️',
      color: '#f97316',
      desc: 'Wijs een workout schema toe',
      onClick: () => {
        console.log('🏋️ Opening workout modal for client:', client?.first_name)
        setWorkoutModalOpen(true)
      }
    },
    { 
      key: 'meal', 
      label: 'Meal Plan', 
      icon: '🍽️',
      color: '#10b981',
      desc: 'AI meal plan of template',
      onClick: () => {
        console.log('🍽️ Opening meal modal for client:', client?.first_name)
        setMealModalOpen(true)
      }
    },
    { 
      key: 'call', 
      label: 'Call Plan', 
      icon: '📞',
      color: '#3b82f6',
      desc: 'Wijs call template toe',
      onClick: () => {
        console.log('📞 Opening call modal for client:', client?.first_name)
        setCallModalOpen(true)
      }
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
        <Loader size={32} className="spin" />
        <p style={{ marginTop: '1rem' }}>Loading client data...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '0.5rem',
        fontWeight: '700'
      }}>
        Assignment Hub
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginBottom: '1.5rem',
        fontSize: isMobile ? '0.85rem' : '0.95rem'
      }}>
        Wijs workout, meal en call plans toe (optioneel)
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        {assignmentTypes.map(type => (
          <div key={type.key} style={{
            padding: isMobile ? '1.5rem' : '2rem',
            borderRadius: '16px',
            background: assignments[type.key]
              ? `linear-gradient(135deg, ${type.color}20 0%, ${type.color}10 100%)`
              : 'rgba(255, 255, 255, 0.03)',
            border: assignments[type.key]
              ? `2px solid ${type.color}`
              : '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              fontSize: isMobile ? '2.5rem' : '3rem',
              marginBottom: '1rem'
            }}>
              {type.icon}
            </div>
            <h3 style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              {type.label}
            </h3>
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '1rem'
            }}>
              {type.desc}
            </p>
            
            {/* Status Badge */}
            <div style={{
              padding: '0.75rem',
              borderRadius: '10px',
              background: assignments[type.key]
                ? `${type.color}40`
                : 'rgba(255, 255, 255, 0.05)',
              color: assignments[type.key] ? type.color : 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              {assignments[type.key] ? '✅ Assigned' : '⏭️ Not Assigned'}
            </div>

            {/* Action Button */}
            <button
              onClick={type.onClick}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                borderRadius: '10px',
                background: assignments[type.key]
                  ? 'rgba(255, 255, 255, 0.1)'
                  : `linear-gradient(135deg, ${type.color} 0%, ${type.color}dd 100%)`,
                border: 'none',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {assignments[type.key] ? 'Change' : 'Assign Now'}
            </button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: isMobile ? '1rem' : '1.25rem',
        borderRadius: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ 
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.7)',
          lineHeight: '1.5'
        }}>
          💡 <strong>Tip:</strong> Je kunt assignments ook later doen via de normale flows. 
          Deze stap is optioneel en bedoeld voor snelheid. Klik "Volgende" om door te gaan.
        </div>
      </div>

      {/* Workout Modal */}
      {client && workoutModalOpen && (
        <WorkoutSchemaAssignmentModal
          client={client}
          isOpen={workoutModalOpen}
          onClose={handleWorkoutModalClose}
          db={db}
        />
      )}

      {/* Meal Plan Modal */}
      {client && mealModalOpen && (
        <MealPlanAssignModal
          client={client}
          isOpen={mealModalOpen}
          onClose={handleMealModalClose}
          db={db}
          isMobile={isMobile}
        />
      )}

      {/* Call Modal */}
      {client && callModalOpen && (
        <CallPlanAssignModal
          client={client}
          isOpen={callModalOpen}
          onClose={handleCallModalClose}
          db={db}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// STEP 7: Export
function StepExport({ client, planType, macros, service, isMobile }) {
  const focusAreas = service.determineFocusAreas(client)
  const message = service.generateWhatsAppMessage(client, planType, macros, focusAreas)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem', 
        color: '#fff', 
        marginBottom: '0.5rem',
        fontWeight: '700'
      }}>
        Plan Export
      </h2>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.6)', 
        marginBottom: '1.5rem',
        fontSize: isMobile ? '0.85rem' : '0.95rem'
      }}>
        Kopieer dit bericht en stuur naar {client.first_name} via WhatsApp
      </p>

      {/* Success Banner */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '0.5rem' }}>
          🎉
        </div>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          color: '#10b981',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          Plan Compleet!
        </h3>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          Macro's zijn opgeslagen in het client profiel
        </p>
      </div>

      {/* Message Preview */}
      <textarea
        value={message}
        readOnly
        style={{
          width: '100%',
          minHeight: isMobile ? '250px' : '350px',
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontFamily: 'monospace',
          lineHeight: '1.5',
          resize: 'vertical',
          marginBottom: '1rem'
        }}
      />

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.25rem',
          borderRadius: '12px',
          background: copied
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: 'none',
          color: '#fff',
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
      >
        {copied ? (
          <>
            <CheckCircle size={20} />
            Gekopieerd!
          </>
        ) : (
          <>
            📋 Kopieer naar Klembord
          </>
        )}
      </button>
    </div>
  )
}
