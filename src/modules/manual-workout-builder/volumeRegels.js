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
