// src/modules/business-os/aanbodData.js
//
// Rekenkern van de aanbod-rekenaar (Aanbod.jsx, 23 nov 2026). Bewust zonder
// Supabase-import, zodat de sommen ook met node te controleren zijn; laden en
// bewaren zit in aanbodOpslag.js. Vorm van de opgeslagen gegevens:
//   { partnerPct, tiers: { premium|midden|basis: { prijs: { 4, 6, 12 },
//     kostenMaand, kostenEenmalig, urenMaand, urenEenmalig, onderdelen: [tekst] } } }
// Leeg veld = null. Een onbekende of oudere vorm wordt door normaliseer()
// aangevuld met de beginwaarden, zodat het scherm altijd iets kan tonen.

export const DUREN = [4, 6, 12]
export const TIERS = [['premium', 'Premium'], ['midden', 'Midden'], ['basis', 'Basis']]

// Ter info in de stand Rekenen (Kersten, 23 nov 2026).
export const HUIDIGE_PRIJZEN = '6 weken €297 borg · 12 weken €450 · 6 maanden €125 per maand · app 1 jaar €300'

const leegTier = (onderdelen, prijs6 = null) => ({
  prijs: { 4: null, 6: prijs6, 12: null },
  kostenMaand: null,
  kostenEenmalig: null,
  urenMaand: null,
  urenEenmalig: null,
  onderdelen,
})

// Beginwaarden zoals Kersten ze op 23 nov 2026 noemde; alles is aanpasbaar.
export const BEGIN = {
  partnerPct: 50,
  tiers: {
    premium: leegTier([
      'Maandelijkse supplementenbundel',
      'MY ARC kleding op maat',
      'Wekelijkse calls',
      "Feedback op workout-video's",
      '3 trainingen in persoon',
      'Plus alles uit Basis',
    ], 3000),
    midden: leegTier([
      'Check-in calls wanneer nodig',
      "Feedback op workout-video's die je opstuurt",
      'Onbeperkt WhatsApp-support',
      'Plus alles uit Basis',
    ]),
    basis: leegTier([
      'Volledige toegang tot de app',
      'Trainingsplan',
      'Voedingsplan',
      'Wekelijkse check op je data',
      'Nieuw plan en bijsturing wanneer nodig',
    ]),
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
    tiers,
  }
}

// Alle sommen voor één tier bij één duur (maanden). Zonder prijs: omzet,
// perMaand, partner, over en perUur zijn null; kosten en uren tellen wel.
// Partner-aandeel gaat over de omzet, niet over wat er na kosten overblijft.
export function reken(tier, duur, partnerPct) {
  const n = (v) => Number(v) || 0
  const kosten = n(tier?.kostenMaand) * duur + n(tier?.kostenEenmalig)
  const uren = n(tier?.urenMaand) * duur + n(tier?.urenEenmalig)
  const prijs = n(tier?.prijs?.[duur])
  if (prijs <= 0) return { omzet: null, perMaand: null, partner: null, kosten, uren, over: null, perUur: null }
  const partner = prijs * n(partnerPct) / 100
  const over = prijs - partner - kosten
  return { omzet: prijs, perMaand: prijs / duur, partner, kosten, uren, over, perUur: uren > 0 ? over / uren : null }
}

export const euro = (v) => (Number(v) < 0 ? '−€' : '€') + Math.abs(Math.round(Number(v) || 0)).toLocaleString('nl-NL')
