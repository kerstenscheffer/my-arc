// ========================================
// 📁 src/lead-magnet/data/personaData.js
// REWRITE — Mannen 18-25, vetverlies
// Quiz questions + scoring + persona content
// ========================================

export const QUIZ_QUESTIONS = [
  {
    key: 'pattern',
    question: 'Hoe ziet een gemiddelde eetdag er bij jou uit?',
    type: 'list',
    options: [
      { text: "Overdag weinig, 's avonds veel te veel", scores: { chaos: 3, kennis: 0, consistentie: 1, omgeving: 0 } },
      { text: "Gewoon wat ik tegenkom, zonder plan", scores: { chaos: 0, kennis: 3, consistentie: 0, omgeving: 0 } },
      { text: "Wisselend — de ene week goed, de andere niet", scores: { chaos: 0, kennis: 0, consistentie: 3, omgeving: 0 } },
      { text: "Doordeweeks oké, weekend alles eraf", scores: { chaos: 0, kennis: 0, consistentie: 0, omgeving: 3 } }
    ]
  },
  {
    key: 'tried',
    question: 'Wat heb je al geprobeerd?',
    type: 'list',
    options: [
      { text: "Meer trainen en hopen dat het genoeg is", scores: { chaos: 0, kennis: 2, consistentie: 1, omgeving: 0 } },
      { text: "Minder eten of maaltijden skippen", scores: { chaos: 3, kennis: 1, consistentie: 0, omgeving: 0 } },
      { text: "Een schema gevolgd maar niet volgehouden", scores: { chaos: 0, kennis: 0, consistentie: 3, omgeving: 0 } },
      { text: "Eigenlijk nooit echt een plan gehad", scores: { chaos: 0, kennis: 3, consistentie: 0, omgeving: 0 } }
    ]
  },
  {
    key: 'frustration',
    question: 'Waar baal je het meest van?',
    type: 'list',
    options: [
      { text: "Ik train maar zie niks veranderen", scores: { chaos: 1, kennis: 2, consistentie: 1, omgeving: 0 } },
      { text: "Ik weet niet wat of hoeveel ik moet eten", scores: { chaos: 0, kennis: 3, consistentie: 0, omgeving: 0 } },
      { text: "Ik kan het nooit langer dan 2 weken volhouden", scores: { chaos: 0, kennis: 0, consistentie: 3, omgeving: 0 } },
      { text: "Die buik is er nog steeds", scores: { chaos: 2, kennis: 1, consistentie: 1, omgeving: 0 } }
    ]
  },
  {
    key: 'goal',
    question: 'Wat wil je het liefst bereiken?',
    type: 'list',
    options: [
      { text: "Droger worden — buik weg", scores: { chaos: 2, kennis: 1, consistentie: 0, omgeving: 0 } },
      { text: "Weten wat ik moet eten zonder twijfelen", scores: { chaos: 0, kennis: 3, consistentie: 0, omgeving: 0 } },
      { text: "Eindelijk consistent blijven", scores: { chaos: 0, kennis: 0, consistentie: 3, omgeving: 0 } },
      { text: "Resultaat zien voor mijn werk in de gym", scores: { chaos: 1, kennis: 1, consistentie: 1, omgeving: 0 } }
    ]
  },
  {
    key: 'blocker',
    question: 'Wat maakt het lastig voor jou?',
    type: 'list',
    options: [
      { text: "Ik eet onregelmatig, soms te veel soms te weinig", scores: { chaos: 3, kennis: 0, consistentie: 0, omgeving: 0 } },
      { text: "Ik snap macro's en calorieën niet", scores: { chaos: 0, kennis: 3, consistentie: 0, omgeving: 0 } },
      { text: "Mijn motivatie zakt altijd weer weg", scores: { chaos: 0, kennis: 0, consistentie: 3, omgeving: 0 } },
      { text: "Weekenden, uitgaan en vrienden", scores: { chaos: 0, kennis: 0, consistentie: 0, omgeving: 3 } }
    ]
  }
]

export function calculatePersona(answers) {
  const totals = { chaos: 0, kennis: 0, consistentie: 0, omgeving: 0 }

  Object.values(answers).forEach(answer => {
    if (answer?.scores) {
      Object.entries(answer.scores).forEach(([key, val]) => {
        totals[key] += val
      })
    }
  })

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
  return sorted[0][0]
}

export const PERSONAS = {
  chaos: {
    slug: 'chaos-eter',
    title: 'De Chaos-eter',
    tagline: 'Je eet niet verkeerd — je eet op de verkeerde momenten.',
    color: '#e85d4a',
    description: 'Je kent het wel. Overdag eet je bijna niks — geen tijd, geen honger, geen zin. Maar zodra je thuiskomt explodeer je. Alles wat je tegenkomt gaat erin. De volgende dag probeer je het weer "goed te doen" door minder te eten. En zo draai je in een cirkel die je nooit dichter bij je doel brengt.',
    perceptions: [
      {
        myth: 'Ik moet gewoon minder eten',
        reality: 'Je eet juist te weinig overdag. Daardoor vreet je alles bij elkaar \'s avonds. Meer eten overdag = minder \'s avonds.'
      },
      {
        myth: 'Ik heb geen discipline',
        reality: 'Als je de hele dag niks eet heeft discipline er niks mee te maken. Je lichaam schreeuwt om energie. Fix je timing.'
      },
      {
        myth: 'Ik moet minder snacken',
        reality: 'Je snackt omdat je maaltijden niet op orde zijn. 3 goede maaltijden en je hebt geen trek meer \'s avonds.'
      }
    ],
    steps: [
      { title: 'Eet binnen 2 uur na opstaan', summary: 'Je lichaam heeft brandstof nodig. Skip geen ontbijt meer.' },
      { title: 'Bouw 3 vaste eetmomenten', summary: 'Ontbijt, lunch, diner. Simpel. Niet perfect, maar consistent.' },
      { title: 'Prep je avond van tevoren', summary: 'Weet wat je eet voordat je honger hebt. Dan kies je niet impulsief.' },
      { title: 'Eet genoeg eiwit per maaltijd', summary: 'Eiwit houdt je vol. 30g+ per maaltijd en je trek verdwijnt.' },
      { title: 'Bouw een 80/20 systeem', summary: '80% op schema, 20% flexibel. Geen perfectie nodig.' }
    ],
    quickWins: [
      'Eet morgenochtend een ontbijt met minstens 30g eiwit',
      'Zet vanavond je lunch voor morgen alvast klaar',
      'Drink 2 glazen water voordat je gaat snacken'
    ],
    pdfFile: 'https://drive.google.com/file/d/1rijlLsYgbs2AVDYstQiXCR43dsOQXBGr/view?usp=sharing'
  },

  kennis: {
    slug: 'blinde-eter',
    title: 'De Blinde Eter',
    tagline: 'Je weet niet wat je eet — en daarom verandert er niks.',
    color: '#2563eb',
    description: 'Je traint hard. Je doet je best. Maar je hebt eigenlijk geen idee hoeveel calorieën je eet, hoeveel eiwit je binnenkrijgt, of wat je macro\'s zijn. Je eet "gewoon wat" en hoopt dat het genoeg is. Maar hopen is geen strategie. Zonder de juiste kennis gooi je al je gym-resultaten weg.',
    perceptions: [
      {
        myth: 'Ik eet wel gezond dus het komt goed',
        reality: 'Gezond eten ≠ de juiste hoeveelheid eten. Je kunt gezond eten en alsnog te veel of te weinig binnenkrijgen.'
      },
      {
        myth: 'Macro\'s tellen is ingewikkeld',
        reality: 'Je hoeft niet alles te tellen. Alleen je eiwit en calorieën weten is al 80% van het werk.'
      },
      {
        myth: 'Ik moet een strikt dieet volgen',
        reality: 'Geen dieet nodig. Je moet gewoon weten wat je eet. Daarna maak je slimme keuzes zonder restricties.'
      }
    ],
    steps: [
      { title: 'Bereken je calorieën', summary: 'Weet hoeveel je nodig hebt. Niet gokken, weten.' },
      { title: 'Ken je eiwitdoel', summary: '2g per kg lichaamsgewicht. Dit is je belangrijkste nummer.' },
      { title: 'Leer 10 go-to maaltijden', summary: '10 maaltijden waarvan je de macro\'s kent. Meer heb je niet nodig.' },
      { title: 'Track 1 week', summary: 'Track 7 dagen alles wat je eet. Je schrikt van wat je ziet.' },
      { title: 'Bouw je eigen systeem', summary: 'Na 1 week tracken weet je genoeg om op gevoel verder te gaan.' }
    ],
    quickWins: [
      'Download MyFitnessPal en track vandaag alles wat je eet',
      'Zoek op hoeveel calorieën je favoriete maaltijd heeft',
      'Weeg je eten vanavond één keer af — je zult schrikken'
    ],
    pdfFile: 'https://drive.google.com/file/d/1oJ9y3MP4JbqLmJkJG7jVFTfH7QO6yVFs/view?usp=drive_link'
  },

  consistentie: {
    slug: 'herstarter',
    title: 'De Herstarter',
    tagline: 'Je start elke maandag opnieuw — en dat is precies het probleem.',
    color: '#7c3aed',
    description: 'Je kent het patroon. Maandag begin je gemotiveerd. Dinsdag gaat goed. Woensdag wordt het lastig. Donderdag skip je een maaltijd. Vrijdag denk je "volgende week weer." En maandag begint het opnieuw. Je mist geen motivatie — je mist een systeem dat werkt als je motivatie weg is.',
    perceptions: [
      {
        myth: 'Ik moet gewoon harder mijn best doen',
        reality: 'Harder proberen met hetzelfde plan geeft hetzelfde resultaat. Je hebt een makkelijker plan nodig, niet meer willskracht.'
      },
      {
        myth: 'Ik ben niet disciplined genoeg',
        reality: 'De meeste "disciplined" mensen hebben gewoon een simpeler systeem. Maak het zo makkelijk dat je het niet KAN vergeten.'
      },
      {
        myth: 'Ik moet alles perfect doen',
        reality: '80% consistent is beter dan 100% voor 3 dagen. Perfectie is de vijand van progressie.'
      }
    ],
    steps: [
      { title: 'Maak je plan 50% makkelijker', summary: 'Als je het niet volhoudt is het plan te moeilijk. Niet jij.' },
      { title: 'Begin met 1 gewoonte', summary: 'Niet alles tegelijk. Alleen je ontbijt op orde. 2 weken. Dan de volgende.' },
      { title: 'Plan je "slechte" dagen', summary: 'Weet dat vrijdag lastig wordt. Heb een plan B klaar.' },
      { title: 'Track je streaks', summary: 'Elke dag dat je je plan volgt = een streak. Je wilt die streak niet breken.' },
      { title: 'Bouw het langzaam op', summary: 'Week 1: ontbijt. Week 3: lunch erbij. Week 5: volledig. Zo houdt iedereen het vol.' }
    ],
    quickWins: [
      'Kies NU één ding dat je morgen gaat doen (niet 5 dingen)',
      'Leg je sportkleren vanavond al klaar',
      'Zet een herinnering op je telefoon voor je eerste maaltijd'
    ],
    pdfFile: 'https://drive.google.com/file/d/1MeaGg9ILvFU3L1OGd2hkTxm6_FRTaFuV/view?usp=sharing'
  },

  omgeving: {
    slug: 'weekendstrijder',
    title: 'De Weekendstrijder',
    tagline: 'Doordeweeks gaat het goed — in het weekend gooi je alles weg.',
    color: '#16a34a',
    description: 'Maandag t/m donderdag ben je on point. Je eet goed, je traint, je bent gefocused. Maar dan komt het weekend. Uitgaan met je maten, bier, snacks, pizza om 3 uur \'s nachts. Zondag herstel je. Maandag begin je weer. En netto kom je geen stap verder. Die 4 goede dagen worden steeds weer tenietgedaan door 3 slechte.',
    perceptions: [
      {
        myth: 'Ik moet stoppen met uitgaan',
        reality: 'Je hoeft niet te stoppen. Je moet leren hoe je uitgaat zonder alles weg te gooien. Slimme keuzes, niet geen keuzes.'
      },
      {
        myth: 'Bier maakt me dik',
        reality: 'Niet het bier is het probleem — het is de pizza, shoarma en snacks die erna komen. Fix de munchies, niet het bier.'
      },
      {
        myth: 'Mijn vrienden snappen het niet',
        reality: 'Je hoeft het niet uit te leggen. Bestel gewoon wat je wilt. Niemand let op wat jij drinkt of eet.'
      }
    ],
    steps: [
      { title: 'Bouw een weekendplan', summary: 'Weet van tevoren wat je eet op zaterdag en zondag. Niet improviseren.' },
      { title: 'Eet stevig voor je uitgaat', summary: 'Vol naar een feestje = minder shit eten. Simpel.' },
      { title: 'Kies je poison', summary: 'Bier OF snacks. Niet alles. Kies één ding en geniet ervan.' },
      { title: 'Zondag = resetdag', summary: 'Niet als straf maar als routine. Preppen, trainen, en klaar voor maandag.' },
      { title: 'Maak doordeweeks extra strak', summary: 'Als je weekend flexibel is, moet doordeweeks strak zijn. Dat is de deal.' }
    ],
    quickWins: [
      'Eet vanavond een extra grote maaltijd voor je de deur uitgaat',
      'Bestel bij je volgende keer uitgaan water tussen je drankjes door',
      'Prep zondagavond alvast 3 dagen aan lunches'
    ],
    pdfFile: 'https://drive.google.com/file/d/1v4iuvUDBaxPXP9wU5_H49eANqemjWNr9/view?usp=sharing'
  }
}
