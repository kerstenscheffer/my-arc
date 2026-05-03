// ============================================
// FILE: src/modules/client-journey/components/messages/recurringMessages.js
// RECURRING: Wekelijks terugkerende berichten (week 3+)
// day: 0=Ma, 1=Di, 2=Wo, 3=Do, 4=Vr, 5=Za, 6=Zo
// ============================================

const recurringMessages = [
  {
    id: 'weekly_call_reminder',
    phase: 'recurring',
    day: 0,
    trigger: 'Maandag - wekelijkse call herinnering',
    title: 'Wekelijkse call herinnering',
    description: 'Reminder voor de wekelijkse coaching call',
    template: `Hey {naam}! We spreken elkaar {call_dag} om {call_tijd}. Zorg dat je gewicht up to date is in de app! 💪`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_dag}', default: 'woensdag', label: 'Dag van de call' },
      { key: '{call_tijd}', default: '14:00', label: 'Tijd van de call' }
    ],
    tags: ['call', 'reminder'],
    priority: 'high',
    frequency: 'weekly'
  },

  {
    id: 'weekly_call_summary',
    phase: 'recurring',
    day: 0,
    trigger: 'Na de wekelijkse call',
    title: 'Wekelijkse call samenvatting',
    description: 'Samenvatting na elke coaching call',
    template: `Hey {naam}, goeie call weer! 💪

Hier even een overzicht:
{call_samenvatting}

Actiepunten voor deze week:
{actiepunten}

We houden contact! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_samenvatting}', default: '- Voortgang besproken\n- Voeding geanalyseerd\n- Workout evaluatie', label: 'Call samenvatting', editable: true },
      { key: '{actiepunten}', default: '- Voeding blijven tracken\n- Workouts volgen\n- Gewicht dagelijks loggen', label: 'Actiepunten', editable: true }
    ],
    tags: ['call', 'samenvatting'],
    priority: 'high',
    frequency: 'weekly'
  },

  {
    id: 'midweek_checkin',
    phase: 'recurring',
    day: 3,
    trigger: 'Donderdag - check-in tussendoor',
    title: 'Midweek check-in',
    description: 'Kort check-in bericht halverwege de week',
    template: `Hey {naam}! Hoe gaat het deze week? Alles op schema? 😃

Laat me weten als er iets is!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['check-in'],
    priority: 'medium',
    frequency: 'weekly'
  },

  {
    id: 'weekend_motivation',
    phase: 'recurring',
    day: 5,
    trigger: 'Zaterdag - motivatie + gewicht reminder',
    title: 'Weekend motivatie + gewicht',
    description: 'Motiverend bericht + reminder gewicht loggen',
    template: `Hey {naam}! Weekend, lekker man. Vergeet niet je gewicht te loggen in de app. 💪

Geniet van je weekend en hou vol, je doet het goed! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['motivatie', 'gewicht', 'reminder'],
    priority: 'low',
    frequency: 'weekly'
  },

  {
    id: 'plan_adjustment',
    phase: 'recurring',
    day: 4,
    trigger: 'Vrijdag - plan bijstellen (elke 2 weken)',
    title: 'Plan bijstelling check',
    description: 'Check of workout/meal plan aangepast moet worden',
    template: `Hey {naam}! Even een check - hoe loopt het plan? 

Zijn er oefeningen die je lastig vindt of recepten die niet lekker zijn? Dan passen we dat deze week aan. Laat het me weten! 💪`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['plan', 'aanpassing'],
    priority: 'medium',
    frequency: 'biweekly'
  },

  {
    id: 'no_response_nudge',
    phase: 'recurring',
    day: 4,
    trigger: 'Vrijdag - als client niet reageert',
    title: 'Nudge bij geen reactie',
    description: 'Vriendelijke follow-up als client stil is',
    template: `Hey {naam}! Ik hoor je niet zo veel deze week. Alles goed? 😃

Laat even weten hoe het gaat, dan kan ik je helpen waar nodig!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['follow-up', 'nudge'],
    priority: 'medium',
    frequency: 'asneeded',
    conditional: 'Alleen als client niet reageert deze week'
  }
]

export default recurringMessages
