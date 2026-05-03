// src/modules/sales/components/ObjectieTrainer.jsx
// Objectie Trainer - Interactieve objectie handling oefening
// Met personages, context en flow-based training

import { useState } from 'react'
import { Shield, RotateCcw } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'

// Data
import { getAllPersonages } from '../data/personages'
import { OBJECTIE_FLOWS } from '../data/objectieFlows'

// Components
import PersonageSelector from './objectie-trainer/PersonageSelector'
import ContextRecap from './objectie-trainer/ContextRecap'
import ObjectieFlow from './objectie-trainer/ObjectieFlow'

export default function ObjectieTrainer({ db, isMobile }) {
  const [phase, setPhase] = useState('select') // 'select', 'training', 'complete'
  const [selectedPersonage, setSelectedPersonage] = useState(null)
  const [objectieFlow, setObjectieFlow] = useState(null)

  const personages = getAllPersonages()

  const handlePersonageSelect = (personage) => {
    setSelectedPersonage(personage)
    setObjectieFlow(OBJECTIE_FLOWS[personage.primaryObjectie])
    setPhase('training')
  }

  const handleComplete = () => {
    setPhase('complete')
  }

  const handleReset = () => {
    setSelectedPersonage(null)
    setObjectieFlow(null)
    setPhase('select')
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '1.5rem' : '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: '900',
          background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <Shield size={isMobile ? 28 : 32} style={{ color: SALES_THEME.primary }} />
          Objectie Trainer
        </h2>
        <p style={{
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontWeight: '500'
        }}>
          Oefen objecties met realistische scenario's
        </p>

        {/* Reset Button (when in training) */}
        {phase !== 'select' && (
          <button
            onClick={handleReset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = SALES_THEME.border
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <RotateCcw size={14} />
            Andere Lead Kiezen
          </button>
        )}
      </div>

      {/* Phase: Select Personage */}
      {phase === 'select' && (
        <PersonageSelector
          personages={personages}
          onSelect={handlePersonageSelect}
          isMobile={isMobile}
        />
      )}

      {/* Phase: Training */}
      {phase === 'training' && selectedPersonage && objectieFlow && (
        <div>
          {/* Context Recap */}
          <ContextRecap
            personage={selectedPersonage}
            isMobile={isMobile}
          />

          {/* Objectie Info */}
          <div style={{
            background: `${SALES_THEME.background}`,
            border: `1px solid ${SALES_THEME.border}`,
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.25rem',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Objectie van {selectedPersonage.naam}
            </div>
            <div style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: SALES_THEME.primary
            }}>
              {objectieFlow.emoji} "{objectieFlow.objectie}"
            </div>
          </div>

          {/* Flow Component */}
          <ObjectieFlow
            personage={selectedPersonage}
            objectieFlow={objectieFlow}
            onComplete={handleComplete}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Phase: Complete */}
      {phase === 'complete' && (
        <CompletionScreen
          personage={selectedPersonage}
          objectieFlow={objectieFlow}
          onReset={handleReset}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// Completion Screen
function CompletionScreen({ personage, objectieFlow, onReset, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${SALES_THEME.border}`,
      borderRadius: '12px',
      padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '1rem'
      }}>
        🎉
      </div>

      <h3 style={{
        fontSize: isMobile ? '1.5rem' : '1.75rem',
        fontWeight: '900',
        color: '#10b981',
        marginBottom: '0.75rem'
      }}>
        Training Compleet!
      </h3>

      <p style={{
        fontSize: isMobile ? '0.875rem' : '0.95rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '2rem',
        maxWidth: '500px',
        margin: '0 auto 2rem'
      }}>
        Je hebt succesvol de "{objectieFlow.label}" objectie van {personage.naam} behandeld en de sale gesloten!
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          emoji="🎯"
          label="Objectie"
          value={objectieFlow.label}
          isMobile={isMobile}
        />
        <StatCard
          emoji="💪"
          label="Lead"
          value={personage.naam}
          isMobile={isMobile}
        />
        <StatCard
          emoji="✅"
          label="Result"
          value="Sale Gesloten"
          isMobile={isMobile}
        />
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onReset}
          style={{
            padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
            background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: '700',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RotateCcw size={18} />
          Oefen Andere Objectie
        </button>
      </div>
    </div>
  )
}

// Stat Card
function StatCard({ emoji, label, value, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '1rem' : '1.25rem',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px'
    }}>
      <div style={{
        fontSize: '1.5rem',
        marginBottom: '0.5rem'
      }}>
        {emoji}
      </div>
      <div style={{
        fontSize: isMobile ? '0.7rem' : '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.25rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: '700',
        color: '#fff'
      }}>
        {value}
      </div>
    </div>
  )
}
