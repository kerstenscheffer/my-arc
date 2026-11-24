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
// producten (24 nov 2026): wat Kersten nu echt verkoopt, als lijst
//   [{ id, naam, maanden, vooruit, perMaand }]   vooruit = in één keer, perMaand = termijnbedrag.
// Het verlengvenster (TrajectModal) kiest hieruit en uit de tiers met een prijs
// (aanbodOpties). Een rij zonder producten leest als BEGIN.producten.

export const DUREN = [4, 6, 12]
export const TIERS = [['premium', 'Premium'], ['midden', 'Midden'], ['basis', 'Basis']]

// Wat Kersten nu verkoopt (23-24 nov 2026). Alleen wat hij zelf noemde; lege bedragen vult hij in Aanbod.
// De challenge (6 weken €297 borg) staat er niet tussen: die verkoop je op het leadbord, niet bij verlengen.
export const BEGIN_PRODUCTEN = [
  { id: '12-weken', naam: '12 weken', maanden: 3, vooruit: 450, perMaand: null },
  { id: '6-maanden', naam: '6 maanden', maanden: 6, vooruit: null, perMaand: 125 },
  { id: 'app-1-jaar', naam: 'App 1 jaar', maanden: 12, vooruit: 300, perMaand: 30 },
]

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
  producten: BEGIN_PRODUCTEN,
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
    producten: Array.isArray(r.producten) ? r.producten.filter(x => x && typeof x === 'object').map(normaliseerProduct) : BEGIN_PRODUCTEN.map(x => ({ ...x })),
    tiers,
  }
}

export function normaliseerProduct(x, i = 0) {
  const maanden = getalOfNull(x?.maanden)
  return {
    id: String(x?.id || `product-${i}-${Date.now()}`),
    naam: typeof x?.naam === 'string' ? x.naam : '',
    maanden: maanden && maanden > 0 ? Math.round(maanden) : null,
    vooruit: getalOfNull(x?.vooruit),
    perMaand: getalOfNull(x?.perMaand),
  }
}

// Keuzes voor het verlengvenster: eerst de producten, dan de tiers met een ingevulde prijs.
// → [{ id, naam, maanden, vooruit, perMaand, soort: 'product'|'tier' }]
export function aanbodOpties(g) {
  if (!g) return []
  const uit = []
  for (const p of g.producten || []) {
    if (!p.naam?.trim() || !p.maanden || (!(p.vooruit > 0) && !(p.perMaand > 0))) continue
    uit.push({ id: p.id, naam: p.naam.trim(), maanden: p.maanden, vooruit: p.vooruit > 0 ? p.vooruit : null, perMaand: p.perMaand > 0 ? p.perMaand : null, soort: 'product' })
  }
  for (const [k, label] of TIERS) {
    for (const d of DUREN) {
      const pr = prijzen(g.tiers?.[k], d, g)
      if (!pr) continue
      uit.push({ id: `tier-${k}-${d}`, naam: `${label} ${d} mnd`, maanden: d, vooruit: pr.vooruit, perMaand: Math.round(pr.teBetalen / d), soort: 'tier' })
    }
  }
  return uit
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

// ── Voor Gino's context (BusinessOS, sleutel Aanbod) ──
// Pagina open: de hele rij in de vorm van de kolom gegevens, zodat Gino hem met
// één wijziging_voorstel terug kan sturen (de kolom is één jsonb-object: een
// half object zou de rest wissen). Lege velden binnen een tier gaan niet mee;
// normaliseer() leest een weggelaten veld daar weer als leeg.
// Pagina dicht: alleen de verwijzing. De context wordt na 4000 tekens afgekapt
// en de rij kost er ruim 1000: altijd meesturen duwt omzet en keten eruit.
export const AANBOD_TABEL = 'business_os_aanbod'

const zonderLeeg = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== null && v !== undefined))

export function aanbodVoorGino({ id = null, gegevens = null, open = false, duur = null, stand = null } = {}) {
  if (!gegevens) return null
  const kop = {
    tabel: AANBOD_TABEL, id_kolom: 'coach_id', id, kolom: 'gegevens',
    let_op: 'Aanpassen = de rij bijwerken via wijziging_voorstel',
  }
  if (!id) kop.rij = 'bestaat nog niet (Kersten heeft nog niets bewaard): insert met gegevens'
  if (!open) return { ...kop, inhoud: 'Pagina Aanbod staat dicht: lees de rij voor de waarden.' }
  const tiers = {}
  for (const [k] of TIERS) {
    const t = gegevens.tiers?.[k] || {}
    tiers[k] = {
      prijs: zonderLeeg(t.prijs),
      ...zonderLeeg({ kostenMaand: t.kostenMaand, kostenEenmalig: t.kostenEenmalig, urenMaand: t.urenMaand, urenEenmalig: t.urenEenmalig }),
      onderdelen: (t.onderdelen || []).filter(o => typeof o === 'string' && o.trim()),
    }
  }
  return {
    ...kop,
    vorm: 'Eén jsonb-object: stuur altijd het hele object terug met jouw wijziging erin (ook producten, anders verdwijnen ze). prijs = totaal per duur in maanden, vooruitPct = % korting bij vooruitbetalen, borgAan/borgBedrag = borg verrekenen. producten = wat nu verkocht wordt: naam, maanden, vooruit (in één keer), perMaand (termijn).',
    in_beeld: { duur, stand },
    gegevens: {
      partnerPct: gegevens.partnerPct, vooruitPct: gegevens.vooruitPct,
      borgAan: gegevens.borgAan, borgBedrag: gegevens.borgBedrag, tiers,
      producten: gegevens.producten || [],
    },
  }
}
