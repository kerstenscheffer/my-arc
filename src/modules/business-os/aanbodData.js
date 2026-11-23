// src/modules/business-os/aanbodData.js
//
// Rekenkern van de aanbod-rekenaar (Aanbod.jsx, 23 nov 2026). Bewust zonder
// Supabase-import, zodat de sommen ook met node te controleren zijn; laden en
// bewaren zit in aanbodOpslag.js. Vorm van de opgeslagen gegevens:
//   { partnerPct, vooruitPct, borgAan, borgBedrag,
//     tiers: { premium|midden|basis: { prijs: { 4, 6, 12 },
//     kostenMaand, kostenEenmalig, urenMaand, urenEenmalig, onderdelen: [tekst] } } }
// Leeg veld = null. Een onbekende of oudere vorm wordt door normaliseer()
// aangevuld met de beginwaarden, zodat het scherm altijd iets kan tonen.
// vooruitPct, borgAan en borgBedrag kwamen er later op 23 nov bij: een rij
// zonder die velden leest als 20 procent, borg uit, 300.

export const DUREN = [4, 6, 12]
export const TIERS = [['premium', 'Premium'], ['midden', 'Midden'], ['basis', 'Basis']]

// Ter info in de stand Rekenen (Kersten, 23 nov 2026).
export const HUIDIGE_PRIJZEN = '6 weken €297 borg · 12 weken €450 · 6 maanden €125 per maand · app 1 jaar €300'

const maakTier = (onderdelen, prijs, rest = {}) => ({
  prijs: { 4: null, 6: null, 12: null, ...prijs },
  kostenMaand: null,
  kostenEenmalig: null,
  urenMaand: null,
  urenEenmalig: null,
  ...rest,
  onderdelen,
})

// Beginwaarden: de drie tiers die Kersten op 23 nov 2026 koos. Kosten en uren
// zijn een schatting. Alles is aanpasbaar.
export const BEGIN = {
  partnerPct: 50,
  vooruitPct: 20,     // korting bij vooruitbetalen
  borgAan: false,     // borg verrekenen: nog geen besluit, dus standaard uit
  borgBedrag: 300,
  tiers: {
    premium: maakTier([
      'Maandelijkse supplementenbundel',
      'MY ARC kleding op maat',
      'Call om de week',
      "Feedback op workout-video's",
      '3 trainingen in persoon op een plek halverwege',
      'Plus alles uit Midden',
    ], { 6: 4000 }, { kostenMaand: 45, kostenEenmalig: 160, urenMaand: 2.8, urenEenmalig: 9 }),
    midden: maakTier([
      'Wekelijkse check op je data met bijsturing',
      'Check-in calls wanneer nodig',
      "Feedback op workout-video's die je opstuurt",
      'Onbeperkt WhatsApp-support',
      'Plus alles uit Basis',
    ], { 4: 800, 6: 1200, 12: 2400 }, { urenMaand: 1.5 }),
    basis: maakTier([
      'Volledige toegang tot de app',
      'Trainingsplan',
      'Voedingsplan',
      'Eén aanpassing per maand',
    ], { 4: 400, 6: 600, 12: 1200 }, { urenMaand: 0.3 }),
  },
}

// Tekst uit een invoerveld → getal of null. Komma en punt mogen allebei;
// "3.000" en "3.000,50" lezen als duizendtallen.
export function leesGetal(tekst) {
  const t = String(tekst ?? '').trim().replace(/[^\d.,]/g, '')
  if (!t) return null
  const kaal = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '') : t
  const n = Number(kaal.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const getalOfNull = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Maakt van wat er in de database staat altijd de volledige vorm.
export function normaliseer(ruw) {
  const r = ruw && typeof ruw === 'object' ? ruw : {}
  const tiers = {}
  for (const [k] of TIERS) {
    const t = r.tiers?.[k]
    const begin = BEGIN.tiers[k]
    if (!t || typeof t !== 'object') { tiers[k] = { ...begin, prijs: { ...begin.prijs }, onderdelen: [...begin.onderdelen] }; continue }
    const prijs = {}
    for (const d of DUREN) prijs[d] = getalOfNull(t.prijs?.[d])
    tiers[k] = {
      prijs,
      kostenMaand: getalOfNull(t.kostenMaand),
      kostenEenmalig: getalOfNull(t.kostenEenmalig),
      urenMaand: getalOfNull(t.urenMaand),
      urenEenmalig: getalOfNull(t.urenEenmalig),
      onderdelen: Array.isArray(t.onderdelen)
        ? t.onderdelen.filter(o => typeof o === 'string' && o.trim())
        : [...begin.onderdelen],
    }
  }
  return {
    partnerPct: r.partnerPct === undefined ? BEGIN.partnerPct : getalOfNull(r.partnerPct),
    vooruitPct: r.vooruitPct === undefined ? BEGIN.vooruitPct : getalOfNull(r.vooruitPct),
    borgAan: r.borgAan === true,
    borgBedrag: r.borgBedrag === undefined ? BEGIN.borgBedrag : getalOfNull(r.borgBedrag),
    tiers,
  }
}

const n = (v) => Number(v) || 0

// Wat de klant betaalt voor één tier bij één duur, of null zonder prijs.
//   totaal      de ingevulde totaalprijs
//   borg        wat er door 'borg verrekenen' afgaat (0 als de schakelaar uit staat)
//   teBetalen   totaal min borg: de gewone prijs in termijnen
//   korting     korting bij vooruitbetalen, over teBetalen, op hele euro's
//   vooruit     teBetalen min korting: de prijs in één keer
export function prijzen(tier, duur, g) {
  const totaal = n(tier?.prijs?.[duur])
  if (totaal <= 0) return null
  const borg = g?.borgAan ? Math.min(totaal, Math.max(0, n(g.borgBedrag))) : 0
  const teBetalen = totaal - borg
  const pct = Math.min(100, Math.max(0, n(g?.vooruitPct)))
  const korting = Math.round(teBetalen * pct / 100)
  return { totaal, perMaand: totaal / duur, borg, teBetalen, korting, vooruit: teBetalen - korting }
}

// Alle sommen voor één tier bij één duur (maanden). Zonder prijs: omzet,
// perMaand, partner, over en perUur zijn null; kosten en uren tellen wel.
// Partner-aandeel gaat over de omzet, niet over wat er na kosten overblijft.
// omzet: wat er echt binnenkomt als dat afwijkt van de totaalprijs (borg
// verrekend, vooruitbetalen); weggelaten = de totaalprijs.
export function reken(tier, duur, partnerPct, omzet = null) {
  const kosten = n(tier?.kostenMaand) * duur + n(tier?.kostenEenmalig)
  const uren = n(tier?.urenMaand) * duur + n(tier?.urenEenmalig)
  const prijs = n(tier?.prijs?.[duur])
  if (prijs <= 0) return { omzet: null, perMaand: null, partner: null, kosten, uren, over: null, perUur: null }
  const binnen = omzet === null ? prijs : n(omzet)
  const partner = binnen * n(partnerPct) / 100
  const over = binnen - partner - kosten
  return { omzet: binnen, perMaand: prijs / duur, partner, kosten, uren, over, perUur: uren > 0 ? over / uren : null }
}

export const euro = (v) => (Number(v) < 0 ? '−€' : '€') + Math.abs(Math.round(Number(v) || 0)).toLocaleString('nl-NL')
