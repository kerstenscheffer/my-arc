// src/modules/client-journey/components/calls/IntakeWorkoutFlow.jsx
// Flow-intro stap 0 voor het Training onderwerp
import React, { useRef, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { C } from './IntakeCallHelpers'
import { FlowQuestion, DeliveryPicker, FlowNav } from './IntakeFlowSlide'

const HERO = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'

const SPLIT_LABELS = {
  push_pull_legs: 'PPL', upper_lower: 'Upper/Lower',
  full_body: 'Full Body', bro_split: 'Bro Split', no_preference: 'Geen voorkeur'
}
const EXP_LABELS = { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }
const LOC_LABELS = { gym: 'Sportschool', home: 'Thuis', both: 'Beide' }

const QUESTIONS = [
  {
    id: 'workout_wat',
    question: 'Wat wil je bereiken met training?',
    suggestions: [
      'Spiermassa opbouwen', 'Sterker worden', 'Afvallen',
      'Fitter worden', 'Conditie verbeteren', 'Body recomp',
      'Meer energie', 'Gezonder worden', 'Functioneler bewegen'
    ]
  },
  {
    id: 'workout_veranderen',
    question: 'Wat denk je dat er moet veranderen in je training?',
    suggestions: [
      'Vaker trainen', 'Beter schema volgen', 'Meer progressie bijhouden',
      'Oefeningen leren uitvoeren', 'Consistenter zijn',
      'Minder blessuregevoelig', 'Cardio toevoegen',
      'Meer structuur', 'Betere warming-up', 'Juiste gewichten'
    ]
  },
  {
    id: 'workout_nodig',
    question: 'Wat heb je nodig om dat vol te houden?',
    suggestions: [
      'Duidelijk trainingsschema', 'Uitleg bij oefeningen',
      'Video\'s bij elke oefening', 'Progressie kunnen bijhouden',
      'Flexibel schema', 'Korte sessies', 'Thuistraining optie',
      'Accountability', 'Iemand die meekijkt', 'Aanpassingen bij blessure'
    ]
  },
  {
    id: 'workout_waarom_werkt',
    question: 'Waarom denk je dat die aanpak werkt voor jou?',
    suggestions: [
      'Ik train al een tijdje maar mis richting',
      'Ik ben beginner en wil het goed leren',
      'Structuur helpt mij enorm',
      'Ik reageer goed op progressie zien',
      'Ik heb een schema nodig anders doe ik niks',
      'Video\'s helpen me techniek leren',
      'Flexibiliteit is key voor mijn schema'
    ]
  },
  {
    id: 'workout_tevreden',
    question: 'Als ik dit trainingsplan voor je opzet — zou je dan tevreden zijn?',
    suggestions: [
      'Ja, dit is precies wat ik nodig heb',
      'Ja, als de oefeningen uitgelegd zijn',
      'Ja, mits ik het kan aanpassen',
      'Ik wil eerst zien hoe het eruit ziet',
      'Ik twijfel nog over...'
    ]
  }
]

const DELIVERY_OPTIONS = [
  'Trainingsschema op maat maken',
  'Schema aanpassen op blessures',
  'Cardio plan toevoegen',
  'Oefeningen met video\'s koppelen',
  'Progressie tracking instellen',
  'Thuistraining schema maken'
]

export default function IntakeWorkoutFlow({ cd, wp, stepNotes, setStepNotes, stepActions, setStepActions, isMobile, onDone }) {
  const history = useRef([])
  const [flowStep, setFlowStep] = useState('workout_wat')

  const go = (next) => { history.current.push(flowStep); setFlowStep(next) }
  const back = () => { if (history.current.length > 0) setFlowStep(history.current.pop()) }

  const flowNotes = typeof stepNotes.workout === 'object' && stepNotes.workout !== null ? stepNotes.workout : {}
  const updateNote = (id, val) => setStepNotes(p => ({ ...p, workout: { ...flowNotes, [id]: val } }))
  const deliveryVal = stepActions.workout_delivery || ''
  const setDelivery = (v) => setStepActions(p => ({ ...p, workout_delivery: v }))

  const getContext = (id) => {
    const exp = wp?.experience_level || wp?.default_experience_level
    const split = wp?.split_preference
    const loc = wp?.training_location
    const freq = cd.workout_days_per_week || wp?.training_frequency
    const time = wp?.time_per_session
    const cardio = wp?.cardio_interest
    const injuries = wp?.injuries
    const avoided = wp?.avoided_exercises

    switch (id) {
      case 'workout_wat':
        return [
          exp && { label: 'NIVEAU', value: EXP_LABELS[exp] || exp },
          split && { label: 'SPLIT', value: SPLIT_LABELS[split] || split },
          freq && { label: 'SESSIES', value: `${freq}x per week` },
        ].filter(Boolean)
      case 'workout_veranderen':
        return [
          injuries && injuries !== 'Nee' && injuries !== 'no' && { label: 'BLESSURE', value: injuries },
          avoided && avoided.length > 0 && { label: 'VERMIJDEN', value: Array.isArray(avoided) ? avoided.join(', ') : avoided },
        ].filter(Boolean)
      case 'workout_nodig':
        return [
          loc && { label: 'LOCATIE', value: LOC_LABELS[loc] || loc },
          time && { label: 'TIJD', value: `${time} min/sessie` },
          wp?.gym_name && { label: 'SPORTSCHOOL', value: wp.gym_name },
        ].filter(Boolean)
      case 'workout_waarom_werkt':
        return [
          wp?.training_willingness && { label: 'MOTIVATIE', value: { starting: 'Wil beginnen', already: 'Traint al', no: 'Twijfelt' }[wp.training_willingness] || wp.training_willingness },
          wp?.training_focus && { label: 'FOCUS', value: Array.isArray(wp.training_focus) ? wp.training_focus.join(', ') : wp.training_focus },
        ].filter(Boolean)
      case 'workout_tevreden':
        return [
          cardio && { label: 'CARDIO', value: { yes: 'Wil cardio', maybe: 'Misschien', no: 'Geen cardio' }[cardio] || cardio },
          wp?.cardio_frequency && { label: 'CARDIO FREQ', value: `${wp.cardio_frequency}x/week` },
        ].filter(Boolean)
      default: return []
    }
  }

  const FLOW_ORDER = ['workout_wat', 'workout_veranderen', 'workout_nodig', 'workout_waarom_werkt', 'workout_tevreden', 'delivery']
  const currentIdx = FLOW_ORDER.indexOf(flowStep)

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Dumbbell size={14} color={C.blue} />
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.08em' }}>TRAINING — GESPREK</span>
        </div>
        <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', display: 'flex', gap: '0.2rem' }}>
          {FLOW_ORDER.map((s, i) => (
            <div key={s} style={{
              width: i === currentIdx ? '12px' : '4px', height: '4px', borderRadius: '2px',
              background: i < currentIdx ? C.blue : i === currentIdx ? C.blue : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease'
            }} />
          ))}
        </div>
      </div>

      {FLOW_ORDER.slice(0, 5).map(id => {
        if (flowStep !== id) return null
        const q = QUESTIONS.find(q => q.id === id)
        return (
          <div key={id}>
            <FlowQuestion
              question={q.question}
              contextItems={getContext(id)}
              suggestions={q.suggestions}
              value={flowNotes[id] || ''}
              onChange={v => updateNote(id, v)}
              isMobile={isMobile}
            />
            <FlowNav
              onBack={currentIdx > 0 ? back : null}
              onNext={() => go(FLOW_ORDER[currentIdx + 1])}
              nextLabel={currentIdx === 4 ? 'WAT GA IK DOEN →' : 'VOLGENDE VRAAG'}
              isMobile={isMobile}
            />
          </div>
        )
      })}

      {flowStep === 'delivery' && (
        <div>
          <div style={{ padding: '0.75rem 0.75rem 0.25rem' }}>
            <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: C.text, marginBottom: '0.25rem' }}>
              Wat ga ik voor jou doen op trainingsgebied?
            </div>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: C.text25, marginBottom: '0.5rem' }}>
              Selecteer wat je gaat leveren
            </div>
          </div>
          <DeliveryPicker options={DELIVERY_OPTIONS} value={deliveryVal} onChange={setDelivery} isMobile={isMobile} />
          <FlowNav
            onBack={back}
            onNext={onDone}
            nextLabel='TRAINING BESPROKEN → OVERZICHT'
            isLast={true}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}
