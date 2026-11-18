// supabase/functions/workout-bouwer/kern.ts
//
// Rekenkern van het concept-trainingsplan na de intake (18 nov 2026). Puur:
// geen database, geen AI. Regels: docs/regels-canonieke-plannen.md.
//
//   1. Canoniek plan kiezen op geslacht + dagen per week (+ focus, huidige split).
//   2. Pijntjes en "liever niet"-oefeningen wisselen voor een vast alternatief.
//   3. Elke dag terugbrengen tot de tijd van de klant en het setmaximum.
//      Volgorde van schrappen: kuiten, "liever niet groter", dubbele isolatie,
//      overige isolatie, 3 sets naar 2. Focusspieren gaan als laatste, net als
//      schouders en buik (man) of achterkant schouders en buik (vrouw).
//   4. Focusspieren een set (of oefening) erbij waar tijd over is.
//   5. Trainingsdagen op de voorkeursdagen van de klant.
//
// Alles wat het systeem besluit komt in de brief (`brief.keuzes`), alles wat
// het niet kon beslissen in `brief.nakijken`.
// deno-lint-ignore-file no-explicit-any

const MIN_PER_OEFENING = 9, MIN_PER_EXTRA_SET = 3
const MAX_SETS = 16, MAX_SETS_40PLUS = 14
const MIN_TRAINING = 45
// De intake vraagt een bereik ("45 tot 60 min") en bewaart de ondergrens. Het
// plan mag de bovengrens gebruiken (Kersten, 18 nov 2026).
const TIJD_BEREIK = 15
// Zes oefeningen passen altijd in een training: wie krap in de tijd zit doet
// oefeningen om en om. Voor tijd wordt er dus nooit onder de zes ingekort
// (feedback Kersten, 18 nov 2026: "6 oefeningen moet in 45 ook lukken").
const MIN_OEFENINGEN = 6
const BEEN = ['quads', 'hamstrings', 'glutes', 'calves']
const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const DAG_VOL: Record<string, string> = { ma: 'maandag', di: 'dinsdag', wo: 'woensdag', do: 'donderdag', vr: 'vrijdag', za: 'zaterdag', zo: 'zondag' }

export const SPIER_NL: Record<string, string> = {
  chest: 'borst', back: 'rug', quads: 'bovenbenen', hamstrings: 'achterkant benen', glutes: 'billen', calves: 'kuiten',
  triceps: 'triceps', biceps: 'biceps', side_delts: 'schouders', rear_delts: 'achterkant schouders', abs: 'buik', traps: 'traps',
}
const FOCUS_NL: Record<string, string> = {
  arms: 'armen', chest: 'borst', shoulders: 'schouders', back: 'rug', traps: 'nek en traps', abs: 'buik',
  quads: 'bovenbenen', hamstrings: 'achterkant benen', glutes: 'billen', calves: 'kuiten',
}
// Intake-keuze -> spieren in het plan.
const FOCUS_SPIER: Record<string, string[]> = {
  arms: ['triceps', 'biceps'], chest: ['chest'], shoulders: ['side_delts', 'rear_delts'], back: ['back'], traps: ['traps'],
  abs: ['abs'], quads: ['quads'], hamstrings: ['hamstrings'], glutes: ['glutes'], calves: ['calves'],
}

type Oef = { name: string; sets: number; type?: string; primairSpieren?: string; [k: string]: any }
type Dag = { name: string; focus?: string; exercises: Oef[]; geschatteTijd?: string }

const kaal = (n: string) => String(n || '').replace(/\s*\(.*?\)\s*/g, ' ').trim()

export function spierVan(ex: Oef): string {
  const n = String(ex?.name || '').toLowerCase()
  const p = String(ex?.primairSpieren || '').toLowerCase()
  if (/cal(f|ves)|kuit/.test(n)) return 'calves'
  if (/crunch|leg raise|sit.?up|plank/.test(n)) return 'abs'
  if (/shrug/.test(n)) return 'traps'
  if (/rear delt|reverse fl|face pull/.test(n)) return 'rear_delts'
  if (/lateral raise/.test(n)) return 'side_delts'
  if (/hip thrust|glute|kickback|abduct/.test(n)) return 'glutes'
  if (/leg curl|romanian|rdl|deadlift|hamstring/.test(n)) return 'hamstrings'
  if (/squat|leg extension|leg press|lunge/.test(n)) return 'quads'
  if (p === 'triceps' || /tricep|pushdown/.test(n)) return 'triceps'
  if (p === 'biceps' || /curl/.test(n)) return 'biceps'
  // Rug vóór borst: "T-Bar Row (Chest-Supported)" is een rugoefening.
  if (p === 'back' || /row|pulldown|pull.?up/.test(n)) return 'back'
  if (p === 'chest' || p === 'borst' || /bench|chest|pec/.test(n)) return 'chest'
  if (p === 'shoulders') return 'side_delts'
  return p || 'onbekend'
}
const isCompound = (ex: Oef) => /squat|leg press|romanian|deadlift|hip thrust|bench|chest press|pulldown|row|pull.?up/i.test(ex.name)

export const minuten = (d: Dag) => d.exercises.reduce((n, e) => n + MIN_PER_OEFENING + Math.max(-1, (Number(e.sets) || 2) - 2) * MIN_PER_EXTRA_SET, 0)
export const setsVan = (d: Dag) => d.exercises.reduce((n, e) => n + (Number(e.sets) || 2), 0)

// Vaste oefeningen die het systeem mag inzetten (namen uit de canonieke plannen).
const OEF: Record<string, Oef> = {
  'Leg Press': { name: 'Leg Press', primairSpieren: 'legs', equipment: 'machine', type: 'compound', reps: '8-12', rust: '3 min', sets: 2 },
  'Seated Leg Curl': { name: 'Seated Leg Curl', primairSpieren: 'legs', equipment: 'machine', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Leg Extension': { name: 'Leg Extension', primairSpieren: 'legs', equipment: 'machine', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Hip Thrust': { name: 'Hip Thrust', primairSpieren: 'glutes', equipment: 'barbell', type: 'compound', reps: '8-12', rust: '3 min', sets: 2 },
  'Calf Raises': { name: 'Calf Raises', primairSpieren: 'calves', equipment: 'machine', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Machine Chest Press': { name: 'Machine Chest Press', primairSpieren: 'chest', equipment: 'machine', type: 'compound', reps: '8-12', rust: '2 min', sets: 2 },
  'Machine Pec Deck': { name: 'Machine Pec Deck', primairSpieren: 'chest', equipment: 'machine', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Lat Pulldown': { name: 'Lat Pulldown', primairSpieren: 'back', equipment: 'cable', type: 'compound', reps: '8-12', rust: '2 min', sets: 2 },
  'Triceps Pushdown': { name: 'Triceps Pushdown', primairSpieren: 'triceps', equipment: 'cable', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Cable Bicep Curls': { name: 'Cable Bicep Curls', primairSpieren: 'biceps', equipment: 'cable', type: 'isolation', reps: '8-12', rust: '2 min', sets: 2 },
  'Cable Lateral Raises': { name: 'Cable Lateral Raises', primairSpieren: 'shoulders', equipment: 'cable', type: 'isolation', reps: '10-15', rust: '2 min', sets: 3 },
  'Cable Rear Delt Flies': { name: 'Cable Rear Delt Flies', primairSpieren: 'shoulders', equipment: 'cable', type: 'isolation', reps: '10-15', rust: '2 min', sets: 3 },
  'Machine Crunches': { name: 'Machine Crunches', primairSpieren: 'abs', equipment: 'machine', type: 'isolation', reps: '8-12', rust: '2 min', sets: 3 },
  'Dumbbell Shrugs': { name: 'Dumbbell Shrugs', primairSpieren: 'traps', equipment: 'dumbbell', type: 'isolation', reps: '10-15', rust: '2 min', sets: 2 },
}
const nieuweOef = (naam: string, sets?: number): Oef => ({ rpe: '7-8', notes: '', stretch: false, priority: 1, goalPriority: false, ...OEF[naam], ...(sets ? { sets } : {}) })

// Oefening erbij voor een focusspier die te weinig in het plan zit.
const ERBIJ: Record<string, string> = {
  hamstrings: 'Seated Leg Curl', calves: 'Calf Raises', glutes: 'Hip Thrust', quads: 'Leg Extension', traps: 'Dumbbell Shrugs',
  triceps: 'Triceps Pushdown', biceps: 'Cable Bicep Curls', side_delts: 'Cable Lateral Raises', rear_delts: 'Cable Rear Delt Flies',
  abs: 'Machine Crunches', chest: 'Machine Pec Deck', back: 'Lat Pulldown',
}
// Vast alternatief per oefening (op kale naam, zonder haakjes).
const ALTERNATIEF: Record<string, string> = {
  'Hack Squat': 'Leg Press', 'Romanian Deadlift': 'Seated Leg Curl',
  'Incline Smith Machine Bench Press': 'Machine Chest Press', 'Incline Barbell Bench Press': 'Machine Chest Press',
  'Machine Chest Press': 'Machine Pec Deck', 'Cable Overhead Triceps Extension': 'Triceps Pushdown',
  'Single Arm Cable Tricep Extension': 'Triceps Pushdown', 'EZ-Bar Preacher Curls': 'Cable Bicep Curls',
  'Incline Dumbbell Curl': 'Cable Bicep Curls', 'Hanging Leg Raises': 'Machine Crunches', 'Machine Lateral Raise': 'Cable Lateral Raises',
}
// Pijntje -> welke oefeningen eruit, en waar de coach op moet letten.
const REGIO: { naam: string; re: RegExp; weg: string[]; let?: string }[] = [
  { naam: 'schouder', re: /schouder|shoulder|rotator/i, weg: ['Incline Smith Machine Bench Press', 'Incline Barbell Bench Press', 'Cable Overhead Triceps Extension'], let: 'Lateral raises licht starten en pijnvrij houden.' },
  { naam: 'knie', re: /knie|knee|meniscus|kruisband/i, weg: ['Hack Squat'], let: 'Leg extension licht starten; bij pijn eruit.' },
  { naam: 'onderrug', re: /onderrug|lage rug|rugklacht|rugpijn|hernia|ischias|\brug\b/i, weg: ['Romanian Deadlift', 'Hanging Leg Raises'] },
  { naam: 'elleboog', re: /elleboog|tennisarm|golfarm|elbow/i, weg: ['Cable Overhead Triceps Extension', 'EZ-Bar Preacher Curls'] },
  { naam: 'pols', re: /\bpols|wrist/i, weg: ['EZ-Bar Preacher Curls', 'Incline Smith Machine Bench Press', 'Incline Barbell Bench Press'] },
  { naam: 'heup', re: /heup|lies|\bhip\b/i, weg: ['Hack Squat'], let: 'Hip thrust en RDL op gevoel; bij pijn wisselen.' },
  { naam: 'nek', re: /\bnek|neck/i, weg: [], let: 'Geen shrugs; pulldown en rows met ontspannen nek.' },
]

const stam = (w: string) => w.toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '')
// "Bench press" raakt "Incline Smith Machine Bench Press"; "Split squats" raakt de hack squat niet.
function raakt(vermijd: string, oefening: string) {
  const woorden = vermijd.split(/[\s-]+/).map(stam).filter(w => w.length >= 3)
  if (!woorden.length) return false
  const naam = oefening.toLowerCase().split(/[\s()/-]+/).map(stam)
  return woorden.every(w => naam.includes(w))
}

function leeftijd(geboren?: string | null) {
  if (!geboren) return null
  const d = new Date(geboren); if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400_000))
}

// n dagen kiezen uit de voorkeursdagen, zo gelijk mogelijk over de week verdeeld.
function kiesDagen(voorkeur: string[], n: number): string[] | null {
  const idx = [...new Set(voorkeur.map(d => DAGEN.indexOf(String(d).toLowerCase().slice(0, 2))).filter(i => i >= 0))].sort((a, b) => a - b)
  if (idx.length < n || n < 1) return null
  let beste: number[] | null = null, besteScore = -1
  const combi = (start: number, gekozen: number[]) => {
    if (gekozen.length === n) {
      const gaten = gekozen.map((d, i) => ((gekozen[(i + 1) % n] - d + 7) % 7) || 7)
      const score = Math.min(...gaten) * 10 - (Math.max(...gaten) - Math.min(...gaten))
      if (score > besteScore) { besteScore = score; beste = [...gekozen] }
      return
    }
    for (let i = start; i < idx.length; i++) combi(i + 1, [...gekozen, idx[i]])
  }
  combi(0, [])
  return beste ? (beste as number[]).map(i => DAGEN[i]) : null
}

export type Invoer = {
  klant: { id: string; first_name?: string; gender?: string; date_of_birth?: string | null; injuries?: string | null; preferred_training_days?: string[] | null }
  wp: any            // rij uit user_workout_preferences (mag null zijn)
  templates: any[]   // canonieke plannen: id, name, days_per_week, doelgroep, week_structure, cyclus, created_at
}

export function bouwConcept({ klant, wp, templates }: Invoer) {
  const keuzes: string[] = [], nakijken: string[] = []
  const sp = wp?.split_preferences || {}
  const naam = String(klant.first_name || 'Klant').trim()

  // ── 1. Uitgangspunten ────────────────────────────────────────────────────
  const g0 = String(klant.gender || '').toLowerCase()
  let groep = ['male', 'man', 'm'].includes(g0) ? 'man' : ['female', 'vrouw', 'v', 'f'].includes(g0) ? 'vrouw' : null
  if (!groep) { groep = 'man'; nakijken.push('Geslacht staat niet in de intake; het mannenplan is als basis genomen.') }

  const voorkeurDagen: string[] = Array.isArray(klant.preferred_training_days) ? klant.preferred_training_days : []
  let dagen = Number(wp?.default_days_per_week) || 0
  if (!dagen) {
    dagen = 3
    keuzes.push('Dagen per week: de klant liet dit aan jou. Gekozen voor 3 keer.')
  }
  let tijd = Number(wp?.default_time_per_session) || 0
  const tijdBekend = tijd > 0
  if (!tijd) { tijd = 60; nakijken.push('Tijd per training staat niet in de intake; gerekend met 60 minuten.') }
  // De klant kiest een bereik en de intake bewaart de ondergrens: "45 tot 60
  // min" staat als 45 in de database. Het plan mag tot de bovengrens duren.
  // Een training is minimaal 45 minuten: korter levert geen zinnig plan op.
  const bovengrens = tijdBekend ? tijd + TIJD_BEREIK : tijd
  const budget = Math.max(MIN_TRAINING, Math.min(bovengrens, 90))
  if (tijdBekend) keuzes.push(`Tijd: de klant koos ${tijd} tot ${tijd + TIJD_BEREIK} minuten per training; het plan mag tot ${budget} minuten duren.`)
  const jr = leeftijd(klant.date_of_birth)
  const maxSets = jr != null && jr >= 40 ? MAX_SETS_40PLUS : MAX_SETS
  if (maxSets === MAX_SETS_40PLUS) keuzes.push(`${jr} jaar: maximaal ${MAX_SETS_40PLUS} sets per training in plaats van ${MAX_SETS}.`)

  const focusKeuze: string[] = Array.isArray(sp.focus_spieren) ? sp.focus_spieren : []
  const nietKeuze: string[] = Array.isArray(sp.niet_groter) ? sp.niet_groter : []
  // Geen antwoord (oude intake): de standaard van man of vrouw.
  const focusBron = focusKeuze.length ? focusKeuze : (groep === 'man' ? ['shoulders', 'arms', 'chest'] : ['glutes', 'hamstrings', 'abs'])
  if (!focusKeuze.length) keuzes.push(`Geen focusspieren gekozen in de intake; uitgegaan van ${focusBron.map(k => FOCUS_NL[k]).join(', ')}.`)
  const focus = new Set(focusBron.flatMap(k => FOCUS_SPIER[k] || []))
  // Bij mannen betekent "schouders" de zijkant; de achterkant doet mee in het plan maar krijgt geen voorrang.
  if (groep === 'man') focus.delete('rear_delts')
  const niet = new Set(nietKeuze.flatMap(k => FOCUS_SPIER[k] || []))
  // Wat bij het inkorten net zo lang blijft staan als een focusspier (Kersten):
  // mannen schouders en buik, vrouwen achterkant schouders en buik.
  const beschermd = new Set([...focus, ...(groep === 'man' ? ['side_delts', 'abs'] : ['rear_delts', 'abs'])].filter(s => !niet.has(s)))

  // ── 2. Canoniek plan kiezen ──────────────────────────────────────────────
  const vanGroep = templates.filter(t => t.doelgroep === groep && t.week_structure)
  if (!vanGroep.length) throw new Error(`Geen canonieke plannen voor ${groep}`)
  const beschikbaar = [...new Set(vanGroep.map(t => Number(t.days_per_week)))].sort((a, b) => a - b)
  let n = dagen
  if (!beschikbaar.includes(n)) {
    n = beschikbaar.filter(d => d <= dagen).pop() ?? beschikbaar[0]
    nakijken.push(`De klant wil ${dagen} keer per week trainen; daar is geen canoniek plan voor (${groep}). Het plan voor ${n} keer is genomen.`)
  }
  const huidig = String(sp.preferred || '').toLowerCase()
  const splitRe = /full/.test(huidig) ? /full/i : /upper|lower/.test(huidig) ? /up|lo/i : /ppl|push/.test(huidig) ? /p[lp][lp]/i : null
  const kandidaten = vanGroep.filter(t => Number(t.days_per_week) === n).map(t => {
    let score = 0
    for (const d of Object.values(t.week_structure as Record<string, Dag>)) for (const e of d.exercises || []) {
      const s = spierVan(e)
      if (focus.has(s)) score += Number(e.sets) || 2
      if (niet.has(s)) score -= Number(e.sets) || 2
    }
    const pastBijHuidig = !!splitRe && splitRe.test(t.name)
    return { t, score: score + (pastBijHuidig ? 3 : 0), pastBijHuidig }
  }).sort((a, b) => b.score - a.score || String(b.t.created_at).localeCompare(String(a.t.created_at)))
  const gekozen = kandidaten[0]
  const basis = gekozen.t
  const basisNaam = String(basis.name).replace(/\s*\(nieuw\)\s*/i, '').trim()
  keuzes.push(kandidaten.length > 1
    ? `Basis: ${String(basis.name).trim()}. Gekozen boven ${kandidaten.slice(1).map(k => String(k.t.name).trim()).join(' en ')} omdat het de meeste sets voor de focusspieren heeft${gekozen.pastBijHuidig ? ' en aansluit op de split die de klant nu doet' : ''}.`
    : `Basis: ${basisNaam}, het canonieke plan voor ${groep} en ${n} keer per week.`)

  const sleutels = Object.keys(basis.week_structure).sort((a, b) => parseInt(a.replace('dag', '')) - parseInt(b.replace('dag', '')))
  const week: Record<string, Dag> = {}
  for (const k of sleutels) week[k] = { ...basis.week_structure[k], exercises: (basis.week_structure[k].exercises || []).map((e: Oef) => ({ ...e })) }
  const dagLijst = () => sleutels.map(k => week[k])

  // ── 3. Pijntjes en "liever niet" ─────────────────────────────────────────
  const wissel = (dag: Dag, i: number, reden: string) => {
    const oud = dag.exercises[i]
    const alt = ALTERNATIEF[kaal(oud.name)]
    if (!alt || dag.exercises.some(e => e.name === alt)) {
      dag.exercises.splice(i, 1)
      keuzes.push(`${dag.name.trim()}: ${oud.name} eruit (${reden})${alt ? `; ${alt} staat al op deze dag` : '. Geen vast alternatief, zelf vervangen als je wilt'}.`)
      return
    }
    dag.exercises[i] = nieuweOef(alt, Number(oud.sets) || 2)
    keuzes.push(`${dag.name.trim()}: ${oud.name} gewisseld voor ${alt} (${reden}).`)
  }
  const pijnTekst = [...new Set([wp?.injuries, wp?.other_limitations, klant.injuries].filter(Boolean).map(x => String(x).trim()))].join(' · ')
  const regios = REGIO.filter(r => r.re.test(pijnTekst))
  for (const r of regios) {
    for (const d of dagLijst()) for (let i = d.exercises.length - 1; i >= 0; i--) {
      if (r.weg.includes(kaal(d.exercises[i].name))) wissel(d, i, r.naam)
    }
    if (r.let) nakijken.push(`${r.naam[0].toUpperCase()}${r.naam.slice(1)}: ${r.let}`)
  }
  if (pijnTekst && !regios.length) nakijken.push(`Klachten uit de intake waar geen vaste regel voor is: "${pijnTekst}".`)
  else if (pijnTekst) nakijken.push(`Letterlijk uit de intake: "${pijnTekst}".`)

  const vermijd = [...new Set(String(wp?.avoided_exercises || '').split(',').map(x => x.trim()).filter(Boolean))]
  const geraakt: string[] = []
  for (const v of vermijd) for (const d of dagLijst()) for (let i = d.exercises.length - 1; i >= 0; i--) {
    if (raakt(v, d.exercises[i].name)) { wissel(d, i, `klant doet liever geen ${v.toLowerCase()}`); geraakt.push(v) }
  }
  const nietGeraakt = vermijd.filter(v => !geraakt.includes(v))
  if (nietGeraakt.length) keuzes.push(`Doet de klant liever niet, en zit ook niet in dit plan: ${nietGeraakt.join(', ')}.`)

  // ── 4. Terug naar de tijd van de klant ───────────────────────────────────
  const weekSets = () => {
    const m: Record<string, number> = {}
    for (const d of dagLijst()) for (const e of d.exercises) m[spierVan(e)] = (m[spierVan(e)] || 0) + (Number(e.sets) || 2)
    return m
  }
  for (const d of dagLijst()) {
    const weg: string[] = [], minder: string[] = []
    let rem = 40
    // Beendag: de helft of meer van de oefeningen is voor de benen. Daar gaat
    // geen beenoefening weg om plaats te maken voor het bovenlichaam, ook niet
    // als dat een focusspier is (feedback Kersten, 18 nov 2026).
    const beenDag = d.exercises.filter(e => BEEN.includes(spierVan(e))).length >= d.exercises.length / 2
    while (((minuten(d) > budget && d.exercises.length > MIN_OEFENINGEN) || setsVan(d) > maxSets) && d.exercises.length > 3 && rem-- > 0) {
      const totaal = weekSets()
      const kandidaat = d.exercises.map((e, i) => {
        const s = spierVan(e)
        const dubbel = d.exercises.filter(x => spierVan(x) === s).length > 1
        const rang = s === 'calves' && !focus.has(s) ? 0
          : beenDag && !BEEN.includes(s) && s !== 'abs' ? 0.5
          : niet.has(s) && (!isCompound(e) || dubbel) ? 1
          : beschermd.has(s) ? (isCompound(e) ? 9 : dubbel ? 6 : 7)
          : !isCompound(e) && dubbel ? 2
          : !isCompound(e) ? 3
          : dubbel ? 5 : 8
        return { i, e, s, rang, vol: totaal[s] || 0 }
      }).sort((a, b) => a.rang - b.rang || b.vol - a.vol || b.i - a.i)[0]
      // Eerst een derde set inleveren voordat een hele hoofdoefening sneuvelt.
      const teVeelSets = d.exercises.findIndex(e => (Number(e.sets) || 2) > 2 && !beschermd.has(spierVan(e)))
      if (kandidaat.rang >= 5 && teVeelSets >= 0) {
        d.exercises[teVeelSets].sets = 2; minder.push(d.exercises[teVeelSets].name); continue
      }
      weg.push(kandidaat.e.name); d.exercises.splice(kandidaat.i, 1)
    }
    if (weg.length || minder.length) {
      keuzes.push(`${d.name.trim()}: ingekort om binnen ${budget} minuten te blijven. ${weg.length ? `Eruit: ${weg.join(', ')}. ` : ''}${minder.length ? `Naar 2 sets: ${minder.join(', ')}.` : ''}`.trim())
    }
    if (minuten(d) > budget && d.exercises.length <= MIN_OEFENINGEN) keuzes.push(`${d.name.trim()}: ${d.exercises.length} oefeningen blijven staan, ook al is dat op papier ${minuten(d)} minuten bij ${budget} beschikbaar. Zes oefeningen passen als de klant oefeningen om en om doet.`)
    else if (minuten(d) > budget) nakijken.push(`${d.name.trim()} is ${minuten(d)} minuten en past niet in de ${budget} minuten van de klant.`)
  }

  // ── 5. Focusspieren extra werk waar tijd over is ─────────────────────────
  const ruimte = (d: Dag, min: number, sets: number) => minuten(d) + min <= budget && setsVan(d) + sets <= maxSets
  for (const s of focus) {
    const erbij: string[] = []
    let extra = 0
    for (const d of dagLijst()) for (const e of d.exercises) {
      if (extra >= 3) break
      if (spierVan(e) === s && (Number(e.sets) || 2) < 4 && ruimte(d, MIN_PER_EXTRA_SET, 1)) {
        e.sets = (Number(e.sets) || 2) + 1; extra++; erbij.push(`${d.name.trim()} ${e.name} naar ${e.sets} sets`)
      }
    }
    const keren = dagLijst().filter(d => d.exercises.some(e => spierVan(e) === s)).length
    if (keren < 2 && ERBIJ[s]) {
      const toe = nieuweOef(ERBIJ[s])
      const kost = MIN_PER_OEFENING + (toe.sets - 2) * MIN_PER_EXTRA_SET
      const been = ['quads', 'hamstrings', 'glutes', 'calves'].includes(s)
      const plek = dagLijst()
        .filter(d => !d.exercises.some(e => spierVan(e) === s) && ruimte(d, kost, toe.sets))
        .filter(d => !been || d.exercises.some(e => ['quads', 'hamstrings', 'glutes'].includes(spierVan(e))))
        .sort((a, b) => minuten(a) - minuten(b))[0]
      if (plek) {
        const buik = plek.exercises.findIndex(e => spierVan(e) === 'abs')
        plek.exercises.splice(buik >= 0 ? buik : plek.exercises.length, 0, toe)
        erbij.push(`${toe.name} erbij op ${plek.name.trim()}`)
      }
    }
    const nu = weekSets()[s] || 0
    if (erbij.length) keuzes.push(`Focus ${SPIER_NL[s]}: ${erbij.join(', ')}. Nu ${nu} sets per week.`)
    else if (!nu) nakijken.push(`Focus ${SPIER_NL[s]} zit niet in het plan en er was geen tijd om een oefening toe te voegen.`)
    else keuzes.push(`Focus ${SPIER_NL[s]}: ${nu} sets per week. Geen tijd over voor extra; deze oefeningen zijn wel als laatste geschrapt.`)
  }
  if (niet.size) keuzes.push(`Liever niet groter (${[...niet].map(s => SPIER_NL[s]).join(', ')}): geen extra werk, en als eerste geschrapt waar tijd tekort was.`)

  for (const d of dagLijst()) d.geschatteTijd = `${minuten(d)} minutes`

  // ── 6. Trainingsdagen ────────────────────────────────────────────────────
  let volgorde: (string | null)[] = Array.isArray(basis.cyclus?.volgorde) && basis.cyclus.volgorde.length === 7 ? [...basis.cyclus.volgorde] : []
  const gekozenDagen = kiesDagen(voorkeurDagen, sleutels.length)
  if (gekozenDagen) {
    volgorde = DAGEN.map(() => null)
    gekozenDagen.forEach((d, i) => { volgorde[DAGEN.indexOf(d)] = sleutels[i] })
    keuzes.push(`Trainingsdagen: ${gekozenDagen.map(d => DAG_VOL[d]).join(', ')}${voorkeurDagen.length > sleutels.length ? ` (gekozen uit de ${voorkeurDagen.length} dagen die de klant kan, zo gelijk mogelijk verdeeld)` : ''}.`)
    const naast = gekozenDagen.filter((d, i) => (DAGEN.indexOf(gekozenDagen[(i + 1) % gekozenDagen.length]) - DAGEN.indexOf(d) + 7) % 7 === 1)
    if (naast.length && sleutels.length <= 3) nakijken.push('Twee trainingsdagen liggen direct achter elkaar; check of dezelfde spieren niet twee dagen op rij komen.')
    else if (naast.length >= 3 && sleutels.length <= 4) nakijken.push(`De ${sleutels.length} trainingen staan ${naast.length + 1} dagen achter elkaar; de klant gaf geen andere dagen op.`)
  } else if (voorkeurDagen.length) {
    nakijken.push(`De klant gaf ${voorkeurDagen.length} voorkeursdag(en) op (${voorkeurDagen.join(', ')}), te weinig voor ${sleutels.length} trainingen. De standaardindeling van het plan staat erin.`)
  } else {
    nakijken.push('Geen voorkeursdagen in de intake; de standaardindeling van het plan staat erin.')
  }
  if (!volgorde.length) { volgorde = DAGEN.map(() => null); sleutels.forEach((k, i) => { volgorde[Math.min(6, i * Math.floor(7 / sleutels.length))] = k }) }

  // ── 7. Wat het systeem niet kan beslissen ────────────────────────────────
  const niveau = String(wp?.default_experience_level || '').toLowerCase()
  if (['beginner', 'starting'].includes(niveau)) nakijken.push('Beginner: er is nog geen beginnersversie. Overweeg minder oefeningen of eerst techniek.')
  const locatie = String(wp?.training_location || '').toLowerCase()
  const materiaal: string[] = Array.isArray(wp?.default_equipment) ? wp.default_equipment : []
  if (locatie === 'home' || (materiaal.length && !materiaal.includes('full_gym'))) {
    nakijken.push(`Dit is een gymplan, maar de klant traint ${locatie === 'home' ? 'thuis' : 'niet met een volledige gym'}${materiaal.length ? ` (${materiaal.join(', ')})` : ''}. Oefeningen zelf omzetten.`)
  } else if (locatie === 'both') nakijken.push('De klant traint thuis én in de gym; dit plan is voor de gym.')
  if (sp.huidig_toelichting || sp.huidig_dagen_tekst || (Array.isArray(sp.huidig_schema) && sp.huidig_schema.filter(Boolean).length)) {
    const delen = [sp.huidig_dagen_tekst && `traint nu ${sp.huidig_dagen_tekst} per week`, Array.isArray(sp.huidig_schema) && sp.huidig_schema.filter(Boolean).join(' / '), sp.huidig_toelichting].filter(Boolean)
    nakijken.push(`Huidige training volgens de klant: ${delen.join(' · ')}.`)
  }

  const langste = Math.max(...dagLijst().map(minuten))
  const samenvatting = `${basisNaam} voor ${naam}: ${sleutels.length} keer per week, tot ${langste} minuten per training (klant heeft ${tijdBekend ? `${tijd} tot ${tijd + TIJD_BEREIK}` : budget} minuten). Focus op ${focusBron.map(k => FOCUS_NL[k]).join(', ')}.`

  return {
    name: `Concept · ${basisNaam} · ${naam}`,
    days_per_week: sleutels.length,
    week_structure: week,
    cyclus: { lengte: 7, volgorde },
    basis: { id: basis.id, naam: basisNaam },
    brief: {
      versie: 1, gemaakt: new Date().toISOString(), samenvatting, keuzes, nakijken,
      basis: { id: basis.id, naam: basisNaam },
      klant: { dagen, tijd, focus: focusBron.map(k => FOCUS_NL[k]), niet_groter: nietKeuze.map(k => FOCUS_NL[k]), voorkeursdagen: voorkeurDagen },
    },
  }
}
