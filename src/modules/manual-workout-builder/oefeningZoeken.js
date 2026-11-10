// src/modules/manual-workout-builder/oefeningZoeken.js
//
// Vergevingsgezind zoeken op oefeningnaam (10 nov 2026). "dumbell", "dumbel",
// "lat pulldwn" en "benchpress" moeten gewoon iets vinden.
//
// Per zoekwoord: past het (bijna) op een woord in de naam? Eerst exact,
// dan als begin van een woord, dan met tikfouten (bewerkafstand 1, vanaf
// 7 letters 2). Dubbele letters tellen als één, en spaties mogen wegvallen.
// Geeft een score terug (hoger = beter) of 0 als het niet past.

const plat = (s) => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim()
const enkel = (s) => s.replace(/(.)\1+/g, '$1')

// Damerau-Levenshtein (omgewisselde letters tellen als één fout), met afkap.
function afstand(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let rijMin = Infinity
    for (let j = 1; j <= b.length; j++) {
      const k = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + k)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      rijMin = Math.min(rijMin, d[i][j])
    }
    if (rijMin > max) return max + 1
  }
  return d[a.length][b.length]
}

const marge = (n) => (n <= 3 ? 0 : n <= 6 ? 1 : 2)

// Hoe goed past één zoekwoord op de woorden van de naam (0 = niet).
function woordScore(q, woorden, aaneen) {
  let beste = 0
  for (const w of woorden) {
    if (w === q) return 10
    if (w.startsWith(q)) beste = Math.max(beste, 8)
    else if (w.includes(q) && q.length >= 3) beste = Math.max(beste, 6)
    else {
      // Drie letters: alleen een vergeten letter ("dek" → "deck"), geen
      // andere letter, anders vindt "dip" ook "hip".
      if (q.length === 3) {
        if (w.length === 4 && afstand(q, w, 1) <= 1) beste = Math.max(beste, 4)
        continue
      }
      const m = marge(q.length)
      if (!m) continue
      // Hele woord, of het begin ervan (half getypt, met of zonder een letter extra).
      const begin = (len) => w.length > len && afstand(q, w.slice(0, len), m) <= m
      if (afstand(q, w, m) <= m || begin(q.length) || begin(q.length + 1)) {
        beste = Math.max(beste, 4)
      }
    }
  }
  // "benchpress" tegen "bench press": spaties weggelaten.
  if (!beste && q.length >= 5 && aaneen.includes(q)) beste = 5
  return beste
}

export function zoekScore(naam, zoek) {
  const q = plat(zoek)
  if (!q) return 1
  const n = plat(naam)
  if (n.includes(q)) return 100 - (n.startsWith(q) ? 0 : 1)
  const woorden = n.split(' ').map(enkel)
  const aaneen = enkel(n.replace(/ /g, ''))
  let totaal = 0
  for (const qw of q.split(' ').map(enkel)) {
    const s = woordScore(qw, woorden, aaneen)
    if (!s) return 0
    totaal += s
  }
  return totaal
}
