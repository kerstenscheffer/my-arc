// scripts/gino-rechten-aan.mjs
//
// Eenmalig, door Kersten zelf te draaien: geeft Gino's code-opdrachten twee extra
// rechten, zodat ze hun werk zelf kunnen afmaken.
//   → node scripts/pa-sql.mjs *   database uitbreiden (weigert alles wat niet aanvullend is)
//   → npm run release             live zetten, alleen als zijn akkoord in de opdracht staat
//
// Terugdraaien: dezelfde regels weer weghalen uit scripts/business-os-pa.mjs.
//
//   node scripts/gino-rechten-aan.mjs            en daarna PA herstarten

import fs from 'node:fs'
import path from 'node:path'

const MAP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const F = process.argv[2] ? path.resolve(process.argv[2]) : path.join(MAP, 'scripts', 'business-os-pa.mjs')
let s = fs.readFileSync(F, 'utf8')
if (s.includes("'Bash(node scripts/pa-sql.mjs *)'")) { console.log('Staat al aan.'); process.exit(0) }

const vervang = (a, b) => {
  if (s.split(a).length !== 2) { console.error(`Niet gevonden: ${a.slice(0, 60)}`); process.exit(1) }
  s = s.replace(a, () => b)
}
vervang(`  'Bash(node scripts/pa-db.mjs *)', 'Bash(node scripts/yt-transcript.mjs *)', 'Bash(pdftotext *)', 'Bash(pdfinfo *)',
]`, `  'Bash(node scripts/pa-db.mjs *)', 'Bash(node scripts/yt-transcript.mjs *)', 'Bash(pdftotext *)', 'Bash(pdfinfo *)',
  // Aangezet door Kersten: opdrachten maken hun werk zelf af.
  'Bash(node scripts/pa-sql.mjs *)', 'Bash(npm run release)',
]`)
vervang(`- Schemawijzigingen kun je hier niet doen, ook niet via de Supabase-MCP: de bevestiging daarvan wordt automatisch geannuleerd. Heb je er een nodig, schrijf de SQL dan in een bestand onder src/modules/ en zeg bij NODIG welk bestand gedraaid moet worden.
- Een release kun je hier ook niet zelf doen. Moet het live, dan is de uitkomst wacht_op_jou met bij NODIG: npm run release.`,
`- Schemawijziging: schrijf de SQL in een bestand onder src/modules/ en draai node scripts/pa-sql.mjs <pad>. Alleen aanvullend. Weigert het script iets, of ontbreekt de sleutel, zeg dan bij NODIG precies wat Kersten moet doen. Controleer daarna met pa-db dat het er echt staat. Gebruik de Supabase-MCP niet voor wijzigingen: de bevestiging daarvan wordt automatisch geannuleerd.
- Release: draai npm run release alleen als in de opdracht staat dat Kersten akkoord geeft. Dan vraag je het niet nog een keer. Staat het er niet en moet het live, dan is de uitkomst wacht_op_jou met bij NODIG: npm run release.`)
fs.writeFileSync(F, s)
console.log('Aangezet. Herstart de PA: launchctl kickstart -k gui/$(id -u)/nl.myarc.pa')
