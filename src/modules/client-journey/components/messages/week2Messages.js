// ============================================
// FILE: src/modules/client-journey/components/messages/week2Messages.js
// WEEK 2: Meal plan call + deliverables
// day: 0=Ma, 1=Di, 2=Wo, 3=Do, 4=Vr, 5=Za, 6=Zo
// ============================================

const week2Messages = [
  {
    id: 'call2_prep',
    phase: 'week2',
    day: 0,
    trigger: 'Maandag - call 2 herinnering',
    title: 'Call 2 herinnering',
    description: 'Herinnering voor de tweede call + MFP data checken',
    template: `Hey {naam}! We spreken elkaar {call_dag} om {call_tijd} voor onze tweede call. 💪

Zorg dat je MyFitnessPal data up to date is, dan gaan we er samen doorheen en stellen we je meal plan op.

Tot dan! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_dag}', default: 'woensdag', label: 'Dag van de call' },
      { key: '{call_tijd}', default: '14:00', label: 'Tijd van de call' }
    ],
    tags: ['call', 'reminder'],
    priority: 'high'
  },

  {
    id: 'call2_summary',
    phase: 'week2',
    day: 0,
    trigger: 'Na call 2 - samenvatting',
    title: 'Call 2 samenvatting + afspraken',
    description: 'Overzicht na de meal plan call',
    template: `Hey {naam}, top call weer man! 💪

Hier even wat we besproken hebben:
{call_samenvatting}

Je meal plan wordt nu opgesteld en staat binnenkort klaar in de app. Ik laat het je weten! 😃`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_samenvatting}', default: '- MFP data doorgenomen\n- Voedingsplan besproken\n- Macro targets bepaald\n- Workout evaluatie', label: 'Call samenvatting', editable: true }
    ],
    tags: ['call', 'samenvatting'],
    priority: 'high'
  },

  {
    id: 'mealplan_ready',
    phase: 'week2',
    day: 1,
    trigger: 'Dinsdag - meal plan klaar',
    title: 'Meal plan staat klaar',
    description: 'Laat weten dat het voedingsplan klaar staat in de app',
    template: `Hey {naam}! Je persoonlijke meal plan staat klaar in de app! 🍽💪

Neem even een kijkje en laat me weten wat je ervan vindt. Als er iets niet lekker klinkt of niet past, passen we het aan.

Succes deze week! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['meal-plan', 'deliverable'],
    priority: 'high'
  },

  {
    id: 'week2_checkin',
    phase: 'week2',
    day: 3,
    trigger: 'Donderdag - check-in',
    title: 'Check-in: meal plan + workouts',
    description: 'Hoe gaat het met het nieuwe meal plan?',
    template: `Hey {naam}! Hoe gaat het met het meal plan? Al wat recepten geprobeerd? 😃

En hoe lopen de workouts? Laat me weten als je ergens tegenaan loopt, dan passen we aan!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['check-in', 'meal-plan'],
    priority: 'medium'
  }
]

export default week2Messages
