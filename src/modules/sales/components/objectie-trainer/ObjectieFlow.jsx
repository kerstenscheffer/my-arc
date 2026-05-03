// src/modules/sales/components/objectie-trainer/ObjectieFlow.jsx
// Component voor objectie flow training - beide modes

import { useState } from 'react'
import { ChevronRight, Eye, List, CheckCircle, ArrowRight } from 'lucide-react'
import { SALES_THEME } from '../../SalesSection'
import { getCompleteFlow } from '../../data/mainFlow'

export default function ObjectieFlow({ 
  personage, 
  objectieFlow, 
  onComplete, 
  isMobile 
}) {
  const [mode, setMode] = useState('step-by-step') // 'step-by-step', 'complete', 'both'
  const [currentStep, setCurrentStep] = useState(0)
  
  const completeFlow = getCompleteFlow(objectieFlow)
  const totalSteps = completeFlow.length

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
  }

  return (
    <div>
      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '0.25rem',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <ModeButton
          active={mode === 'step-by-step'}
          onClick={() => setMode('step-by-step')}
          icon={ChevronRight}
          label="Stap-voor-Stap"
          isMobile={isMobile}
        />
        <ModeButton
          active={mode === 'complete'}
          onClick={() => setMode('complete')}
          icon={List}
          label="Volledig"
          isMobile={isMobile}
        />
        <ModeButton
          active={mode === 'both'}
          onClick={() => setMode('both')}
          icon={Eye}
          label="Beide"
          isMobile={isMobile}
        />
      </div>

      {/* Step-by-Step Mode */}
      {(mode === 'step-by-step' || mode === 'both') && (
        <StepByStepView
          flow={completeFlow}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onReset={handleReset}
          personage={personage}
          isMobile={isMobile}
        />
      )}

      {/* Complete Mode */}
      {(mode === 'complete' || mode === 'both') && (
        <div style={{ marginTop: mode === 'both' ? '2rem' : 0 }}>
          <CompleteView
            flow={completeFlow}
            objectieFlow={objectieFlow}
            personage={personage}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}

// Mode Button
function ModeButton({ active, onClick, icon: Icon, label, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: isMobile ? '0.625rem' : '0.75rem',
        background: active 
          ? `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`
          : 'transparent',
        border: 'none',
        borderRadius: '6px',
        color: active ? '#000' : 'rgba(255, 255, 255, 0.6)',
        fontWeight: '700',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <Icon size={isMobile ? 14 : 16} />
      {!isMobile && label}
    </button>
  )
}

// Step-by-Step View
function StepByStepView({ 
  flow, 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onReset,
  personage,
  isMobile 
}) {
  const step = flow[currentStep]
  const isStart = step?.type === 'start'
  const isReturn = step?.type === 'return'
  const isClose = step?.type === 'close'
  const isSuccess = step?.type === 'success'
  const isLast = currentStep === totalSteps - 1

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${SALES_THEME.border}`,
      borderRadius: '12px',
      padding: isMobile ? '1.25rem' : '1.5rem'
    }}>
      {/* Progress */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Stap {currentStep + 1} / {totalSteps}
          </div>
          {isReturn && (
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              padding: '0.25rem 0.625rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#10b981',
              fontWeight: '700'
            }}>
              ← Terug naar Main Flow
            </div>
          )}
          {isClose && (
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              padding: '0.25rem 0.625rem',
              background: `${SALES_THEME.background}`,
              border: `1px solid ${SALES_THEME.border}`,
              borderRadius: '12px',
              color: SALES_THEME.primary,
              fontWeight: '700'
            }}>
              Closing Sequence
            </div>
          )}
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.accent} 100%)`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Message Bubble */}
      {!isSuccess ? (
        <MessageBubble
          speaker={step.speaker}
          text={step.text}
          personage={personage}
          isStart={isStart}
          isMobile={isMobile}
        />
      ) : (
        <SuccessMessage isMobile={isMobile} />
      )}

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '1.5rem'
      }}>
        <button
          onClick={onReset}
          disabled={currentStep === 0}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.5 : 1
          }}
        >
          Reset
        </button>

        <button
          onClick={onPrevious}
          disabled={currentStep === 0}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '600',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.5 : 1
          }}
        >
          Vorige
        </button>

        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.25rem',
            background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: '700',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isLast ? 'Afronden' : 'Volgende'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// Message Bubble
function MessageBubble({ speaker, text, personage, isStart, isMobile }) {
  const isLead = speaker === 'lead'
  const isYou = speaker === 'jij'
  const isSystem = speaker === 'system'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isYou ? 'flex-end' : 'flex-start'
    }}>
      {/* Speaker Label */}
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        fontWeight: '700',
        color: isSystem ? SALES_THEME.primary : (isYou ? '#10b981' : '#60a5fa'),
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isSystem ? '💰 Price Offer' : isYou ? '💬 Jij' : `👤 ${personage.naam}`}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: isMobile ? '100%' : '85%',
        padding: isMobile ? '1rem' : '1.25rem',
        background: isSystem 
          ? `${SALES_THEME.background}`
          : isYou 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.08) 100%)',
        border: isSystem
          ? `1px solid ${SALES_THEME.border}`
          : isYou
            ? '1px solid rgba(16, 185, 129, 0.2)'
            : '1px solid rgba(96, 165, 250, 0.2)',
        borderRadius: '12px',
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: '#fff',
        lineHeight: '1.6'
      }}>
        {text}
      </div>
    </div>
  )
}

// Complete View
function CompleteView({ flow, objectieFlow, personage, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${SALES_THEME.border}`,
      borderRadius: '12px',
      padding: isMobile ? '1.25rem' : '1.5rem'
    }}>
      <h4 style={{
        fontSize: isMobile ? '1rem' : '1.125rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '1.5rem'
      }}>
        Volledige Flow
      </h4>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {flow.map((step, idx) => (
          <div key={idx}>
            {step.type && step.type !== 'close' && (
              <div style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: SALES_THEME.primary,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {step.type === 'start' && '🎯 START'}
                {step.type === 'return' && '↩️ RETURN TO MAIN'}
                {step.type === 'success' && '✅ SUCCESS'}
              </div>
            )}
            <FlowLine
              speaker={step.speaker}
              text={step.text}
              personage={personage}
              isMobile={isMobile}
            />
          </div>
        ))}
      </div>

      {/* Tips Section */}
      {objectieFlow.tips && (
        <div style={{
          marginTop: '2rem',
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '700',
            color: SALES_THEME.primary,
            marginBottom: '0.75rem'
          }}>
            💡 Tips voor deze objectie:
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '1.25rem',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.6'
          }}>
            {objectieFlow.tips.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Flow Line (for complete view)
function FlowLine({ speaker, text, personage, isMobile }) {
  const isLead = speaker === 'lead'
  const isYou = speaker === 'jij'

  return (
    <div style={{
      padding: isMobile ? '0.75rem' : '0.875rem',
      background: isYou 
        ? 'rgba(16, 185, 129, 0.08)'
        : isLead
          ? 'rgba(96, 165, 250, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${isYou ? 'rgba(16, 185, 129, 0.2)' : isLead ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
      borderLeft: `3px solid ${isYou ? '#10b981' : isLead ? '#60a5fa' : SALES_THEME.primary}`,
      borderRadius: '6px',
      fontSize: isMobile ? '0.8rem' : '0.85rem',
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: '1.5'
    }}>
      <span style={{
        fontWeight: '700',
        color: isYou ? '#10b981' : isLead ? '#60a5fa' : SALES_THEME.primary,
        marginRight: '0.5rem'
      }}>
        {isYou ? 'JIJ:' : isLead ? `${personage.naam.toUpperCase()}:` : 'SYSTEM:'}
      </span>
      {text}
    </div>
  )
}

// Success Message
function SuccessMessage({ isMobile }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem'
    }}>
      <CheckCircle 
        size={isMobile ? 56 : 64} 
        color="#10b981"
        style={{ marginBottom: '1rem' }}
      />
      <h3 style={{
        fontSize: isMobile ? '1.5rem' : '1.75rem',
        fontWeight: '900',
        color: '#10b981',
        marginBottom: '0.5rem'
      }}>
        SALE GESLOTEN! 🎉
      </h3>
      <p style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: 'rgba(255, 255, 255, 0.7)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        Je hebt de objectie succesvol behandeld en de sale gesloten!
      </p>
    </div>
  )
}
