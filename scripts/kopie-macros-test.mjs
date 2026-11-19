// scripts/kopie-macros-test.mjs
//
// Test van plan-analyzer/kopieMacros.js: welke macro's krijgt een klantplan dat
// uit een template wordt gekopieerd? Puur, geen database en geen netwerk.
//
//   node scripts/kopie-macros-test.mjs
//
// De cijfers zijn die van het geval van 18 nov 2026: testaccount ks10k (doelen
// 3150 / 170 / 430 / 85) kreeg uit template 'Man | 2200 | Vast' (2120 / 174 /
// 227 / 62) een plan met de kolom-defaults 2000 / 150 / 200 / 67.

import { macrosVoorKopie, STANDAARD_MACROS } from '../src/modules/ai-meal-generator/tabs/plan-analyzer/kopieMacros.js'

const doelen = { target_calories: 3150, target_protein: 170, target_carbs: 430, target_fat: 85 }
const geenDoelen = { target_calories: null, target_protein: null, target_carbs: null, target_fat: null }
const template = { daily_calories: 2120, daily_protein: 174, daily_carbs: 227, daily_fat: 62, base_macros: { fat: 62, carbs: 227, protein: 174, calories: 2120 } }

const gevallen = [
  ['doelen van de klant gaan voor', macrosVoorKopie(doelen, template), [3150, 170, 430, 85]],
  ['geen doelen: macro\'s van het template', macrosVoorKopie(geenDoelen, template), [2120, 174, 227, 62]],
  ['klantrij niet gevonden: template', macrosVoorKopie(null, template), [2120, 174, 227, 62]],
  ['template met alleen base_macros', macrosVoorKopie(geenDoelen, { base_macros: template.base_macros }), [2120, 174, 227, 62]],
  ['geen doelen en geen template: standaard', macrosVoorKopie(geenDoelen, undefined), [2000, 150, 200, 67]],
  ['niets meegegeven: standaard', macrosVoorKopie(), Object.values(STANDAARD_MACROS)],
  ['gat in de doelen: dat veld uit het template', macrosVoorKopie({ ...doelen, target_carbs: null, target_fat: 0 }, template), [3150, 170, 227, 62]],
  ['getallen als tekst en met decimalen', macrosVoorKopie({ target_calories: '3150', target_protein: '170.4', target_carbs: '430', target_fat: '85' }, template), [3150, 170, 430, 85]],
  ['doelen zonder template', macrosVoorKopie(doelen, null), [3150, 170, 430, 85]],
]

let fout = 0
for (const [naam, uit, verwacht] of gevallen) {
  const kreeg = [uit.daily_calories, uit.daily_protein, uit.daily_carbs, uit.daily_fat]
  const goed = Object.keys(uit).length === 4 && JSON.stringify(kreeg) === JSON.stringify(verwacht)
  if (!goed) fout++
  console.log(`${goed ? 'goed' : 'FOUT'}  ${naam}: ${kreeg.join(' / ')}${goed ? '' : `  (verwacht ${verwacht.join(' / ')})`}`)
}
console.log(fout ? `${fout} van ${gevallen.length} fout` : `alle ${gevallen.length} goed`)
process.exit(fout ? 1 : 0)
