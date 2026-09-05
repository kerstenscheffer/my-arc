// scripts/controleer-imports.mjs
//
// Zoekt JSX-componenten die gebruikt worden zonder import of definitie.
//
// Waarom dit bestaat: zo'n ontbrekende naam komt door de build én door
// ESLint heen. `no-undef` slaat niet aan als de naam elders in het bestand
// bestaat, en Vite bouwt gewoon door. Je merkt het pas als het scherm
// opengaat en React over een undefined component valt.
//
// Gebruik:  node scripts/controleer-imports.mjs <bestand...>
// Geeft exitcode 1 als er iets ontbreekt, zodat het in een keten kan.
//
// Let op de regelverwerking hieronder: een eerdere poging gebruikte één
// regex over het hele bestand. Bij een import over meerdere regels
// (`import {\n  A,\n  B\n} from 'x'`) slokte die de volgende import-regels
// op, waardoor bestaande imports als "ontbrekend" werden gemeld. Vals alarm
// is hier duurder dan geen controle: je leert de melding negeren.

import fs from 'fs'

function bindingenUitImports(bron) {
  const namen = new Set()
  const regels = bron.split('\n')
  let buffer = null

  for (const regel of regels) {
    if (buffer === null && !regel.startsWith('import ')) continue
    buffer = buffer === null ? regel : buffer + ' ' + regel.trim()

    // Een import is pas compleet als hij zijn bronpad heeft.
    const klaar = /\sfrom\s+['"]/.test(buffer)
    if (!klaar) {
      // Zijeffect-import zonder bindingen: import './x.css'
      if (/^import\s+['"]/.test(buffer)) buffer = null
      continue
    }

    const deel = buffer.slice(0, buffer.search(/\sfrom\s+['"]/))
      .replace(/^import\s+/, '')
      .replace(/[{}]/g, ' ')
    for (const stuk of deel.split(',')) {
      const naam = stuk.trim().split(/\s+as\s+/).pop().trim()
      if (naam && /^[A-Za-z_$][\w$]*$/.test(naam)) namen.add(naam)
    }
    buffer = null
  }
  return namen
}

let problemen = 0
for (const pad of process.argv.slice(2)) {
  const bron = fs.readFileSync(pad, 'utf8')
  const bekend = bindingenUitImports(bron)

  // Ook lokaal gedefinieerde componenten tellen mee.
  for (const m of bron.matchAll(/(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/g)) bekend.add(m[1])

  const gebruikt = new Set([...bron.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map(m => m[1]))
  const ontbreekt = [...gebruikt].filter(n => !bekend.has(n))

  const naam = pad.split('/').pop()
  if (ontbreekt.length) {
    problemen += ontbreekt.length
    console.log(`${naam}: ONTBREEKT — ${ontbreekt.join(', ')}`)
  } else {
    console.log(`${naam}: compleet`)
  }
}
process.exit(problemen ? 1 : 0)
