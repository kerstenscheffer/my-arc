// src/pages/mijn-split/oefeningWissel.js
// Persoonlijke aanpassing van de split (23 okt 2026, akkoord Kersten):
//   1. BEPERKINGEN: de vraag "Is er iets wat je niet kunt of wilt?". Elke
//      keuze verbiedt een paar oefeningen en zegt waarmee ze vervangen worden.
//   2. ALTERNATIEVEN: per oefening de suggesties achter de wisselknop op het
//      laatste scherm.
// Alleen namen die in de bibliotheek (exercises) of de splits staan. Een
// vervangen oefening houdt de sets, reps en rust van het origineel.

// Volgorde = voorrang: klachten eerst, daarna voorkeuren. Bij een oefening
// die onder twee keuzes valt, wint de vervanging van de eerste.
export const BEPERKINGEN = [
  { key: 'knie', label: 'Knieklachten',
    verboden: ['Hack Squat', 'Leg Extension', 'Goblet Squat', 'Bulgarian Split Squat', 'Walking Lunges', 'Reverse Lunges', 'Step-ups'],
    vervang: {
      'Hack Squat': ['Hip Thrust'],
      'Leg Extension': ['Lying Leg Curl', 'Hip Thrust'],
      'Goblet Squat': ['Hip Thrust (Dumbbell)', 'Romanian Deadlift (Dumbbell)', 'Glute Bridge'],
      'Bulgarian Split Squat': ['Romanian Deadlift (Dumbbell)', 'Hip Thrust (Dumbbell)', 'Single Leg Romanian Deadlift'],
      'Walking Lunges': ['Hip Thrust (Dumbbell)', 'Romanian Deadlift (Dumbbell)', 'Glute Bridge'],
      'Reverse Lunges': ['Hip Thrust (Dumbbell)', 'Single Leg Romanian Deadlift', 'Glute Bridge'],
      'Step-ups': ['Romanian Deadlift (Dumbbell)', 'Hip Thrust (Dumbbell)', 'Glute Bridge'],
    } },
  { key: 'schouder', label: 'Schouderklachten',
    verboden: ['Incline Smith Machine Bench Press', 'Cable Overhead Triceps Extension', 'Push-ups', 'Decline Push-ups', 'Diamond Push-ups',
      'Arnold Press', 'Bench Dips', 'Dumbbell Overhead Extension', 'Single Arm Overhead Tricep Extension'],
    vervang: {
      'Incline Smith Machine Bench Press': ['Landmine Press'],
      'Cable Overhead Triceps Extension': ['Triceps Pushdown', 'Single Arm Cable Tricep Extension'],
      'Push-ups': ['Floor Press', 'Flat Dumbbell Bench Press'],
      'Decline Push-ups': ['Floor Press', 'Flat Dumbbell Bench Press'],
      'Diamond Push-ups': ['Dumbbell Skull Crusher', 'Floor Press'],
      'Arnold Press': ['Dumbbell Lateral Raise', 'Single Arm Dumbbell Lateral Raise'],
      'Bench Dips': ['Dumbbell Skull Crusher', 'Floor Press'],
      'Dumbbell Overhead Extension': ['Dumbbell Skull Crusher', 'Floor Press'],
      'Single Arm Overhead Tricep Extension': ['Dumbbell Skull Crusher', 'Floor Press'],
    } },
  { key: 'onderrug', label: 'Onderrugklachten',
    verboden: ['Hack Squat', 'Dumbbell Row (Two Arm)', 'Bent Over Rear Delt Fly'],
    vervang: {
      'Hack Squat': ['Leg Press', 'Leg Press (Single Leg)', 'Hip Thrust'],
      'Dumbbell Row (Two Arm)': ['Single Arm Dumbbell Row', 'Dumbbell Pullover', 'Inverted Row'],
      'Bent Over Rear Delt Fly': ['Dumbbell Lateral Raise', 'Single Arm Dumbbell Lateral Raise'],
    } },
  { key: 'squats', label: 'Geen squats',
    verboden: ['Hack Squat', 'Goblet Squat'],
    vervang: {
      'Hack Squat': ['Leg Press', 'Leg Press (Single Leg)', 'Hip Thrust'],
      'Goblet Squat': ['Romanian Deadlift (Dumbbell)', 'Hip Thrust (Dumbbell)', 'Glute Bridge', 'Single Leg Romanian Deadlift'],
    } },
  { key: 'lunges', label: 'Geen lunges of split squats', alleen: 'thuis',
    verboden: ['Walking Lunges', 'Reverse Lunges', 'Bulgarian Split Squat', 'Step-ups'],
    vervang: {
      'Walking Lunges': ['Goblet Squat', 'Hip Thrust (Dumbbell)', 'Romanian Deadlift (Dumbbell)', 'Single Leg Romanian Deadlift', 'Glute Bridge'],
      'Reverse Lunges': ['Hip Thrust (Dumbbell)', 'Goblet Squat', 'Glute Bridge', 'Single Leg Romanian Deadlift'],
      'Bulgarian Split Squat': ['Goblet Squat', 'Romanian Deadlift (Dumbbell)', 'Hip Thrust (Dumbbell)', 'Single Leg Romanian Deadlift', 'Glute Bridge'],
      'Step-ups': ['Hip Thrust (Dumbbell)', 'Goblet Squat', 'Glute Bridge', 'Single Leg Romanian Deadlift'],
    } },
  { key: 'pushups', label: 'Geen push-ups of dips', alleen: 'thuis',
    verboden: ['Push-ups', 'Decline Push-ups', 'Diamond Push-ups', 'Bench Dips'],
    vervang: {
      'Push-ups': ['Flat Dumbbell Bench Press', 'Incline Dumbbell Fly'],
      'Decline Push-ups': ['Flat Dumbbell Bench Press', 'Incline Dumbbell Fly'],
      'Diamond Push-ups': ['Dumbbell Skull Crusher', 'Dumbbell Overhead Extension'],
      'Bench Dips': ['Dumbbell Skull Crusher', 'Dumbbell Overhead Extension'],
    } },
]

export const beperkingenVoor = (locatie) => BEPERKINGEN.filter(b => !b.alleen || b.alleen === locatie)

// De keuzes toepassen op de dagen uit get_mijn_split_dagen. Een vervanging
// die al op dezelfde dag staat wordt overgeslagen (dan de volgende uit de
// lijst); lukt dat niet, dan toch de eerste die mag.
export function pasBeperkingenToe(dagen, keuzes = []) {
  if (!dagen || !keuzes.length) return dagen
  const regels = BEPERKINGEN.filter(b => keuzes.includes(b.key))
  const verboden = new Set(regels.flatMap(r => r.verboden))
  const uit = {}
  for (const [code, dag] of Object.entries(dagen)) {
    const opDag = new Set(dag.oefeningen.map(o => o.naam))
    uit[code] = {
      ...dag,
      oefeningen: dag.oefeningen.map(o => {
        if (!verboden.has(o.naam)) return o
        const regel = regels.find(r => r.verboden.includes(o.naam))
        const kandidaten = regels.flatMap(r => r.vervang[o.naam] || [])
        const keuze = kandidaten.find(k => !verboden.has(k) && !opDag.has(k)) || kandidaten.find(k => !verboden.has(k))
        if (!keuze) return o
        opDag.add(keuze)
        return { ...o, naam: keuze, origineel: o.naam, reden: regel.label }
      }),
    }
  }
  return uit
}

// Suggesties achter de wisselknop, per oefening uit de splits.
export const ALTERNATIEVEN = {
  // Gym
  'Incline Smith Machine Bench Press': ['Incline Machine Chest Press', 'Flat Smith Machine Bench Press', 'Machine Chest Press', 'Landmine Press'],
  'Machine Pec Deck': ['Seated Cable Fly (Flat)', 'Cable Crossover', 'Low-to-High Cable Fly'],
  'Machine Lateral Raise': ['Cable Lateral Raises', 'Dumbbell Lateral Raise', 'Single Arm Cable Lateral Raise'],
  'Cable Lateral Raises': ['Machine Lateral Raise', 'Dumbbell Lateral Raise', 'Single Arm Cable Lateral Raise'],
  'Cable Overhead Triceps Extension': ['EZ-Bar Skull Crusher', 'Dumbbell Skull Crusher', 'Triceps Pushdown'],
  'Single Arm Cable Tricep Extension': ['Triceps Pushdown', 'Dumbbell Skull Crusher', 'Cable Overhead Triceps Extension'],
  'Triceps Pushdown': ['Cable Overhead Triceps Extension', 'EZ-Bar Skull Crusher', 'Single Arm Cable Tricep Extension'],
  'Lat Pulldown': ['Pull-Ups', 'Chin-Ups', 'Close-Grip Lat Pulldown'],
  'Chest Supported Machine Row': ['Machine Row', 'T-Bar Row (Chest-Supported)', 'Seated Cable Row (Wide Grip)'],
  'Seated Cable Row (Close Grip)': ['Single Arm Cable Row', 'Machine Row', 'T-Bar Row'],
  'Chest Supported Rear Delt Fly': ['Reverse Pec Deck', 'Rear Delt Cable Fly', 'Face Pulls'],
  'EZ-Bar Preacher Curls': ['Preacher Curl (Dumbbell)', 'Bayesian Cable Curl', 'EZ-Bar Curl'],
  'Hack Squat': ['Leg Press', 'Smith Machine Squat', 'Bulgarian Split Squat'],
  'Leg Press': ['Hack Squat', 'Smith Machine Squat', 'Leg Press (Single Leg)'],
  'Leg Extension': ['Bulgarian Split Squat', 'Leg Press (Single Leg)'],
  'Seated Leg Curl': ['Lying Leg Curl', 'Romanian Deadlift'],
  'Seated Calf Raises': ['Standing Calf Raises', 'Leg Press Calf Raise'],
  'Leg Raises': ['Hanging Knee Raises', 'Cable Crunches', 'Plank'],
  // Gym en thuis
  'Incline Dumbbell Curl': ['Dumbbell Curl', 'Hammer Curls', 'Zottman Curl'],
  // Thuis
  'Flat Dumbbell Bench Press': ['Floor Press', 'Push-ups', 'Decline Push-ups'],
  'Incline Dumbbell Fly': ['Flat Dumbbell Fly', 'Push-ups'],
  'Push-ups': ['Flat Dumbbell Bench Press', 'Decline Push-ups'],
  'Decline Push-ups': ['Push-ups', 'Flat Dumbbell Bench Press'],
  'Diamond Push-ups': ['Bench Dips', 'Dumbbell Skull Crusher'],
  'Dumbbell Lateral Raise': ['Single Arm Dumbbell Lateral Raise', 'Arnold Press'],
  'Arnold Press': ['Dumbbell Shoulder Press', 'Single Arm Dumbbell Shoulder Press'],
  'Bent Over Rear Delt Fly': ['Dumbbell Lateral Raise', 'Inverted Row'],
  'Dumbbell Overhead Extension': ['Single Arm Overhead Tricep Extension', 'Dumbbell Skull Crusher'],
  'Single Arm Overhead Tricep Extension': ['Dumbbell Overhead Extension', 'Dumbbell Skull Crusher'],
  'Bench Dips': ['Diamond Push-ups', 'Dumbbell Skull Crusher'],
  'Inverted Row': ['Dumbbell Row (Two Arm)', 'Single Arm Dumbbell Row'],
  'Dumbbell Row (Two Arm)': ['Single Arm Dumbbell Row', 'Inverted Row'],
  'Single Arm Dumbbell Row': ['Dumbbell Row (Two Arm)', 'Inverted Row'],
  'Dumbbell Pullover': ['Inverted Row', 'Single Arm Dumbbell Row'],
  'Zottman Curl': ['Incline Dumbbell Curl', 'Dumbbell Curl', 'Waiter Curl'],
  'Goblet Squat': ['Bulgarian Split Squat', 'Reverse Lunges', 'Romanian Deadlift (Dumbbell)'],
  'Bulgarian Split Squat': ['Reverse Lunges', 'Goblet Squat', 'Step-ups'],
  'Reverse Lunges': ['Walking Lunges', 'Bulgarian Split Squat', 'Step-ups'],
  'Walking Lunges': ['Reverse Lunges', 'Bulgarian Split Squat', 'Step-ups'],
  'Step-ups': ['Reverse Lunges', 'Bulgarian Split Squat', 'Goblet Squat'],
  'Nordic Hamstring Curl': ['Romanian Deadlift (Dumbbell)', 'Single Leg Romanian Deadlift'],
  'Calf Raise (Bodyweight)': ['Glute Bridge'],
}

// Wat de wisselknop toont: het origineel (als terugzetten), dan de
// suggesties, zonder wat al op deze dag staat of verboden is.
export function suggestiesVoor(oefening, opDag, keuzes = []) {
  const verboden = new Set(BEPERKINGEN.filter(b => keuzes.includes(b.key)).flatMap(b => b.verboden))
  const bron = oefening.origineel || oefening.naam
  const lijst = [...(ALTERNATIEVEN[bron] || []), ...(ALTERNATIEVEN[oefening.naam] || [])]
  const gezien = new Set()
  return lijst.filter(n => {
    if (n === oefening.naam || gezien.has(n) || verboden.has(n) || opDag.includes(n)) return false
    gezien.add(n)
    return true
  })
}
