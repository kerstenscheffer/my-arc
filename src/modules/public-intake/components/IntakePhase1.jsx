// src/modules/public-intake/components/IntakePhase1.jsx
// Phase 1 orchestrator — conversational flow
// v3.0 — één vraag tegelijk, alle DB velden intact

import React, { useState } from 'react'
import { FlowProgress } from './phase1/FlowStep'
import BasicsFlow    from './phase1/BasicsFlow'
import BodyFlow      from './phase1/BodyFlow'
import GoalFlow      from './phase1/GoalFlow'
// Nulmeting: staat direct na Doel — de klant heeft net gezegd waar hij heen
// wil, dus dit is het moment om vast te leggen waar hij vandaan komt.
import BaselineFlow  from './phase1/BaselineFlow'
import LifestyleFlow from './phase1/LifestyleFlow'
import HealthFlow    from './phase1/HealthFlow'
import CoachingFlow  from './phase1/CoachingFlow'
import { calculateTDEE, calculateTargetCalories, calculateMacros } from '../services/TDEECalculator'

const SECTIONS = ['Basis', 'Lichaam', 'Doel', 'Nulmeting', 'Levensstijl', 'Gezondheid', 'Coaching']

export default function IntakePhase1({ data, onChange, onComplete, isMobile }) {
  const [sectionIndex, setSectionIndex] = useState(0)

  const goNext = () => setSectionIndex(i => i + 1)
  const goBack = () => setSectionIndex(i => Math.max(0, i - 1))

  const handleComplete = () => {
    console.log('🎯 IntakePhase1 handleComplete aangeroepen, data:', data)
    const age = data.date_of_birth
      ? Math.floor((Date.now() - new Date(data.date_of_birth)) / 31557600000)
      : null

    const tdee = calculateTDEE({
      gender:        data.gender,
      age,
      height:        parseFloat(data.height),
      weight:        parseFloat(data.current_weight),
      activityLevel: data.activity_level
    })

    const effectiveBf = data.current_body_fat && data.current_body_fat_2
      ? Math.round((data.current_body_fat + data.current_body_fat_2) / 2)
      : data.current_body_fat

    const targetCal = calculateTargetCalories({
      tdee,
      goal:           data.primary_goal,
      currentBodyFat: effectiveBf
    })

    const macros = calculateMacros({
      targetCalories: targetCal,
      weight:         parseFloat(data.current_weight),
      goal:           data.primary_goal,
      currentBodyFat: effectiveBf
    })

    // Motivatie tags → leesbare tekst
    if (!data.motivation && data.motivation_tags?.length) {
      const motivationLabels = {
        beter_uitzien:  'Ik wil beter uitzien',
        meer_energie:   'Ik wil meer energie',
        gezonder_leven: 'Ik wil gezonder leven',
        zelfvertrouwen: 'Ik wil meer zelfvertrouwen',
        prestaties:     'Ik wil beter presteren in sport',
      }
      data.motivation = data.motivation_tags.map(t => motivationLabels[t] || t).join('. ')
    }

    const surplus = data.primary_goal === 'recomp' ? 0 : (targetCal - tdee)

    const finalTargetWeight = data.primary_goal === 'recomp' && !data.has_weight_goal
      ? null
      : data.target_weight || null

    let autoTargetBf = data.target_body_fat || null
    if (data.primary_goal === 'recomp' && !autoTargetBf && effectiveBf) {
      autoTargetBf = Math.max(effectiveBf - 5, 10)
    }

    const finalTimeline = data.primary_goal === 'general_fitness'
      ? (data.goal_timeline || 'no_rush')
      : data.primary_goal === 'recomp' ? null : data.goal_timeline

    onComplete({
      ...data,
      age,
      tdee,
      target_calories: targetCal,
      target_protein:  macros?.protein,
      target_carbs:    macros?.carbs,
      target_fat:      macros?.fat,
      surplus,
      target_weight:   finalTargetWeight,
      target_body_fat: autoTargetBf,
      goal_timeline:   finalTimeline,
    })
  }

  const sectionProps = { data, onChange, isMobile, onBack: sectionIndex > 0 ? goBack : undefined }

  return (
    <div>
      <div style={{ padding: isMobile ? '1rem' : '1.25rem' }}>
        {sectionIndex === 0 && <BasicsFlow    {...sectionProps} onNext={goNext} />}
        {sectionIndex === 1 && <BodyFlow      {...sectionProps} onNext={goNext} />}
        {sectionIndex === 2 && <GoalFlow      {...sectionProps} onNext={goNext} />}
        {sectionIndex === 3 && <BaselineFlow  {...sectionProps} onNext={goNext} />}
        {sectionIndex === 4 && <LifestyleFlow {...sectionProps} onNext={goNext} />}
        {sectionIndex === 5 && <HealthFlow    {...sectionProps} onNext={goNext} />}
        {sectionIndex === 6 && <CoachingFlow  {...sectionProps} onNext={handleComplete} />}
      </div>
    </div>
  )
}
