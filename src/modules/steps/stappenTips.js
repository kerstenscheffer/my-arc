// src/modules/steps/stappenTips.js
//
// Tips voor het stappeninzicht (StappenInzicht.jsx), 18 nov 2026, Kersten:
// zelfde opzet als het slaapinzicht. Geen taalmodel: regels op de eigen dagen
// van de klant, dus ze kloppen altijd met wat er staat. Elke tip heeft een
// gewicht; de zwaarste staan bovenaan.
//
// Vandaag telt niet mee: die dag is nog bezig.

import { kcalVanStappen } from './stappenEnergie'

export const ALGEMENE_STAPPEN_TIPS = [
  'Wandel 10 minuten na elke maaltijd. Drie keer per dag is al ±3.000 stappen, en het helpt je bloedsuiker.',
  'Bel staand of lopend. Een telefoontje van 15 minuten is ±1.500 stappen.',
  'Neem de trap en parkeer verder weg. Kleine stukjes tellen over een dag flink op.',
  'Ga binnen een uur na het opstaan naar buiten. Daglicht in de ochtend helpt ook je slaap.',
  'Verdeel je doel over de dag: de helft vóór de lunch maakt de avond makkelijk.',
  'Zet een herinnering op je telefoon: elk uur 2 minuten lopen.',
]

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const gem = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
const DAGNAAM = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const weekdag = (iso) => new Date(`${iso}T12:00:00`).getDay()

// dagen: [{ iso, steps }] (afgelopen dagen, zonder vandaag). doel: per dag.
export function stappenTips(dagen, doel, { gewichtKg = null, gekoppeld = false } = {}) {
  const gevuld = dagen.filter(d => d.steps > 0)
  const tips = []
  if (gevuld.length < 3) {
    return [{ titel: 'Vul een paar dagen in', tekst: 'Vanaf 3 dagen met stappen zie je hier tips op basis van jouw week.', gewicht: 0 }]
  }
  const gemiddeld = gem(gevuld.map(d => d.steps))
  const gehaald = gevuld.filter(d => d.steps >= doel).length

  // 1. Onder het doel: hoeveel minuten wandelen is dat?
  if (doel > 0 && gemiddeld < doel * 0.92) {
    const tekort = doel - gemiddeld
    const minuten = Math.max(5, Math.round(tekort / 100 / 5) * 5) // ±100 stappen per minuut
    const kcal = gewichtKg ? Math.round(kcalVanStappen(tekort, gewichtKg) / 10) * 10 : null
    tips.push({
      titel: 'Naar je doel',
      tekst: `Je loopt gemiddeld ${nl(gemiddeld)} stappen, ${nl(tekort)} onder je doel. Dat is ±${minuten} minuten wandelen per dag${kcal ? ` (±${kcal} kcal)` : ''}. Plan het op een vast moment, bijvoorbeeld na het avondeten.`,
      gewicht: 40 + (1 - gemiddeld / doel) * 60,
    })
  }

  // 2. Weekend tegen doordeweeks
  const weekend = gevuld.filter(d => [0, 6].includes(weekdag(d.iso))).map(d => d.steps)
  const doordeweeks = gevuld.filter(d => ![0, 6].includes(weekdag(d.iso))).map(d => d.steps)
  if (weekend.length >= 2 && doordeweeks.length >= 3 && gem(weekend) < gem(doordeweeks) * 0.7) {
    tips.push({
      titel: 'Weekend-dip',
      tekst: `In het weekend loop je ${nl(gem(doordeweeks) - gem(weekend))} stappen minder per dag dan doordeweeks. Plan op zaterdag en zondag één vaste wandeling, alleen of samen.`,
      gewicht: 30 + (1 - gem(weekend) / gem(doordeweeks)) * 30,
    })
  } else if (doordeweeks.length >= 3 && weekend.length >= 2 && gem(doordeweeks) < gem(weekend) * 0.7) {
    tips.push({
      titel: 'Werkdagen',
      tekst: `Doordeweeks loop je ${nl(gem(weekend) - gem(doordeweeks))} stappen minder dan in het weekend. Wandel in je lunchpauze of bel lopend; 15 minuten is ±1.500 stappen.`,
      gewicht: 28,
    })
  }

  // 3. Een vaste slechte dag
  const perDag = {}
  for (const d of gevuld) (perDag[weekdag(d.iso)] ||= []).push(d.steps)
  const zwakste = Object.entries(perDag).filter(([, l]) => l.length >= 2).map(([w, l]) => ({ w: Number(w), g: gem(l) }))
    .sort((a, b) => a.g - b.g)[0]
  if (zwakste && zwakste.g < gemiddeld * 0.6 && ![0, 6].includes(zwakste.w)) {
    tips.push({
      titel: `Je ${DAGNAAM[zwakste.w]}`,
      tekst: `Op ${DAGNAAM[zwakste.w]} loop je het minst: gemiddeld ${nl(zwakste.g)}. Zet voor die dag een vaste wandeling in je agenda.`,
      gewicht: 24 + (1 - zwakste.g / gemiddeld) * 20,
    })
  }

  // 4. Grote schommelingen
  const sd = Math.sqrt(gem(gevuld.map(d => (d.steps - gemiddeld) ** 2)))
  if (gemiddeld > 0 && sd / gemiddeld > 0.5) {
    tips.push({
      titel: 'Vaste momenten',
      tekst: 'Je stappen schommelen sterk per dag. Bouw vaste momenten in, zoals 10 minuten na elke maaltijd. Dan haal je je doel ook op een drukke dag.',
      gewicht: 20,
    })
  }

  // 5. Dagen zonder stappen
  const leeg = dagen.length - gevuld.length
  if (leeg >= 3) {
    tips.push({
      titel: 'Lege dagen',
      tekst: gekoppeld
        ? `Op ${leeg} van de ${dagen.length} dagen staat niets. Neem je telefoon mee als je loopt, of vul het 's avonds aan.`
        : `Op ${leeg} van de ${dagen.length} dagen staat niets. Koppel je telefoon, dan komen je stappen er vanzelf in.`,
      gewicht: 18 + leeg * 2,
    })
  }

  if (!tips.length || (gehaald >= Math.ceil(gevuld.length * 0.85) && !tips.some(t => t.gewicht >= 30))) {
    return [{ titel: 'Geen tip, je bent goed bezig', tekst: `Gemiddeld ${nl(gemiddeld)} stappen en ${gehaald} van de ${gevuld.length} dagen je doel gehaald. Zo houden.`, gewicht: 0 }]
  }
  return tips.sort((a, b) => b.gewicht - a.gewicht)
}
