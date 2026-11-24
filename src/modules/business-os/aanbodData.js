// src/modules/business-os/aanbodData.js
//
// Rekenkern van de aanbod-rekenaar (Aanbod.jsx, 23 nov 2026). Bewust zonder
// Supabase-import, zodat de sommen ook met node te controleren zijn; laden en
// bewaren zit in aanbodOpslag.js. Vorm van de opgeslagen gegevens:
//   { partnerPct, vooruitPct, gratisMaanden: { 3, 6, 12 }, borgAan, borgBedrag,
//     tiers: { premium|midden|basis: { prijs: { 3, 4, 6, 12 },
//     kostenMaand, kostenEenmalig, urenMaand, urenEenmalig, onderdelen: [tekst], zin } },
//     producten: [...], vergelijking: [...] }
// Leeg veld = null. Een onbekende of oudere vorm wordt door normaliseer()
// aangevuld met de beginwaarden, zodat het scherm altijd iets kan tonen.
// vooruitPct, borgAan en borgBedrag kwamen er later op 23 nov bij: een rij
// zonder die velden leest als 0 procent (was 20 tot de gratis maanden kwamen), borg uit, 300.
// producten (24 nov 2026): wat Kersten nu echt verkoopt, als lijst
//   [{ id, naam, maanden, vooruit, perMaand }]   vooruit = in één keer, perMaand = termijnbedrag.
// Het verlengvenster (TrajectModal) kiest hieruit en uit de tiers met een prijs
// (aanbodOpties). Een rij zonder producten leest als BEGIN.producten.
// vergelijking (24 nov 2026): de drie tiers naast elkaar in één tabel, als lijst
//   [{ onderdeel, basis, midden, premium }]   cel = true (zit erin), tekst (de vorm
//   in die tier) of null (zit er niet in).
// Staat er minstens één gevulde rij, dan toont Aanbod.jsx de tabel in plaats van
// de lijstjes uit tiers.*.onderdelen. Die lijstjes blijven in de data staan: een
// oudere app-versie leest ze nog, en zonder vergelijking tonen we ze zoals altijd.
// zin (24 nov 2026): per tier het aanbod in één zin (tekst, leeg = ''). Laten zien
// toont hem achter een knopje bij de tiernaam, Rekenen bewerkt hem. Hij moet bij
// laden, normaliseren, opslaan en in Gino's context blijven staan: de kolom is één
// object, wat er niet in teruggaat is weg.
// gratisMaanden (24 nov 2026, besluit Kersten): vooruitbetalen geeft geen korting
// meer maar gratis maanden bovenop de looptijd: { 3: 1, 6: 3, 12: 6 } = 3 vooruit is
// 1 gratis, 6 is 3, 12 is 6. De maandprijs blijft gelijk; wie per maand betaalt krijgt
// niets gratis. Leeg of 0 bij een looptijd = geen gratis maanden. vooruitPct blijft
// als veld bestaan (nu 0); staat het boven 0, dan werkt de oude korting er nog naast.
// Looptijden: de pagina toont 3, 6 en 12 (DUREN). 4 was de oude kortste looptijd: die
// prijs blijft in de data staan (oudere app-versies tonen hem), net als elke andere
// sleutel in prijs en gratisMaanden die hier niet bekend is.

export const DUREN = [3, 6, 12]
// Looptijden die altijd een plek in prijs hebben, ook als ze niet getoond worden.
export const PRIJS_DUREN = [3, 4, 6, 12]
export const TIERS = [['premium', 'Premium'], ['midden', 'Midden'], ['basis', 'Basis']]

// Wat Kersten nu verkoopt (23-24 nov 2026). Alleen wat hij zelf noemde; lege bedragen vult hij in Aanbod.
// De challenge (6 weken €297 borg) staat er niet tussen: die verkoop je op het leadbord, niet bij verlengen.
export const BEGIN_PRODUCTEN = [
  { id: '12-weken', naam: '12 weken', maanden: 3, vooruit: 450, perMaand: null },
  { id: '6-maanden', naam: '6 maanden', maanden: 6, vooruit: null, perMaand: 125 },
  { id: 'app-1-jaar', naam: 'App 1 jaar', maanden: 12, vooruit: 300, perMaand: 30 },
]

const maakTier = (onderdelen, prijs, rest = {}) => ({
  prijs: { 3: null, 4: null, 6: null, 12: null, ...prijs },
  kostenMaand: null,
  kostenEenmalig: null,
  urenMaand: null,
  urenEenmalig: null,
  ...rest,
  onderdelen,
  zin: '',
})

// Beginwaarden: de drie tiers die Kersten op 23 nov 2026 koos. Kosten en uren
// zijn een schatting. Alles is aanpasbaar.
export const BEGIN = {
  partnerPct: 50,
  vooruitPct: 0,      // korting bij vooruitbetalen: vervangen door gratis maanden (24 nov 2026)
  gratisMaanden: { 3: 1, 6: 3, 12: 6 },  // gratis maanden bij vooruitbetalen, per looptijd
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
    ], { 3: 2250, 6: 4000 }, { kostenMaand: 45, kostenEenmalig: 160, urenMaand: 2.8, urenEenmalig: 9 }),
    midden: maakTier([
      'Wekelijkse check op je data met bijsturing',
      'Check-in calls wanneer nodig',
      "Feedback op workout-video's die je opstuurt",
      'Onbeperkt WhatsApp-support',
      'Plus alles uit Basis',
    ], { 3: 600, 4: 800, 6: 1200, 12: 2400 }, { urenMaand: 1.5 }),
    basis: maakTier([
      'Volledige toegang tot de app',
      'Trainingsplan',
      'Voedingsplan',
      'Eén aanpassing per maand',
    ], { 3: 300, 4: 400, 6: 600, 12: 1200 }, { urenMaand: 0.3 }),
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

const heelOfNull = (v) => {
  const g = getalOfNull(v)
  return g === null ? null : Math.max(0, Math.round(g))
}
const isLooptijd = (k) => /^\d+$/.test(k)

// Prijs per looptijd. Alle sleutels blijven staan (ook 4 en looptijden die deze
// versie niet kent): de kolom is één object, wat hier wegvalt is na één opslag weg.
function normaliseerPrijs(ruw) {
  const prijs = {}
  for (const d of PRIJS_DUREN) prijs[d] = getalOfNull(ruw?.[d])
  if (ruw && typeof ruw === 'object') {
    for (const [k, v] of Object.entries(ruw)) if (!(k in prijs) && isLooptijd(k)) prijs[k] = getalOfNull(v)
  }
  return prijs
}

// Gratis maanden bij vooruitbetalen, per looptijd: heel getal vanaf 0, of null (leeg).
// Een rij zonder het veld leest als de beginwaarden (1, 3, 6).
export function normaliseerGratis(ruw) {
  if (!ruw || typeof ruw !== 'object' || Array.isArray(ruw)) return { ...BEGIN.gratisMaanden }
  const uit = {}
  for (const d of DUREN) uit[d] = heelOfNull(ruw[d])
  for (const [k, v] of Object.entries(ruw)) if (!(k in uit) && isLooptijd(k)) uit[k] = heelOfNull(v)
  return uit
}

// Aantal gratis maanden bij vooruitbetalen voor één looptijd. Leeg = 0.
export const gratisBij = (g, duur) => Math.max(0, Math.round(Number(g?.gratisMaanden?.[duur]) || 0))

// Het aanbod van één tier in één zin, zonder spaties eromheen. '' = geen zin.
export const tierZin = (tier) => (typeof tier?.zin === 'string' ? tier.zin.trim() : '')

// Maakt van wat er in de database staat altijd de volledige vorm.
export function normaliseer(ruw) {
  const r = ruw && typeof ruw === 'object' ? ruw : {}
  const tiers = {}
  for (const [k] of TIERS) {
    const t = r.tiers?.[k]
    const begin = BEGIN.tiers[k]
    if (!t || typeof t !== 'object') { tiers[k] = { ...begin, prijs: { ...begin.prijs }, onderdelen: [...begin.onderdelen] }; continue }
    tiers[k] = {
      prijs: normaliseerPrijs(t.prijs),
      kostenMaand: getalOfNull(t.kostenMaand),
      kostenEenmalig: getalOfNull(t.kostenEenmalig),
      urenMaand: getalOfNull(t.urenMaand),
      urenEenmalig: getalOfNull(t.urenEenmalig),
      onderdelen: Array.isArray(t.onderdelen)
        ? t.onderdelen.filter(o => typeof o === 'string' && o.trim())
        : [...begin.onderdelen],
      zin: tierZin(t),
    }
  }
  return {
    partnerPct: r.partnerPct === undefined ? BEGIN.partnerPct : getalOfNull(r.partnerPct),
    vooruitPct: r.vooruitPct === undefined ? BEGIN.vooruitPct : getalOfNull(r.vooruitPct),
    gratisMaanden: normaliseerGratis(r.gratisMaanden),
    borgAan: r.borgAan === true,
    borgBedrag: r.borgBedrag === undefined ? BEGIN.borgBedrag : getalOfNull(r.borgBedrag),
    producten: Array.isArray(r.producten) ? r.producten.filter(x => x && typeof x === 'object').map(normaliseerProduct) : BEGIN_PRODUCTEN.map(x => ({ ...x })),
    tiers,
    vergelijking: normaliseerVergelijking(r.vergelijking),
  }
}

// ── Vergelijking: één tabel voor de drie tiers ──
// Wat er in een cel staat: 'vink' (true), 'tekst' of 'leeg' (null, '', spaties).
export const celSoort = (v) => (v === true ? 'vink' : typeof v === 'string' && v.trim() ? 'tekst' : 'leeg')

const leesCel = (v) => {
  if (v === true) return true
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

export const nieuweVergelijkRij = () => ({ onderdeel: '', basis: null, midden: null, premium: null })

// Rij die iets zegt: een naam of minstens één gevulde cel.
export const rijGevuld = (r) => !!r && (!!String(r.onderdeel ?? '').trim() || TIERS.some(([k]) => celSoort(r[k]) !== 'leeg'))

// Altijd een lijst. Helemaal lege rijen (net toegevoegd, niets getypt) vallen weg.
export function normaliseerVergelijking(ruw) {
  if (!Array.isArray(ruw)) return []
  return ruw
    .filter(r => r && typeof r === 'object' && !Array.isArray(r))
    .map(r => ({
      onderdeel: typeof r.onderdeel === 'string' ? r.onderdeel.trim() : '',
      basis: leesCel(r.basis), midden: leesCel(r.midden), premium: leesCel(r.premium),
    }))
    .filter(rijGevuld)
}

// De rijen die Laten zien toont. Leeg = geen vergelijking: dan de lijstjes per tier.
export const vergelijkRijen = (g) => (Array.isArray(g?.vergelijking) ? g.vergelijking.filter(rijGevuld) : [])

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
//   korting     korting bij vooruitbetalen, over teBetalen, op hele euro's (0 bij vooruitPct 0)
//   vooruit     teBetalen min korting: de prijs in één keer
//   gratis      gratis maanden bij vooruitbetalen voor deze duur (0 = geen)
//   maandenVooruit   duur plus gratis: hoe lang hij bij vooruitbetalen coaching krijgt
export function prijzen(tier, duur, g) {
  const totaal = n(tier?.prijs?.[duur])
  if (totaal <= 0) return null
  const borg = g?.borgAan ? Math.min(totaal, Math.max(0, n(g.borgBedrag))) : 0
  const teBetalen = totaal - borg
  const pct = Math.min(100, Math.max(0, n(g?.vooruitPct)))
  const korting = Math.round(teBetalen * pct / 100)
  const gratis = gratisBij(g, duur)
  return { totaal, perMaand: totaal / duur, borg, teBetalen, korting, vooruit: teBetalen - korting, gratis, maandenVooruit: duur + gratis }
}

// Alle sommen voor één tier bij één duur (maanden). Zonder prijs: omzet,
// perMaand, partner, over en perUur zijn null; kosten en uren tellen wel.
// Partner-aandeel gaat over de omzet, niet over wat er na kosten overblijft.
// omzet: wat er echt binnenkomt als dat afwijkt van de totaalprijs (borg
// verrekend, vooruitbetalen); weggelaten = de totaalprijs.
// gratis: gratis maanden bij vooruitbetalen. Die maanden lever je wel: kosten en
// uren per maand lopen door over duur plus gratis (maanden), de omzet blijft wat
// er vooruit betaald is. perMaand blijft de prijs per betaalde maand.
export function reken(tier, duur, partnerPct, omzet = null, gratis = 0) {
  const maanden = duur + Math.max(0, n(gratis))
  const kosten = n(tier?.kostenMaand) * maanden + n(tier?.kostenEenmalig)
  const uren = n(tier?.urenMaand) * maanden + n(tier?.urenEenmalig)
  const prijs = n(tier?.prijs?.[duur])
  if (prijs <= 0) return { omzet: null, perMaand: null, partner: null, kosten, uren, maanden, over: null, perUur: null }
  const binnen = omzet === null ? prijs : n(omzet)
  const partner = binnen * n(partnerPct) / 100
  const over = binnen - partner - kosten
  return { omzet: binnen, perMaand: prijs / duur, partner, kosten, uren, maanden, over, perUur: uren > 0 ? over / uren : null }
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
      ...zonderLeeg({ zin: tierZin(t) || null }),
    }
  }
  return {
    ...kop,
    vorm: 'Eén jsonb-object: stuur altijd het hele object terug met jouw wijziging erin (ook producten, vergelijking, gratisMaanden, zin per tier en elke sleutel in prijs, anders verdwijnen ze). prijs = totaal per duur in maanden (scherm toont 3, 6, 12; 4 blijft staan), zin = het aanbod van die tier in één zin (achter het knopje bij de tiernaam), gratisMaanden = gratis maanden bovenop de duur bij vooruitbetalen, per duur, vooruitPct = % korting bij vooruitbetalen (0 = geen), borgAan/borgBedrag = borg verrekenen. producten = wat nu verkocht wordt: naam, maanden, vooruit (in één keer), perMaand (termijn). vergelijking = de tabel die de klant ziet: per rij onderdeel en per tier true (zit erin), tekst (de vorm in die tier) of null (zit er niet in); staat er een vergelijking, dan toont het scherm die in plaats van onderdelen.',
    in_beeld: { duur, stand },
    gegevens: {
      partnerPct: gegevens.partnerPct, vooruitPct: gegevens.vooruitPct,
      gratisMaanden: normaliseerGratis(gegevens.gratisMaanden),
      borgAan: gegevens.borgAan, borgBedrag: gegevens.borgBedrag, tiers,
      producten: gegevens.producten || [],
      vergelijking: normaliseerVergelijking(gegevens.vergelijking),
    },
  }
}
