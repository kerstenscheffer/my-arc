import fs from 'fs'

const secties = [
  ['GEGEVENS · 1. Basis',        'src/modules/public-intake/components/phase1/BasicsFlow.jsx'],
  ['GEGEVENS · 2. Lichaam',      'src/modules/public-intake/components/phase1/BodyFlow.jsx'],
  ['GEGEVENS · 3. Doel',         'src/modules/public-intake/components/phase1/GoalFlow.jsx'],
  ['GEGEVENS · 4. Leefstijl',    'src/modules/public-intake/components/phase1/LifestyleFlow.jsx'],
  ['GEGEVENS · 5. Gezondheid',   'src/modules/public-intake/components/phase1/HealthFlow.jsx'],
  ['GEGEVENS · 6. Coaching',     'src/modules/public-intake/components/phase1/CoachingFlow.jsx'],
  ['VOEDING · 1. Huidige maaltijden', 'src/modules/nutrition-intake/components/nutrition-flow/CurrentMealsFlow.jsx'],
  ['VOEDING · 2. Eetpatroon',    'src/modules/nutrition-intake/components/nutrition-flow/EatPatternFlow.jsx'],
  ['VOEDING · 3. Kennis',        'src/modules/nutrition-intake/components/nutrition-flow/KnowledgeFlow.jsx'],
  ['VOEDING · 4. Beperkingen',   'src/modules/nutrition-intake/components/nutrition-flow/RestrictionsFlow.jsx'],
  ['VOEDING · 5. Praktisch',     'src/modules/nutrition-intake/components/nutrition-flow/PracticalFlow.jsx'],
  ['VOEDING · 6. Extra\'s',      'src/modules/nutrition-intake/components/nutrition-flow/ExtrasFlow.jsx'],
  ['TRAINING · 1. Ervaring',     'src/modules/public-intake/components/phase3/ExperienceFlow.jsx'],
  ['TRAINING · 2. Huidige training','src/modules/public-intake/components/phase3/CurrentTrainingFlow.jsx'],
  ['TRAINING · 3. Focus',        'src/modules/public-intake/components/phase3/FocusFlow.jsx'],
  ['TRAINING · 4. Beperkingen',  'src/modules/public-intake/components/phase3/LimitationsFlow.jsx'],
  ['TRAINING · 5. Cardio',       'src/modules/public-intake/components/phase3/CardioFlow.jsx'],
  ['TRAINING · 6. Praktisch',    'src/modules/public-intake/components/phase3/PracticalFlow.jsx'],
  ['TRAINING · 7. Weekagenda',   'src/modules/public-intake/components/WeekBuilder/WeekBuilder.jsx'],
]

const schoon = (t) => t
  .replace(/\{[^{}]*\}/g, m => {
    const v = m.slice(1, -1).trim()
    return /^['"`]/.test(v) ? v.slice(1, -1) : `<${v}>`
  })
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim()

for (const [naam, pad] of secties) {
  if (!fs.existsSync(pad)) { console.log(`\n### ${naam}\n(bestand niet gevonden)`); continue }
  const src = fs.readFileSync(pad, 'utf8')
  const uit = []
  const re = /<(Q|Hint)\b[^>]*>([\s\S]*?)<\/\1>/g
  let m
  while ((m = re.exec(src))) {
    const tekst = schoon(m[2])
    if (!tekst) continue
    uit.push(m[1] === 'Q' ? `- ${tekst}` : `    ↳ ${tekst}`)
  }
  console.log(`\n### ${naam}`)
  console.log(uit.length ? uit.join('\n') : '(geen <Q> gevonden — andere opzet)')
}
