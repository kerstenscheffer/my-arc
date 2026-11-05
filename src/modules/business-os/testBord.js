// src/modules/business-os/testBord.js
//
// Regels van het testbord (fase.bord === true in business_os_projecten.plan):
// zes vaste kolommen en wanneer elke kolom klaar is. Alleen rekenen, geen scherm
// en geen database, zodat dezelfde regels overal gelijk zijn.

import { leesTest } from './testMeting'

export const KOLOMMEN = [
  { id: 'onderzoek', naam: 'Onderzoek' },
  { id: 'plan', naam: 'Plan' },
  { id: 'maken', naam: 'Maken' },
  { id: 'posten', naam: 'Posten' },
  { id: 'meten', naam: 'Meten' },
  { id: 'besluit', naam: 'Besluit' },
]
const KOLOM_IDS = KOLOMMEN.map(k => k.id)

// Geen of onbekende kolom = onderzoek.
export const kolomVan = (stap) => (KOLOM_IDS.includes(stap?.kolom) ? stap.kolom : 'onderzoek')
export const volgendeKolom = (id) => KOLOM_IDS[KOLOM_IDS.indexOf(id) + 1] || null

export const PLAN_VELDEN = [
  { id: 'wat', label: 'Wat verandert' },
  { id: 'nulmeting_per_10', label: 'Nulmeting per 10 posts', soort: 'getal' },
  { id: 'controlegroep', label: 'Controlegroep' },
  { id: 'posts_doel', label: 'Aantal posts', soort: 'getal' },
  { id: 'verwachting', label: 'Verwachting' },
  { id: 'meetdatum', label: 'Meetdatum', soort: 'dag' },
]

export const BESLUITEN = [['meer', 'Meer'], ['aanpassen', 'Aanpassen'], ['stoppen', 'Stoppen']]
// Het oordeel uit de meting, als voorstel voor het besluit.
export const VOORSTEL = { Werkt: 'meer', Matig: 'aanpassen', Zwak: 'stoppen' }

export const isDag = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))
export const kortDag = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : '')
export const komma = (n, dec = 0) => Number(n).toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const gevuld = (v) => (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' ? v.trim() !== '' : false)
const doelPosts = (test) => {
  const n = Number(test?.posts_doel)
  return gevuld(test?.posts_doel) && Number.isFinite(n) && n > 0 ? n : null
}
// "12,4" of 12.4 → 12.4. Niet te lezen → null.
export const leesGetal = (t) => {
  const n = Number(String(t).trim().replace(',', '.'))
  return String(t).trim() !== '' && Number.isFinite(n) ? n : null
}

// Voorbeeldvraag bij een leeg veld zonder suggestie.
export const VRAGEN = {
  wat: 'Wat verandert er, en wat blijft gelijk?',
  nulmeting_per_10: 'Wat is het cijfer nu?',
  controlegroep: 'Waarmee vergelijken we?',
  posts_doel: 'Hoeveel posts tot een besluit? (50 of meer over 2 weken)',
  verwachting: 'Welke uitkomst noemen we werkt?',
  meetdatum: 'Wanneer kijken we? (posts moeten 7 dagen oud zijn)',
  besluit: 'Meer doen, aanpassen of stoppen?',
  les: 'Wat weten we nu wat we niet wisten?',
}

// In een kolom zonder kaarten. Geen kaarten zelf: ze tellen nergens mee.
export const STARTVRAGEN = {
  onderzoek: ['Welk cijfer laat zien dat dit kan werken?'],
  maken: ['Wat moet er geschoten en geschreven worden?'],
  posten: ['Waar en wanneer gaat het online?'],
}

export const veldLeeg = (v) => v === undefined || v === null || String(v).trim() === ''

// test.suggesties[id] → { waarde, tekst }: waarde gaat bij Overnemen in het echte veld, tekst staat op het scherm.
// Null als het echte veld gevuld is, of als de suggestie in dat veld niet zou kloppen.
// Harde regel: een suggestie telt nergens mee. bordStand en leesTest lezen test.suggesties nooit.
export function suggestieVoor(test, id) {
  if (!test || typeof test !== 'object' || !veldLeeg(test[id])) return null
  const s = test.suggesties
  const w = s && typeof s === 'object' ? s[id] : null
  if ((typeof w !== 'string' && typeof w !== 'number') || veldLeeg(w)) return null
  if (id === 'besluit') {
    const keuze = BESLUITEN.find(([k]) => k === String(w).trim().toLowerCase())
    return keuze ? { waarde: keuze[0], tekst: keuze[1] } : null
  }
  const soort = PLAN_VELDEN.find(v => v.id === id)?.soort
  if (soort === 'getal') {
    const n = leesGetal(w)
    if (n == null || (id === 'posts_doel' && n <= 0)) return null
    return { waarde: n, tekst: komma(n, Number.isInteger(n) ? 0 : 1) }
  }
  if (soort === 'dag') return isDag(w) ? { waarde: w, tekst: kortDag(w) } : null
  const tekst = String(w).trim()
  return { waarde: tekst, tekst }
}

// stand = uitkomst van useTestMeting: null zolang de meting loopt.
export function bordStand({ stappen, test, stand, vandaag }) {
  const t = test && typeof test === 'object' ? test : {}
  const kaarten = (id) => (stappen || []).filter(s => kolomVan(s) === id)
  const allesAf = (id) => { const k = kaarten(id); return k.length > 0 && k.every(s => s.klaar) }

  const planAantal = PLAN_VELDEN.filter(v => (v.id === 'posts_doel' ? doelPosts(t) != null : gevuld(t[v.id]))).length
  const doel = doelPosts(t)
  // Niet gestart (geen woord of geen startdatum): Posten en Meten hebben geen data, dus ook niet klaar.
  const gestart = !!leesTest(t)
  const m = gestart ? stand?.uit || null : null

  const klaar = {
    onderzoek: allesAf('onderzoek'),
    plan: planAantal === PLAN_VELDEN.length,
    maken: allesAf('maken'),
    posten: gestart && m?.posts != null && doel != null && m.posts >= doel,
    meten: gestart && (m?.niveau === 'Besluit' || (isDag(t.meetdatum) && t.meetdatum < vandaag)),
    besluit: BESLUITEN.some(([id]) => id === t.besluit) && gevuld(t.les),
  }
  return {
    klaar,
    huidig: KOLOM_IDS.find(id => !klaar[id]) || null,
    planAantal,
    doel,
    gestart,
    laadt: gestart && !stand,
    mislukt: gestart && !!stand && !m,
    m,
  }
}
