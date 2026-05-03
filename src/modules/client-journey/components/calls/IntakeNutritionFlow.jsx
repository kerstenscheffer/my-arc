// src/modules/client-journey/components/calls/IntakeNutritionFlow.jsx
// Flow-intro stap 0 voor het Voeding onderwerp
import React, { useRef, useState } from 'react'
import { Utensils } from 'lucide-react'
import { C } from './IntakeCallHelpers'
import { FlowQuestion, DeliveryPicker, FlowNav } from './IntakeFlowSlide'

const HERO = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'

const QUESTIONS = [
  {
    id: 'nutrition_wat',
    question: 'Wat wil je bereiken op het gebied van voeding?',
    suggestions: [
      'Gezonder eten', 'Meer eiwitten', 'Minder koolhydraten',
      'Afvallen via voeding', 'Meer structuur in eten',
      'Leren wat macro\'s zijn', 'Maaltijdprepping leren',
      'Minder snacken', 'Meer groenten', 'Budget-vriendelijk eten'
    ]
  },
  {
    id: 'nutrition_veranderen',
    question: 'Wat denk je zelf dat er op dit gebied moet veranderen?',
    suggestions: [
      'Minder suiker', 'Minder alcohol', 'Meer groenten',
      'Ontbijt niet overslaan', 'Minder eten buiten de deur',
      'Minder snacks', 'Meer water drinken', 'Regelmatiger eten',
      'Minder processed food', 'Betere lunch'
    ]
  },
  {
    id: 'nutrition_nodig',
    question: 'Wat heb je nodig om dat vol te houden?',
    suggestions: [
      'Duidelijk voedingsplan', 'Macro targets weten',
      'Recepten die ik lekker vind', 'Simpele maaltijden',
      'Boodschappenlijst', 'Flexibiliteit in weekenden',
      'Weten wat ik mag eten', 'Weinig kooktijd',
      'Budget houden', 'Geen ingewikkelde recepten'
    ]
  },
  {
    id: 'nutrition_waarom_werkt',
    question: 'Waarom denk je dat die aanpak gaat werken?',
    suggestions: [
      'Ik houd van structuur', 'Eerder geprobeerd maar zonder plan',
      'Ik kook graag', 'Ik wil het begrijpen niet alleen volgen',
      'Simpel werkt voor mij', 'Ik ben consistent als ik een plan heb',
      'Ik reageer goed op vaste routines', 'Flexibiliteit is voor mij key'
    ]
  },
  {
    id: 'nutrition_tevreden',
    question: 'Als ik dit voor je regel — zou je dan tevreden zijn?',
    suggestions: [
      'Ja, dit klinkt perfect',
      'Ja, als het simpel te volgen is',
      'Ja, mits er ruimte is voor aanpassingen',
      'Ik wil eerst zien hoe het eruit ziet',
      'Ik twijfel nog over...'
    ]
  }
]

const DELIVERY_OPTIONS = [
  'Voedingsschema op maat maken',
  'Macro targets instellen',
  'Flexibel eetplan (geen schema)',
  'Boodschappenlijst meegeven',
  'Supplement advies geven',
  'Cheat meal strategie bespreken'
]

export default function IntakeNutritionFlow({ cd, np, stepNotes, setStepNotes, stepActions, setStepActions, isMobile, onDone }) {
  const history = useRef([])
  const [flowStep, setFlowStep] = useState('nutrition_wat')

  const go = (next) => { history.current.push(flowStep); setFlowStep(next) }
  const back = () => { if (history.current.length > 0) setFlowStep(history.current.pop()) }

  const flowNotes = typeof stepNotes.nutrition === 'object' && stepNotes.nutrition !== null ? stepNotes.nutrition : {}
  const updateNote = (id, val) => setStepNotes(p => ({ ...p, nutrition: { ...flowNotes, [id]: val } }))
  const deliveryVal = stepActions.nutrition_delivery || ''
  const setDelivery = (v) => setStepActions(p => ({ ...p, nutrition_delivery: v }))

  const getContext = (id) => {
    const diet = np?.allergens?.diet_preference
    const allergens = np?.allergens?.selected_allergens || []
    const guidance = np?.guidance_level?.guidance_level
    const budget = np?.life_context?.weekly_budget
    const meals = np?.meal_schedule?.num_meals
    const cheat = np?.cheat_meals?.frequency
    const supps = np?.supplement_preferences?.openness

    switch (id) {
      case 'nutrition_wat':
        return [
          diet && diet !== 'geen' && { label: 'DIEET', value: { vegetarisch: 'Vegetarisch', veganistisch: 'Veganistisch', halal: 'Halal', pescotarisch: 'Pescotarisch' }[diet] || diet },
          allergens.length > 0 && { label: 'ALLERGIE', value: allergens.join(', ') },
          guidance && { label: 'STIJL', value: { strict: 'Alles uitgestippeld', flexible: 'Plan met targets', free: 'Alleen richtlijnen' }[guidance] || guidance },
        ].filter(Boolean)
      case 'nutrition_veranderen':
        return [
          np?.wishes?.niet_lekker?.length > 0 && { label: 'NIET LEKKER', value: np.wishes.niet_lekker.join(', ') },
          np?.practical_info?.plan_gevolgd && { label: 'PLAN EERDER', value: { ja: 'Ja', nee: 'Nee' }[np.practical_info.plan_gevolgd] || np.practical_info.plan_gevolgd },
          cheat && { label: 'CHEAT', value: { nooit: 'Geen cheat meals', '1x_week': '1x per week', weekend: 'Weekend flexibel', als_nodig: 'Als nodig' }[cheat] || cheat },
        ].filter(Boolean)
      case 'nutrition_nodig':
        return [
          meals && { label: 'MAALTIJDEN', value: `${meals}x per dag` },
          budget && { label: 'BUDGET', value: `€${budget}/week` },
          np?.life_context?.cooking_preference && { label: 'KOKEN', value: { graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk' }[np.life_context.cooking_preference] || np.life_context.cooking_preference },
          cd.cooking_time && { label: 'KOOKTIJD', value: `${cd.cooking_time} min` },
        ].filter(Boolean)
      case 'nutrition_waarom_werkt':
        return [
          np?.practical_info?.macros_kennis && { label: 'MACRO KENNIS', value: { ja: 'Kent macro\'s', beetje: 'Beetje kennis', nee: 'Geen kennis' }[np.practical_info.macros_kennis] || np.practical_info.macros_kennis },
          np?.practical_info?.calorieen_geteld && { label: 'CALORIEËN', value: { ja: 'Bijgehouden', soms: 'Soms', nee: 'Nooit' }[np.practical_info.calorieen_geteld] || np.practical_info.calorieen_geteld },
          np?.wishes?.wat_werkte && { label: 'WAT WERKTE', value: { ja: 'Weet wat werkt', beetje: 'Een beetje', nee: 'Weet het niet' }[np.wishes.wat_werkte] || np.wishes.wat_werkte },
        ].filter(Boolean)
      case 'nutrition_tevreden':
        return [
          supps && { label: 'SUPPLEMENTEN', value: { ja_graag: 'Wil supplementen', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[supps] || supps },
        ].filter(Boolean)
      default: return []
    }
  }

  const FLOW_ORDER = ['nutrition_wat', 'nutrition_veranderen', 'nutrition_nodig', 'nutrition_waarom_werkt', 'nutrition_tevreden', 'delivery']
  const currentIdx = FLOW_ORDER.indexOf(flowStep)

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Utensils size={14} color={C.green} />
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em' }}>VOEDING — GESPREK</span>
        </div>
        <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', display: 'flex', gap: '0.2rem' }}>
          {FLOW_ORDER.map((s, i) => (
            <div key={s} style={{
              width: i === currentIdx ? '12px' : '4px', height: '4px', borderRadius: '2px',
              background: i < currentIdx ? C.green : i === currentIdx ? C.green : 'rgba(255,255,255,0.2)',
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
              Wat ga ik voor jou doen op voedingsgebied?
            </div>
            <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: C.text25, marginBottom: '0.5rem' }}>
              Selecteer wat je gaat leveren
            </div>
          </div>
          <DeliveryPicker options={DELIVERY_OPTIONS} value={deliveryVal} onChange={setDelivery} isMobile={isMobile} />
          <FlowNav
            onBack={back}
            onNext={onDone}
            nextLabel='VOEDING BESPROKEN → OVERZICHT'
            isLast={true}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}
