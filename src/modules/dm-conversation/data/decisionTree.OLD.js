// src/modules/dm-conversation/data/decisionTree.js
// DECISION TREE V4.0 - WITH MESSAGE VARIANTS
// Integrated with 120+ messages from messageDatabase.js

// ICON MAPPING - Tone/Label to Lucide Icon
const TONE_ICON_MAP = {
  // Openers
  'Follow-back': 'UserPlus',
  'Profiel observatie': 'Eye',
  'Compliment A': 'ThumbsUp',
  'Compliment B': 'Award',
  'Compliment C': 'Star',
  'Fun fact hook': 'Lightbulb',
  'Direct value': 'Gift',
  'Story reply': 'MessageCircle',
  'Sport specifiek': 'Trophy',
  'Performance hook': 'Zap',
  'Follow-back algemeen': 'UserCheck',
  'Interesse check': 'Search',
  'Breed compliment': 'Heart',
  'Curiosity hook': 'HelpCircle',
  'Value first': 'TrendingUp',
  'Fun fact algemeen': 'Info',
  
  // Qualify
  'Huidige gewicht': 'Weight',
  'Hoeveel kilo': 'Target',
  'Hoe lang bezig': 'Clock',
  'Wat geprobeerd': 'List',
  'Grootste struggle': 'AlertCircle',
  'Voeding check': 'Utensils',
  'Sport routine': 'Calendar',
  'Training duur': 'Timer',
  'Schema': 'FileText',
  'Struggle': 'AlertTriangle',
  'Calorieën': 'Calculator',
  'Eiwit check': 'Beef',
  'Niveau check': 'BarChart',
  'Krachttraining?': 'Dumbbell',
  'Doelen': 'Target',
  'Empathie': 'Heart',
  'Wat doe je': 'ClipboardList',
  'Hoe lang vast': 'Lock',
  'Pain versterken': 'AlertOctagon',
  'Werkt het?': 'HelpCircle',
  'Resultaten': 'TrendingDown',
  'Tracking value': 'LineChart',
  'Gok vs zekerheid': 'Compass',
  'Waar hulp': 'LifeBuoy',
  'Optimalisatie': 'Settings',
  'Hoe lang geen resultaat': 'XCircle',
  'Frustratie schaal': 'Thermometer',
  'Impact leven': 'Users',
  'Toekomst scenario': 'FastForward',
  
  // Call Push
  'Hulp aanbieden': 'Hand',
  'Als je wilt': 'PhoneCall',
  'Quick call': 'Phone',
  'Value first': 'Sparkles',
  'Laten we bellen': 'PhoneForwarded',
  'Wanneer tijd': 'CalendarClock',
  'Dit is wat ik doe': 'Briefcase',
  'Situatie herkennen': 'CheckCircle',
  '15min vs typen': 'MessageSquare',
  'Sneller resultaat': 'Rocket',
  'Persoonlijk vs generic': 'UserCog',
  'Beperkte plekken': 'Clock',
  'Agenda vol': 'CalendarX',
  'Langer wachten': 'HourglassEmpty',
  
  // Bezwaren
  'Waar specifiek': 'MessageSquareQuestion',
  'Wat houdt tegen': 'ShieldQuestion',
  'Gratis reminder': 'Gift',
  'Respectvolle exit': 'LogOut',
  'Soft reminder': 'BellRing',
  '15min = Netflix': 'Tv',
  'Wanneer wel': 'CalendarCheck',
  'Prioriteit check': 'Flag',
  'Feedback loop': 'RefreshCw',
  'Exit': 'X',
  'Respect + hoe lang': 'Clock',
  'Tijd vs resultaat': 'Timer',
  'Shortcut': 'Zap',
  'Wat kost blijven': 'TrendingDown',
  'Investering frame': 'Coins',
  'Geld isoleren': 'DollarSign',
  'Waardevergelijking': 'Scale',
  'Feedback + exit': 'MessageCircleOff',
  'Wanneer later': 'CalendarDays',
  'Perfect moment': 'Clock',
  'Later = nooit': 'Ban',
  'Momentum verlies': 'TrendingDown',
  'Waarom call beter': 'PhoneCall',
  'Tijd efficiency': 'Gauge',
  'Complexity': 'Network',
  'Transparant': 'Eye',
  'Waarde eerst': 'Gift',
  'Respectvol': 'Heart',
  
  // Follow-up
  'Had je gezien': 'Eye',
  'Benieuwd': 'MessageCircleQuestion',
  'Reminder + waarde': 'BellPlus',
  'Andere vraag': 'HelpCircle',
  'Mocht gemist': 'Mail',
  'Andere hoek': 'CornerDownRight',
  'Social proof': 'Users',
  'Case study': 'FileBarChart',
  'Laatste soft': 'HandWaving',
  'Value drop': 'Gift',
  'Final goodbye': 'Handshake',
  
  // Waarde
  'Eiwit tip': 'Beef',
  'TDEE tip': 'Calculator',
  'Slaap tip': 'Moon',
  'Progressive overload': 'TrendingUp',
  'Consistency': 'Calendar',
  'Tracking tip': 'LineChart',
  'Hydration': 'Droplets',
  'Pre-workout timing': 'Clock',
  '80% keuken': 'Utensils',
  'Te weinig eten': 'AlertCircle',
  'Slaap = gains': 'Moon',
  'Compound ROI': 'BarChart3',
  'Protein timing': 'Clock',
  'Cardio gains': 'Activity',
  
  // Call Admin
  'Calendly link': 'Link',
  'Mail reminder': 'Mail',
  'Directe tijd': 'CalendarCheck',
  'Instagram call': 'Instagram',
  'Verwachting setting': 'ListChecks',
  'Dag van call': 'CalendarClock',
  'Ochtend reminder': 'BellRing',
  '1 uur voor': 'Clock',
  '30 min voor': 'Timer',
  'Laatste check': 'AlertCircle',
  'Gemist + curiosity': 'PhoneMissed',
  'Gemist + waarde': 'PhoneOff',
  'Geen Calendly': 'LinkOff',
  'Laatste kans': 'AlertTriangle',
  'Clean closure': 'CheckCircle2',
  'Client vraagt': 'MessageCircle',
  'Flexibel': 'Calendar',
  'Commitment check': 'ShieldCheck',
  'Geboekt lang geleden': 'CalendarSearch',
  'Check interesse': 'UserCheck',
  'Reconfirm + exit': 'CalendarX'
}

// Helper function to create variant with icon
function createVariant(id, label, text) {
  return {
    id,
    tone: label,
    text,
    icon: TONE_ICON_MAP[label] || 'MessageSquare'
  }
}

export const DECISION_TREE = {
  // ==========================================
  // OPENING NODES - Profile Type Selection
  // ==========================================
  
  start: {
    id: 'start',
    phase: 'opening',
    label: 'START - Profiel Type',
    description: 'Selecteer het profiel type van de lead',
    question: 'Welk type profiel heeft deze lead?',
    options: [
      { 
        id: 'dikker',
        label: '🔴 Dikker (Afvallen)',
        description: 'Lead wil afvallen / vet verliezen',
        nextNode: 'opening_dikker',
        keywords: ['afvallen', 'vet', 'dikker', 'gewicht kwijt', 'slanker']
      },
      { 
        id: 'dunner',
        label: '🔵 Dunner (Spieren)',
        description: 'Lead wil spiermassa opbouwen',
        nextNode: 'opening_dunner',
        keywords: ['spieren', 'bulken', 'massa', 'groter', 'sterker']
      },
      { 
        id: 'sporter',
        label: '⚽ Sporter (Prestatie)',
        description: 'Lead doet aan sport (voetbal, etc)',
        nextNode: 'opening_sporter',
        keywords: ['voetbal', 'sport', 'prestatie', 'atletisch']
      },
      { 
        id: 'neutral',
        label: '⚪ Neutraal (Onbekend)',
        description: 'Profiel geeft geen duidelijke indicatie',
        nextNode: 'opening_neutral',
        keywords: []
      }
    ],
    message: null,
    painKeywords: []
  },

  // ==========================================
  // OPENING - DIKKER (8 variants)
  // ==========================================
  
  opening_dikker: {
    id: 'opening_dikker',
    phase: 'opening',
    label: 'Opening - Dikker Profiel',
    description: 'Eerste contact met iemand die wil afvallen',
    question: 'Kies je opening message style:',
    message: {
      variants: [
        createVariant('o1', 'Follow-back', 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Waar ligt jouw interesse meer, afvallen of juist fitter worden?'),
        createVariant('o2', 'Profiel observatie', 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je ook bezig bent met fitter worden. Ben je al lang bezig?'),
        createVariant('o3', 'Compliment A', 'Heyy [naam]! Ik zag dat je ook flink aan het sporten bent, lekker bezig! 💪 Train je ergens voor op dit moment?'),
        createVariant('o4', 'Compliment B', 'Heyy [naam]! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Waar werk je naartoe qua doel?'),
        createVariant('o5', 'Compliment C', 'Heyy [naam]! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Wat is je grootste uitdaging op dit moment?'),
        createVariant('o6', 'Fun fact hook', 'Heyy [naam]! Ik zag dat je ook bezig bent met je fitter worden. Snel weetje voor jou: Wist je dat het grootste deel van vetverlies in de keuken gebeurt? En dat je deze week al vet kan gaan verliezen door een paar kleine veranderingen in je eten. Wil je weten welke?'),
        createVariant('o7', 'Direct value', 'Heyy [naam]! Ik kwam je insta tegen en zag dat je ook traint, lekker bezig man. 💪 Ik (en de meeste mannen) laten jaarlijks wel 5-10 kg gratis spiergroei liggen door een fout in hun eten. Ik stuur je graag welke fout dat is.'),
        createVariant('o8', 'Story reply', 'Lekker bezig man! 🔥 Waar train je voor?')
      ]
    },
    options: [
      { 
        id: 'afvallen',
        label: 'Wil afvallen',
        nextNode: 'qualify_afvallen',
        keywords: ['afvallen', 'kwijtraken', 'verliezen', 'slanker', 'lichter']
      },
      { 
        id: 'fitter',
        label: 'Algemeen fitter',
        nextNode: 'qualify_afvallen',
        keywords: ['fitter', 'gezonder', 'beter', 'conditie']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag1',
        keywords: []
      }
    ],
    painKeywords: ['vast', 'lukt niet', 'geen resultaat', 'frustratie', 'struggle']
  },

  // ==========================================
  // OPENING - DUNNER (8 variants)
  // ==========================================
  
  opening_dunner: {
    id: 'opening_dunner',
    phase: 'opening',
    label: 'Opening - Dunner Profiel',
    description: 'Eerste contact met iemand die wil groeien',
    question: 'Kies je opening message style:',
    message: {
      variants: [
        createVariant('o9', 'Follow-back', 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Waar ligt jouw interesse meer, sterker worden of juist meer massa opbouwen?'),
        createVariant('o10', 'Profiel observatie', 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je ook aan het trainen bent. Ben je al lang aan het trainen?'),
        createVariant('o11', 'Compliment A', 'Heyy [naam]! Ik zag dat je ook flink aan het trainen was, lekker bezig! 💪 Waar werk je naartoe, droger worden of spiermassa opbouwen?'),
        createVariant('o12', 'Compliment B', 'Heyy [naam]! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Train je al lang serieus?'),
        createVariant('o13', 'Compliment C', 'Heyy [naam]! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Ben je ook ergens naartoe aan het trainen? Een bepaald aantal kilo ofzo?'),
        createVariant('o14', 'Fun fact hook', 'Heyy [naam]! Ik zag dat je ook aan het trainen bent. Snel weetje voor jou: De meeste mannen die moeite hebben met spieropbouw eten simpelweg te weinig calorieën per dag. En dit is super makkelijk op te lossen met een paar kleine aanpassingen. Wil je weten hoe?'),
        createVariant('o15', 'Direct value', 'Heyy [naam]! Ik kwam je insta tegen en zag dat je ook traint, lekker bezig man. 💪 De meeste lichtere jongens laten jaarlijks wel 3-5 kg gratis spiergroei liggen omdat ze zo\'n 500-1000 kcal te weinig eten per dag. Wil je weten hoe je dit makkelijk kunt oplossen?'),
        createVariant('o16', 'Story reply', 'Lekker bezig man! 💪 Ben je ook aan het bulken op dit moment?')
      ]
    },
    options: [
      { 
        id: 'spieren',
        label: 'Wil spieren',
        nextNode: 'qualify_spieren',
        keywords: ['spieren', 'massa', 'groter', 'bulken', 'sterker']
      },
      { 
        id: 'algemeen',
        label: 'Algemeen trainen',
        nextNode: 'qualify_spieren',
        keywords: ['trainen', 'fit', 'gezond']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag1',
        keywords: []
      }
    ],
    painKeywords: ['kom niet aan', 'geen groei', 'blijf dun', 'lukt niet']
  },

  // ==========================================
  // OPENING - SPORTER (8 variants)
  // ==========================================
  
  opening_sporter: {
    id: 'opening_sporter',
    phase: 'opening',
    label: 'Opening - Sporter Profiel',
    description: 'Eerste contact met sporter (voetbal, etc)',
    question: 'Kies je opening message style:',
    message: {
      variants: [
        createVariant('o17', 'Follow-back', 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Ben je vooral bezig met voetbal of train je ook in de gym?'),
        createVariant('o18', 'Profiel observatie', 'Heyy [naam]! Ik kwam je profiel een paar dagen geleden tegen en zag dat je voetbalt. Hoe lang speel je al en op welk niveau?'),
        createVariant('o19', 'Compliment A', 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Doe je ook aan krachttraining naast je voetbal?'),
        createVariant('o20', 'Compliment B', 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Wat is je positie?'),
        createVariant('o21', 'Compliment C', 'Heyy [naam]! Ik zag dat je voetbalt, vet man! ⚽ Let je ook op je voeding of eet je gewoon wat je wilt?'),
        createVariant('o22', 'Sport specifiek', 'Heyy [naam]! Mooi om te zien dat je serieus bezig bent met je sport man. Doe je naast voetbal ook aan explosieve kracht training in de gym?'),
        createVariant('o23', 'Performance hook', 'Heyy [naam]! Ik zag dat je voetbalt. Snel weetje voor jou: De juiste voeding en krachttraining kunnen je prestaties op het veld enorm verbeteren. Dit doen topatleten anders dan de gemiddelde voetballer. Wil je weten wat precies?'),
        createVariant('o24', 'Story reply', 'Gave skills man! ⚽ Train je ook in de gym voor explosiviteit?')
      ]
    },
    options: [
      { 
        id: 'voetbal_focus',
        label: 'Focust op sport',
        nextNode: 'qualify_sport',
        keywords: ['voetbal', 'spelen', 'wedstrijd', 'team']
      },
      { 
        id: 'ook_gym',
        label: 'Ook gym training',
        nextNode: 'qualify_sport',
        keywords: ['gym', 'krachttraining', 'fitness']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag1',
        keywords: []
      }
    ],
    painKeywords: ['prestatie', 'snelheid', 'kracht', 'explosiviteit', 'blessure']
  },

  // ==========================================
  // OPENING - NEUTRAL (6 variants)
  // ==========================================
  
  opening_neutral: {
    id: 'opening_neutral',
    phase: 'opening',
    label: 'Opening - Neutraal Profiel',
    description: 'Eerste contact bij onduidelijk profiel',
    question: 'Kies je opening message style:',
    message: {
      variants: [
        createVariant('o25', 'Follow-back algemeen', 'Heyy [naam]! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Wat trok je aandacht, de trainingen of juist de voeding content?'),
        createVariant('o26', 'Interesse check', 'Heyy [naam]! Leuk profiel man. Ben je naast [activiteit op profiel] ook bezig met fitness of sporten?'),
        createVariant('o27', 'Breed compliment', 'Heyy [naam]! Gave feed man. Ben je zelf ook bezig met sporten of fitter worden?'),
        createVariant('o28', 'Curiosity hook', 'Heyy [naam]! Snel weetje voor jou: 90% van de mannen haalt hun fitness doelen niet door één simpele fout in hun aanpak. En dit is super makkelijk te voorkomen als je weet welke fout dit is. Wil je weten welke?'),
        createVariant('o29', 'Value first', 'Heyy [naam]! Ik help mannen met hun fitness doelen. Snelle vraag: ben je zelf ook bezig met trainen of gezonde voeding?'),
        createVariant('o30', 'Fun fact algemeen', 'Heyy [naam]! Interessante feed man. Random vraag voor je: als je zou moeten kiezen, waar ligt je interesse meer: training of voeding?')
      ]
    },
    options: [
      { 
        id: 'training',
        label: 'Interesse: Training',
        nextNode: 'qualify_spieren',
        keywords: ['training', 'trainen', 'gym', 'workout']
      },
      { 
        id: 'voeding',
        label: 'Interesse: Voeding',
        nextNode: 'qualify_afvallen',
        keywords: ['eten', 'voeding', 'dieet', 'calorieën']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag1',
        keywords: []
      }
    ],
    painKeywords: ['weet niet', 'geen idee', 'struggle']
  },

  // ==========================================
  // QUALIFY - AFVALLEN (7 variants + deepen variants)
  // ==========================================
  
  qualify_afvallen: {
    id: 'qualify_afvallen',
    phase: 'qualify',
    label: 'Qualify - Afvallen Doel',
    description: 'Verdiep in afval doelen en struggles',
    question: 'Kies je qualify vraag:',
    message: {
      variants: [
        createVariant('q1', 'Huidige gewicht', 'Ahh duidelijk man, top dat je ermee bezig bent. Heb je ook een streefgewicht?'),
        createVariant('q2', 'Hoeveel kilo', 'Nice dat je de stap zet man! Hoeveel kilo wil je kwijtraken?'),
        createVariant('q3', 'Hoe lang bezig', 'Nice dat je ermee bezig bent! Hoe lang ben je hier al mee bezig?'),
        createVariant('q4', 'Wat geprobeerd', 'Snap ik helemaal man. Wat heb je tot nu toe al geprobeerd om af te vallen?'),
        createVariant('q5', 'Grootste struggle', 'Herkenbaar man. Wat denk je dat je nu mist om dichter bij je doel te komen?'),
        createVariant('q6', 'Voeding check', 'Top dat je ermee aan de slag bent! Let je ook een beetje op hoeveel je eet of doe je dat nog meer op gevoel?'),
        createVariant('q7', 'Sport routine', 'Lekker bezig! Hoe vaak sport je nu ongeveer per week?')
      ]
    },
    options: [
      { 
        id: 'zit_vast',
        label: '🔴 Zit vast / geen resultaat',
        nextNode: 'qualify_vast',
        keywords: ['vast', 'lukt niet', 'geen resultaat', 'werkt niet', 'hetzelfde']
      },
      { 
        id: 'op_gevoel',
        label: '🟡 Doet het op gevoel',
        nextNode: 'qualify_gevoel',
        keywords: ['gevoel', 'ongeveer', 'niet precies', 'schat']
      },
      { 
        id: 'trackt',
        label: '🟢 Trackt al',
        nextNode: 'qualify_trackt',
        keywords: ['track', 'meten', 'bijhouden', 'app']
      },
      { 
        id: 'push_call',
        label: '➡️ Direct naar call push',
        nextNode: 'call_push_soft',
        keywords: []
      }
    ],
    painKeywords: ['vast', 'frustrerend', 'lukt niet', 'geen vooruitgang', 'hetzelfde gewicht']
  },

  // ==========================================
  // QUALIFY - SPIEREN (7 variants)
  // ==========================================
  
  qualify_spieren: {
    id: 'qualify_spieren',
    phase: 'qualify',
    label: 'Qualify - Spieren Doel',
    description: 'Verdiep in massa opbouw doelen',
    question: 'Kies je qualify vraag:',
    message: {
      variants: [
        createVariant('q8', 'Huidige gewicht', 'Ahh nice man, bulken is een goeie keuze 💪 Heb je ook een streefgewicht voor ogen?'),
        createVariant('q9', 'Hoeveel kilo', 'Lekker bezig! Hoeveel kilo wil je er precies bij hebben?'),
        createVariant('q10', 'Training duur', 'Top dat je ermee bezig bent! Hoe lang train je al serieus?'),
        createVariant('q11', 'Schema', 'Nice man! Welk trainingsschema volg je op dit moment?'),
        createVariant('q12', 'Struggle', 'Snap ik helemaal. Wat denk je dat je nu mist om dichter bij je doel te komen?'),
        createVariant('q13', 'Calorieën', 'Lekker bezig! Let je ook een beetje op hoeveel calorieën je eet of doe je dat nog meer op gevoel?'),
        createVariant('q14', 'Eiwit check', 'Top man! Heb je enig idee hoeveel gram eiwit je ongeveer binnenkrijgt per dag?')
      ]
    },
    options: [
      { 
        id: 'komt_niet_aan',
        label: '🔴 Komt niet aan',
        nextNode: 'qualify_vast',
        keywords: ['kom niet aan', 'geen groei', 'blijf hetzelfde', 'lukt niet']
      },
      { 
        id: 'op_gevoel',
        label: '🟡 Eet op gevoel',
        nextNode: 'qualify_gevoel',
        keywords: ['gevoel', 'ongeveer', 'niet precies']
      },
      { 
        id: 'trackt',
        label: '🟢 Trackt calorieën',
        nextNode: 'qualify_trackt',
        keywords: ['track', 'meten', 'app', 'myfitnesspal']
      },
      { 
        id: 'push_call',
        label: '➡️ Direct naar call push',
        nextNode: 'call_push_soft',
        keywords: []
      }
    ],
    painKeywords: ['kom niet aan', 'geen groei', 'te weinig', 'frustrerend']
  },

  // ==========================================
  // QUALIFY - SPORT (5 variants)
  // ==========================================
  
  qualify_sport: {
    id: 'qualify_sport',
    phase: 'qualify',
    label: 'Qualify - Sport Focus',
    description: 'Verdiep in sport prestatie doelen',
    question: 'Kies je qualify vraag:',
    message: {
      variants: [
        createVariant('q15', 'Niveau check', 'Ahh vet man! Op welk niveau speel je op dit moment?'),
        createVariant('q16', 'Krachttraining?', 'Nice! Doe je naast voetbal ook nog aan krachttraining in de gym?'),
        createVariant('q17', 'Voeding check', 'Top man! Let je ook een beetje op je voeding of eet je gewoon wat je wilt?'),
        createVariant('q18', 'Doelen', 'Gave dedication man! Waar werk je naartoe met voetbal?'),
        createVariant('q19', 'Performance hook', 'Mooi man! Wist je trouwens dat de juiste krachttraining en voeding je snelheid en explosiviteit flink kunnen verbeteren?')
      ]
    },
    options: [
      { 
        id: 'wil_beter',
        label: '🔴 Wil beter presteren',
        nextNode: 'qualify_vast',
        keywords: ['beter', 'sneller', 'sterker', 'explosief']
      },
      { 
        id: 'geen_voeding',
        label: '🟡 Let niet op voeding',
        nextNode: 'qualify_gevoel',
        keywords: ['wat ik wil', 'niet echt', 'soms']
      },
      { 
        id: 'doet_al_alles',
        label: '🟢 Doet al alles',
        nextNode: 'qualify_trackt',
        keywords: ['krachttraining', 'gezonde voeding', 'track']
      },
      { 
        id: 'push_call',
        label: '➡️ Direct naar call push',
        nextNode: 'call_push_soft',
        keywords: []
      }
    ],
    painKeywords: ['prestatie', 'snelheid', 'niet goed genoeg', 'verbeteren']
  },

  // ==========================================
  // QUALIFY SUB-FLOWS
  // ==========================================
  
  qualify_vast: {
    id: 'qualify_vast',
    phase: 'qualify',
    label: 'Qualify - Zit Vast (HIGH PAIN)',
    description: 'Lead heeft duidelijke struggle - verdiep pain',
    question: 'Kies pain deepening vraag:',
    message: {
      variants: [
        createVariant('q20', 'Empathie', 'Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan?'),
        createVariant('q21', 'Wat doe je', 'Snap ik helemaal. Wat doe je nu eigenlijk qua training en voeding?'),
        createVariant('q22', 'Hoe lang vast', 'Frustrerend man! Hoe lang zit je al ongeveer op hetzelfde gewicht?'),
        createVariant('q23', 'Voeding check', 'Herkenbaar. Let je een beetje op hoeveel je eet of doe je dat meer op gevoel?'),
        createVariant('q24', 'Pain versterken', 'Ja dat hoor ik vaker man. Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over 6 maanden staat?')
      ]
    },
    options: [
      { 
        id: 'deepen_more',
        label: 'Verdiep pain verder',
        nextNode: 'qualify_pain_deepen',
        keywords: ['frustrerend', 'lang al', 'weet niet meer']
      },
      { 
        id: 'ready_call',
        label: '➡️ Klaar voor call push',
        nextNode: 'call_push_direct',
        keywords: []
      }
    ],
    painKeywords: ['frustrerend', 'lang al', 'niks werkt', 'geen idee meer']
  },

  qualify_gevoel: {
    id: 'qualify_gevoel',
    phase: 'qualify',
    label: 'Qualify - Op Gevoel (MEDIUM PAIN)',
    description: 'Lead trackt niet - wijs op blinde vlek',
    question: 'Kies tracking value vraag:',
    message: {
      variants: [
        createVariant('q25', 'Werkt het?', 'Ahh oké snap ik! En werkt dat voor je? Zie je de resultaten die je wilt zien?'),
        createVariant('q26', 'Resultaten', 'Snap ik helemaal. Kom je wel vooruit of blijft het een beetje hetzelfde?'),
        createVariant('q27', 'Tracking value', 'Ja dat doen de meeste mensen man. Maar weet je wat? Wat je niet meet, kun je ook niet echt verbeteren. Herkenbaar?'),
        createVariant('q28', 'Gok vs zekerheid', 'Ahh oké! Maar zou je niet liever precies weten wat je moet doen in plaats van een beetje gokken?')
      ]
    },
    options: [
      { 
        id: 'geen_resultaat',
        label: '🔴 Geen resultaat → Pain deepen',
        nextNode: 'qualify_vast',
        keywords: ['niet echt', 'hetzelfde', 'weinig', 'lukt niet']
      },
      { 
        id: 'beetje_resultaat',
        label: '🟡 Beetje resultaat → Call push',
        nextNode: 'call_push_soft',
        keywords: ['beetje', 'soms', 'langzaam']
      },
      { 
        id: 'gaat_goed',
        label: '🟢 Gaat goed → Logical call',
        nextNode: 'call_push_logical',
        keywords: ['goed', 'prima', 'vooruitgang']
      }
    ],
    painKeywords: ['niet echt', 'hetzelfde', 'langzaam']
  },

  qualify_trackt: {
    id: 'qualify_trackt',
    phase: 'qualify',
    label: 'Qualify - Trackt Al',
    description: 'Lead is al bezig - check optimalisatie behoefte',
    question: 'Kies optimalisatie vraag:',
    message: {
      variants: [
        createVariant('q29', 'Compliment', 'Ahh nice man! Top dat je dat doet, de meeste mensen doen dat niet 💪 En hoe gaat het?'),
        createVariant('q30', 'Resultaat?', 'Respect man! Zie je de resultaten die je wilt zien of loopt het ergens een beetje vast?'),
        createVariant('q31', 'Waar hulp', 'Lekker bezig! Wat denk je dat je nu mist om dichter bij je doel te komen?'),
        createVariant('q32', 'Optimalisatie', 'Top dat je zo bezig bent man! Weet je zeker dat je op de juiste hoeveelheid calorieën zit voor je doel?')
      ]
    },
    options: [
      { 
        id: 'loopt_vast',
        label: '🔴 Loopt ergens vast',
        nextNode: 'qualify_vast',
        keywords: ['vast', 'niet helemaal', 'zou beter kunnen']
      },
      { 
        id: 'gaat_ok',
        label: '🟡 Gaat oké',
        nextNode: 'call_push_soft',
        keywords: ['goed', 'oké', 'prima']
      },
      { 
        id: 'wil_optimaliseren',
        label: '🟢 Wil optimaliseren',
        nextNode: 'call_push_logical',
        keywords: ['beter', 'optimaal', 'maximaal']
      }
    ],
    painKeywords: ['niet optimaal', 'kan beter', 'twijfel']
  },

  qualify_pain_deepen: {
    id: 'qualify_pain_deepen',
    phase: 'qualify',
    label: 'Pain Deepening - Maximum Impact',
    description: 'Maximale pain versterking voor ready leads',
    question: 'Kies ultimate pain vraag:',
    message: {
      variants: [
        createVariant('q33', 'Hoe lang geen resultaat', 'Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan zonder vooruitgang?'),
        createVariant('q34', 'Wat geprobeerd', 'Frustrerend! Wat heb je allemaal al geprobeerd om het te fixen?'),
        createVariant('q35', 'Frustratie schaal', 'Snap ik helemaal man. Op een schaal van 1-10, hoe frustrerend is dit eigenlijk voor je?'),
        createVariant('q36', 'Impact leven', 'Ja dat snap ik man. Heeft dit ook een beetje impact op hoe je je voelt over jezelf?'),
        createVariant('q37', 'Toekomst scenario', 'Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over een jaar staat? Nog steeds hetzelfde?')
      ]
    },
    options: [
      { 
        id: 'ready',
        label: '➡️ READY - Direct call push',
        nextNode: 'call_push_direct',
        keywords: []
      }
    ],
    painKeywords: ['maanden', 'jaar', 'alles geprobeerd', 'frustrerend', 'impact']
  },

  // ==========================================
  // CALL PUSH NODES
  // ==========================================
  
  call_push_soft: {
    id: 'call_push_soft',
    phase: 'call_push',
    label: 'Call Push - Soft Approach',
    description: 'Zachte call invitation voor medium pain leads',
    question: 'Kies soft call push:',
    message: {
      variants: [
        createVariant('cp1', 'Hulp aanbieden', 'Duidelijk, dit is precies waar ik mensen mee help man. Ik kan wel even kort meekijken op een call om te kijken wat jij nodig hebt om door te gaan naar je doel. Zou je dat handig vinden?'),
        createVariant('cp2', 'Als je wilt', 'Weet je wat, als je wilt kan ik je even op weg helpen. Ik help vaker jongens die een beetje vastlopen met dit soort dingen. Gewoon 15 minuutjes bellen, zou dat helpen denk je?'),
        createVariant('cp3', 'Quick call', 'Snap ik helemaal man. Ik kan deze week wel even 15 minuutjes op een call springen, dan wil ik je wel uitleggen wat je moet doen om vooruit te komen. Zou je dat handig vinden?'),
        createVariant('cp4', 'Value first', 'Duidelijk, ik zie denk ik waar je vast loopt. Misschien handig om deze week kort te bellen, dan leg ik je even uit wat je nodig hebt om naar je doel te komen. Vind je dat handig?')
      ]
    },
    options: [
      { 
        id: 'ja',
        label: '✅ Ja, wil bellen',
        nextNode: 'call_admin_booking',
        keywords: ['ja', 'graag', 'goed idee', 'handig']
      },
      { 
        id: 'nadenken',
        label: '🤔 Moet nadenken',
        nextNode: 'bezwaar_nadenken',
        keywords: ['nadenken', 'denk', 'weet niet']
      },
      { 
        id: 'geen_tijd',
        label: '⏰ Geen tijd',
        nextNode: 'bezwaar_geen_tijd',
        keywords: ['druk', 'tijd', 'geen tijd', 'vol']
      },
      { 
        id: 'via_chat',
        label: '💬 Liever via chat',
        nextNode: 'bezwaar_via_chat',
        keywords: ['chat', 'typen', 'hier']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag1',
        keywords: []
      }
    ],
    painKeywords: []
  },

  call_push_direct: {
    id: 'call_push_direct',
    phase: 'call_push',
    label: 'Call Push - Direct Approach',
    description: 'Directe call push voor high pain leads',
    question: 'Kies directe call push:',
    message: {
      variants: [
        createVariant('cp5', 'Laten we bellen', 'Weet je wat, laten we gewoon even bellen man. Dan kan ik je situatie beter begrijpen en precies kijken of en hoe ik je kan helpen. Wanneer zou je kunnen deze week?'),
        createVariant('cp6', 'Wanneer tijd', 'Dit is precies waar ik goed in ben man. Wanneer heb je deze week ongeveer 15 minuutjes? Dan bel ik je even.'),
        createVariant('cp7', 'Dit is wat ik doe', 'Oké luister, dit is letterlijk wat ik de hele dag doe man. Laten we bellen, dan leg ik je precies uit hoe we dit kunnen oplossen. Vandaag of morgen?'),
        createVariant('cp8', 'Situatie herkennen', 'Ja zie je, dit is precies waar veel jongens tegenaan lopen. Laten we even bellen, dan help ik je op weg. Welke dag zou kunnen?')
      ]
    },
    options: [
      { 
        id: 'ja',
        label: '✅ Ja, wanneer',
        nextNode: 'call_admin_booking',
        keywords: ['ja', 'wanneer', 'oké', 'prima']
      },
      { 
        id: 'bezwaar',
        label: '❌ Bezwaar',
        nextNode: 'bezwaar_handler',
        keywords: ['maar', 'weet niet', 'later']
      }
    ],
    painKeywords: []
  },

  call_push_logical: {
    id: 'call_push_logical',
    phase: 'call_push',
    label: 'Call Push - Logical Frame',
    description: 'Logische argumenten voor call',
    question: 'Kies logische call push:',
    message: {
      variants: [
        createVariant('cp9', '15min vs typen', 'Ik kan je hier uren over typen man, maar een call van 15 minuten is echt veel effectiever. Dan kan ik doorvragen en je direct op maat helpen met jouw situatie. Ben je daar voor open?'),
        createVariant('cp10', 'Sneller resultaat', 'Kijk, je kunt zelf blijven uitzoeken en hopen dat het werkt. Of je belt me even en dan weet je binnen 15 minuten precies wat je moet doen. Wat lijkt jou slimmer?'),
        createVariant('cp11', 'Persoonlijk vs generic', 'Via chat kan ik je alleen maar generic tips geven man. In een gesprek kan ik echt ingaan op jouw specifieke situatie. 15 minuutjes bellen?')
      ]
    },
    options: [
      { 
        id: 'ja_logisch',
        label: '✅ Logisch, ja',
        nextNode: 'call_admin_booking',
        keywords: ['ja', 'logisch', 'goed punt', 'waar']
      },
      { 
        id: 'bezwaar',
        label: '❌ Toch bezwaar',
        nextNode: 'bezwaar_handler',
        keywords: ['maar', 'toch', 'liever']
      }
    ],
    painKeywords: []
  },

  call_push_urgency: {
    id: 'call_push_urgency',
    phase: 'call_push',
    label: 'Call Push - Urgency Frame',
    description: 'Urgentie creëren voor beslissing',
    question: 'Kies urgency push:',
    message: {
      variants: [
        createVariant('cp12', 'Beperkte plekken', 'Ik heb deze week nog maar een paar plekken vrij man. Als je het echt wilt fixen, laten we dan nu een moment prikken. Welke dag zou kunnen?'),
        createVariant('cp13', 'Agenda vol', 'Mijn agenda zit bijna vol deze week man. Ik kan je er nog tussen proppen op [dag] om [tijd]. Zou dat kunnen voor jou?'),
        createVariant('cp14', 'Langer wachten', 'Snap ik man. Maar wees eerlijk: hoe langer je wacht, hoe langer je zonder resultaat blijft zitten. Laten we het gewoon nu regelen?')
      ]
    },
    options: [
      { 
        id: 'ja_urgency',
        label: '✅ Ja, nu plannen',
        nextNode: 'call_admin_booking',
        keywords: ['ja', 'oké', 'nu', 'vandaag']
      },
      { 
        id: 'later',
        label: '⏰ Toch later',
        nextNode: 'bezwaar_later',
        keywords: ['later', 'volgende week', 'wacht']
      }
    ],
    painKeywords: []
  },

  // ==========================================
  // BEZWAAR HANDLING NODES
  // ==========================================
  
  bezwaar_handler: {
    id: 'bezwaar_handler',
    phase: 'bezwaar',
    label: 'Bezwaar Handler - Router',
    description: 'Route naar specifiek bezwaar type',
    question: 'Welk bezwaar heeft de lead?',
    options: [
      { 
        id: 'nadenken',
        label: '🤔 Moet nadenken',
        nextNode: 'bezwaar_nadenken',
        keywords: ['nadenken', 'denk', 'overwegen']
      },
      { 
        id: 'geen_tijd',
        label: '⏰ Geen tijd',
        nextNode: 'bezwaar_geen_tijd',
        keywords: ['druk', 'tijd', 'geen tijd']
      },
      { 
        id: 'zelf_proberen',
        label: '💪 Zelf proberen',
        nextNode: 'bezwaar_zelf_proberen',
        keywords: ['zelf', 'proberen', 'eerst']
      },
      { 
        id: 'te_duur',
        label: '💰 Te duur',
        nextNode: 'bezwaar_te_duur',
        keywords: ['duur', 'geld', 'kosten', 'prijs']
      },
      { 
        id: 'later',
        label: '📅 Later',
        nextNode: 'bezwaar_later',
        keywords: ['later', 'volgende week', 'maand']
      },
      { 
        id: 'via_chat',
        label: '💬 Via chat',
        nextNode: 'bezwaar_via_chat',
        keywords: ['chat', 'typen', 'dm']
      },
      { 
        id: 'sales_pitch',
        label: '🎯 Denkt sales pitch',
        nextNode: 'bezwaar_sales_pitch',
        keywords: ['verkopen', 'sales', 'pitch']
      }
    ],
    message: null,
    painKeywords: []
  },

  bezwaar_nadenken: {
    id: 'bezwaar_nadenken',
    phase: 'bezwaar',
    label: 'Bezwaar - Moet Nadenken',
    description: 'Handle twijfel en nadenken bezwaar',
    question: 'Kies nadenken response:',
    message: {
      variants: [
        createVariant('b1', 'Waar specifiek', 'Snap ik helemaal man! Kun je mij vertellen waar je over na moet denken? Dan neem ik dat mee en zorg ik dat ik dat verwerk in mijn volgende dm-gesprek.'),
        createVariant('b2', 'Wat houdt tegen', 'Dat is goed man, neem rustig de tijd. Mag ik vragen waar je aan twijfelt? Dan neem ik dat mee en zorg ik dat ik dat verwerk in mijn volgende dm-gesprek.'),
        createVariant('b3', 'Gratis reminder', 'Ahh oké snap ik. Bedenk wel: Je liep tegen [probleem x] en [probleem y] aan. In de call wilde ik je uitleggen hoe je dit kunt fixen en hoe ik je hierbij zou helpen. Na het gesprek loop je weg met een plan of met de begeleiding die je naar je doel brengt. Klinkt dat fair?'),
        createVariant('b4', 'Respectvolle exit', 'Ahh oké man, snap ik. Dan laat ik het hierbij. Mocht je ooit wel bereid zijn 15 minuten te investeren om erachter te komen waar je tegenaan loopt en hoe je dit kunt fixen, kun je mij een berichtje sturen. Ik kan je hier goed bij helpen en doe het graag.'),
        createVariant('b5', 'Soft reminder', 'Helemaal goed man. Als je alsnog interesse hebt, laat het weten. De 15 minuten zijn gratis en je bent nergens toe verplicht. Gewoon kijken of ik je kan helpen.')
      ]
    },
    options: [
      { 
        id: 'alsnog_ja',
        label: '✅ Alsnog ja',
        nextNode: 'call_admin_booking',
        keywords: ['oké', 'ja', 'toch']
      },
      { 
        id: 'blijft_nee',
        label: '❌ Blijft nee',
        nextNode: 'follow_up_dag3',
        keywords: ['nee', 'niet', 'later']
      },
      { 
        id: 'geen_antwoord',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag3',
        keywords: []
      }
    ],
    painKeywords: []
  },

  bezwaar_geen_tijd: {
    id: 'bezwaar_geen_tijd',
    phase: 'bezwaar',
    label: 'Bezwaar - Geen Tijd',
    description: 'Handle geen tijd bezwaar',
    question: 'Kies geen tijd response:',
    message: {
      variants: [
        createVariant('b6', '15min = Netflix', 'Snap ik man, iedereen is druk. Maar even eerlijk: 15 minuten is letterlijk minder dan één Netflix aflevering. Kun je dat echt niet ergens vinden?'),
        createVariant('b7', 'Wanneer wel', 'Ahh oké geen probleem man! Wanneer zou volgende week dan wel kunnen voor je? Dan plannen we hem gewoon wat later in.'),
        createVariant('b8', 'Prioriteit check', 'Snap ik helemaal. Maar is "geen tijd" niet eigenlijk "geen prioriteit"? Even eerlijk: wil je resultaat of blijf je liever bij hoe het nu gaat?'),
        createVariant('b9', 'Feedback loop', 'Oké snap ik man. Mag ik vragen: Is het echt geen tijd, of voel je je niet klaar voor een gesprek? Dan neem ik dat mee voor een volgende keer.'),
        createVariant('b10', 'Exit', 'Ahh oké man, begrijpelijk. Dan laat ik het hierbij. Als je ooit wel 15 minuten vindt om erachter te komen hoe je je doel bereikt, laat het maar weten.')
      ]
    },
    options: [
      { 
        id: 'vindt_tijd',
        label: '✅ Vindt toch tijd',
        nextNode: 'call_admin_booking',
        keywords: ['volgende week', 'maandag', 'dinsdag']
      },
      { 
        id: 'blijft_druk',
        label: '❌ Blijft druk',
        nextNode: 'follow_up_dag7',
        keywords: ['echt druk', 'geen tijd', 'sorry']
      }
    ],
    painKeywords: []
  },

  bezwaar_zelf_proberen: {
    id: 'bezwaar_zelf_proberen',
    phase: 'bezwaar',
    label: 'Bezwaar - Zelf Proberen',
    description: 'Handle "ik probeer het zelf" bezwaar',
    question: 'Kies zelf proberen response:',
    message: {
      variants: [
        createVariant('b11', 'Respect + hoe lang', 'Respect dat je het zelf wilt proberen man. Mag ik vragen: hoe lang doe je dat nu al? En hoe gaat het tot nu toe?'),
        createVariant('b12', 'Tijd vs resultaat', 'Fair enough man! Maar even eerlijk: als het over 3 maanden nog steeds niet werkt, heb je wel 3 maanden verspild. Waarom niet eerst even 15 minuten investeren om te weten of je de juiste richting opgaat?'),
        createVariant('b13', 'Shortcut', 'Snap ik helemaal. Maar waarom trial & error doen als je in 15 minuten de shortcut kunt krijgen? Je bespaart jezelf echt maanden frustratie man.'),
        createVariant('b14', 'Feedback loop', 'Oké snap ik man. Kun je mij wel vertellen wat je precies zelf gaat proberen? Dan kan ik je alvast zeggen of je de juiste richting opgaat.'),
        createVariant('b15', 'Exit', 'Helemaal goed man, doe je ding. Mocht je er over een paar weken achter komen dat het niet werkt, laat het maar weten. Dan help ik je alsnog.')
      ]
    },
    options: [
      { 
        id: 'toch_hulp',
        label: '✅ Toch hulp',
        nextNode: 'call_admin_booking',
        keywords: ['oké', 'misschien', 'goed punt']
      },
      { 
        id: 'blijft_zelf',
        label: '❌ Blijft zelf doen',
        nextNode: 'follow_up_dag7',
        keywords: ['zelf', 'eerst', 'proberen']
      }
    ],
    painKeywords: []
  },

  bezwaar_te_duur: {
    id: 'bezwaar_te_duur',
    phase: 'bezwaar',
    label: 'Bezwaar - Te Duur',
    description: 'Handle prijs bezwaar',
    question: 'Kies prijs response:',
    message: {
      variants: [
        createVariant('b16', 'Wat kost blijven', 'Snap ik man. Maar even eerlijk: wat kost het je eigenlijk om nog een jaar zonder resultaat te blijven? Geen vooruitgang, geen zelfvertrouwen? Dat is toch ook een prijs?'),
        createVariant('b17', 'Investering frame', 'Fair point man. Maar dit is wel een investering in je lichaam en gezondheid voor de rest van je leven. Hoeveel geef je per maand uit aan uitgaan of eten bestellen? Dit is gewoon een andere keuze.'),
        createVariant('b18', 'Geld isoleren', 'Oké snap ik helemaal. Maar stel dat geld geen issue was - zou je het dan wel doen? Want dan is geld niet het echte bezwaar.'),
        createVariant('b19', 'Waardevergelijking', 'Begrijpelijk man. Maar wat is je lichaam en gezondheid je eigenlijk waard? Dit is geen uitgave, dit is een investering die je je hele leven bij blijft.'),
        createVariant('b20', 'Feedback + exit', 'Ahh oké man, snap ik. Mag ik vragen wat voor jou wel een redelijke investering zou zijn in je gezondheid? Dan neem ik dat mee voor de toekomst.')
      ]
    },
    options: [
      { 
        id: 'ziet_waarde',
        label: '✅ Ziet waarde',
        nextNode: 'call_admin_booking',
        keywords: ['waar', 'punt', 'misschien']
      },
      { 
        id: 'blijft_duur',
        label: '❌ Blijft te duur',
        nextNode: 'end_lost_price',
        keywords: ['te duur', 'niet', 'geld']
      }
    ],
    painKeywords: []
  },

  bezwaar_later: {
    id: 'bezwaar_later',
    phase: 'bezwaar',
    label: 'Bezwaar - Later',
    description: 'Handle "later" uitstel bezwaar',
    question: 'Kies later response:',
    message: {
      variants: [
        createVariant('b21', 'Wanneer later', 'Snap ik man! Maar wanneer is "later" precies voor jou? Over een maand? Drie maanden? Eerlijk: is later niet gewoon een nette manier om nooit te zeggen?'),
        createVariant('b22', 'Perfect moment', 'Oké man. Maar wees eerlijk: komt er ooit een perfect moment? Of is het altijd wel ergens druk?'),
        createVariant('b23', 'Later = nooit', 'Respect man. Maar ik ga eerlijk zijn: "later" wordt in 90% van de gevallen gewoon nooit. Over een jaar wil je dan nog steeds hetzelfde zeggen? Of wil je dan echt resultaat zien?'),
        createVariant('b24', 'Momentum verlies', 'Snap ik helemaal. Bedenk wel: je hebt nu momentum en motivatie. Over een maand is dat waarschijnlijk weg en begin je weer vanaf nul. Weet je dat zeker?'),
        createVariant('b25', 'Exit', 'Ahh oké man, begrijpelijk. Dan laat ik het hierbij. Als "later" ooit "nu" wordt, laat het maar weten. Dan help ik je alsnog graag.')
      ]
    },
    options: [
      { 
        id: 'toch_nu',
        label: '✅ Toch nu',
        nextNode: 'call_admin_booking',
        keywords: ['oké', 'punt', 'nu']
      },
      { 
        id: 'echt_later',
        label: '⏰ Echt later',
        nextNode: 'follow_up_dag14',
        keywords: ['later', 'volgende maand', 'wacht']
      }
    ],
    painKeywords: []
  },

  bezwaar_via_chat: {
    id: 'bezwaar_via_chat',
    phase: 'bezwaar',
    label: 'Bezwaar - Via Chat',
    description: 'Handle "liever via chat" bezwaar',
    question: 'Kies via chat response:',
    message: {
      variants: [
        createVariant('b26', 'Waarom call beter', 'Snap ik helemaal man! Maar eerlijk gezegd kan ik je via chat niet zo goed helpen. In een gesprek kan ik doorvragen, precies horen wat er speelt, en je echt op maat advies geven. Dat lukt via tekst gewoon niet goed.'),
        createVariant('b27', 'Tijd efficiency', 'Ja dat zou kunnen man, maar dan wordt het zo\'n lange lap tekst heen en weer. In 15 minuten bellen krijg je echt veel meer waarde dan 20 berichten sturen. Trust me.'),
        createVariant('b28', 'Persoonlijk vs generic', 'Via chat kan ik je alleen maar generic tips geven man. In een gesprek kan ik echt ingaan op jouw specifieke situatie en doorvragen waar nodig. Dat maakt het verschil.'),
        createVariant('b29', 'Complexity', 'Snap ik, maar wat je tegenaan loopt is te complex voor chat man. Ik moet kunnen doorvragen om te begrijpen waar het precies mis gaat. 15 minuten bellen is echt de moeite waard.'),
        createVariant('b30', 'Exit', 'Ahh oké man, snap ik. Dan laat ik het hierbij. Mocht je ooit wel 15 minuten willen investeren voor een echt op maat advies, laat het maar weten.')
      ]
    },
    options: [
      { 
        id: 'ziet_punt',
        label: '✅ Ziet het punt',
        nextNode: 'call_admin_booking',
        keywords: ['oké', 'snap', 'punt']
      },
      { 
        id: 'blijft_chat',
        label: '💬 Blijft chat willen',
        nextNode: 'end_lost_chat',
        keywords: ['liever', 'chat', 'typen']
      }
    ],
    painKeywords: []
  },

  bezwaar_sales_pitch: {
    id: 'bezwaar_sales_pitch',
    phase: 'bezwaar',
    label: 'Bezwaar - Denkt Sales Pitch',
    description: 'Handle "dit is een sales pitch" bezwaar',
    question: 'Kies transparantie response:',
    message: {
      variants: [
        createVariant('b31', 'Transparant', 'Eerlijk: na de call kan ik je misschien iets aanbieden als ik denk dat ik je kan helpen. Maar de call zelf is gewoon gratis en je bent nergens toe verplicht. We kijken gewoon eerst of het past.'),
        createVariant('b32', 'Waarde eerst', 'Nee man, het is echt gewoon om te kijken of ik je kan helpen. Als het niks voor je is, prima. Als ik denk dat ik je kan helpen, vertel ik je hoe. No pressure.'),
        createVariant('b33', 'Feedback loop', 'Oké snap ik man. Mag ik vragen wat je precies verwacht van de call? Dan kan ik je nu al zeggen of het matcht met wat ik doe.'),
        createVariant('b34', 'Respectvol', 'Fair enough man. Ik push je nergens in. De meeste jongens vinden het gewoon handig om duidelijkheid te krijgen, maar als je dat niet wilt is dat ook prima.')
      ]
    },
    options: [
      { 
        id: 'vertrouwt_het',
        label: '✅ Vertrouwt het',
        nextNode: 'call_admin_booking',
        keywords: ['oké', 'snap', 'prima']
      },
      { 
        id: 'blijft_wantrouwen',
        label: '❌ Blijft wantrouwen',
        nextNode: 'end_lost_trust',
        keywords: ['verkopen', 'sales', 'niet']
      }
    ],
    painKeywords: []
  },

  // ==========================================
  // CALL ADMIN NODES
  // ==========================================
  
  call_admin_booking: {
    id: 'call_admin_booking',
    phase: 'call_admin',
    label: 'Call Admin - Booking',
    description: 'Calendly link + bevestiging',
    question: 'Stuur booking link:',
    message: {
      variants: [
        createVariant('ca1', 'Calendly link', 'Top man! Als je hem hier even kunt inplannen dan komt hij in jouw agenda en die van mij: [CALENDLY LINK]'),
        createVariant('ca2', 'Mail reminder', 'Perfect man! Als je mij even je mail kunt geven, dan stuur ik je een automatische reminder. 💪'),
        createVariant('ca3', 'Directe tijd', 'Nice! Dan zet ik je in voor [DAG] om [TIJD]. Als je mij even je mail geeft, stuur ik je een reminder.'),
        createVariant('ca4', 'Instagram call', 'Top man! Check je DM\'s [DAG] om [TIJD], dan stuur ik een belverzoek via Instagram. Zorg dat je even rustig kunt praten!'),
        createVariant('ca5', 'Verwachting setting', 'Perfect! Zet het in je agenda voor [DAG] om [TIJD]. Zorg dat je 15 minuten hebt en ergens rustig kunt zitten. Tot dan! 💪')
      ]
    },
    options: [
      { 
        id: 'geboekt',
        label: '✅ Call geboekt',
        nextNode: 'call_admin_reminders',
        keywords: ['geboekt', 'ingepland', 'zie je']
      },
      { 
        id: 'geen_reactie',
        label: 'Geen reactie na link',
        nextNode: 'call_admin_no_calendly',
        keywords: []
      }
    ],
    painKeywords: []
  },

  call_admin_reminders: {
    id: 'call_admin_reminders',
    phase: 'call_admin',
    label: 'Call Admin - Reminders',
    description: 'Pre-call reminders dag van call',
    question: 'Stuur reminder:',
    message: {
      variants: [
        createVariant('ca6', 'Dag van call', 'Heyy [naam]! Ik kijk ernaar uit om vanmiddag om [TIJD] je situatie te bespreken. Zie je dan! (Laat even weten of het je gaat lukken 💪)'),
        createVariant('ca7', 'Ochtend reminder', 'Heyy [naam]! Reminder dat we vanmiddag om [TIJD] bellen. Tot zo! 🤙'),
        createVariant('ca8', '1 uur voor', 'Heyy [naam]! Ik zag dat je het bericht wel had gelezen, maar niet had gereageerd. Kun je mij een uur van tevoren laten weten of het gaat lukken? Anders moet ik hem helaas afzeggen! 🤙'),
        createVariant('ca9', '30 min voor', 'Heyy [naam]! Over 30 minuten bellen we. Ben je er klaar voor?'),
        createVariant('ca10', 'Laatste check', 'Heyy [naam], ik heb niks gehoord. Ik ga ervan uit dat het niet doorgaat en zet hem af. Als je hem nog wilt doen, laat het snel even weten!')
      ]
    },
    options: [
      { 
        id: 'bevestiging',
        label: '✅ Bevestigt',
        nextNode: 'end_call_booked',
        keywords: ['ja', 'zie je', 'tot']
      },
      { 
        id: 'no_show',
        label: '❌ No show',
        nextNode: 'call_admin_no_show',
        keywords: []
      },
      { 
        id: 'reschedule',
        label: '📅 Wil verzetten',
        nextNode: 'call_admin_reschedule',
        keywords: ['kan niet', 'verzetten', 'anders']
      }
    ],
    painKeywords: []
  },

  call_admin_no_show: {
    id: 'call_admin_no_show',
    phase: 'call_admin',
    label: 'Call Admin - No Show',
    description: 'Lead heeft call gemist',
    question: 'Stuur no show message:',
    message: {
      variants: [
        createVariant('ca11', 'Gemist + curiosity', 'Heyy [naam], ik zie dat je de call had gemist. Is alles goed? Ik had 2 enorm goede oplossingen bedacht voor jouw probleem die ik je graag zou meegeven. Laat maar weten of je de call nog wilt verplaatsen. Anders succes verder!'),
        createVariant('ca12', 'Gemist + waarde', 'Heyy [naam]! Je hebt de call gemist. Ik had voor jou uitgewerkt wat je precies moet doen om [doel] te bereiken. Wil je hem nog verzetten? Laat het maar weten, anders laat ik het hierbij.'),
        createVariant('ca13', 'Geen Calendly', 'Heyy [naam], ik zie dat je de call nog niet had ingepland via de link. Heb je nog steeds interesse? Zo ja, plan hem snel in. Zo niet, laat het even weten dan stop ik met reminders.'),
        createVariant('ca14', 'Laatste kans', 'Heyy [naam], dit is de tweede keer dat je de call mist. Ik snap dat het druk kan zijn. Als je alsnog wilt, laat het weten. Anders laat ik het hierbij en wens ik je succes!'),
        createVariant('ca15', 'Clean closure', 'Heyy [naam], ik ga ervan uit dat je geen tijd hebt of geen interesse meer. Helemaal prima man. Als je ooit toch hulp wilt, je weet me te vinden. Succes! 💪')
      ]
    },
    options: [
      { 
        id: 'wil_reschedule',
        label: '✅ Wil alsnog',
        nextNode: 'call_admin_reschedule',
        keywords: ['sorry', 'verzetten', 'nog']
      },
      { 
        id: 'geen_reactie',
        label: '❌ Geen reactie',
        nextNode: 'end_lost_no_show',
        keywords: []
      }
    ],
    painKeywords: []
  },

  call_admin_reschedule: {
    id: 'call_admin_reschedule',
    phase: 'call_admin',
    label: 'Call Admin - Reschedule',
    description: 'Lead wil call verzetten',
    question: 'Stuur reschedule response:',
    message: {
      variants: [
        createVariant('ca16', 'Client vraagt', 'Geen probleem man! Wanneer zou het dan wel kunnen voor je?'),
        createVariant('ca17', 'Flexibel', 'Kan gebeuren man. Ik heb nog plek op [dag] om [tijd] of [dag] om [tijd]. Welke past beter?'),
        createVariant('ca18', 'Laatste kans', 'Oké snap ik. Dit is wel de laatste keer dat ik hem kan verzetten man. Wanneer weet je 100% zeker dat je tijd hebt?'),
        createVariant('ca19', 'Commitment check', 'Geen probleem. Maar even voor mij: ben je echt ready om dit aan te pakken? Of moet je nog even wachten? Wil je tijd niet verspillen.')
      ]
    },
    options: [
      { 
        id: 'nieuwe_tijd',
        label: '✅ Nieuwe tijd afgesproken',
        nextNode: 'call_admin_reminders',
        keywords: ['maandag', 'dinsdag', 'woensdag']
      },
      { 
        id: 'blijft_vaag',
        label: '❌ Blijft vaag',
        nextNode: 'end_lost_reschedule',
        keywords: ['weet niet', 'kijk', 'misschien']
      }
    ],
    painKeywords: []
  },

  call_admin_no_calendly: {
    id: 'call_admin_no_calendly',
    phase: 'call_admin',
    label: 'Call Admin - Geen Calendly Actie',
    description: 'Lead heeft link niet gebruikt',
    question: 'Stuur Calendly reminder:',
    message: {
      variants: [
        createVariant('ca13', 'Geen Calendly', 'Heyy [naam], ik zie dat je de call nog niet had ingepland via de link. Heb je nog steeds interesse? Zo ja, plan hem snel in. Zo niet, laat het even weten dan stop ik met reminders.')
      ]
    },
    options: [
      { 
        id: 'plant_alsnog',
        label: '✅ Plant alsnog in',
        nextNode: 'call_admin_reminders',
        keywords: ['nu', 'geboekt', 'klaar']
      },
      { 
        id: 'geen_reactie',
        label: '❌ Geen reactie',
        nextNode: 'end_lost_no_calendly',
        keywords: []
      }
    ],
    painKeywords: []
  },

  call_admin_long_silence: {
    id: 'call_admin_long_silence',
    phase: 'call_admin',
    label: 'Call Admin - Lange Stilte',
    description: 'Call geboekt maar geen contact meer',
    question: 'Stuur reconfirm message:',
    message: {
      variants: [
        createVariant('ca20', 'Geboekt lang geleden', 'Heyy [naam]! We hadden een call staan voor [dag] om [tijd]. Klopt dat nog? Laat even weten!'),
        createVariant('ca21', 'Check interesse', 'Heyy [naam], we hadden een call gepland maar ik heb al een tijdje niks gehoord. Ben je er nog klaar voor? Laat het maar weten, anders haal ik je van de lijst.'),
        createVariant('ca22', 'Reconfirm + exit', 'Heyy [naam]! Call staat nog voor [dag]. Als het niet meer past, helemaal geen probleem. Laat het even weten dan stop ik met reminders.')
      ]
    },
    options: [
      { 
        id: 'bevestigt',
        label: '✅ Bevestigt nog steeds',
        nextNode: 'call_admin_reminders',
        keywords: ['ja', 'klopt', 'nog']
      },
      { 
        id: 'annuleert',
        label: '❌ Annuleert',
        nextNode: 'end_lost_cancelled',
        keywords: ['niet', 'toch', 'annuleren']
      }
    ],
    painKeywords: []
  },

  // ==========================================
  // FOLLOW-UP NODES (11 variants)
  // ==========================================
  
  follow_up_dag1: {
    id: 'follow_up_dag1',
    phase: 'follow_up',
    label: 'Follow-up - Dag 1-2',
    description: 'Eerste reminder na geen reactie',
    question: 'Stuur dag 1-2 follow-up:',
    message: {
      variants: [
        createVariant('f1', 'Had je gezien', 'Heyy [naam], had je mijn bericht gezien? 🙂'),
        createVariant('f2', 'Benieuwd', 'Heyy [naam]! Ik was benieuwd of je mijn bericht nog had gelezen?')
      ]
    },
    options: [
      { 
        id: 'reageert',
        label: '✅ Reageert alsnog',
        nextNode: 'qualify_afvallen',
        keywords: []
      },
      { 
        id: 'geen_reactie',
        label: 'Nog steeds geen reactie',
        nextNode: 'follow_up_dag3',
        keywords: []
      }
    ],
    painKeywords: []
  },

  follow_up_dag3: {
    id: 'follow_up_dag3',
    phase: 'follow_up',
    label: 'Follow-up - Dag 3-5',
    description: 'Reminder met waarde toevoeging',
    question: 'Stuur dag 3-5 follow-up:',
    message: {
      variants: [
        createVariant('f3', 'Reminder + waarde', 'Heyy [naam], weet niet of je mijn berichtje had gezien, maar hier is een snelle tip voor je: De meeste mannen eten te weinig eiwitten voor hun doel. Zit jij op minimaal 2 gram per kg lichaamsgewicht?'),
        createVariant('f4', 'Andere vraag', 'Heyy [naam]! Nog even dit: Veel mannen trainen hard maar zien weinig resultaat omdat ze hun calorieën niet tracken. Ken je dat?'),
        createVariant('f5', 'Mocht gemist', 'Heyy [naam], mocht je het gemist hebben - ik had je een vraag gestuurd. Laat even weten als je tijd hebt!')
      ]
    },
    options: [
      { 
        id: 'reageert',
        label: '✅ Reageert nu wel',
        nextNode: 'qualify_afvallen',
        keywords: []
      },
      { 
        id: 'geen_reactie',
        label: 'Nog geen reactie',
        nextNode: 'follow_up_dag7',
        keywords: []
      }
    ],
    painKeywords: []
  },

  follow_up_dag7: {
    id: 'follow_up_dag7',
    phase: 'follow_up',
    label: 'Follow-up - Dag 7-14',
    description: 'Andere hoek, social proof',
    question: 'Stuur dag 7-14 follow-up:',
    message: {
      variants: [
        createVariant('f6', 'Andere hoek', 'Heyy [naam], andere vraag voor je: Loop jij soms ook tegen een plateau aan met je training? Veel mannen in jouw situatie hebben dat namelijk.'),
        createVariant('f7', 'Social proof', 'Heyy [naam], toevallig: Ik hielp laatst iemand met exact dezelfde situatie als jou. Hij ging van 70 naar 80kg lean in 4 maanden tijd. Benieuwd hoe?'),
        createVariant('f8', 'Case study', 'Heyy [naam]! Ik werk met mannen die serieus willen bouwen aan hun lichaam. Eentje kreeg laatst 6kg spiermassa erbij in 12 weken. Zou dat wat voor jou zijn?')
      ]
    },
    options: [
      { 
        id: 'reageert',
        label: '✅ Reageert',
        nextNode: 'qualify_afvallen',
        keywords: []
      },
      { 
        id: 'geen_reactie',
        label: 'Geen reactie',
        nextNode: 'follow_up_dag21',
        keywords: []
      }
    ],
    painKeywords: []
  },

  follow_up_dag14: {
    id: 'follow_up_dag14',
    phase: 'follow_up',
    label: 'Follow-up - Dag 14-21',
    description: 'Voor "later" leads - check-in',
    question: 'Stuur dag 14-21 check-in:',
    message: {
      variants: [
        createVariant('f8', 'Case study', 'Heyy [naam]! Ik werk met mannen die serieus willen bouwen aan hun lichaam. Eentje kreeg laatst 6kg spiermassa erbij in 12 weken. Zou dat wat voor jou zijn?')
      ]
    },
    options: [
      { 
        id: 'nu_ready',
        label: '✅ Nu ready',
        nextNode: 'call_push_soft',
        keywords: ['ja', 'nu', 'misschien']
      },
      { 
        id: 'nog_niet',
        label: 'Nog niet ready',
        nextNode: 'follow_up_dag21',
        keywords: []
      }
    ],
    painKeywords: []
  },

  follow_up_dag21: {
    id: 'follow_up_dag21',
    phase: 'follow_up',
    label: 'Follow-up - Dag 21+',
    description: 'Laatste berichten voordat je opgeeft',
    question: 'Stuur laatste follow-up:',
    message: {
      variants: [
        createVariant('f9', 'Laatste soft', 'Heyy [naam], ik snap dat je druk bent, helemaal geen probleem. Mocht je ooit serieus willen kijken naar je fitness, dan weet je me te vinden!'),
        createVariant('f10', 'Value drop', 'Heyy [naam], laatste tip van mij: Focus op progressieve overload en zorg voor een calorie surplus. Dat zijn de basics die 90% van de mannen gewoon mist. Succes! 💪'),
        createVariant('f11', 'Final goodbye', 'Heyy [naam]! Dit is mijn laatste berichtje. Ik wens je veel succes met je fitness journey man. Als je ooit besluit dat je er serieus mee aan de slag wilt, je weet me te vinden. ✌️')
      ]
    },
    options: [
      { 
        id: 'reageert_alsnog',
        label: '✅ Reageert alsnog',
        nextNode: 'qualify_afvallen',
        keywords: []
      },
      { 
        id: 'definitief_geen_reactie',
        label: '❌ Definitief geen reactie',
        nextNode: 'end_lost_no_response',
        keywords: []
      }
    ],
    painKeywords: []
  },

  // ==========================================
  // WAARDE NODES (14 tips & facts)
  // ==========================================
  
  waarde_tips: {
    id: 'waarde_tips',
    phase: 'waarde',
    label: 'Waarde - Tips & Facts',
    description: 'Value-add berichten tijdens conversatie',
    question: 'Kies waarde tip:',
    message: {
      variants: [
        createVariant('w1', 'Eiwit tip', 'Trouwens, snelle tip voor je: De meeste mannen eten te weinig eiwitten. Zit jij op minimaal 2 gram per kg lichaamsgewicht? Dat is echt de basis voor goede spiergroei.'),
        createVariant('w2', 'TDEE tip', 'Wist je dat je TDEE (dagelijkse caloriebehoefte) bepaalt of je aankomt of afvalt? Niet hoeveel je traint. Ken je die van jou?'),
        createVariant('w3', 'Slaap tip', 'Fun fact man: Slaap is net zo belangrijk als training voor je gains. 7-9 uur per nacht = optimale spiergroei en herstel.'),
        createVariant('w4', 'Progressive overload', 'Grootste fout die ik zie: Mannen willen te snel te zwaar trainen. Progressive overload (beetje meer gewicht per week) werkt echt beter dan ego lifting.'),
        createVariant('w5', 'Consistency', 'De waarheid: De meeste transformaties falen niet door slechte workouts, maar door gebrek aan consistentie. 80% opdagen is belangrijker dan het perfecte schema hebben.'),
        createVariant('w6', 'Tracking tip', 'Pro tip: Track je workouts man. Serieus. Wat je niet meet, kun je ook niet echt verbeteren. Een simpel spreadsheetje is al genoeg.'),
        createVariant('w7', 'Hydration', 'Snelle tip: De meeste mannen drinken te weinig water. 3-4 liter per dag is het minimum voor optimale prestaties en herstel.'),
        createVariant('w8', 'Pre-workout timing', 'Wist je dat je 1-2 uur voor je training koolhydraten moet eten? Geeft je veel meer energie tijdens je workout.'),
        createVariant('w9', '80% keuken', 'Wist je dat 80% van je resultaat in de keuken wordt bepaald? Niet in de gym. Je kunt echt niet outtrainen wat je slecht eet.'),
        createVariant('w10', 'Te weinig eten', 'Snelle reality check: Als je niet groeit, eet je te weinig. Punt. De meeste "hardgainers" zijn gewoon "undereaters".'),
        createVariant('w11', 'Slaap = gains', 'Crazy fact: Je spieren groeien niet in de gym, maar tijdens je slaap. Te weinig slapen = gains op tafel laten liggen letterlijk.'),
        createVariant('w12', 'Compound ROI', 'Wist je dat compound oefeningen (squat, deadlift, bench) meer ROI geven dan isolation? Je traint gewoon meerdere spiergroepen tegelijk.'),
        createVariant('w13', 'Protein timing', 'Fun fact: Het maakt niet uit wanneer je eiwitten eet. Totale dagelijkse inname is veel belangrijker dan timing.'),
        createVariant('w14', 'Cardio gains', 'Wist je dat te veel cardio je spiergroei kan remmen? 2-3x per week 20 minuten is genoeg als je aan het bulken bent.')
      ]
    },
    options: [
      { 
        id: 'reageert',
        label: 'Lead reageert',
        nextNode: 'qualify_afvallen',
        keywords: []
      },
      { 
        id: 'verder_conversatie',
        label: 'Verder in conversatie',
        nextNode: 'call_push_soft',
        keywords: []
      }
    ],
    painKeywords: []
  },

  // ==========================================
  // END NODES
  // ==========================================
  
  end_call_booked: {
    id: 'end_call_booked',
    phase: 'end',
    label: '✅ SUCCESS - Call Geboekt',
    description: 'Lead heeft call ingepland',
    message: {
      variants: [
        createVariant('end1', 'Bevestiging', '✅ Call succesvol geboekt! Zie je op [DAG] om [TIJD]. 💪')
      ]
    },
    options: [],
    painKeywords: []
  },

  end_lost_no_response: {
    id: 'end_lost_no_response',
    phase: 'end',
    label: '❌ LOST - Geen Reactie',
    description: 'Lead reageert niet meer',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_price: {
    id: 'end_lost_price',
    phase: 'end',
    label: '❌ LOST - Prijs',
    description: 'Lead vindt het te duur',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_chat: {
    id: 'end_lost_chat',
    phase: 'end',
    label: '❌ LOST - Wil alleen chat',
    description: 'Lead blijft bij chat willen',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_trust: {
    id: 'end_lost_trust',
    phase: 'end',
    label: '❌ LOST - Vertrouwt niet',
    description: 'Lead denkt dat het sales is',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_no_show: {
    id: 'end_lost_no_show',
    phase: 'end',
    label: '❌ LOST - No Show',
    description: 'Lead kwam niet opdagen',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_reschedule: {
    id: 'end_lost_reschedule',
    phase: 'end',
    label: '❌ LOST - Reschedule Loop',
    description: 'Lead blijft verzetten',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_no_calendly: {
    id: 'end_lost_no_calendly',
    phase: 'end',
    label: '❌ LOST - Geen Calendly',
    description: 'Lead plant niet in',
    message: null,
    options: [],
    painKeywords: []
  },

  end_lost_cancelled: {
    id: 'end_lost_cancelled',
    phase: 'end',
    label: '❌ LOST - Geannuleerd',
    description: 'Lead annuleert alsnog',
    message: null,
    options: [],
    painKeywords: []
  }
}

// Export variant count for validation
export const VARIANT_STATS = {
  openers: 30,       // 8+8+8+6
  qualify: 37,       // 7+7+5+5+4+4+5
  callPush: 14,      // 4+4+3+3
  bezwaren: 34,      // 5+5+5+5+5+5+4
  followUp: 11,
  waarde: 14,
  callAdmin: 22,     // 5+5+5+4+3
  total: 162
}

// ========================================
// HELPER FUNCTIONS
// ========================================

export function getNode(tree, nodeId) {
  if (!tree || !nodeId) return null
  return tree[nodeId] || null
}

export function isEndNode(nodeId) {
  if (!nodeId) return false
  return nodeId.startsWith('end_')
}

export function getPhaseColor(phase) {
  const colors = {
    'opening': '#3b82f6',
    'qualify': '#8b5cf6', 
    'call_push': '#10b981',
    'bezwaar': '#f59e0b',
    'follow_up': '#ec4899',
    'waarde': '#06b6d4',
    'call_admin': '#6366f1',
    'end': '#ef4444'
  }
  return colors[phase] || '#6b7280'
}

export default DECISION_TREE
