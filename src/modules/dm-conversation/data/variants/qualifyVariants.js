// Qualify Message Variants
// EXACT COPY from messageDatabase.js

import { Target, TrendingUp, Zap, AlertCircle, ThumbsUp, Activity, Flame } from 'lucide-react'

// QUALIFY AFVALLEN - 7 messages
export const qualifyAfvallenVariants = [
  {
    id: 'q1',
    tone: 'Huidige gewicht',
    icon: Target,
    text: "Ahh duidelijk man, top dat je ermee bezig bent. Heb je ook een streefgewicht?"
  },
  {
    id: 'q2',
    tone: 'Hoeveel kilo',
    icon: TrendingUp,
    text: "Nice dat je de stap zet man! Hoeveel kilo wil je kwijtraken?"
  },
  {
    id: 'q3',
    tone: 'Hoe lang bezig',
    icon: Activity,
    text: "Nice dat je ermee bezig bent! Hoe lang ben je hier al mee bezig?"
  },
  {
    id: 'q4',
    tone: 'Wat geprobeerd',
    icon: Zap,
    text: "Snap ik helemaal man. Wat heb je tot nu toe al geprobeerd om af te vallen?"
  },
  {
    id: 'q5',
    tone: 'Grootste struggle',
    icon: AlertCircle,
    text: "Herkenbaar man. Wat denk je dat je nu mist om dichter bij je doel te komen?"
  },
  {
    id: 'q6',
    tone: 'Voeding check',
    icon: ThumbsUp,
    text: "Top dat je ermee aan de slag bent! Let je ook een beetje op hoeveel je eet of doe je dat nog meer op gevoel?"
  },
  {
    id: 'q7',
    tone: 'Sport routine',
    icon: Flame,
    text: "Lekker bezig! Hoe vaak sport je nu ongeveer per week?"
  }
]

// QUALIFY SPIEREN - 7 messages
export const qualifySpierenVariants = [
  {
    id: 'q8',
    tone: 'Huidige gewicht',
    icon: Target,
    text: "Ahh nice man, bulken is een goeie keuze 💪 Heb je ook een streefgewicht voor ogen?"
  },
  {
    id: 'q9',
    tone: 'Hoeveel kilo',
    icon: TrendingUp,
    text: "Lekker bezig! Hoeveel kilo wil je er precies bij hebben?"
  },
  {
    id: 'q10',
    tone: 'Training duur',
    icon: Activity,
    text: "Top dat je ermee bezig bent! Hoe lang train je al serieus?"
  },
  {
    id: 'q11',
    tone: 'Schema',
    icon: Zap,
    text: "Nice man! Welk trainingsschema volg je op dit moment?"
  },
  {
    id: 'q12',
    tone: 'Struggle',
    icon: AlertCircle,
    text: "Snap ik helemaal. Wat denk je dat je nu mist om dichter bij je doel te komen?"
  },
  {
    id: 'q13',
    tone: 'Calorieën',
    icon: ThumbsUp,
    text: "Lekker bezig! Let je ook een beetje op hoeveel calorieën je eet of doe je dat nog meer op gevoel?"
  },
  {
    id: 'q14',
    tone: 'Eiwit check',
    icon: Flame,
    text: "Top man! Heb je enig idee hoeveel gram eiwit je ongeveer binnenkrijgt per dag?"
  }
]

// QUALIFY SPORT - 5 messages
export const qualifySportVariants = [
  {
    id: 'q15',
    tone: 'Niveau check',
    icon: Target,
    text: "Ahh vet man! Op welk niveau speel je op dit moment?"
  },
  {
    id: 'q16',
    tone: 'Krachttraining?',
    icon: Activity,
    text: "Nice! Doe je naast voetbal ook nog aan krachttraining in de gym?"
  },
  {
    id: 'q17',
    tone: 'Voeding check',
    icon: ThumbsUp,
    text: "Top man! Let je ook een beetje op je voeding of eet je gewoon wat je wilt?"
  },
  {
    id: 'q18',
    tone: 'Doelen',
    icon: TrendingUp,
    text: "Gave dedication man! Waar werk je naartoe met voetbal?"
  },
  {
    id: 'q19',
    tone: 'Performance hook',
    icon: Zap,
    text: "Mooi man! Wist je trouwens dat de juiste krachttraining en voeding je snelheid en explosiviteit flink kunnen verbeteren?"
  }
]

// QUALIFY VAST (Pain detected) - 5 messages
export const qualifyVastVariants = [
  {
    id: 'q20',
    tone: 'Empathie',
    icon: AlertCircle,
    text: "Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan?"
  },
  {
    id: 'q21',
    tone: 'Wat doe je',
    icon: Activity,
    text: "Snap ik helemaal. Wat doe je nu eigenlijk qua training en voeding?"
  },
  {
    id: 'q22',
    tone: 'Hoe lang vast',
    icon: AlertCircle,
    text: "Frustrerend man! Hoe lang zit je al ongeveer op hetzelfde gewicht?"
  },
  {
    id: 'q23',
    tone: 'Voeding check',
    icon: ThumbsUp,
    text: "Herkenbaar. Let je een beetje op hoeveel je eet of doe je dat meer op gevoel?"
  },
  {
    id: 'q24',
    tone: 'Pain versterken',
    icon: Flame,
    text: "Ja dat hoor ik vaker man. Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over 6 maanden staat?"
  }
]

// QUALIFY GEVOEL (No tracking) - 4 messages
export const qualifyGevoelVariants = [
  {
    id: 'q25',
    tone: 'Werkt het?',
    icon: AlertCircle,
    text: "Ahh oké snap ik! En werkt dat voor je? Zie je de resultaten die je wilt zien?"
  },
  {
    id: 'q26',
    tone: 'Resultaten',
    icon: TrendingUp,
    text: "Snap ik helemaal. Kom je wel vooruit of blijft het een beetje hetzelfde?"
  },
  {
    id: 'q27',
    tone: 'Tracking value',
    icon: Target,
    text: "Ja dat doen de meeste mensen man. Maar weet je wat? Wat je niet meet, kun je ook niet echt verbeteren. Herkenbaar?"
  },
  {
    id: 'q28',
    tone: 'Gok vs zekerheid',
    icon: Zap,
    text: "Ahh oké! Maar zou je niet liever precies weten wat je moet doen in plaats van een beetje gokken?"
  }
]

// QUALIFY TRACKT (Already tracking) - 4 messages
export const qualifyTracktVariants = [
  {
    id: 'q29',
    tone: 'Compliment',
    icon: ThumbsUp,
    text: "Ahh nice man! Top dat je dat doet, de meeste mensen doen dat niet 💪 En hoe gaat het?"
  },
  {
    id: 'q30',
    tone: 'Resultaat?',
    icon: TrendingUp,
    text: "Respect man! Zie je de resultaten die je wilt zien of loopt het ergens een beetje vast?"
  },
  {
    id: 'q31',
    tone: 'Waar hulp',
    icon: AlertCircle,
    text: "Lekker bezig! Wat denk je dat je nu mist om dichter bij je doel te komen?"
  },
  {
    id: 'q32',
    tone: 'Optimalisatie',
    icon: Target,
    text: "Top dat je zo bezig bent man! Weet je zeker dat je op de juiste hoeveelheid calorieën zit voor je doel?"
  }
]

// PAIN DEEPEN (High pain - ready for call push) - 5 messages
export const painDeepenVariants = [
  {
    id: 'q33',
    tone: 'Hoe lang geen resultaat',
    icon: AlertCircle,
    text: "Ahh dat is kut man, herkenbaar. Hoe lang loop je hier al tegenaan zonder vooruitgang?"
  },
  {
    id: 'q34',
    tone: 'Wat geprobeerd',
    icon: Activity,
    text: "Frustrerend! Wat heb je allemaal al geprobeerd om het te fixen?"
  },
  {
    id: 'q35',
    tone: 'Frustratie schaal',
    icon: Flame,
    text: "Snap ik helemaal man. Op een schaal van 1-10, hoe frustrerend is dit eigenlijk voor je?"
  },
  {
    id: 'q36',
    tone: 'Impact leven',
    icon: AlertCircle,
    text: "Ja dat snap ik man. Heeft dit ook een beetje impact op hoe je je voelt over jezelf?"
  },
  {
    id: 'q37',
    tone: 'Toekomst scenario',
    icon: Zap,
    text: "Even een eerlijke vraag: Als je zo doorgaat, waar denk je dat je dan over een jaar staat? Nog steeds hetzelfde?"
  }
]
