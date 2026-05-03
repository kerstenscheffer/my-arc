// ============================================
// 📁 FILE: src/modules/client-journey/components/callflow/callTemplates.js
// CALL TEMPLATES - Standaard agenda's per call type
// Pas deze aan om je call structuur te wijzigen
// ============================================

const callTemplates = {
  // ===== INTAKE CALL (eerste call) =====
  intake: {
    id: 'intake',
    name: 'Intake Call',
    description: 'Eerste kennismaking - doelen, verwachtingen, plan van aanpak',
    duration: 60,
    weekNumber: 0,
    agenda: [
      { id: 'intro', title: 'Kennismaking & achtergrond', duration: 10, notes: '', done: false, prompts: ['Wat is je sport/trainings achtergrond?', 'Wat heb je eerder geprobeerd?', 'Hoe ziet je huidige routine eruit?'] },
      { id: 'goals', title: 'Doelen bespreken', duration: 10, notes: '', done: false, prompts: ['Wat wil je bereiken?', 'Wat is je tijdlijn?', 'Wat is je #1 prioriteit?'] },
      { id: 'lifestyle', title: 'Levensstijl & planning', duration: 5, notes: '', done: false, prompts: ['Hoeveel dagen per week kun je trainen?', 'Hoe ziet je werkweek eruit?', 'Eventuele blessures of beperkingen?'] },
      { id: 'nutrition', title: 'Voeding & gewoontes', duration: 10, notes: '', done: false, prompts: ['Hoe eet je nu?', 'Allergieën of voorkeuren?', 'Ervaring met calorie tracking?'] },
      { id: 'plan', title: 'Plan van aanpak uitleggen', duration: 10, notes: '', done: false, prompts: ['Week 0 verwachtingen uitleggen', 'App doorlopen', 'MFP tracking uitleggen'] },
      { id: 'questions', title: 'Vragen van de client', duration: 10, notes: '', done: false, prompts: [] },
      { id: 'afspraken', title: 'Afspraken & actiepunten', duration: 5, notes: '', done: false, prompts: ['Volgende call inplannen', 'Actiepunten samenvatten', 'Verwachtingen week 0 herhalen'] }
    ],
    prepChecklist: [
      { item: 'Intake formulier bekeken', done: false },
      { item: 'Betaling ontvangen', done: false },
      { item: 'Zoom link klaargezet', done: false },
      { item: 'Workout plan voorbereid', done: false }
    ],
    deliverables: [
      'App login gegevens sturen',
      'Workout plan activeren in app',
      'Week 0 verwachtingen sturen',
      'MFP tracking instructies sturen'
    ]
  },

  // ===== WEEK 2 CALL (meal plan opzetten) =====
  meal_plan_call: {
    id: 'meal_plan_call',
    name: 'Voedingsplan Call',
    description: 'MFP data bespreken en meal plan opstellen',
    duration: 45,
    weekNumber: 2,
    agenda: [
      { id: 'checkin', title: 'Check-in: hoe gaat het?', duration: 5, notes: '', done: false, prompts: ['Hoe was de eerste week?', 'Workout ervaring?', 'Problemen tegengekomen?'] },
      { id: 'weight', title: 'Gewicht & voortgang', duration: 5, notes: '', done: false, prompts: ['Gewicht bekijken', 'Trends bespreken'] },
      { id: 'mfp', title: 'MFP data analyseren', duration: 10, notes: '', done: false, prompts: ['Gemiddelde calorie intake', 'Macro verdeling', 'Eetpatronen herkennen'] },
      { id: 'mealplan', title: 'Meal plan opstellen', duration: 15, notes: '', done: false, prompts: ['Calorie doel vaststellen', 'Macro targets bepalen', 'Voedingsvoorkeuren bespreken', 'Maaltijdstructuur bepalen'] },
      { id: 'workout', title: 'Workout evaluatie', duration: 5, notes: '', done: false, prompts: ['Hoe gaan de trainingen?', 'Gewichten/progressie', 'Oefeningen aanpassen?'] },
      { id: 'afspraken', title: 'Afspraken & actiepunten', duration: 5, notes: '', done: false, prompts: ['Meal plan gaat klaarstaan in app', 'Volgende call inplannen'] }
    ],
    prepChecklist: [
      { item: 'MFP data van client bekeken', done: false },
      { item: 'Gewicht data gecheckt', done: false },
      { item: 'Workout logs bekeken', done: false },
      { item: 'Meal preferences formulier bekeken', done: false }
    ],
    deliverables: [
      'Meal plan klaarzetten in app',
      'Call samenvatting sturen via WhatsApp'
    ]
  },

  // ===== STANDAARD WEKELIJKSE CALL =====
  weekly: {
    id: 'weekly',
    name: 'Wekelijkse Call',
    description: 'Standaard wekelijkse coaching call - voortgang en bijsturing',
    duration: 45,
    weekNumber: null,
    agenda: [
      { id: 'checkin', title: 'Check-in: hoe gaat het?', duration: 5, notes: '', done: false, prompts: ['Hoe voel je je?', 'Hoe was de week?', 'Energie level?'] },
      { id: 'weight', title: 'Gewicht & voortgang', duration: 5, notes: '', done: false, prompts: ['Gewicht trend bekijken', 'Op schema?', 'Eventuele schommelingen bespreken'] },
      { id: 'nutrition', title: 'Voeding evaluatie', duration: 10, notes: '', done: false, prompts: ['Meal plan gevolgd?', 'Moeilijkheden?', 'Honger/verzadiging?', 'Aanpassingen nodig?'] },
      { id: 'workout', title: 'Workout evaluatie', duration: 10, notes: '', done: false, prompts: ['Alle workouts gedaan?', 'Progressie op oefeningen?', 'Pijn/ongemak?', 'Gewichten verhogen?'] },
      { id: 'mindset', title: 'Doelen & mindset', duration: 5, notes: '', done: false, prompts: ['Motivatie level?', 'Uitdagingen?', 'Kleine wins vieren'] },
      { id: 'adjustments', title: 'Plan aanpassingen', duration: 5, notes: '', done: false, prompts: ['Voeding aanpassen?', 'Workout aanpassen?', 'Volume/intensiteit wijzigen?'] },
      { id: 'afspraken', title: 'Actiepunten komende week', duration: 5, notes: '', done: false, prompts: ['Focus punten voor de week', 'Specifieke taken', 'Volgende call inplannen'] }
    ],
    prepChecklist: [
      { item: 'Gewicht data gecheckt', done: false },
      { item: 'Workout logs bekeken', done: false },
      { item: 'Vorige call notities gelezen', done: false },
      { item: 'Voortgang t.o.v. doelen bekeken', done: false }
    ],
    deliverables: [
      'Call samenvatting sturen via WhatsApp',
      'Eventuele plan aanpassingen doorvoeren'
    ]
  },

  // ===== EVALUATIE CALL (elke 4 weken) =====
  evaluation: {
    id: 'evaluation',
    name: 'Maandelijkse Evaluatie',
    description: 'Uitgebreide evaluatie met foto vergelijking en plan bijsturing',
    duration: 45,
    weekNumber: null,
    agenda: [
      { id: 'checkin', title: 'Algemene check-in', duration: 5, notes: '', done: false, prompts: ['Hoe voel je je overall?', 'Tevredenheid met het traject?'] },
      { id: 'results', title: 'Resultaten analyseren', duration: 10, notes: '', done: false, prompts: ['Gewicht trend (4 weken)', 'Foto vergelijking', 'Metingen vergelijken', 'Wat is er verbeterd?'] },
      { id: 'nutrition_eval', title: 'Voeding evaluatie', duration: 8, notes: '', done: false, prompts: ['Compliance percentage', 'Wat gaat goed?', 'Wat kan beter?', 'Calorie/macro aanpassing nodig?'] },
      { id: 'workout_eval', title: 'Workout evaluatie', duration: 8, notes: '', done: false, prompts: ['Progressie op compound lifts', 'Volume/frequentie goed?', 'Nieuw programma nodig?'] },
      { id: 'goals_review', title: 'Doelen herzien', duration: 5, notes: '', done: false, prompts: ['Op koers voor einddoel?', 'Doelen bijstellen?', 'Nieuwe subdoelen zetten'] },
      { id: 'plan_update', title: 'Plan voor komende maand', duration: 5, notes: '', done: false, prompts: ['Voeding aanpassen', 'Workout aanpassen', 'Focus gebieden bepalen'] },
      { id: 'afspraken', title: 'Afspraken', duration: 4, notes: '', done: false, prompts: ['Nieuwe foto\'s over 4 weken', 'Specifieke targets voor de maand'] }
    ],
    prepChecklist: [
      { item: 'Gewicht data (4 weken) bekeken', done: false },
      { item: 'Progressie foto\'s vergeleken', done: false },
      { item: 'Metingen vergeleken', done: false },
      { item: 'Workout progressie geanalyseerd', done: false },
      { item: 'Vorige maand notities gelezen', done: false }
    ],
    deliverables: [
      'Bijgewerkt meal plan (indien nodig)',
      'Bijgewerkt workout plan (indien nodig)',
      'Call samenvatting + resultaten sturen',
      'Nieuwe foto\'s + metingen over 4 weken'
    ]
  },

  // ===== LAATSTE CALL =====
  final: {
    id: 'final',
    name: 'Afsluitende Call',
    description: 'Eindresultaten bespreken en vervolg traject',
    duration: 45,
    weekNumber: null,
    agenda: [
      { id: 'results', title: 'Eindresultaten presenteren', duration: 10, notes: '', done: false, prompts: ['Before/after foto\'s', 'Gewicht verschil', 'Metingen verschil', 'Kracht progressie'] },
      { id: 'journey', title: 'Traject terugblikken', duration: 5, notes: '', done: false, prompts: ['Wat ging goed?', 'Wat was lastig?', 'Belangrijkste lessen'] },
      { id: 'habits', title: 'Gewoontes evalueren', duration: 5, notes: '', done: false, prompts: ['Welke gewoontes zitten er nu in?', 'Wat moet nog aandacht?'] },
      { id: 'future', title: 'Toekomst & vervolg', duration: 15, notes: '', done: false, prompts: ['Wat zijn je volgende doelen?', 'Wil je doorgaan met coaching?', 'Welk traject past het beste?', 'Zelfstandig of met begeleiding?'] },
      { id: 'plan', title: 'Vervolg plan', duration: 5, notes: '', done: false, prompts: ['Volgend traject kiezen', 'Of: zelfstandig plan meegeven', 'Transition plan bespreken'] },
      { id: 'closing', title: 'Afsluiting', duration: 5, notes: '', done: false, prompts: ['Bedanken', 'Testimonial vragen', 'Referral bespreken'] }
    ],
    prepChecklist: [
      { item: 'Before/after foto\'s klaargezet', done: false },
      { item: 'Gewicht + metingen vergelijking gemaakt', done: false },
      { item: 'Kracht progressie overzicht gemaakt', done: false },
      { item: 'Vervolg opties voorbereid', done: false },
      { item: 'Testimonial vraag voorbereid', done: false }
    ],
    deliverables: [
      'Eindresultaten overzicht sturen',
      'Vervolg traject info sturen (indien van toepassing)',
      'Testimonial opvolgen'
    ]
  }
}

// Get the right template for a week
export function getCallTemplateForWeek(weekNumber, totalWeeks) {
  if (weekNumber === 0 || weekNumber === 1) return callTemplates.intake
  if (weekNumber === 2) return callTemplates.meal_plan_call
  if (weekNumber === totalWeeks) return callTemplates.final
  if (weekNumber % 4 === 0) return callTemplates.evaluation
  return callTemplates.weekly
}

export default callTemplates
