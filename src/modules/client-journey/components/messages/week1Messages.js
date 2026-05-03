
// ============================================
// FILE: src/modules/client-journey/components/messages/week1Messages.js
// WEEK 1: Na eerste call berichten
// day: 0=Ma, 1=Di, 2=Wo, 3=Do, 4=Vr, 5=Za, 6=Zo
// ============================================

const week1Messages = [
  {
    id: 'call1_summary',
    phase: 'week1',
    day: 0,
    trigger: 'Direct na de eerste call',
    title: 'Call samenvatting + afspraken',
    description: 'Overzicht van wat besproken is + actiepunten',
    template: `Heyy {naam}, top call man! 💪

Hier even kort wat we net hebben besproken:
{call_samenvatting}

Actiepunten voor deze week:
{actiepunten}

We houden contact! Als je vragen hebt, stuur ze gerust. 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{call_samenvatting}', default: '- Doelen besproken\n- Huidige situatie doorgenomen\n- Plan van aanpak uitgelegd', label: 'Call samenvatting', editable: true },
      { key: '{actiepunten}', default: '- Voeding bijhouden in MyFitnessPal\n- Workouts volgen uit de app\n- Dagelijks gewicht loggen', label: 'Actiepunten', editable: true }
    ],
    tags: ['call', 'samenvatting'],
    priority: 'high'
  },

  {
    id: 'app_login',
    phase: 'week1',
    day: 0,
    trigger: 'Na de call - app inloggegevens',
    title: 'App login gegevens',
    description: 'Inloggegevens + instructievideo voor de app',
    template: `Top {naam}, hier is de link naar de app. Je hoeft hem maar een keer te "downloaden" en dan staat hij op je startscherm net als alle andere apps.

Volg de instructies uit de video hierboven en dan kan je een kijkje nemen in je persoonlijke dashboard. Als je het niet begrijpt, trek aan de bel en ik help je erdoorheen.

Je inlog gegevens:
Email: {client_email}
Wachtwoord: Welcome123!

Hier de link: https://myarcfitness.com/login`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' },
      { key: '{client_email}', source: 'client.email', label: 'Client email' }
    ],
    tags: ['app', 'login', 'onboarding'],
    priority: 'high'
  },

  {
    id: 'workout_ready',
    phase: 'week1',
    day: 1,
    trigger: 'Dinsdag - workout plan klaar',
    title: 'Workout plan staat klaar',
    description: 'Laat weten dat het trainingsschema klaar staat',
    template: `Hey {naam}! Je workout plan staat klaar in de app! 💪🔥

Neem even een kijkje en laat me weten als je vragen hebt over de oefeningen. De eerste training is altijd even wennen, maar dat is helemaal goed.

Succes man! 🏆`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['workout', 'deliverable'],
    priority: 'high'
  },

  {
    id: 'mfp_tracking',
    phase: 'week1',
    day: 2,
    trigger: 'Woensdag - MFP tracking starten',
    title: 'Start voeding bijhouden',
    description: 'Instructie om voeding te gaan tracken in MyFitnessPal',
    template: `Hey {naam}! Deze week gaan we je voeding bijhouden in MyFitnessPal zodat we een goed beeld krijgen van wat je eet.

Hier een handige video hoe je dat doet:
https://www.tiktok.com/@sportpoeder/video/7190282989371165958

Probeer minimaal 3 dagen eerlijk bij te houden, dan kunnen we daar volgende call mee aan de slag. 😃`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['voeding', 'tracking', 'MFP'],
    priority: 'medium'
  },

  {
    id: 'week1_checkin',
    phase: 'week1',
    day: 3,
    trigger: 'Donderdag - check-in',
    title: 'Check-in: hoe gaat het?',
    description: 'Kort check-in bericht halverwege de week',
    template: `Hey {naam}! Hoe gaat het deze week? Eerste workouts al gedaan? 😃

Laat me weten als je ergens tegenaan loopt!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['check-in'],
    priority: 'medium'
  },

  {
    id: 'week0_expectations',
    phase: 'week1',
    day: 5,
    trigger: 'Zaterdag - week 0 verwachtingen',
    title: 'Week 0 verwachtingen + gewicht',
    description: 'Wat er verwacht wordt deze week + gewicht bijhouden',
    template: `Hoii {naam}, dan hier nog even kort wat er verwacht wordt tijdens week 0.
Als je hier moeite mee hebt laat het me vooral weten, ik help graag.

- 1 weging per dag
- 3 dagen huidige calorieen tracken (MyFitnessPal)
- 4 dagen naar doel proberen te eten
- 3 workouts van programma aanvoelen en loggen

Super, deze gegevens zullen ons enorm helpen bij het halen van jouw resultaten, dus jouw transformatie begint hier 😄.

Heel veel succes!`,
    variables: [
      { key: '{naam}', source: 'client.first_name', label: 'Voornaam' }
    ],
    tags: ['verwachtingen', 'week-0'],
    priority: 'high'
  }
]

export default week1Messages
