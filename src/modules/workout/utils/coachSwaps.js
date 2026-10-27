// src/modules/workout/utils/coachSwaps.js
//
// Coach-suggesties in het wisselvenster: per soort oefening de twee, drie
// beste vervangers, vanuit een bodybuilding-blik (Kersten, 27 okt 2026).
// Zelfde spier, zelfde hoek, zelfde beweging: een incline press blijft een
// incline press (andere machine), een cable lateral raise wordt een machine-
// of dumbbell lateral raise, een row blijft een row.
//
// De eerste regel die op de naam past wint, dus specifiek staat boven
// algemeen (rear delt vóór fly, preacher vóór curl, straight-arm vóór
// pulldown). De namen moeten bestaan in `exercises`; wat er niet is, of wat
// de oefening zelf is, valt weg. Van de rest tonen we er maximaal drie.

const REGELS = [
  // Eerst wat anders door een algemenere regel gevangen wordt: een leg curl
  // is geen biceps-curl, een RDL geen gewone deadlift.
  { match: /leg curl|hamstring curl/, opties: ['Seated Leg Curl', 'Lying Leg Curl', 'Nordic Hamstring Curl'] },
  { match: /romanian|rdl|stiff|good morning|hyperext/, opties: ['Romanian Deadlift (Dumbbell)', 'Romanian Deadlift', 'Seated Leg Curl', 'Hyperextensions'] },

  // ── Schouders ──
  { match: /rear delt|reverse pec|face pull/, opties: ['Reverse Pec Deck', 'Chest Supported Rear Delt Fly', 'Cable Rear Delt Flies', 'Single Arm Cable Rear Delt Fly'] },
  { match: /upright row/, opties: ['Upright Row (Cable)', 'Cable Lateral Raise', 'Machine Lateral Raise'] },
  { match: /machine lateral/, opties: ['Cable Lateral Raise', 'Dumbbell Lateral Raise', 'Single Arm Cable Lateral Raise'] },
  { match: /cable lateral|lateral raise.*cable/, opties: ['Machine Lateral Raise', 'Dumbbell Lateral Raise', 'Single Arm Cable Lateral Raise'] },
  { match: /lateral raise|lu raise/, opties: ['Cable Lateral Raise', 'Machine Lateral Raise', 'Single Arm Cable Lateral Raise'] },
  { match: /front raise/, opties: ['Front Raise (Cable)', 'Front Raise (Dumbbell)', 'Machine Shoulder Press'] },
  { match: /shoulder press|overhead press|arnold|military|bradford/, opties: ['Machine Shoulder Press', 'Dumbbell Shoulder Press', 'Smith Machine Shoulder Press', 'Seated Barbell Overhead Press'] },

  // ── Biceps ──
  { match: /preacher|spider|concentration/, opties: ['EZ-Bar Preacher Curls', 'Preacher Curl (Dumbbell)', 'Single Arm Cable Preacher Curl', 'Spider Curl'] },
  { match: /hammer|zottman/, opties: ['Hammer Curls', 'Cable Hammer Curls', 'Zottman Curl'] },
  { match: /incline.*curl|bayesian|drag curl/, opties: ['Bayesian Cable Curl', 'Incline Dumbbell Curl', 'Single Arm Cable Curl', 'Cable Bicep Curls'] },
  { match: /curl/, opties: ['Cable Bicep Curls', 'EZ-Bar Curl', 'Dumbbell Curl', 'Bayesian Cable Curl'] },

  // ── Triceps ──
  { match: /overhead.*(tri|ext)|(tri|ext).*overhead/, opties: ['Cable Overhead Triceps Extension', 'Dumbbell Overhead Extension', 'Single-Arm Overhead Cable Extension', 'EZ-Bar Skull Crusher'] },
  { match: /skull|jm press|close-?grip.*bench|tate/, opties: ['EZ-Bar Skull Crusher', 'Close-Grip Bench Press', 'Cable Overhead Triceps Extension'] },
  { match: /single arm.*tri|crossbody|tricep extension/, opties: ['Crossbody Cable Extension', 'Single Arm Tricep Pushdown', 'Single-Arm Overhead Cable Extension'] },
  { match: /pushdown|push-?down/, opties: ['Cable Pushdown (Rope)', 'Cable Pushdown (Straight Bar)', 'Cable Pushdown (V-Bar)', 'Single Arm Tricep Pushdown'] },
  { match: /dips.*tri|bench dips|diamond/, opties: ['Dips (Triceps Focus)', 'Close-Grip Bench Press', 'Cable Pushdown (Rope)'] },

  // ── Borst ──
  { match: /(incline|low-to-high|low to high).*(fly|flies|crossover)/, opties: ['Incline Cable Flies', 'Low-to-High Cable Fly', 'Incline Dumbbell Fly', 'Seated Incline Cable Fly'] },
  { match: /(high-to-low|high to low|decline).*(fly|flies|crossover)/, opties: ['High-to-Low Cable Fly', 'Machine Pec Deck', 'Seated Cable Fly', 'Cable Crossover'] },
  { match: /pec deck|chest fly|machine fly|crossover|cable fly|dumbbell fly|seated cable fly|squeeze press|svend/, opties: ['Machine Pec Deck', 'Seated Cable Fly', 'Cable Crossover', 'Flat Dumbbell Fly'] },
  { match: /incline/, opties: ['Incline Dumbbell Press', 'Incline Smith Machine Bench Press', 'Incline Machine Chest Press', 'Low-Incline Barbell Bench Press', 'Incline Barbell Bench Press'] },
  { match: /decline.*(press|bench)/, opties: ['Weighted Dips (Chest Focus)', 'Decline Dumbbell Bench Press', 'High-to-Low Cable Fly'] },
  { match: /dips.*chest|chest.*dips|weighted dips|dip assist|dips machine/, opties: ['Weighted Dips (Chest Focus)', 'Decline Dumbbell Bench Press', 'Machine Chest Press'] },
  { match: /push-?ups?$|^push-?ups?|decline push/, opties: ['Machine Chest Press', 'Flat Dumbbell Bench Press', 'Flat Smith Machine Bench Press'] },
  { match: /bench press|chest press|machine press|floor press|hex press|plate press|landmine press/, opties: ['Flat Dumbbell Bench Press', 'Machine Chest Press', 'Flat Smith Machine Bench Press', 'Barbell Bench Press'] },

  // ── Rug ──
  { match: /straight.?arm|pullover/, opties: ['Straight-Arm Pulldown (Rope)', 'Cable Pullovers', 'Dumbbell Pullover'] },
  { match: /single.?arm.*(lat )?pull(down)?|single arm lat pull/, opties: ['Close-Grip Lat Pulldown', 'Single Arm Cable Row', 'Lat Pulldown'] },
  { match: /pulldown|pull-?ups?|chin-?ups?|chin assist/, opties: ['Lat Pulldown', 'Single Arm Lat Pulldown', 'Close-Grip Lat Pulldown', 'Pull-Ups'] },
  { match: /chest supported.*row|machine row|t-bar row/, opties: ['Chest Supported Machine Row', 'Seated Cable Row (Close Grip)', 'T-Bar Row (Chest-Supported)', 'Machine Row'] },
  { match: /(single.?arm|dumbbell|kettlebell|meadows).*row|row.*single arm/, opties: ['Single Arm Machine Row', 'Single Arm Cable Row', 'Chest Supported Machine Row'] },
  { match: /barbell.*row|bent.?over row|pendlay|yates/, opties: ['T-Bar Row (Chest-Supported)', 'Chest Supported Machine Row', 'Seated Cable Row (Wide Grip)'] },
  { match: /row/, opties: ['Chest Supported Machine Row', 'Seated Cable Row (Close Grip)', 'Machine Row', 'Single Arm Cable Row'] },
  { match: /deadlift$|^deadlift|rack pull|sumo/, opties: ['Rack Pull', 'Romanian Deadlift', 'Hip Thrust'] },

  // ── Benen ──
  { match: /leg press calf/, opties: ['Standing Calf Raise', 'Seated Calf Raise'] },
  { match: /seated calf/, opties: ['Seated Calf Raise', 'Standing Calf Raise', 'Leg Press Calf Raise'] },
  { match: /calf/, opties: ['Standing Calf Raise', 'Leg Press Calf Raise', 'Seated Calf Raise'] },
  { match: /leg extension|sissy/, opties: ['Leg Extension', 'Sissy Squat', 'Hack Squat', 'Leg Press (machine)'] },
  { match: /hip thrust|glute bridge|frog pump|pull-through/, opties: ['Hip Thrust', 'Glute Bridge', 'B-Stance Hip Thrust', 'Cable Pull-Through'] },
  { match: /split squat|lunge|step-?ups?/, opties: ['Bulgarian Split Squat', 'Walking Lunges', 'Reverse Lunges', 'Leg Press (Single Leg)'] },
  { match: /hack|pend[ua]l|smith.*squat/, opties: ['Hack Squat', 'Leg Press (machine)', 'Smith Machine Squat', 'Barbell Front Squat'] },
  { match: /goblet/, opties: ['Leg Press (machine)', 'Bulgarian Split Squat', 'Hack Squat'] },
  { match: /squat|sqaut/, opties: ['Hack Squat', 'Smith Machine Squat', 'Leg Press (machine)', 'Barbell Front Squat'] },
  { match: /leg press/, opties: ['Hack Squat', 'Leg Press (Single Leg)', 'Smith Machine Squat'] },

  // ── Buik ──
  { match: /leg raise|knee raise|l-sit/, opties: ['Hanging Leg Raises', 'Hanging Knee Raises', 'Cable Crunches'] },
  { match: /crun[cs]h|sit-?ups?/, opties: ['Cable Crunches', 'Hanging Knee Raises', 'Ab Wheel Rollout'] },
]

// "Cable Lateral Raises" en "Cable Lateral Raise" zijn dezelfde oefening.
export const normNaam = (n) => String(n || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim()
  .split(' ').map(w => w.replace(/s$/, '')).join(' ')

// Maximaal `max` coach-suggesties voor deze oefening, als rijen uit `alle`.
export function coachSuggesties(naam, alle, max = 3) {
  const laag = String(naam || '').toLowerCase()
  const regel = REGELS.find(r => r.match.test(laag))
  if (!regel) return []
  const zelf = normNaam(naam)
  const opNaam = new Map()
  ;(alle || []).forEach(ex => { const k = normNaam(ex.name); if (!opNaam.has(k)) opNaam.set(k, ex) })
  const gezien = new Set([zelf])
  const uit = []
  for (const optie of regel.opties) {
    const k = normNaam(optie)
    if (gezien.has(k)) continue
    const ex = opNaam.get(k)
    if (!ex) continue
    gezien.add(k)
    uit.push(ex)
    if (uit.length >= max) break
  }
  return uit
}
