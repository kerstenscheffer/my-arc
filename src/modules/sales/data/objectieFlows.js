// src/modules/sales/data/objectieFlows.js
// Objectie handling flows voor Objectie Trainer
// Gebaseerd op MY ARC sales script

export const OBJECTIE_FLOWS = {
  geld: {
    id: 'geld',
    label: 'Veel Geld',
    emoji: '💰',
    objectie: 'Het is wel veel geld eigenlijk',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Het is wel veel geld eigenlijk'
      },
      {
        speaker: 'jij',
        text: 'Ja zeker weten man, het is ook veel geld. En weet je, dat is precies waarom ik weet dat dit gaat werken voor jou. De mensen die het BESTE resultaat halen zijn degenen die dit als een serieuze investering zien. Want wat denk je - als je €1050 in jezelf investeert, wat doet dat met hoe committed je bent?'
      },
      {
        speaker: 'lead',
        text: 'Ja, dan zou ik waarschijnlijk wel zo goed mogelijk mijn best doen.'
      },
      {
        speaker: 'jij',
        text: 'Tuurlijk, en wat denk je dat dat met jou resultaat en consistentie zou doen?'
      },
      {
        speaker: 'lead',
        text: 'Ja dan zou ik beter resultaat halen denk ik.'
      },
      {
        speaker: 'jij',
        text: 'Zeker weten. Zou dat het dan niet juist waard zijn?'
      },
      {
        speaker: 'lead',
        text: 'Ja, dat denk ik eigenlijk wel.'
      }
    ],
    
    returnText: 'Ja toch? Laten we dan gewoon beginnen, en als het toch niks is kun je altijd terug op de 28 dagen geld terug garantie goed?',
    
    tips: [
      'ACKNOWLEDGE: Bevestig dat het veel geld is - ontken het niet',
      'ASSOCIATE: Link naar beste klanten die ook zo dachten',
      'REFRAME: Van prijs naar commitment en resultaat',
      'Laat LEAD zelf de conclusie trekken (commitment → resultaat → waard)',
      'Gebruik 28 dagen garantie als safety net'
    ]
  },
  
  nadenken: {
    id: 'nadenken',
    label: 'Moet Nadenken',
    emoji: '🤔',
    objectie: 'Ik moet er nog even over nadenken',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Ik moet er nog even over nadenken'
      },
      {
        speaker: 'jij',
        text: 'Tuurlijk man, snap ik 100%. Eigenlijk laat dit zien dat je dit serieus neemt en geen impulsieve beslissing maakt - dat waardeer ik. Mag ik vragen, waar wil je specifiek over nadenken? Wat is je grootste zorg?'
      },
      {
        speaker: 'lead',
        text: 'Nou, het is wel een grote stap...'
      },
      {
        speaker: 'jij',
        text: 'Ja zeker, het is een grote stap. Maar we hebben net helder gemaakt dat je [DOEL] wilt bereiken, en dat je tegen [STRUGGLES] aanloopt. We zijn het eens dat dit programma die problemen oplost. Wat is er dan nog dat je tegenhoudt?'
      },
      {
        speaker: 'lead',
        text: 'Eigenlijk niks, als je het zo zegt.'
      }
    ],
    
    returnText: 'Ja toch? Dan laten we gewoon beginnen. Je hebt 28 dagen om te kijken of het bij je past, goed?',
    
    tips: [
      'ACKNOWLEDGE: Valideer dat nadenken normaal is',
      'ASSOCIATE: Dit laat zien dat ze serieus zijn (positief label)',
      'ASK: Vraag SPECIFIEK waar over - meeste mensen weten het niet',
      'RECAP: Doel + struggles + oplossing (logic check)',
      'GO DIRECT: "Wat houdt je dan nog tegen?"'
    ]
  },
  
  tijd: {
    id: 'tijd',
    label: 'Geen Tijd',
    emoji: '⏰',
    objectie: 'Ik heb eigenlijk niet genoeg tijd hiervoor',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Ik heb eigenlijk niet genoeg tijd hiervoor'
      },
      {
        speaker: 'jij',
        text: 'Ja snap ik man. Weet je, onze beste klanten - degenen met het meeste resultaat - hadden eigenlijk allemaal hetzelfde verhaal. Ze werkten 50-60u per week, net als jij. Mag ik vragen, hoeveel tijd denk je dat je per dag zou hebben?'
      },
      {
        speaker: 'lead',
        text: 'Maximaal een uurtje per dag ofzo'
      },
      {
        speaker: 'jij',
        text: 'Perfect, daar werken we gewoon mee. Het programma is juist gemaakt voor mensen met weinig tijd. Want als ik eerlijk ben, als je WEL tijd had maar geen plan, zou je dan resultaat halen?'
      },
      {
        speaker: 'lead',
        text: 'Nee, waarschijnlijk niet'
      },
      {
        speaker: 'jij',
        text: 'Precies. Dus het gaat niet om hoeveel tijd je hebt, maar hoe efficiënt je die tijd gebruikt toch? En wat denk je dat er gebeurt als je niks doet omdat je weinig tijd hebt?'
      },
      {
        speaker: 'lead',
        text: 'Dan blijft alles hetzelfde...'
      },
      {
        speaker: 'jij',
        text: 'Exact. En je gaf net aan dat je [DOEL] wilt bereiken en dat [IMPACT] je dagelijks raakt. Is dat het waard om uit te stellen?'
      },
      {
        speaker: 'lead',
        text: 'Nee, eigenlijk niet.'
      }
    ],
    
    returnText: 'Dan beginnen we toch gewoon? We maken het passend voor jouw schema, goed?',
    
    tips: [
      'ACKNOWLEDGE: Begrijp dat ze druk zijn',
      'ASSOCIATE: Beste klanten hadden ook weinig tijd (social proof)',
      'ASK: Hoeveel tijd hebben ze ECHT? (vaak meer dan ze denken)',
      'REFRAME: Tijd → Efficiency (plan vs geen plan)',
      'FLIP: Wat kost het om NIET te doen? (pijn amplificeren)',
      'FULL FLOW: Meer heen-en-weer, lead overtuigt zichzelf'
    ]
  },
  
  overleggen: {
    id: 'overleggen',
    label: 'Moet Overleggen',
    emoji: '👥',
    objectie: 'Ik moet dit nog even overleggen met mijn vriendin',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Ik moet dit nog even overleggen met mijn vriendin'
      },
      {
        speaker: 'jij',
        text: 'Ja tuurlijk, dat snap ik. Mag ik vragen, als zij ja zegt, ga je dan beginnen?'
      },
      {
        speaker: 'lead',
        text: 'Ja, dan wel denk ik'
      },
      {
        speaker: 'jij',
        text: 'Oké top. Wat denk je dat haar bezwaar zou kunnen zijn?'
      },
      {
        speaker: 'lead',
        text: 'Waarschijnlijk het geld, of de tijd die ik erin steek'
      },
      {
        speaker: 'jij',
        text: 'Helder. Als ik jou was, zou ik het zo framen: je investeert in jezelf om [DOEL] te bereiken, je wordt gezonder en gelukkiger, en dat komt jullie relatie ook ten goede. Plus je hebt 28 dagen garantie. Denk je dat ze dat zou snappen?'
      },
      {
        speaker: 'lead',
        text: 'Ja, zo had ik het nog niet bekeken. Dat is een goed punt.'
      }
    ],
    
    returnText: 'Zullen we dan vast beginnen en kun je het haar vanavond vertellen? Dan weet je dat je plek hebt.',
    
    tips: [
      'BINARY CHECK: Als zij ja zegt, begin jij dan? (commitment test)',
      'PRE-HANDLE: Vraag wat haar bezwaar zou zijn',
      'ARM THEM: Geef de pitch voor hun partner',
      'ASSUMPTIVE CLOSE: Vast beginnen, vanavond vertellen',
      'Gebruik garantie als safety net voor partner'
    ]
  },
  
  past_niet: {
    id: 'past_niet',
    label: 'Past Niet Bij Mij',
    emoji: '❌',
    objectie: 'Ik denk niet dat dit helemaal bij mij past',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Ik denk niet dat dit helemaal bij mij past'
      },
      {
        speaker: 'jij',
        text: 'Oké, ik hoor je. Weet je, meestal als iemand dit zegt is het niet dat het programma niet past, maar dat er een specifieke twijfel is. Mag ik vragen - wat past er volgens jou niet?'
      },
      {
        speaker: 'lead',
        text: 'Ik weet niet, het voelt gewoon niet helemaal goed'
      },
      {
        speaker: 'jij',
        text: 'Snap ik. Laat me checken: je wilt [DOEL] bereiken toch?'
      },
      {
        speaker: 'lead',
        text: 'Ja'
      },
      {
        speaker: 'jij',
        text: 'En je loopt tegen [STRUGGLES] aan, en dat heeft [IMPACT] op je leven?'
      },
      {
        speaker: 'lead',
        text: 'Ja, dat klopt'
      },
      {
        speaker: 'jij',
        text: 'En we zijn het eens dat dit programma die problemen oplost en je naar je doel brengt?'
      },
      {
        speaker: 'lead',
        text: 'Ja, dat wel'
      },
      {
        speaker: 'jij',
        text: 'Dan is het volgens mij niet dat het niet past, maar dat je ergens bang voor bent. Waar denk je?'
      },
      {
        speaker: 'lead',
        text: 'Eigenlijk niet, als je het zo zegt'
      }
    ],
    
    returnText: 'Ja toch? Dan laten we gewoon beginnen. Je kan altijd stoppen binnen 28 dagen, dus er is geen risico.',
    
    tips: [
      'ACKNOWLEDGE: Hoor wat ze zeggen',
      'ASSOCIATE: Meestal specifieke twijfel, niet hele programma',
      'ASK: Wat past SPECIFIEK niet? (vaak weten ze het niet)',
      'LOGIC CHECK: Recap doel → struggles → oplossing (alle 3 kloppen)',
      'GO TO FEAR: Als logica klopt = angst, niet "past niet"',
      'Vaak masker voor commitment angst'
    ]
  },
  
  niet_de_juiste: {
    id: 'niet_de_juiste',
    label: 'Niet Wie Je Zoekt',
    emoji: '🎯',
    objectie: 'Ik denk dat ik niet degene ben die je zoekt',
    
    flow: [
      {
        speaker: 'lead',
        text: 'Ik denk dat ik niet degene ben die je zoekt'
      },
      {
        speaker: 'jij',
        text: 'Oké, ik snap dat je dat denkt. Maar weet je, de mensen die het BESTE doen zijn juist degenen die in het begin denken dat ze niet de juiste zijn. Waarom denk je dat je niet de juiste bent?'
      },
      {
        speaker: 'lead',
        text: 'Nou, ik ben niet zo gemotiveerd als anderen denk ik'
      },
      {
        speaker: 'jij',
        text: 'Maar je zit nu hier in dit gesprek omdat je [DOEL] wilt bereiken toch? Dat ÍS motivatie.'
      },
      {
        speaker: 'lead',
        text: 'Ja, dat is waar'
      },
      {
        speaker: 'jij',
        text: 'Precies. En je hebt het geprobeerd op eigen houtje, maar het lukte niet vanwege [STRUGGLES]. Daarom ben je hier. Dat betekent niet dat je niet gemotiveerd bent, maar dat je de juiste hulp nodig hebt. En dat is precies waar ik voor ben.'
      },
      {
        speaker: 'lead',
        text: 'Zo had ik het nog niet bekeken'
      }
    ],
    
    returnText: 'Precies. Je bent perfect wie ik zoek: iemand die zijn doel wil bereiken maar de juiste aanpak mist. Zullen we beginnen?',
    
    tips: [
      'ACKNOWLEDGE: Begrijp hun twijfel',
      'ASSOCIATE: Beste klanten denken dit ook (positieve flip)',
      'REFRAME MOTIVATIE: In gesprek zitten = al gemotiveerd',
      'REFRAME STRUGGLES: Niet gefaald, verkeerde tools',
      'JIJ VULT GAP: Daarom besta ik - om die hulp te geven',
      'Bescherm hun ego - ze zijn niet het probleem'
    ]
  }
}

// Helpers
export const getObjectieFlow = (id) => OBJECTIE_FLOWS[id]
export const getAllObjectieFlows = () => Object.values(OBJECTIE_FLOWS)
