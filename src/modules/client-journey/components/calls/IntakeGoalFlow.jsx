// src/modules/client-journey/components/calls/IntakeGoalFlow.jsx
// v4 — Vraag 1 concreet per intake doel + switch optie
import React, { useRef, useState } from 'react'
import { Target, RefreshCw } from 'lucide-react'
import { C } from './IntakeCallHelpers'
import { FlowQuestion, DeliveryPicker, FlowNav } from './IntakeFlowSlide'
import IntakeMaaltijdContext from './IntakeMaaltijdContext'

const HERO = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'

const GOAL_LABELS = {
  fat_loss: 'Afvallen', muscle_gain: 'Spieropbouw',
  recomp: 'Body Recomp', general_fitness: 'Fitter worden'
}

// Sub-label mappings
const ONTBIJT_SUBS = {
  brood_kaas:'Brood+kaas', brood_vlees:'Brood+vlees', brood_pindakaas:'Pindakaas', brood_choco:'Chocopasta',
  brood_ei:'Ei op brood', havermout_fruit:'Havermout+fruit', havermout_noten:'Havermout+noten',
  kwark_fruit:'Kwark+fruit', griekse_yoghurt:'Griekse yoghurt', skyr:'Skyr', smoothie_bowl:'Smoothie bowl',
  gebakken:'Gebakken ei', eieren_scrambled:'Scrambled eggs', omelet:'Omelet', eieren_gekookt:'Gekookt ei',
  roerei_toast:'Roerei op toast', fruit_vers:'Vers fruit', smoothie:'Smoothie', fruit_yoghurt:'Fruit+yoghurt',
  muesli:'Muesli', brood_toast:'Toast avocado'
}
const LUNCH_SUBS = {
  brood_kaas:'Brood+kaas', brood_vlees:'Brood+vlees', lunch_wrap_kip:'Wrap kip', lunch_wrap_groenten:'Wrap groenten',
  lunch_tosti:'Tosti', broodje_shoarma:'Shoarma', salade_kip:'Salade kip', salade_tonijn:'Salade tonijn',
  salade_ei:'Salade ei', soep:'Soep', soep_brood:'Soep+brood', lunch_rijst:'Rijst', lunch_pasta:'Pasta',
  lunch_wok:'Wok', lunch_noodles:'Noodles', snack_noten:'Noten', snack_fruit:'Fruit',
  snack_reep:'Proteïnereep', snack_yoghurt:'Yoghurt', snack_cracker:'Crackers'
}
const DINER_SUBS = {
  rijst_kip:'Rijst+kip', rijst_rund:'Rijst+rund', rijst_zalm:'Rijst+zalm', rijst_groenten:'Rijst+groenten',
  nasi:'Nasi goreng', bolognese:'Bolognese', carbonara:'Carbonara', pasta_kip:'Pasta+kip',
  pasta_zalm:'Pasta+zalm', bami:'Bami goreng', noodles:'Noodles', aard_kip:'Aardappel+kip',
  aard_vlees:'Aardappel+vlees', aard_vis:'Aardappel+vis', stamppot:'Stamppot', friet:'Friet',
  soep_kip:'Kippensoep', soep_groente:'Groentesoep', soep_tomaat:'Tomatensoep', grote_salade:'Grote salade',
  pizza:'Pizza', shoarma:'Shoarma', hamburger:'Hamburger', sushi:'Sushi', chinees:'Chinees', indiaas:'Indiaas'
}

const mapSubs = (subs, map) => (subs || []).map(s => map[s] || s).join(', ')

// Helper: haal maaltijden uit np.wishes
const getMaaltijden = (np) => {
  const wishes = np?.wishes || {}
  const items = []
  if (wishes.ontbijt_categories?.length) items.push(...wishes.ontbijt_categories.slice(0, 2))
  if (wishes.lunch_categories?.length) items.push(...wishes.lunch_categories.slice(0, 2))
  if (wishes.diner_categories?.length) items.push(...wishes.diner_categories.slice(0, 2))
  return items
}

const ROUTES = {
  afvallen: ['doel', 'afvallen_richting', 'afvallen_voeding', 'afvallen_voeding_wensen', 'afvallen_training', 'afvallen_leefstijl', 'blokkades', 'zelf_overtuigd', 'delivery'],
  spieren:  ['doel', 'spieren_richting',  'spieren_training',  'spieren_voeding',  'spieren_voeding_wensen', 'spieren_herstel', 'blokkades', 'zelf_overtuigd', 'delivery'],
  recomp:   ['doel', 'recomp_focus',      'recomp_voeding',    'recomp_voeding_wensen', 'recomp_training', 'recomp_herstel', 'blokkades', 'zelf_overtuigd', 'delivery'],
  fitness:  ['doel', 'fitness_concreet',  'fitness_leefstijl', 'fitness_training', 'fitness_voeding', 'fitness_voeding_wensen', 'blokkades', 'zelf_overtuigd', 'delivery'],
}

const GOAL_TO_ROUTE = {
  fat_loss: 'afvallen', muscle_gain: 'spieren', recomp: 'recomp', general_fitness: 'fitness'
}

const detectRoute = (value, cd) => {
  const v = (value || '').toLowerCase()
  // Recomp eerst — bevat ook "spieren" en "afvallen"
  if (v.includes('recomp') || v.includes('strakk') || v.includes('definitie') || v.includes('samenstelling') ||
      v.includes('tegelijk') || v.includes('behouden terwijl') || v.includes('zonder massa')) return 'recomp'
  // Spieren
  if (v.includes('spier') || v.includes('massa') || v.includes('opbouw') || v.includes('bulk') ||
      v.includes('groter') || v.includes('gespierd') || v.includes('voller')) return 'spieren'
  // Afvallen — expliciete afval-woorden, niet fitness
  if (v.includes('afvall') || v.includes('kwijt') || v.includes('cutt') ||
      v.includes('verliez') || v.includes('minder vet') || v.includes('passen in') ||
      v.includes('lichter') || v.includes('vetpercentage')) return 'afvallen'
  // Fitness — alleen als geen van bovenstaande
  if (v.includes('fit') || v.includes('energie') || v.includes('gezond') ||
      v.includes('conditie') || v.includes('vel') || v.includes('sterk')) return 'fitness'
  // Fallback op intake
  return GOAL_TO_ROUTE[cd.primary_goal] || 'fitness'
}

// Switch labels
const SWITCH_OPTIONS = [
  { route: 'afvallen', label: 'Toch afvallen als focus' },
  { route: 'spieren',  label: 'Toch spieropbouw als focus' },
  { route: 'recomp',   label: 'Toch recomp als focus' },
  { route: 'fitness',  label: 'Toch fitter worden als focus' },
]

const STEPS = {

  // ── STAP 1 — Concreet maken per intake doel ──
  doel: {
    question: (cd) => {
      const goal = cd.primary_goal
      if (goal === 'fat_loss')        return 'Je hebt aangegeven dat je wil afvallen. Wat bedoel je daar precies mee?'
      if (goal === 'muscle_gain')     return 'Je hebt aangegeven dat je spieren wil opbouwen. Wat bedoel je daar precies mee?'
      if (goal === 'recomp')          return 'Je hebt body recomp ingevuld. Wat bedoel je daar precies mee?'
      if (goal === 'general_fitness') return 'Je wil fitter worden. Wat bedoel je daar precies mee?'
      return 'Wat wil je bereiken? Vertel het in je eigen woorden.'
    },
    suggestions: (cd) => {
      const goal = cd.primary_goal
      if (goal === 'fat_loss') return [
        'Zichtbaar afvallen, minder vet',
        cd.current_weight && cd.target_weight ? `${Math.abs(Number(cd.current_weight) - Number(cd.target_weight))} kg kwijtraken` : 'Een bepaald gewicht halen',
        'Buikvet kwijtraken specifiek',
        'Strakker worden in het algemeen',
        'Passen in kleinere kleding',
        'Me lichter en fitter voelen',
        'Minder zwaar, meer energie',
      ].filter(Boolean)
      if (goal === 'muscle_gain') return [
        'Groter en voller worden',
        'Lean bulk — zo weinig mogelijk vet erbij',
        'Sterker worden met meer massa',
        'Van skinny naar gespierd',
        'Specifieke spiergroepen opbouwen',
        'Meer volume in schouders/borst/benen',
        'Serieuze massa opbouwen',
      ]
      if (goal === 'recomp') return [
        'Strakker worden, minder vet zichtbaar',
        'Spieren behouden terwijl ik afval',
        'Écht tegelijk spieren bouwen én afvallen',
        'Betere lichaamssamenstelling',
        'Meer definitie zien in mijn lichaam',
        'Vet verliezen zonder massa te verliezen',
        'Van zacht naar gespierd en droog',
      ]
      if (goal === 'general_fitness') return [
        'Meer energie overdag',
        'Betere conditie, niet snel buiten adem',
        'Sterker worden in dagelijks leven',
        'Minder buikvet en actiever zijn',
        'Beter slapen en minder stress',
        'Gewoon lekkerder in mijn vel zitten',
        'Gezonder leven als geheel',
      ]
      return [
        'Afvallen', 'Spieren opbouwen', 'Strakker worden',
        'Meer energie', 'Sterker worden', 'Fitter worden',
        'Body recomp', 'Gezonder leven',
      ]
    },
    context: (cd) => [
      cd.primary_goal && { label: 'INTAKE DOEL', value: GOAL_LABELS[cd.primary_goal] || cd.primary_goal },
      cd.current_weight && cd.target_weight && { label: 'GEWICHT DOEL', value: `${cd.current_weight} → ${cd.target_weight} kg` },
      cd.goal_urgency && { label: 'URGENTIE', value: `${cd.goal_urgency}/10` },
    ].filter(Boolean),
  },

  // ── AFVALLEN ──
  afvallen_richting: {
    question: () => 'Hoeveel wil je afvallen en hoe snel wil je dat aanpakken?',
    suggestions: (cd) => [
      'Zo snel mogelijk, ik ben er klaar voor',
      'Rustig en duurzaam, liever langzamer',
      cd.current_weight && cd.target_weight ? `${Math.abs(Number(cd.current_weight) - Number(cd.target_weight))} kg totaal kwijt` : '5-10 kg kwijt',
      'Voor een specifiek moment of datum',
      'Gewoon beginnen, tempo later bepalen',
    ].filter(Boolean),
    context: (cd) => [
      cd.current_weight && { label: 'HUIDIG', value: `${cd.current_weight} kg` },
      cd.target_weight && { label: 'DOEL', value: `${cd.target_weight} kg` },
      cd.goal_urgency && { label: 'URGENTIE', value: `${cd.goal_urgency}/10` },
    ].filter(Boolean),
  },

  afvallen_voeding: {
    question: () => 'Wat denk je zelf dat er moet veranderen in je voeding om af te vallen?',
    suggestions: () => [
      'Minder eten overall',
      'Minder suiker en snacks',
      'Meer eiwitten eten',
      'Minder eten buiten de deur',
      'Geen of minder alcohol',
      'Maaltijden plannen en preppen',
      'Weten wat ik eigenlijk eet',
      'Niet meer eten s\'avonds',
    ],
    context: (cd) => [
      cd.cooking_time && { label: 'KOOKTIJD', value: `${cd.cooking_time} min` },
      cd.diet_type && cd.diet_type !== 'geen' && { label: 'DIEET', value: cd.diet_type },
      cd.stress_level && parseInt(cd.stress_level) >= 7 && { label: '⚠ STRESS', value: `${cd.stress_level}/10 — let op emotie-eten` },
    ].filter(Boolean),
  },

  afvallen_training: {
    question: () => 'Hoe staat training erbij? Wil je dat toevoegen of aanpassen?',
    suggestions: () => [
      'Ik train al — wil dit combineren met afvallen',
      'Ik wil beginnen met trainen',
      'Liever alleen via voeding aanpakken',
      'Meer cardio doen',
      'Krachttraining toevoegen voor betere vetverbranding',
      'Meer bewegen in dagelijks leven',
      'Weet niet wat het beste werkt voor mij',
    ],
    context: (cd) => [
      cd.workout_days_per_week && { label: 'TRAINT', value: `${cd.workout_days_per_week}x/week` },
      cd.activity_level && { label: 'ACTIVITEIT', value: { sedentary: 'Zittend', lightly_active: 'Licht actief', moderately_active: 'Matig actief', very_active: 'Zeer actief' }[cd.activity_level] || cd.activity_level },
    ].filter(Boolean),
  },

  afvallen_leefstijl: {
    question: () => 'Zijn er dingen in je leefstijl die het moeilijk maken? Slaap, stress, sociale situaties?',
    suggestions: () => [
      'Ik slaap slecht, weinig energie',
      'Hoog stressniveau — eet dan meer',
      'Sociale druk: etentjes, alcohol, uiteten',
      'Onregelmatige werktijden',
      'Weinig tijd om te koken',
      'Val altijd terug in oude gewoontes',
      'Weekenden zijn mijn probleem',
      'Eigenlijk loopt het leefstijl goed',
    ],
    context: (cd) => [
      cd.sleep_hours && { label: 'SLAAP', value: `${cd.sleep_hours} uur` },
      cd.stress_level && { label: 'STRESS', value: `${cd.stress_level}/10` },
      cd.alcohol_frequency && { label: 'ALCOHOL', value: cd.alcohol_frequency },
    ].filter(Boolean),
  },

  // ── SPIEREN ──
  spieren_richting: {
    question: () => 'Wil je puur massa opbouwen, of ook tegelijk vet verliezen?',
    suggestions: () => [
      'Puur massa — ik wil groter en zwaarder worden',
      'Lean bulk — massa met zo weinig mogelijk vet',
      'Recomp — spieren én vet tegelijk aanpakken',
      'Eerst bulk, later cutten',
      'Ik weet het nog niet precies',
    ],
    context: (cd) => [
      cd.current_weight && { label: 'HUIDIG', value: `${cd.current_weight} kg` },
      cd.current_body_fat && { label: 'VET%', value: `${cd.current_body_fat}%` },
    ].filter(Boolean),
  },

  spieren_training: {
    question: () => 'Hoe train je nu, en wat denk je dat er moet veranderen om spieren op te bouwen?',
    suggestions: () => [
      'Ik train nog niet — wil beginnen',
      'Ik train maar mis structuur en progressie',
      'Ik train al goed maar kom niet verder',
      'Zwaarder tillen, minder reps',
      'Consistenter worden',
      'Progressie bijhouden',
      'Meer volume per spiergroep toevoegen',
    ],
    context: (cd) => [
      cd.workout_days_per_week && { label: 'SESSIES', value: `${cd.workout_days_per_week}x/week` },
      cd.training_experience && { label: 'NIVEAU', value: { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }[cd.training_experience] || cd.training_experience },
    ].filter(Boolean),
  },

  spieren_voeding: {
    question: () => 'Wat moet er veranderen in je voeding om spieren op te bouwen?',
    suggestions: () => [
      'Meer eten overall — surplus opbouwen',
      'Meer eiwitten per dag',
      'Geen maaltijden meer overslaan',
      'Beter timen rondom training',
      'Weten hoeveel ik moet eten',
      'Consistenter eten door de week',
      'Voeding is mijn grootste zwakke punt',
    ],
    context: (cd) => [
      cd.target_calories && { label: 'DOEL KCAL', value: `${cd.target_calories} kcal` },
      cd.cooking_time && { label: 'KOOKTIJD', value: `${cd.cooking_time} min` },
    ].filter(Boolean),
  },

  spieren_herstel: {
    question: () => 'Hoe is je herstel? Slaap en stress spelen een grote rol bij spieropbouw.',
    suggestions: () => [
      'Slaap en herstel lopen prima',
      'Ik slaap te weinig — minder dan 7 uur',
      'Hoog stressniveau, moeilijk te recoveren',
      'Ik rust te weinig tussen trainingen',
      'Ik ben vaak moe na het werk',
      'Herstel is mijn zwakke punt',
      'Ik wil leren over actief herstel',
    ],
    context: (cd) => [
      cd.sleep_hours && { label: 'SLAAP', value: `${cd.sleep_hours} uur` },
      cd.stress_level && { label: 'STRESS', value: `${cd.stress_level}/10` },
    ].filter(Boolean),
  },

  // ── RECOMP ──
  recomp_focus: {
    question: () => 'Recomp is spieren opbouwen én vet verliezen tegelijk. Wat is voor jou het belangrijkste resultaat?',
    suggestions: () => [
      'Strakker worden — minder vet zichtbaar',
      'Meer spieren — ook al val ik niet veel af',
      'Betere verhouding vet/spier overall',
      'Er gewoon beter uitzien',
      'Meer definitie en vorm zien',
      'Beide even belangrijk voor mij',
    ],
    context: (cd) => [
      cd.current_body_fat && { label: 'HUIDIG VET%', value: `${cd.current_body_fat}%` },
      cd.target_body_fat && { label: 'DOEL VET%', value: `${cd.target_body_fat}%` },
    ].filter(Boolean),
  },

  recomp_voeding: {
    question: () => 'Recomp vraagt precieze voeding. Hoe goed ben je daar nu mee bezig?',
    suggestions: () => [
      'Ik eet redelijk maar weet niet of het klopt',
      'Ik tel geen calorieën — wil dat leren',
      'Ik weet wat macro\'s zijn maar doe er weinig mee',
      'Ik eet chaotisch, geen structuur',
      'Ik wil een plan dat ik gewoon kan volgen',
      'Eiwitten zijn mijn zwakke punt',
    ],
    context: (cd) => [
      cd.cooking_time && { label: 'KOOKTIJD', value: `${cd.cooking_time} min` },
      cd.diet_type && cd.diet_type !== 'geen' && { label: 'DIEET', value: cd.diet_type },
    ].filter(Boolean),
  },

  recomp_training: {
    question: () => 'Hoe ziet je training eruit? Recomp werkt het beste met krachttraining.',
    suggestions: () => [
      'Ik train al met gewichten',
      'Ik doe voornamelijk cardio — wil kracht toevoegen',
      'Ik begin net met trainen',
      'Ik wil 3-4x per week trainen',
      'Ik wil een schema dat niet te zwaar is',
      'Ik heb eerder getraind maar ben gestopt',
    ],
    context: (cd) => [
      cd.workout_days_per_week && { label: 'SESSIES', value: `${cd.workout_days_per_week}x/week` },
      cd.training_experience && { label: 'NIVEAU', value: { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }[cd.training_experience] || cd.training_experience },
    ].filter(Boolean),
  },

  recomp_herstel: {
    question: () => 'Recomp vergt geduld en consistent herstel. Hoe is dat bij jou?',
    suggestions: () => [
      'Ik heb geduld — wil het goed doen',
      'Ik wil snel resultaat zien',
      'Slaap is mijn zwakke punt',
      'Stress maakt het moeilijk',
      'Ik heb een druk leven',
      'Herstel en slaap lopen prima',
    ],
    context: (cd) => [
      cd.sleep_hours && { label: 'SLAAP', value: `${cd.sleep_hours} uur` },
      cd.stress_level && { label: 'STRESS', value: `${cd.stress_level}/10` },
    ].filter(Boolean),
  },

  // ── FITNESS ──
  fitness_concreet: {
    question: () => 'Wat betekent fitter worden voor jou concreet? Wat wil je kunnen of voelen?',
    suggestions: () => [
      'Meer energie overdag',
      'Betere conditie — niet snel buiten adem',
      'Sterker worden in dagelijks leven',
      'Minder buikvet zichtbaar',
      'Beter slapen',
      'Minder stress en meer rust',
      'Gewoon lekkerder in mijn vel zitten',
      'Gezonder oud worden',
    ],
    context: (cd) => [
      cd.activity_level && { label: 'ACTIVITEIT', value: { sedentary: 'Zittend', lightly_active: 'Licht actief', moderately_active: 'Matig actief', very_active: 'Zeer actief' }[cd.activity_level] || cd.activity_level },
      cd.stress_level && { label: 'STRESS', value: `${cd.stress_level}/10` },
    ].filter(Boolean),
  },

  fitness_leefstijl: {
    question: () => 'Wat moet er veranderen in je dagelijkse leven om fitter te worden?',
    suggestions: () => [
      'Meer bewegen — minder zitten',
      'Beter en langer slapen',
      'Minder stress',
      'Regelmatiger eten',
      'Minder alcohol',
      'Meer structuur in mijn dag',
      'Meer buiten komen',
      'Vaste gewoontes opbouwen',
    ],
    context: (cd) => [
      cd.sleep_hours && { label: 'SLAAP', value: `${cd.sleep_hours} uur` },
      cd.stress_level && { label: 'STRESS', value: `${cd.stress_level}/10` },
    ].filter(Boolean),
  },

  fitness_training: {
    question: () => 'Wil je training toevoegen, en wat past bij jou?',
    suggestions: () => [
      'Ja — ik wil beginnen met trainen',
      'Ja — ik train al maar wil meer structuur',
      'Wandelen of fietsen is genoeg voor mij',
      'Combinatie van cardio en kracht',
      'Thuistraining — geen sportschool',
      'Sportschool maar weet niet waar te beginnen',
      'Groepslessen of teamsport',
    ],
    context: (cd) => [
      cd.workout_days_per_week && { label: 'SESSIES', value: `${cd.workout_days_per_week}x/week` },
      cd.training_experience && { label: 'NIVEAU', value: { beginner: 'Beginner', intermediate: 'Gevorderd', advanced: 'Expert' }[cd.training_experience] || cd.training_experience },
    ].filter(Boolean),
  },

  fitness_voeding: {
    question: () => 'Wat moet er veranderen in je voeding om fitter te worden?',
    suggestions: () => [
      'Gezonder eten overall',
      'Minder processed food',
      'Meer groenten en fruit',
      'Minder suiker',
      'Meer eiwitten',
      'Regelmatiger eten',
      'Voeding loopt al goed',
    ],
    context: (cd) => [
      cd.cooking_time && { label: 'KOOKTIJD', value: `${cd.cooking_time} min` },
      cd.diet_type && cd.diet_type !== 'geen' && { label: 'DIEET', value: cd.diet_type },
    ].filter(Boolean),
  },

  // ── VOEDING WENSEN — gedeeld, gebruikt np data ──
  afvallen_voeding_wensen: {
    question: (cd, answers, np) => {
      const maaltijden = getMaaltijden(np)
      if (maaltijden.length > 0) return `Je gaf aan dat je normaal ${maaltijden.slice(0, 3).join(', ')} eet. Wat wil je hiervan terug zien in je plan, en wat mag anders?`
      return 'Wat zou je graag terug zien in je voedingsplan?'
    },
    suggestions: (cd, answers, np) => {
      const maaltijden = getMaaltijden(np)
      const base = [
        'Dit grotendeels houden zoals het is',
        'Mijn ontbijt mag anders',
        'Mijn lunch mag anders',
        'Mijn avondeten mag anders',
        'Alles mag op de schop',
        'Meal prep basis',
        'Simpel en snel',
        'Veel variatie',
      ]
      return base
    },
    context: (cd, np) => {
      const wishes = np?.wishes || {}
      const ctx = []
      if (wishes.ontbijt_subs?.length) ctx.push({ label: 'ONTBIJT', value: mapSubs(wishes.ontbijt_subs, ONTBIJT_SUBS) })
      else if (wishes.ontbijt_categories?.length) ctx.push({ label: 'ONTBIJT', value: wishes.ontbijt_categories.join(', ') })
      if (wishes.lunch_subs?.length) ctx.push({ label: 'LUNCH', value: mapSubs(wishes.lunch_subs, LUNCH_SUBS) })
      else if (wishes.lunch_categories?.length) ctx.push({ label: 'LUNCH', value: wishes.lunch_categories.join(', ') })
      if (wishes.diner_subs?.length) ctx.push({ label: 'DINER', value: mapSubs(wishes.diner_subs, DINER_SUBS) })
      else if (wishes.diner_categories?.length) ctx.push({ label: 'DINER', value: wishes.diner_categories.join(', ') })
      if (wishes.niet_lekker?.length) ctx.push({ label: 'NIET LEKKER', value: wishes.niet_lekker.join(', ') })
      if (np?.life_context?.cooking_preference) ctx.push({ label: 'KOKEN', value: { graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk' }[np.life_context.cooking_preference] })
      if (cd.cooking_time) ctx.push({ label: 'KOOKTIJD', value: `${cd.cooking_time} min` })
      if (np?.life_context?.weekly_budget) ctx.push({ label: 'BUDGET', value: `€${np.life_context.weekly_budget}/week` })
      if (np?.meal_schedule?.num_meals) ctx.push({ label: 'MAALTIJDEN', value: `${np.meal_schedule.num_meals}x per dag` })
      if (np?.cheat_meals?.frequency) ctx.push({ label: 'CHEAT', value: { nooit: 'Geen cheat meals', '1x_week': '1x/week', weekend: 'Weekend flexibel', als_nodig: 'Als nodig' }[np.cheat_meals.frequency] })
      if (np?.supplement_preferences?.openness) ctx.push({ label: 'SUPPS', value: { ja_graag: 'Wil supplementen', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[np.supplement_preferences.openness] })
      return ctx
    },
  },

  spieren_voeding_wensen: {
    question: (cd, answers, np) => {
      const maaltijden = getMaaltijden(np)
      if (maaltijden.length > 0) return `Je eet nu ${maaltijden.slice(0, 2).join(' en ')}. Wat wil je hiervan terug zien in je bulk plan, en wat mag anders of extra?`
      return 'Wat wil je graag terug zien in je voedingsplan voor spieropbouw?'
    },
    suggestions: (cd, answers, np) => [
      'Dit grotendeels houden, alleen meer eten',
      'Meer eiwitrijke maaltijden toevoegen',
      'Mijn ontbijt mag groter en rijker',
      'Lunch wil ik uitbreiden',
      'Extra snacks rondom training',
      'Meal prep basis',
      'Simpel maar voedingsrijk',
    ],
    context: (cd, np) => {
      const wishes = np?.wishes || {}
      const ctx = []
      if (wishes.ontbijt_subs?.length) ctx.push({ label: 'ONTBIJT', value: mapSubs(wishes.ontbijt_subs, ONTBIJT_SUBS) })
      else if (wishes.ontbijt_categories?.length) ctx.push({ label: 'ONTBIJT', value: wishes.ontbijt_categories.join(', ') })
      if (wishes.lunch_subs?.length) ctx.push({ label: 'LUNCH', value: mapSubs(wishes.lunch_subs, LUNCH_SUBS) })
      if (wishes.diner_subs?.length) ctx.push({ label: 'DINER', value: mapSubs(wishes.diner_subs, DINER_SUBS) })
      else if (wishes.diner_categories?.length) ctx.push({ label: 'DINER', value: wishes.diner_categories.join(', ') })
      if (wishes.niet_lekker?.length) ctx.push({ label: 'NIET LEKKER', value: wishes.niet_lekker.join(', ') })
      if (np?.meal_schedule?.num_meals) ctx.push({ label: 'MAALTIJDEN', value: `${np.meal_schedule.num_meals}x per dag` })
      if (np?.life_context?.weekly_budget) ctx.push({ label: 'BUDGET', value: `€${np.life_context.weekly_budget}/week` })
      if (cd.cooking_time) ctx.push({ label: 'KOOKTIJD', value: `${cd.cooking_time} min` })
      if (np?.supplement_preferences?.openness) ctx.push({ label: 'SUPPS', value: { ja_graag: 'Wil supplementen', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[np.supplement_preferences.openness] })
      return ctx
    },
  },

  recomp_voeding_wensen: {
    question: (cd, answers, np) => {
      const maaltijden = getMaaltijden(np)
      if (maaltijden.length > 0) return `Je eet nu ${maaltijden.slice(0, 2).join(' en ')}. Wat wil je hiervan terug zien, en wat mag veranderen voor jouw recomp plan?`
      return 'Wat wil je graag terug zien in je recomp voedingsplan?'
    },
    suggestions: (cd, answers, np) => [
      'Dit grotendeels houden maar slimmer verdelen',
      'Meer eiwitten door de dag',
      'Minder koolhydraten savonds',
      'Ontbijt mag anders',
      'Lunch wil ik eiwit-rijker',
      'Meal prep basis',
      'Flexibel plan met targets',
    ],
    context: (cd, np) => {
      const wishes = np?.wishes || {}
      const ctx = []
      if (wishes.ontbijt_subs?.length) ctx.push({ label: 'ONTBIJT', value: mapSubs(wishes.ontbijt_subs, ONTBIJT_SUBS) })
      else if (wishes.ontbijt_categories?.length) ctx.push({ label: 'ONTBIJT', value: wishes.ontbijt_categories.join(', ') })
      if (wishes.lunch_subs?.length) ctx.push({ label: 'LUNCH', value: mapSubs(wishes.lunch_subs, LUNCH_SUBS) })
      if (wishes.diner_subs?.length) ctx.push({ label: 'DINER', value: mapSubs(wishes.diner_subs, DINER_SUBS) })
      if (wishes.niet_lekker?.length) ctx.push({ label: 'NIET LEKKER', value: wishes.niet_lekker.join(', ') })
      if (np?.meal_schedule?.num_meals) ctx.push({ label: 'MAALTIJDEN', value: `${np.meal_schedule.num_meals}x per dag` })
      if (np?.life_context?.weekly_budget) ctx.push({ label: 'BUDGET', value: `€${np.life_context.weekly_budget}/week` })
      if (cd.cooking_time) ctx.push({ label: 'KOOKTIJD', value: `${cd.cooking_time} min` })
      if (np?.supplement_preferences?.openness) ctx.push({ label: 'SUPPS', value: { ja_graag: 'Wil supplementen', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[np.supplement_preferences.openness] })
      return ctx
    },
  },

  fitness_voeding_wensen: {
    question: (cd, answers, np) => {
      const maaltijden = getMaaltijden(np)
      if (maaltijden.length > 0) return `Je eet nu ${maaltijden.slice(0, 2).join(' en ')}. Wat wil je hiervan terug zien in je gezondere eetplan?`
      return 'Wat wil je graag terug zien in je voedingsplan?'
    },
    suggestions: (cd, answers, np) => [
      'Dit grotendeels houden, iets gezonder',
      'Meer groenten en fruit toevoegen',
      'Minder snacks en suiker',
      'Ontbijt mag anders',
      'Simpele gezonde maaltijden',
      'Meal prep basis',
      'Zo min mogelijk nadenken over eten',
    ],
    context: (cd, np) => {
      const wishes = np?.wishes || {}
      const ctx = []
      if (wishes.ontbijt_subs?.length) ctx.push({ label: 'ONTBIJT', value: mapSubs(wishes.ontbijt_subs, ONTBIJT_SUBS) })
      else if (wishes.ontbijt_categories?.length) ctx.push({ label: 'ONTBIJT', value: wishes.ontbijt_categories.join(', ') })
      if (wishes.lunch_subs?.length) ctx.push({ label: 'LUNCH', value: mapSubs(wishes.lunch_subs, LUNCH_SUBS) })
      if (wishes.diner_subs?.length) ctx.push({ label: 'DINER', value: mapSubs(wishes.diner_subs, DINER_SUBS) })
      if (wishes.niet_lekker?.length) ctx.push({ label: 'NIET LEKKER', value: wishes.niet_lekker.join(', ') })
      if (np?.life_context?.cooking_preference) ctx.push({ label: 'KOKEN', value: { graag: 'Kookt graag', neutraal: 'Maakt niet uit', niet_graag: 'Zo min mogelijk' }[np.life_context.cooking_preference] })
      if (np?.meal_schedule?.num_meals) ctx.push({ label: 'MAALTIJDEN', value: `${np.meal_schedule.num_meals}x per dag` })
      if (np?.life_context?.weekly_budget) ctx.push({ label: 'BUDGET', value: `€${np.life_context.weekly_budget}/week` })
      if (cd.cooking_time) ctx.push({ label: 'KOOKTIJD', value: `${cd.cooking_time} min` })
      if (np?.cheat_meals?.frequency) ctx.push({ label: 'CHEAT', value: { nooit: 'Geen cheat meals', '1x_week': '1x/week', weekend: 'Weekend flexibel', als_nodig: 'Als nodig' }[np.cheat_meals.frequency] })
      if (np?.supplement_preferences?.openness) ctx.push({ label: 'SUPPS', value: { ja_graag: 'Wil supplementen', basics: 'Alleen basics', liever_niet: 'Liever niet', nee: 'Geen' }[np.supplement_preferences.openness] })
      return ctx
    },
  },

  // ── GEDEELD ──
  blokkades: {
    question: () => 'Wat heeft het eerder tegengehouden? En wat is nu anders?',
    suggestions: () => [
      'Te streng plan — niet vol te houden',
      'Geen begeleiding of accountability',
      'Motivatie zakte weg na 2-3 weken',
      'Te weinig resultaat gezien',
      'Leven werd druk — werk of privé',
      'Blessure of ziekte',
      'Nooit echt serieus aangepakt',
      'Nu is het anders want...',
    ],
    context: (cd) => [
      cd.previous_coaching && { label: 'EERDER', value: cd.previous_coaching?.slice(0, 60) },
      cd.biggest_obstacle && { label: 'OBSTAKEL', value: cd.biggest_obstacle?.slice(0, 60) },
    ].filter(Boolean),
  },

  zelf_overtuigd: {
    question: (cd, answers) => {
      const keys = Object.keys(answers).filter(k => k !== 'doel')
      const laatste = keys.length > 0 ? answers[keys[keys.length - 1]] : null
      const eerste = laatste ? laatste.split(' · ')[0] : null
      if (eerste && eerste.length < 60) return `Je zei "${eerste}". Als ik je daar concreet bij help — denk je dan dat je het dit keer gaat halen?`
      return 'Als ik je een plan geef dat past bij jouw leven en jouw manier — denk je dan dat je het gaat halen?'
    },
    suggestions: () => [
      'Ja — als ik het goed volg absoluut',
      'Ja — ik ben er echt klaar voor',
      'Ik denk het wel, als het haalbaar is',
      'Ik heb nog twijfels over mijn consistentie',
      'Ik wil het proberen en zien hoe het gaat',
    ],
    context: (cd) => [
      cd.goal_urgency && { label: 'URGENTIE', value: `${cd.goal_urgency}/10` },
      cd.motivation && { label: 'MOTIVATIE', value: cd.motivation?.slice(0, 60) + (cd.motivation?.length > 60 ? '...' : '') },
    ].filter(Boolean),
  },
}

const getDeliveryOptions = (route) => ({
  afvallen: [
    'Voedingsschema op maat (cut)',
    'Caloriedoel + macro\'s instellen',
    'Cardio plan toevoegen',
    'Trainingsschema op maat',
    'Coaching level bepalen',
    'Tijdlijn vastleggen',
  ],
  spieren: [
    'Trainingsschema op maat (hypertrofie)',
    'Voedingsschema op maat (bulk/lean bulk)',
    'Surplus + macro\'s instellen',
    'Progressie tracking instellen',
    'Coaching level bepalen',
    'Tijdlijn vastleggen',
  ],
  recomp: [
    'Recomp voedingsplan op maat',
    'Macro targets instellen',
    'Trainingsschema op maat',
    'Progressie tracking instellen',
    'Coaching level bepalen',
  ],
  fitness: [
    'Voedingsplan op maat',
    'Trainingsschema op maat',
    'Leefstijl aanpak bespreken',
    'Coaching level bepalen',
    'Tijdlijn vastleggen',
  ],
})[route] || []

export default function IntakeGoalFlow({ cd, np, stepNotes, setStepNotes, stepActions, setStepActions, isMobile, onDone }) {
  const history = useRef([])
  const intakeRoute = GOAL_TO_ROUTE[cd.primary_goal] || 'fitness'
  const [route, setRoute] = useState(intakeRoute)
  const [flowStep, setFlowStep] = useState('doel')
  const [answers, setAnswers] = useState({})
  const [showSwitch, setShowSwitch] = useState(false)

  // Effectief doel op basis van actieve route (voor vraag 1 na switch)
  const ROUTE_TO_GOAL = { afvallen: 'fat_loss', spieren: 'muscle_gain', recomp: 'recomp', fitness: 'general_fitness' }
  const effectiveCd = flowStep === 'doel' ? { ...cd, primary_goal: ROUTE_TO_GOAL[route] || cd.primary_goal } : cd

  const go = (next) => { history.current.push(flowStep); setFlowStep(next) }
  const back = () => { if (history.current.length > 0) setFlowStep(history.current.pop()) }

  const flowNotes = (stepNotes.goal_flow && typeof stepNotes.goal_flow === 'object') ? stepNotes.goal_flow : {}
  const updateNote = (id, val) => {
    setAnswers(p => ({ ...p, [id]: val }))
    setStepNotes(p => ({ ...p, goal_flow: { ...(p.goal_flow || {}), [id]: val } }))
  }

  // Reset delivery bij elke mount zodat het niet opstapelt
  const [deliveryVal, setDeliveryVal] = React.useState('')
  const setDelivery = (v) => {
    setDeliveryVal(v)
    setStepActions(p => ({ ...p, goal_delivery: v }))
  }

  const routeSteps = ROUTES[route]
  const currentIdx = routeSteps.indexOf(flowStep)
  const totalSteps = routeSteps.length - 2 // exclude doel + delivery
  const progress = flowStep === 'delivery' ? 1
    : flowStep === 'doel' ? 0
    : Math.max((currentIdx) / (routeSteps.length - 1), 0)

  const handleNext = () => {
    const currentValue = flowNotes[flowStep] || ''
    setShowSwitch(false)

    if (flowStep === 'doel') {
      // Na eerste vraag: detecteer route op basis van antwoord
      const detected = detectRoute(currentValue, cd)
      if (detected !== route) setRoute(detected)
      const newRoute = ROUTES[detected]
      go(newRoute[1])
      return
    }

    const nextIdx = currentIdx + 1
    if (nextIdx < routeSteps.length) {
      go(routeSteps[nextIdx])
    } else {
      go('delivery')
    }
  }

  const handleSwitch = (newRoute) => {
    // Als nog op doel: alleen route wijzigen zodat pills updaten
    if (flowStep === 'doel') {
      setRoute(newRoute)
      setShowSwitch(false)
      return
    }
    setRoute(newRoute)
    setShowSwitch(false)
    // Reset history en ga naar stap 2 van nieuwe route
    history.current = ['doel']
    setFlowStep(ROUTES[newRoute][1])
  }

  const currentDef = STEPS[flowStep]
  const currentValue = flowNotes[flowStep] || ''

  const routeColor = {
    afvallen: C.gold, spieren: C.blue, recomp: C.green, fitness: C.green
  }[route] || C.gold

  return (
    <div>
      {/* Hero — klein, alleen voor visuele context */}
      <div style={{ position: 'relative', height: '50px', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.5) 100%)' }} />
        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: routeColor, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Route + switch balk — duidelijk zichtbaar onder hero */}
      {flowStep !== 'delivery' && (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gap: '0.5rem'
        }}>
          <Target size={11} color={C.gold} />
          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Doel
          </span>
          {/* Actieve route badge */}
          <span style={{
            fontSize: '0.55rem', fontWeight: 700,
            color: routeColor,
            background: `${routeColor}12`,
            border: `1px solid ${routeColor}25`,
            borderRadius: '4px', padding: '0.1rem 0.4rem',
            textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            {route === 'afvallen' ? 'Afvallen' : route === 'spieren' ? 'Spieropbouw' : route === 'recomp' ? 'Body Recomp' : 'Fitter worden'}
          </span>
          <div style={{ flex: 1 }} />
          {/* Switch knop — groot en duidelijk */}
          <button onClick={() => setShowSwitch(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            background: showSwitch ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', padding: '0.3rem 0.6rem',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 700,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            minHeight: '28px'
          }}>
            <RefreshCw size={10} />
            Wijzig doel
          </button>
        </div>
      )}

      {/* Switch opties — inline onder de balk */}
      {showSwitch && (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {SWITCH_OPTIONS.filter(o => o.route !== route).map(opt => (
            <button key={opt.route} onClick={() => handleSwitch(opt.route)} style={{
              width: '100%', padding: '0.6rem 0.75rem',
              background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              minHeight: '40px'
            }}>
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>→</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Flow vraag */}
      {flowStep !== 'delivery' && currentDef && (
        <div>
          {/* Maaltijd context alleen bij voeding wensen stappen */}
          {flowStep.includes('voeding_wensen') && (
            <IntakeMaaltijdContext np={np} cd={effectiveCd} isMobile={isMobile} />
          )}
          <FlowQuestion
            question={typeof currentDef.question === 'function' ? currentDef.question(effectiveCd, answers, np) : currentDef.question}
            contextItems={flowStep.includes('voeding_wensen') ? [] : (currentDef.context ? currentDef.context(effectiveCd, np) : [])}
            suggestions={currentDef.suggestions ? currentDef.suggestions(effectiveCd, answers, np) : []}
            value={currentValue}
            onChange={v => updateNote(flowStep, v)}
            isMobile={isMobile}
          />
          <FlowNav
            onBack={history.current.length > 0 ? back : null}
            onNext={handleNext}
            nextLabel='VOLGENDE'
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Delivery */}
      {flowStep === 'delivery' && (
        <div>
          <div style={{ padding: '1rem 0.75rem 0.5rem' }}>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: C.text, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
              Wat ga ik voor jou doen?
            </div>
            <div style={{ fontSize: '0.62rem', color: C.text25, marginBottom: '0.75rem' }}>
              Selecteer wat je gaat leveren — verschijnt in het WhatsApp bericht
            </div>
          </div>
          <DeliveryPicker
            options={getDeliveryOptions(route)}
            value={deliveryVal}
            onChange={setDelivery}
            isMobile={isMobile}
          />
          <FlowNav
            onBack={back}
            onNext={onDone}
            nextLabel='DOEL BESPROKEN → PLAN KIEZEN'
            isLast={true}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  )
}
