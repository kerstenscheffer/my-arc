// src/modules/manual-workout-builder/volumeRegels.js
//
// Regels voor volume per spiergroep (10 nov 2026). Bron: Kerstens onderzoek
// "Tien tot twintig harde sets winnen bijna alles" (docs/regels-volume.md):
// Pelland 2025, Schoenfeld 2017, Baz-Valle 2022, Remmert 2025, ACSM 2026,
// Roth 2022/23 (cut), Bickel 2011 / Spiering 2021 (onderhoud).
//
// Alles hier is aan te passen zonder de rekenlogica (volumeSuggesties.js) te
// raken. Getallen = fractionele harde sets per spiergroep per week:
// prime mover = 1, synergist in een compound = 0,5.

// Weekrange per trainingsstatus × fase: [min, max], start = waar een nieuw blok begint.
export const RANGE = {
  beginner:     { bulk: [8, 10, 6],  onderhoud: [6, 8],   cut: [6, 8] },
  intermediate: { bulk: [12, 16, 10], onderhoud: [10, 12], cut: [8, 12] },
  advanced:     { bulk: [14, 20, 14], onderhoud: [10, 14], cut: [10, 14] },
}

// Max fractionele sets per spier per sessie (Remmert: boven ~8-11 geen meerwaarde).
export const MAX_PER_SESSIE = { beginner: 5, intermediate: 8, advanced: 10 }
// 40-55 jaar: zelfde weekvolume, lager per sessie, altijd >= 2 sessies.
export const MAX_PER_SESSIE_40PLUS = 7
export const LEEFTIJD_40PLUS = 40

// Elke spier minimaal zo vaak per week.
export const MIN_FREQUENTIE = 2

// Range × factor per spier (1 = de tabel hierboven). Sinds de opsplitsing in
// quads/hamstrings en front/side/rear delts (10 nov 2026) is er geen factor meer nodig.
// Billen en front delts krijgen genoeg via compounds (squats, presses; RP: MEV 0):
// alleen een plafond. Buik en traps: geen weekdoel, wel meetellen.
export const FACTOR = {}
export const ALLEEN_PLAFOND = new Set(['glutes', 'front_delts'])
export const GEEN_DOEL = new Set(['abs', 'traps', 'core', 'forearms', 'onbekend'])

// Een set telt voor de synergist half mee. Bibliotheek (secundair_spieren) gaat voor;
// zonder die info herkennen we de bekende compounds aan de naam.
export const SYNERGIST_GEWICHT = 0.5
// Per regel: [naam-patroon, synergisten, gewicht]. Zonder gewicht geldt SYNERGIST_GEWICHT.
// Been-compounds tellen voor beide groepen volledig (Kersten, 10 nov 2026): een hack
// squat is evengoed een billen-oefening als een quads-oefening.
export const SYNERGISTEN_OP_NAAM = [
  [/overhead press|shoulder press|military|arnold|push press/i, ['triceps', 'side_delts']],
  [/bench|chest press|(incline|decline|flat|floor)\b.*press|push.?up|\bdips?\b/i, ['triceps', 'front_delts']],
  [/row|pulldown|pull.?up|chin.?up|pullover/i, ['biceps', 'rear_delts']],
  [/squat|leg press|lunge|split squat|step.?up|hack/i, ['glutes'], 1],
  [/deadlift|rdl|romanian|good morning|hip hinge/i, ['glutes'], 1],
  [/hip thrust|glute bridge/i, ['hamstrings']],
]
// Bibliotheek zegt alleen 'shoulders' of 'legs' als synergist: welke precies hangt af van de beweging.
export const TREK = /row|pulldown|pull.?up|chin.?up|face.?pull|pullover/i
export const BOVEN_DRUK = /overhead press|shoulder press|military|arnold|push press/i
export const HEUP = /deadlift|rdl|romanian|good.?morning|hip|hinge|thrust|bridge/i

// Prestatie: beste set per week (geschatte 1RM) op de oefeningen in het plan.
// "Twee weken niet stijgen" = de laatste twee weekstappen elk minder dan +0,5%.
export const KRACHT_WEKEN_TERUG = 5
export const STIJGING_MIN = 0.005
export const DALING_MIN = 0.01

// Reacties.
export const PLUS_PER_STAP = 1        // +1 tot 2 sets per spier: we stellen 1 voor
export const MAX_STAP = 2             // nooit meer dan 2 sets per spier per week erbij of eraf
export const MIN_FRACTIE = 1 / 3      // te veel: die spier een week 1/3 minder

export const LABEL_STATUS = { beginner: 'beginner', intermediate: 'intermediair', advanced: 'gevorderd' }
export const LABEL_FASE = { bulk: 'build', onderhoud: 'onderhoud', cut: 'cut' }

// Per spier uit het onderzoek (RP 2017 landmarks + wat studies zeggen), voor het
// i-tje in het spieroverzicht. MV = onderhoud, MEV = minimaal effectief,
// MAV = meeste groei, MRV = maximaal herstelbaar (sets/week).
export const SPIER_INFO = {
  chest: { mv: 8, mev: 10, mav: '12-20', mrv: '22+', freq: '1,5-3x', studie: 'Plafond schaalt met frequentie: ~20 sets bij 2x tot ~35 bij 5-6x per week (RP).' },
  back: { mv: 8, mev: 10, mav: '14-22', mrv: '25+', freq: '2-4x', studie: 'Geen specifiek dosisonderzoek; rows tellen ook half voor biceps en rear delts.' },
  quads: { mv: 6, mev: 8, mav: '12-18', mrv: '20+', freq: '1,5-3x', studie: 'Baz-Valle: >20 sets niet beter (p = 0,19). Aube: 12 sets = 24 sets.' },
  hamstrings: { mv: 4, mev: 6, mav: '10-16', mrv: '20+', freq: '2-3x', studie: 'Geen specifiek onderzoek. Combineer knie-buigen (curl) en heup-strekken (RDL).' },
  glutes: { mv: 0, mev: 0, mav: '4-12', mrv: '16+', freq: '2-3x', studie: 'Squats, lunges en deadlifts dekken onderhoud en minimum al.' },
  side_delts: { mv: 0, mev: 8, mav: '16-22', mrv: '26+', freq: '2-6x', studie: 'Geen specifiek onderzoek; herstellen snel, dus vaak trainen kan.' },
  rear_delts: { mv: 0, mev: 8, mav: '16-22', mrv: '26+', freq: '2-6x', studie: 'Geen specifiek onderzoek; rows en pulldowns tellen half mee.' },
  front_delts: { mv: 0, mev: 0, mav: '—', mrv: '—', freq: '—', studie: 'Geen aparte doelen: presses trainen ze al genoeg (RP: MEV 0).' },
  biceps: { mv: 5, mev: 8, mav: '14-20', mrv: '26+', freq: '2-6x', studie: 'Baz-Valle: >20 sets niet beter (p = 0,59).' },
  triceps: { mv: 4, mev: 6, mav: '10-14', mrv: '18+', freq: '2-4x', studie: 'Baz-Valle: >20 sets wel beter (p = 0,01); Radaelli: groeide door tot 45 sets.' },
  calves: { mv: 6, mev: 8, mav: '12-16', mrv: '20+', freq: '2-4x', studie: 'RP 2024 geeft een generieke 6-16.' },
}
