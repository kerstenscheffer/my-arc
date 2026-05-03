// ============================================
// FILE: src/modules/client-journey/components/messages/milestoneMessages.js
// MILESTONES: Foto's, metingen, evaluatie (elke 4 weken)
// day: 0=Ma, 1=Di, 2=Wo, 3=Do, 4=Vr, 5=Za, 6=Zo
// ============================================

const milestoneMessages = [
  {
    id: 'photos_request',
    phase: 'milestone',
    day: 4,
    trigger: 'Vrijdag - progressiefoto\'s opvragen (elke 4 weken)',
    title: 'Progressiefoto\'s opvragen',
    description: 'Foto\'s aanvragen voor de maandelijkse vergelijking',
    template: `Hey {naam}! Het is weer tijd voor progressiefoto's. 📸

Kun je dit weekend even foto's maken? Zelfde pose als vorige keer:
- Voorkant, ontspannen
- Zijkant
- Achterkant

Upload ze in de app of stuur ze hier. We vergelijken ze tijdens de call! 💪`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['foto', 'progressie'],
    priority: 'high',
    frequency: 'monthly'
  },

  {
    id: 'measurements_request',
    phase: 'milestone',
    day: 4,
    trigger: 'Vrijdag - metingen opvragen (elke 4 weken)',
    title: 'Lichaamsmetingen opvragen',
    description: 'Borst, taille, heupen, armen, bovenbenen meten',
    template: `Hey {naam}! Kun je dit weekend ook even je metingen doen?

- Borst
- Taille
- Heupen
- Armen (beide)
- Bovenbenen (beide)

Vul ze in via de app of stuur ze hier. Dan hebben we een compleet beeld! 😃`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['metingen', 'progressie'],
    priority: 'high',
    frequency: 'monthly'
  },

  {
    id: 'monthly_evaluation',
    phase: 'milestone',
    day: 0,
    trigger: 'Maandag - maandelijkse evaluatie (elke 4 weken)',
    title: 'Maandelijkse evaluatie',
    description: 'Vooraankondiging evaluatie call',
    template: `Hey {naam}! Deze week is het evaluatie-week. 🏆

We gaan tijdens de call kijken naar:
- Je resultaten van afgelopen maand
- Foto vergelijking
- Metingen vergelijking
- Workout en voeding evalueren
- Plan aanpassen voor komende maand

Zorg dat je foto's en metingen up to date zijn! 💪`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['evaluatie', 'maandelijks'],
    priority: 'high',
    frequency: 'monthly'
  },

  {
    id: 'halfway_milestone',
    phase: 'milestone',
    day: 0,
    trigger: 'Halverwege het traject',
    title: 'Halverwege - milestone',
    description: 'Halverwege evaluatie + motivatie boost',
    template: `Hey {naam}! Je bent halverwege je traject man! 🏆💪

Kijk even terug naar waar je begon en waar je nu staat. Dat verschil is echt sick.

Deze week gaan we evalueren en kijken hoe we de tweede helft nog beter maken. Ik ben trots op je progressie! 🔥`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['milestone', 'halverwege'],
    priority: 'high',
    frequency: 'once'
  },

  {
    id: 'final_measurement',
    phase: 'milestone',
    day: 0,
    trigger: 'Laatste week - eindmeting',
    title: 'Eindmeting traject',
    description: 'Finale foto\'s + metingen voor het eindresultaat',
    template: `Hey {naam}! Het is de laatste week van je traject. 🏆

Kun je nog een laatste set foto's en metingen doen? Dan maken we een mooie voor/na vergelijking.

We bespreken alles in onze afsluitende call. Ben benieuwd naar je eindresultaat! 💪🔥`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['eindmeting', 'afsluiting'],
    priority: 'high',
    frequency: 'once'
  },

  {
    id: 'continuation_offer',
    phase: 'milestone',
    day: 3,
    trigger: 'Laatste week donderdag - vervolg bespreken',
    title: 'Vervolg traject bespreken',
    description: 'Aanbod voor verlenging of nieuw traject',
    template: `Hey {naam}! Ik hoop dat je trots bent op wat je bereikt hebt. 🏆

Ik wil graag met je bespreken hoe we verder gaan. We hebben een paar opties:
- Doorgaan met coaching (maandelijks)
- Nieuw traject met nieuwe doelen
- Zelfstandig verder met het plan

Laten we het erover hebben in onze afsluitende call! 💪`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['vervolg', 'upsell', 'afsluiting'],
    priority: 'high',
    frequency: 'once'
  }
]

export default milestoneMessages
