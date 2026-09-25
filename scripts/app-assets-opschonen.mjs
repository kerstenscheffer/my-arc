// scripts/app-assets-opschonen.mjs
//
// Haalt marketingmateriaal uit de native app-build. Draait ná `cap sync`.
//
// Waarom: Vite kopieert alles uit public/ naar dist/, en `cap sync` kopieert
// dist/ ongewijzigd de app in. Daar zit je hele verkoopmachine bij —
// welkom-video.mp4 alleen al is 46 MB — terwijl een klant in de app nooit op
// een salespagina komt: die routes bestaan alleen op het web. De download was
// daardoor 87 MB voor een app van ongeveer 40.
//
// De regel waarop we verwijderen:
//
//   1. Alleen bestanden die ergens in src/ worden genoemd, én uitsluitend
//      vanuit marketingcode (sales-call, lead-magnet, funnel, intake, ...).
//   2. Nooit iets wat nergens genoemd wordt. Dat lijkt juist veilig, maar daar
//      zitten de dynamisch opgebouwde paden: foodImageFallback bouwt zijn
//      bestandsnamen uit producttitels, en die vindt geen enkele grep.
//   3. Nooit iets uit de mappen in VEILIG — daar wonen die dynamische paden.
//   4. Alleen bestanden boven de drempel; onder de 100 kB is de moeite niet
//      waard tegen het risico dat we iets missen.
//
// Het web verandert niet: dist/ blijft compleet, alleen de kopie ín de app
// wordt uitgedund.

import { readdirSync, statSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { execFileSync } from 'child_process'

const DREMPEL_KB = 100

// Mappen waar de app zelf uit put — nooit aankomen.
const VEILIG = [/^public\/food\//, /^public\/icons\//, /^public\/oefeningen\//]

// Code die alleen op het web draait. Staat een bestand uitsluitend hierin, dan
// hoort het niet in de app.
const MARKETING = [
  /^src\/sales-call/, /^src\/sales-call-/, /^src\/lead-magnet/, /^src\/funnel/,
  /^src\/intake\//, /^src\/till-the-goal/, /^src\/tillthegoal/, /^src\/homepage-sections/,
  /^src\/pages\//, /^src\/modules\/funnel-pages/, /^src\/modules\/qualification-funnel/,
  /^src\/modules\/public-intake/, /^src\/modules\/lead-/, /^src\/modules\/resource-hub/,
  /^src\/modules\/nutrition-intake/,
]

// Waar de native kopieën staan.
const DOELEN = [
  'android/app/src/main/assets/public',
  'ios/App/App/public',
]

const loop = (map, uit = []) => {
  for (const item of readdirSync(map, { withFileTypes: true })) {
    const pad = join(map, item.name)
    if (item.isDirectory()) {
      if (!/backup/i.test(item.name)) loop(pad, uit)
    } else {
      uit.push(pad)
    }
  }
  return uit
}

const verwijzingen = (bestandsnaam) => {
  try {
    const uit = execFileSync('grep', ['-rl', '--', bestandsnaam, 'src'], { encoding: 'utf8' })
    return uit.split('\n').filter(r => r && !/backup|\.bak/i.test(r))
  } catch {
    return []   // grep geeft exit 1 als er niets is
  }
}

const bestanden = loop('public')
  .map(pad => ({ pad, kb: Math.round(statSync(pad).size / 1024) }))
  .filter(b => b.kb >= DREMPEL_KB)
  .filter(b => !VEILIG.some(re => re.test(b.pad)))

let weg = 0
const verwijderd = []

for (const b of bestanden) {
  const naam = b.pad.split('/').pop()
  const refs = verwijzingen(naam)
  if (refs.length === 0) continue                       // regel 2
  if (!refs.every(r => MARKETING.some(re => re.test(r)))) continue   // regel 1

  const relatief = b.pad.replace(/^public\//, '')
  for (const doel of DOELEN) {
    const volledig = join(doel, relatief)
    if (existsSync(volledig)) {
      rmSync(volledig)
    }
  }
  verwijderd.push(`${String(b.kb).padStart(6)} kB  ${relatief}`)
  weg += b.kb
}

if (verwijderd.length === 0) {
  console.log('Niets te verwijderen — de app-build bevat geen marketingmateriaal.')
} else {
  console.log(verwijderd.sort((a, b) => parseInt(b) - parseInt(a)).join('\n'))
  console.log(`\n${verwijderd.length} bestanden uit de app-build, ${(weg / 1024).toFixed(1)} MB lichter.`)
}
