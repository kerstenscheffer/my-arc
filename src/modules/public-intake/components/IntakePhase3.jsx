// src/modules/public-intake/components/IntakePhase3.jsx
import React, { useState } from 'react'
import ExperienceFlow from './phase3/ExperienceFlow'
import CurrentTrainingFlow from './phase3/CurrentTrainingFlow'
import PracticalFlow from './phase3/PracticalFlow'
import FocusFlow from './phase3/FocusFlow'
import CardioFlow from './phase3/CardioFlow'
import LimitationsFlow from './phase3/LimitationsFlow'

// Secties per profiel
// Beginner:   experience → practical → focus → cardio → limitations
// Ervaren:    experience → currentTraining → practical → focus → cardio → limitations
// Geen sport: experience (stopt na reden)

export default function IntakePhase3({ data, onChange, onComplete, personalData, clientEmail, isMobile }) {
  const [section, setSection] = useState(0)
  const [isBeginner, setIsBeginner] = useState(false)
  const [isExperienced, setIsExperienced] = useState(false)

  const handleComplete = () => {
    console.log('🏁 Phase3 handleComplete — data:', data)
    onComplete({
      ...data,
      days_per_week: data.days_per_week || personalData?.preferred_training_days?.length || null,
      training_time: data.training_time || personalData?.training_time || null,
      // Samenvoeg pills + open tekst in avoided_exercises
      avoided_exercises: [
        ...(data.avoided_exercises_pills || []),
        ...(data.avoided_exercises ? [data.avoided_exercises] : [])
      ].join(', ') || null,
    })
  }

  // ExperienceFlow geeft 'beginner', 'intermediate', 'advanced' terug via onNext(level)
  const handleExperienceNext = (level) => {
    console.log('✅ Phase3 experience done — level:', level)
    const beginner = level === 'beginner' || level === 'starting'
    setIsBeginner(beginner)
    setIsExperienced(!beginner)
    setSection(1)
  }

  const goBack = () => setSection(s => Math.max(0, s - 1))
  const goNext = () => setSection(s => s + 1)

  const sharedProps = { data, onChange, isMobile }

  // Beginner flow: 0=experience, 1=practical, 2=focus, 3=cardio, 4=limitations
  // Ervaren flow:  0=experience, 1=currentTraining, 2=practical, 3=focus, 4=cardio, 5=limitations

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
      {personalData?.motivation && (
        <div style={{
          marginBottom: '1.25rem',
          padding: isMobile ? '0.65rem 0.75rem' : '0.75rem 1rem',
          background: 'rgba(255,215,0,0.02)',
          borderLeft: '2px solid rgba(255,215,0,0.35)',
          borderRadius: '0 8px 8px 0'
        }}>
          <div style={{ fontSize: '0.42rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
            WAAROM JIJ DIT DOET
          </div>
          <div style={{
            fontSize: isMobile ? '0.62rem' : '0.65rem', color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic', lineHeight: 1.5, fontWeight: 500,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          }}>
            "{personalData.motivation}"
          </div>
        </div>
      )}

      {/* SECTION 0 — Altijd: willingness + experience */}
      {section === 0 && (
        <ExperienceFlow
          {...sharedProps}
          onNext={handleExperienceNext}
          onNoTraining={handleComplete}
          onBack={undefined}
        />
      )}

      {/* BEGINNER FLOW */}
      {isBeginner && section === 1 && (
        <PracticalFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={true} />
      )}
      {isBeginner && section === 2 && (
        <FocusFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={true} />
      )}
      {isBeginner && section === 3 && (
        <CardioFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={true} />
      )}
      {isBeginner && section === 4 && (
        <LimitationsFlow {...sharedProps} onNext={handleComplete} onBack={goBack} />
      )}

      {/* ERVAREN FLOW */}
      {isExperienced && section === 1 && (
        <CurrentTrainingFlow {...sharedProps} onNext={goNext} onBack={goBack} experienceLevel={data.experience_level} />
      )}
      {isExperienced && section === 2 && (
        <PracticalFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={false} />
      )}
      {isExperienced && section === 3 && (
        <FocusFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={false} />
      )}
      {isExperienced && section === 4 && (
        <CardioFlow {...sharedProps} onNext={goNext} onBack={goBack} isBeginner={false} />
      )}
      {isExperienced && section === 5 && (
        <LimitationsFlow {...sharedProps} onNext={handleComplete} onBack={goBack} />
      )}
    </div>
  )
}
