// src/modules/public-intake/components/IntakePhase3.jsx
import React, { useState } from 'react'
import ExperienceFlow from './phase3/ExperienceFlow'
import CurrentTrainingFlow from './phase3/CurrentTrainingFlow'
import PracticalFlow from './phase3/PracticalFlow'
import FocusFlow from './phase3/FocusFlow'
import CardioFlow from './phase3/CardioFlow'
import LimitationsFlow from './phase3/LimitationsFlow'
import { Q, Hint, NextBtn, SkipBtn, TextField } from './phase1/FlowStep'

// Secties per profiel
// Beginner:   experience → practical → focus → cardio → limitations
// Ervaren:    experience → currentTraining → practical → focus → cardio → limitations
// Geen sport: experience (stopt na reden)

export default function IntakePhase3({ data, onChange, onComplete, personalData, clientEmail, isMobile }) {
  const [section, setSection] = useState(0)
  const [isBeginner, setIsBeginner] = useState(false)
  const [isExperienced, setIsExperienced] = useState(false)

  // Afsluitende open vraag. Hangt aan handleComplete i.p.v. aan een sectie-
  // index: er zijn drie manieren om hier te eindigen (beginner, ervaren, en
  // "ik wil niet trainen"), en via deze route mist geen daarvan hem.
  const [toonSlot, setToonSlot] = useState(false)

  const handleComplete = () => {
    if (!toonSlot) { setToonSlot(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
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
      {toonSlot && (
        <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
          <Q isMobile={isMobile}>
            Vertel alles wat je kwijt wil over jezelf, en wat je graag zou willen doen, bereiken of krijgen in de coaching.
          </Q>
          <Hint isMobile={isMobile}>
            Laatste vraag. Schrijf zoveel als je wil — dit lees ik als eerste.
          </Hint>
          <TextField
            multiline
            placeholder="Alles wat je kwijt wil…"
            value={data.intake_slotwoord || ''}
            onChange={v => onChange({ ...data, intake_slotwoord: v })}
            isMobile={isMobile}
          />
          <NextBtn onClick={handleComplete} label="INTAKE AFRONDEN →" isMobile={isMobile} />
          <SkipBtn onClick={handleComplete} label="Overslaan en afronden" isMobile={isMobile} />
        </div>
      )}

      {!toonSlot && (<>

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

      </>)}
    </div>
  )
}
