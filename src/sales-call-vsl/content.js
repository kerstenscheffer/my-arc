// Gedeelde content voor het "5 Uur Per Week Back In Shape" aanbod.
// Wordt zowel gebruikt door de publieke VSL-landing als de fullscreen
// sales-call presentatie, zodat de offer-tekst op één plek aangepast wordt.

export const BRAND = 'MY ARC COACHING'
export const OFFER_NAME = '5 Uur Per Week Back In Shape Systeem'

export const TAGLINE =
  'Ik help mannen met weinig tijd binnen 16 weken een sterk en strak lichaam opbouwen waar ze trots op zijn en waarin shirts weer goed passen — zonder dat hun leven om fitness draait.'

// VSL video config — zet `type: 'youtube'` en plak je YouTube video ID
// (of volledige URL) in `src` zodra de video klaar is. Tot die tijd laat
// de VSLPlayer-component een nette placeholder zien.
//
//   type:    null | 'youtube' | 'vimeo' | 'mp4'
//   src:     YouTube/Vimeo URL of ID, of /pad/naar/video.mp4
//   poster:  optionele thumbnail (alleen voor mp4)
export const VSL_VIDEO = {
  type: null,
  src: '',
  poster: '',
}

// CTA voor de publieke landing — verschijnt direct onder de video en
// onderaan de pagina als grote "Plan een call" knop.
export const CALENDLY_URL = 'https://calendly.com/kerstenscheffer/call-met-kersten'

// Voor wie — de pijn in nuchtere taal, zoals de doelgroep zichzelf
// herkent. Geen jargon, geen drama.
export const VOOR_WIE = {
  title: 'Herken je dit?',
  bullets: [
    'Je shirts zitten strakker dan een jaar geleden — schouders en buik vooral.',
    'Je werkt hard, eet "best oké", maar er verandert niks aan hoe je eruitziet.',
    'Je bent rond 19:00 thuis en hebt geen energie meer om te sporten.',
    'Verjaardagen en etentjes gooien je elke keer terug — of je slaat ze af om aan je doel te werken.',
    'Je denkt: "ik doe alles goed, waarom werkt het niet?"',
  ],
}

// Wat je bereikt — concreet, geen "ultiem fysiek" geneuzel.
export const BEREIKT = {
  title: 'Wat je hieraan overhoudt',
  bullets: [
    'Een lichaam waar je kleding weer normaal in zit — shirts vallen weer netjes.',
    'Niet meer hoeven verbergen op werk, verjaardagen of in de spiegel.',
    'Je voelt je sterker en lichter, ook in hoe je beweegt door je dag.',
    'Zekerheid hoe je gezond eet zonder dat het je sociale leven kost.',
    'En vooral: zonder dat fitness je hele leven overneemt.',
  ],
}

// De 5 systemen — elk lost minstens één echte objectie op.
// `belofte` = wat het systeem voor de klant doet, in één zin.
// `deliverables` = wat zit erin (concrete onderdelen die de klant krijgt).
// `highlight` = optioneel; markeert "grootste waarde" voor visuele nadruk.
export const SYSTEMEN = [
  {
    nr: '01',
    title: 'Eten Zonder Nadenken',
    belofte:
      'Precies weten hoeveel en wat je eet om in shape te komen — zonder zelf te rekenen, zonder weegschaal, zonder elke dag na te denken.',
    deliverables: [
      'Persoonlijk eetplan + macro\'s, voor jou uitgewerkt',
      'Maaltijden-database met swap-functie (vervang wat je niet lust)',
      'Loggen op bakjes en porties — geen weegschaal nodig',
      'Dagplanning op jouw werkritme',
      'Uitlegvideo\'s zodat je nooit vastloopt',
    ],
  },
  {
    nr: '02',
    title: 'Gewoon Meedoen',
    belofte:
      'Meedoen op verjaardagen, etentjes en met een biertje — zonder je resultaat te verpesten of de buitenstaander te zijn.',
    deliverables: [
      'Flex-regels cheatsheet voor sociale momenten',
      'Sociaal-scenario playbook (verjaardag, etentje, vakantie)',
      'Alcohol inrekenen zonder dat het je weekend kost',
      'Uit-eten-aanpak — wat te kiezen bij elke keuken',
      'WhatsApp-support voor acute momenten',
    ],
  },
  {
    nr: '03',
    title: 'Klaar Om Te Trainen',
    belofte:
      '3x per week trainen ingepast in je werkweek. Nooit hoeven bedenken wat te doen, en zien dat je vooruitgaat.',
    deliverables: [
      'Schema voorgeladen in de app — oefeningen, sets, gewicht',
      'Video-bibliotheek per oefening (techniek + uitvoering)',
      'Logging met vorige gewichten + progressie-suggesties',
      'Backup-workout voor drukke dagen',
      'PR-detectie — je ziet meteen wanneer je groeit',
    ],
  },
  {
    nr: '04',
    title: 'Zie Dat Het Werkt',
    belofte:
      'Week na week zwart-op-wit zien dat je op koers ligt — zodat schommelingen je niet ontmoedigen.',
    deliverables: [
      'Gewicht-tracking met weektrend + kleurcodering',
      'Verwachte trendlijn ernaast — je ziet of je voor of achter ligt',
      'Foto-upload elke 2 weken voor het echte beeld',
      'Dashboard met al je voortgang op één plek',
      'Herinneringen zodat je niks vergeet',
    ],
  },
  {
    nr: '05',
    title: 'Coach Naast Je',
    belofte:
      'Een echte coach die wekelijks meekijkt, bijstuurt en je erdoorheen trekt — zodat je nooit vastloopt zonder hulp.',
    deliverables: [
      'Wekelijkse data-review + bijsturing van je plan',
      '2-wekelijkse check-in call met mij persoonlijk',
      'WhatsApp-support op jouw vragen',
      'Call-samenvattingen zodat je niks vergeet',
      'Bad-day / terugval-aanpak — hoe je terugkomt na een mindere week',
    ],
    highlight: true,
  },
]

// Slide-tekst voor de "aanpak intro" op de call-presentatie.
export const AANPAK_INTRO = {
  title: 'De aanpak',
  subtitle: '5 systemen die elk een specifiek obstakel oplossen',
}

// Garantie — hele paragraaf als citaat, geen losse bullets.
export const GARANTIE = {
  title: '30-Dagen Garantie',
  text:
    'Train je 3x per week, eet je naar het plan en houd je contact met me? Dan garandeer ik je binnen 30 dagen zichtbaar verschil in hoe je shirts zitten. Zo niet, krijg je je volledige investering terug — en heb je 30 dagen coaching gehad voor niks.',
}

export const INVESTERING = {
  duur: '16 weken',
  prijs: '€997',
  // Korte, rustige onderbouwing — geen "normaal kost dit €1997!"-flauwekul.
  detail: 'Eenmalig, inclusief alles wat hierboven staat.',
}

export const AFSLUITING = {
  title: 'Klaar om te beginnen?',
  text: 'Plan een korte call in waarin we kijken of dit bij jou past — en zo ja, hoe we starten.',
}
