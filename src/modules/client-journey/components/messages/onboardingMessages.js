// ============================================
// FILE: src/modules/client-journey/components/messages/onboardingMessages.js
// PRE-WEEK: Onboarding berichten (voor eerste call)
// day: 0=Ma, 1=Di, 2=Wo, 3=Do, 4=Vr, 5=Za, 6=Zo
// ============================================

const onboardingMessages = [
  {
    id: 'welcome_close',
    phase: 'onboarding',
    day: 0,
    trigger: 'Direct na de close',
    title: 'Welkomstbericht + linkjes',
    description: 'Betaallink + onboarding formulier sturen',
    template: `Heyy {naam}, super om je gesproken te hebben man. We gaan er wat moois van maken! 💪🏆

Ik heb hier 2 linkjes, als je beide zou willen afronden kan ik direct aan de slag.

Hier is het linkje voor naar de informatiepagina, als je wat gegevens zou willen invoeren kan ik daarmee aan de slag. (Gebruik dezelfde mail als voor de zoom call)
{onboarding_link}

Hier is het linkje naar de investerings-pagina.
{checkout_link}

Als je nog vragen hebt kun je ze altijd direct stellen man! Via dit nummer reageer ik snel. 😃

Groetjes Kersten`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{onboarding_link}', default: 'https://www.myarcfitness.com/onboarding', label: 'Onboarding link' },
      { key: '{checkout_link}', default: 'https://www.myarcfitness.com/checkout', label: 'Checkout link' }
    ],
    tags: ['onboarding', 'close', 'betaling'],
    priority: 'high'
  },

  {
    id: 'intake_reminder',
    phase: 'onboarding',
    day: 1,
    trigger: 'Dag na close - als intake/betaling nog niet gedaan',
    title: 'Reminder intake + betaling',
    description: 'Vriendelijke reminder formulier + betaling',
    template: `Hey {naam}! Top man, zou je hier wanneer je tijd hebt wat gegevens willen invoeren? Duurt een minuutje denk ik. 💪

{onboarding_link}`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{onboarding_link}', default: 'https://www.myarcfitness.com/onboarding', label: 'Onboarding link' }
    ],
    tags: ['onboarding', 'reminder'],
    priority: 'medium',
    conditional: 'Alleen als intake nog niet ingevuld is'
  },

  {
    id: 'warm_contact',
    phase: 'onboarding',
    day: 2,
    trigger: 'Dag 3 - warm houden',
    title: 'Warm houden bericht',
    description: 'Contact warm houden, enthousiasme opbouwen',
    template: `Hey {naam}! Heb je er al zin in? Ik ben alvast bezig met de voorbereidingen voor je programma. We gaan resultaten neerzetten! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['onboarding', 'warm-contact'],
    priority: 'medium'
  },

  {
    id: 'meal_preferences',
    phase: 'onboarding',
    day: 2,
    trigger: 'Dag 3 - meal preferences opvragen',
    title: 'Voedingsvoorkeuren formulier',
    description: 'Link naar meal preferences voor het meal plan',
    template: `Hoii {naam}, zou je dit snel willen invullen? Dan weet ik een beetje wat ik voor je kan gebruiken in je maaltijdplan. 😄

{meal_preferences_link}`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{meal_preferences_link}', default: 'https://www.myarcfitness.com/meal-preferences.html', label: 'Meal preferences link' }
    ],
    tags: ['onboarding', 'meal-plan'],
    priority: 'medium'
  },

  {
    id: 'pre_call_reminder',
    phase: 'onboarding',
    day: 4,
    trigger: 'Dag voor de eerste call',
    title: 'Call reminder',
    description: 'Herinnering + enthousiasme eerste call',
    template: `Hey {naam}! Morgen spreken we elkaar om {call_tijd}. Ik heb er zin in! 💪

Ik heb een zoom link gedeeld via je mail.
Als je nog vragen hebt, stuur ze gerust alvast door!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_tijd}', default: '14:00', label: 'Tijd van de call' }
    ],
    tags: ['onboarding', 'call', 'reminder'],
    priority: 'high'
  }
]

export default onboardingMessages
