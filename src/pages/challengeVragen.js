// src/pages/challengeVragen.js
//
// De schermen van de prekwalificatie (/challenge/start en het blad op
// /challenge), los van de pagina zodat het coachscherm Ads dezelfde volgorde
// gebruikt voor het afhaken per vraag.
//
// 21 okt 2026: korter en makkelijker. Eerst vier vragen over jou, dan "je
// bent geschikt", dan kiezen: zelf inplannen of contact. De contactgegevens
// pas aan het eind, op één scherm. Weg: e-mail los, kilo's, waarom nu,
// belang, hoe vaak trainen en de borg (de borg was de grootste afhaker).
//
// `soort`: keuze | meerkeuze | info | gegevens
// `eigen`: placeholder van een open veld onder de keuzes (antwoord in <id>_eigen).
// `afwijzen(antwoord)` geeft 'B' of 'C' terug als deze keuze het einde is.
// `alleen(antw)`: scherm alleen tonen als dit waar is.
export const ROUTE_ZELF = 'Zelf een moment inplannen'
export const ROUTE_CONTACT = 'Neem contact met mij op'

const LASTIG_AFVALLEN = ["'s Avonds snaaien", 'Weekenden en sociale momenten', 'Ik weet niet wat en hoeveel ik moet eten', 'Ik hou het een paar weken vol en dan stopt het']
const LASTIG_SPIEREN = ['Ik train, maar groei nauwelijks', 'Genoeg eten zonder vet aan te komen', 'Ik weet niet welk schema bij mij past', 'Ik hou het een paar weken vol en dan stopt het']

// Opties van een vraag; sommige hangen af van een eerder antwoord.
export const optiesVan = (q, antw) => (typeof q.opties === 'function' ? q.opties(antw) : q.opties)

export const VRAGEN = [
  {
    id: 'doel', soort: 'keuze', vraag: 'Wat wil je de komende 6 weken bereiken?',
    opties: ['Buikvet kwijt', 'Vet verliezen en sterker worden', 'Spieren opbouwen', 'Fitter en meer energie'],
  },
  {
    id: 'vastlopen', soort: 'meerkeuze', vraag: 'Wat vind je nu lastig?', hint: 'Kies alles wat past',
    // Wie spieren wil opbouwen loopt op andere dingen vast dan wie vet wil
    // verliezen: eigen tak (21 okt 2026).
    opties: (antw) => (antw.doel === 'Spieren opbouwen' ? LASTIG_SPIEREN : LASTIG_AFVALLEN),
    // Vier keuzes plus een eigen antwoord; een van beide is genoeg.
    eigen: 'Iets anders, namelijk…',
  },
  {
    id: 'geprobeerd', soort: 'meerkeuze', vraag: 'Wat heb je al geprobeerd?', hint: 'Kies alles wat past',
    opties: ['Zelf diëten', 'Calorieën tellen met een app', 'Personal trainer', 'Online coach', 'Nog niks'],
  },
  {
    id: 'leeftijd', soort: 'keuze', vraag: 'Hoe oud ben je?',
    opties: ['Onder 18', '18–24', '25–34', '35–44', '45–54', '55+'],
    afwijzen: (a) => (a === 'Onder 18' ? 'C' : null),
  },
  { id: 'geschikt', soort: 'info', vraag: 'Je bent geschikt voor de challenge' },
  {
    id: 'route', soort: 'keuze', vraag: 'Hoe wil je verder?',
    opties: [ROUTE_ZELF, ROUTE_CONTACT],
  },
  {
    id: 'kanaal', soort: 'keuze', vraag: 'Hoe kan ik je het best bereiken?',
    opties: ['WhatsApp', 'Bellen', 'E-mail'],
    alleen: (antw) => antw.route === ROUTE_CONTACT,
  },
  { id: 'gegevens', soort: 'gegevens', vraag: 'Waar mag ik je bereiken?' },
]

// Welke gegevens het laatste scherm vraagt: e-mail voor zelf inplannen (dan
// staat die al in de agenda) en bij contact per mail, anders het nummer.
export const vraagtTelefoon = (antw) => antw.route === ROUTE_CONTACT && antw.kanaal !== 'E-mail'
