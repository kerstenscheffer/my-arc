// src/pages/challengeVragen.js
//
// De vragen van de prekwalificatie (/challenge/start), los van de pagina
// zodat het coachscherm Ads dezelfde volgorde gebruikt voor het afhaken per
// vraag.

// `soort`: tekst | email | keuze | meerkeuze | lang | schaal | contact
// `afwijzen(antwoord)` geeft 'B' of 'C' terug als deze keuze het einde is.
export const VRAGEN = [
  // Contact eerst (17 okt 2026): naam, telefoon, e-mail. Wie daarna afhaakt
  // staat met nummer in challenge_prequal_voortgang en kan worden opgevolgd;
  // het akkoord voor contact staat bij het telefoonnummer.
  { id: 'voornaam', soort: 'tekst', vraag: 'Wat is je voornaam?', placeholder: 'Je voornaam' },
  { id: 'contact', soort: 'contact', vraag: 'Op welk nummer kan ik je appen?' },
  { id: 'email', soort: 'email', vraag: 'Wat is je e-mailadres?', placeholder: 'jouw@email.nl' },
  {
    id: 'leeftijd', soort: 'keuze', vraag: 'Hoe oud ben je?',
    opties: ['Onder 18', '18–24', '25–34', '35–44', '45–54', '55+'],
    afwijzen: (a) => (a === 'Onder 18' ? 'C' : null),
  },
  {
    id: 'doel', soort: 'keuze', vraag: 'Wat wil je de komende 6 weken het liefst bereiken?',
    opties: ['Buikvet kwijt', 'Vet verliezen en sterker worden', 'Spieren opbouwen', 'Fitter en meer energie'],
  },
  {
    id: 'kilos', soort: 'keuze', vraag: 'Hoeveel kilo wil je ongeveer kwijt?',
    opties: ['Niks, ik wil vooral sterker worden', '0–5', '5–10', '10–20', '20+'],
  },
  {
    id: 'vastlopen', soort: 'meerkeuze', vraag: 'Waar loop je nu het meest op vast?', hint: 'Meerdere antwoorden mogelijk',
    opties: ["'s Avonds snaaien", 'Weekenden en sociale momenten', 'Ik weet niet wat en hoeveel ik moet eten', 'Ik train, maar zie geen resultaat', 'Ik hou het een paar weken vol en dan stopt het', 'Te weinig tijd'],
  },
  {
    id: 'geprobeerd', soort: 'meerkeuze', vraag: 'Wat heb je al geprobeerd?', hint: 'Meerdere antwoorden mogelijk',
    opties: ['Zelf diëten', 'Calorieën tellen met een app', 'Personal trainer', 'Online coach', 'Nog niks'],
  },
  { id: 'waarom_nu', soort: 'lang', vraag: 'Waarom wil je dit juist nú aanpakken?', placeholder: 'Vertel kort wat er speelt' },
  {
    id: 'belang', soort: 'schaal', vraag: 'Hoe belangrijk is het voor je om dit de komende 6 weken op te lossen?',
    hint: '1 = niet zo belangrijk, 10 = heel belangrijk',
    afwijzen: (a) => (Number(a) <= 5 ? 'B' : null),
  },
  {
    id: 'trainen', soort: 'keuze', vraag: 'Hoe vaak per week kun je realistisch trainen?',
    opties: ['0–1x', '2x', '3x', '4x of meer'],
    afwijzen: (a) => (a === '0–1x' ? 'B' : null),
    afwijsTekst: 'Voor de challenge is minimaal 2x per week trainen nodig.',
  },
  {
    id: 'borg', soort: 'keuze', vraag: 'De challenge werkt met een borg die je terugkrijgt als je je aan de afspraken houdt. Sta je daarvoor open?',
    opties: ['Ja', 'Ik wil er eerst meer over horen', 'Nee'],
    afwijzen: (a) => (a === 'Nee' ? 'C' : null),
  },
]

