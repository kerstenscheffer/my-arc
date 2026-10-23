// src/pages/mijn-split/splitRegels.js
// Van "zoveel dagen per week" naar een split uit de MY ARC-bibliotheek
// (workout_day_templates, bibliotheek 'myarc-2026', gym en thuis). De
// oefeningen zelf komen uit de database via get_mijn_split_dagen, zodat een
// aanpassing in de bibliotheek vanzelf in de lead magnet staat.

export const DAG_NAAM = {
  full_a: 'Full body A', full_b: 'Full body B', full_c: 'Full body C',
  push: 'Push', pull: 'Pull', legs: 'Legs',
  upper_borst: 'Upper (borst)', upper_rug: 'Upper (rug)',
}

export const SPLITS = {
  2: { naam: 'Full body 2x', waarom: 'Twee keer per week je hele lichaam: elke spier krijgt twee prikkels per week, met maximaal herstel ertussen.',
       dagen: ['full_a', 'full_b'], week: ['Ma', 'Do'] },
  3: { naam: 'Full body 3x', waarom: 'Drie keer je hele lichaam: elke spier twee à drie keer per week geraakt, en een gemiste training kost je weinig.',
       dagen: ['full_a', 'full_b', 'full_c'], week: ['Ma', 'Wo', 'Vr'] },
  4: { naam: 'Upper / Lower', waarom: 'Twee keer bovenlichaam en twee keer benen: elke spier twee keer per week, met kortere en gerichtere trainingen.',
       dagen: ['upper_borst', 'legs', 'upper_rug', 'legs'], week: ['Ma', 'Di', 'Do', 'Vr'] },
  5: { naam: 'Upper / Lower / Push / Pull / Legs', waarom: 'Upper/lower aan het begin van de week, push/pull/legs aan het eind: elke spier twee keer per week met extra volume.',
       dagen: ['upper_borst', 'legs', 'push', 'pull', 'legs'], week: ['Ma', 'Di', 'Wo', 'Vr', 'Za'] },
  6: { naam: 'Push / Pull / Legs 2x', waarom: 'Push, pull en legs, twee keer per week: maximaal volume per spiergroep voor wie zes dagen beschikbaar heeft.',
       dagen: ['push', 'pull', 'legs', 'push', 'pull', 'legs'], week: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'] },
}

export const WEEK = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export const DOELEN = [
  { key: 'spiermassa', label: 'Spiermassa opbouwen', sub: 'Groter en sterker worden' },
  { key: 'vetverlies', label: 'Vet verliezen', sub: 'Strakker worden zonder spier te verliezen' },
  { key: 'allebei', label: 'Allebei', sub: 'Vet eraf en spier erbij' },
]

export const NIVEAUS = [
  { key: 'beginner', label: 'Korter dan 1 jaar', sub: 'Of net (opnieuw) begonnen' },
  { key: 'gevorderd', label: '1 tot 3 jaar', sub: 'De basis zit erin' },
  { key: 'ervaren', label: 'Langer dan 3 jaar', sub: 'Je kent je oefeningen' },
]

export const LOCATIES = [
  { key: 'gym', label: 'In de gym', sub: 'Machines, kabels en dumbbells' },
  { key: 'thuis', label: 'Thuis', sub: 'Dumbbells en een bankje' },
]

// Drie korte regels onder de split: hoe je hem uitvoert, afgestemd op doel en
// ervaring. Kort gehouden; de split is het product, dit is de handleiding.
export function tips({ doel, niveau }) {
  const t = []
  t.push(niveau === 'beginner'
    ? 'Eindig elke set met 2 à 3 herhalingen over. Eerst de techniek, dan het gewicht.'
    : niveau === 'ervaren'
      ? 'Ga op elke set tot 0 à 1 herhaling van falen. Twee zware sets doen meer dan vier halve.'
      : 'Eindig elke set met 1 à 2 herhalingen over. Haal je de bovenkant van de reps? Gewicht erbij.')
  t.push('Schrijf je gewichten op en probeer elke week een herhaling of een paar kilo meer te doen.')
  t.push(doel === 'vetverlies'
    ? 'Train precies zo zwaar als hierboven: dat houdt je spieren vast. Het vet gaat eraf via je voeding en 8 à 10k stappen per dag.'
    : doel === 'allebei'
      ? 'Eet rond je onderhoud met genoeg eiwit (ongeveer 2 g per kg). Dan bouw je spier op terwijl er vet afgaat.'
      : 'Eet een klein overschot (zo\'n 200 à 300 kcal) met ongeveer 2 g eiwit per kg. Zonder brandstof groeit er niets.')
  return t
}
