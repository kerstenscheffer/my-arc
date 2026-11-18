// src/modules/progress/slaapTips.js
//
// Rekenwerk voor het slaapinzicht (SlaapInzicht.jsx), 18 nov 2026, Kersten:
// "tips naar voren drukken om slaap te verbeteren: vaste tijden als iemand
// daar inconsistent mee is, iets voor kwaliteit als iemand daar laag zit."
//
// Geen taalmodel: de tips komen uit de eigen nachten van de klant (regels
// hieronder), dus ze kloppen altijd met wat er gelogd is, zijn direct
// beschikbaar en kosten niets. Elke tip heeft een gewicht; de zwaarste staan
// bovenaan.
//
// log_date = de ochtend waarop je wakker werd. Een bedtijd na middernacht telt
// als laat (00:30 = 24:30), anders lijkt wie om half één slaapt een vroege
// slaper.

export const ALGEMENE_TIPS = [
  'Ga elke dag op dezelfde tijd naar bed en sta op dezelfde tijd op, ook in het weekend.',
  'Houd je slaapkamer koel. Tussen 17 en 19 °C slaap je het diepst.',
  'Zorg voor volledige duisternis. Gebruik een slaapmasker of verduisteringsgordijnen.',
  'Leg je scherm 45 minuten voor bedtijd weg. Blauw licht remt melatonine.',
  "Neem 's avonds een warme douche: de afkoeling daarna versnelt het inslapen.",
  'Eet je laatste maaltijd 2 tot 3 uur voor bedtijd.',
  'Sta op zodra je wekker gaat. Snoozen verstoort je ritme.',
  'Ga binnen 30 minuten na het opstaan naar buiten voor daglicht.',
]

export const lokaalIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const maandagVan = (iso) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return lokaalIso(d)
}
export const plusDagen = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return lokaalIso(d)
}

// Kloktijd → minuten. Bedtijd: alles vóór 12:00 is na middernacht (laat).
export const bedMin = (t) => {
  if (!t) return null
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const v = h * 60 + m
  return v < 12 * 60 ? v + 24 * 60 : v
}
export const opMin = (t) => {
  if (!t) return null
  const [h, m] = String(t).split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}
export const klokTekst = (min) => {
  if (min == null || !Number.isFinite(min)) return '—'
  const v = ((Math.round(min / 5) * 5) % 1440 + 1440) % 1440
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}
export const nl = (n, dec = 1) => (n == null || !Number.isFinite(n) ? '—' : String(Math.round(n * 10 ** dec) / 10 ** dec).replace('.', ','))

const gem = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const spreiding = (a) => {
  if (a.length < 2) return null
  const g = gem(a)
  return Math.sqrt(a.reduce((s, x) => s + (x - g) ** 2, 0) / a.length)
}
const mediaan = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)]
}
const isWeekendOchtend = (iso) => { const d = new Date(`${iso}T12:00:00`).getDay(); return d === 6 || d === 0 }

// Cijfers van een rij nachten (een week, of de laatste 14).
export function cijfers(nachten) {
  const uren = nachten.map(n => Number(n.hours_slept)).filter(Number.isFinite)
  const kw = nachten.map(n => Number(n.quality)).filter(Number.isFinite)
  const bed = nachten.map(n => bedMin(n.bedtime)).filter(v => v != null)
  const op = nachten.map(n => opMin(n.wake_time)).filter(v => v != null)
  return {
    aantal: nachten.length,
    uren: gem(uren),
    kwaliteit: gem(kw),
    bed: gem(bed),
    op: gem(op),
    bedSpreiding: spreiding(bed),
    opSpreiding: spreiding(op),
    bedVroegst: bed.length ? Math.min(...bed) : null,
    bedLaatst: bed.length ? Math.max(...bed) : null,
  }
}

// Persoonlijke tips uit de laatste nachten (nieuwste eerst of niet, maakt niet uit).
// Geeft [{ titel, tekst, gewicht }] terug, zwaarste eerst.
export function persoonlijkeTips(nachten) {
  const tips = []
  if (nachten.length < 3) {
    return [{ titel: 'Log een paar nachten', tekst: 'Vanaf 3 gelogde nachten zie je hier tips op basis van jouw slaap.', gewicht: 0 }]
  }
  const c = cijfers(nachten)
  const bedden = nachten.map(n => bedMin(n.bedtime)).filter(v => v != null)
  const vasteBed = mediaan(bedden)

  // 1. Vaste bedtijd
  if (c.bedSpreiding != null && c.bedSpreiding > 35 && c.bedVroegst != null) {
    tips.push({
      titel: 'Vaste bedtijd',
      tekst: `Je bedtijd wisselt tussen ${klokTekst(c.bedVroegst)} en ${klokTekst(c.bedLaatst)}. Kies één vaste tijd, bijvoorbeeld ${klokTekst(vasteBed)}, en houd die 7 dagen vast, ook in het weekend. Een vast ritme maakt je slaap dieper.`,
      gewicht: 40 + c.bedSpreiding / 2,
    })
  }

  // 2. Vaste opstaantijd, en het weekend apart
  const doordeweeks = nachten.filter(n => !isWeekendOchtend(n.log_date)).map(n => opMin(n.wake_time)).filter(v => v != null)
  const weekend = nachten.filter(n => isWeekendOchtend(n.log_date)).map(n => opMin(n.wake_time)).filter(v => v != null)
  const verschuiving = doordeweeks.length && weekend.length ? gem(weekend) - gem(doordeweeks) : 0
  if (verschuiving > 75) {
    tips.push({
      titel: 'Weekend-jetlag',
      tekst: `In het weekend sta je gemiddeld ${nl(verschuiving / 60)} uur later op dan doordeweeks. Dat voelt op maandag als een jetlag. Sta in het weekend hooguit een uur later op.`,
      gewicht: 30 + verschuiving / 6,
    })
  } else if (c.opSpreiding != null && c.opSpreiding > 40) {
    tips.push({
      titel: 'Vaste opstaantijd',
      tekst: `Je opstaantijd wisselt veel. Een vaste wekker, elke dag dezelfde tijd, is de snelste manier om ook 's avonds vanzelf moe te worden.`,
      gewicht: 25 + c.opSpreiding / 3,
    })
  }

  // 3. Te kort
  if (c.uren != null && c.uren < 7) {
    const doel = vasteBed != null ? klokTekst(vasteBed - Math.min(60, Math.round((7.5 - c.uren) * 60))) : null
    tips.push({
      titel: 'Meer uren',
      tekst: `Je slaapt gemiddeld ${nl(c.uren)} uur. Onder de 7 uur krijg je meer trek en herstel je slechter van je training.${doel ? ` Ga eens een week om ${doel} naar bed.` : ' Ga een half uur eerder naar bed.'}`,
      gewicht: 35 + (7 - c.uren) * 20,
    })
  }

  // 4. Kwaliteit, en wanneer die beter is
  if (c.kwaliteit != null && c.kwaliteit < 6.5) {
    tips.push({
      titel: 'Kwaliteit omhoog',
      tekst: `Je geeft je nachten gemiddeld een ${nl(c.kwaliteit)}. Begin bij je slaapkamer: koel (17-19 °C), helemaal donker, telefoon buiten handbereik. Geen cafeïne meer na 14:00.`,
      gewicht: 30 + (6.5 - c.kwaliteit) * 12,
    })
  }
  if (vasteBed != null) {
    const metCijfer = nachten.filter(n => Number.isFinite(Number(n.quality)) && bedMin(n.bedtime) != null)
    const vroeg = metCijfer.filter(n => bedMin(n.bedtime) <= vasteBed).map(n => Number(n.quality))
    const laat = metCijfer.filter(n => bedMin(n.bedtime) > vasteBed).map(n => Number(n.quality))
    if (vroeg.length >= 2 && laat.length >= 2 && gem(vroeg) - gem(laat) >= 1) {
      tips.push({
        titel: 'Vroeger = beter',
        tekst: `Lig je uiterlijk om ${klokTekst(vasteBed)} in bed, dan geef je je nacht een ${nl(gem(vroeg))}. Later een ${nl(gem(laat))}. Je eigen cijfers zeggen het al.`,
        gewicht: 28 + (gem(vroeg) - gem(laat)) * 6,
      })
    }
  }

  // 5. Laat naar bed
  if (c.bed != null && c.bed > 24 * 60 + 15) {
    tips.push({
      titel: 'Eerder naar bed',
      tekst: `Je gaat gemiddeld om ${klokTekst(c.bed)} naar bed. Zet een wekker op ${klokTekst(c.bed - 60)} als seintje: scherm weg, lichten dimmen.`,
      gewicht: 20 + (c.bed - 24 * 60) / 6,
    })
  }

  // 6. Wat de klant zelf schreef
  const tekst = nachten.map(n => String(n.struggles || '').toLowerCase()).join(' ')
  const telt = (re) => (tekst.match(re) || []).length
  // Teksten uit de keuzelijst (NachtOpmerking.jsx) en eigen tekst.
  const opmerkingen = [
    [/moeilijk in slaap|inslapen|niet in slaap/g, 'Moeilijk in slaap', 'Kom je moeilijk in slaap? Een vast avondritueel helpt: zelfde tijd, licht dimmen, scherm weg, warme douche. Lig je na 20 minuten nog wakker, sta dan even op.'],
    [/(vaak|veel) wakk|wakker gelegen|lag wakker/g, 'Vaak wakker', 'Word je vaak wakker? Check je slaapkamer (koel, donker, stil) en drink geen alcohol of cafeïne in de avond. Kijk niet op je telefoon of wekker als je wakker wordt.'],
    [/te vroeg wakker/g, 'Te vroeg wakker', 'Te vroeg wakker? Houd je kamer donker tot je wekker gaat en sta wel op je vaste tijd op, ook als de nacht kort was.'],
    [/pieker|stress|hoofd|onrust|gedacht/g, 'Hoofd vol', 'Je schreef over piekeren. Schrijf voor het slapen op wat er morgen moet gebeuren. Dan hoeft je hoofd het niet vast te houden.'],
    [/koffie|cafe|cola|energy|pre.?workout/g, 'Cafeïne', 'Cafeïne werkt 6 tot 8 uur door. Je laatste koffie of pre-workout uiterlijk om 14:00.'],
    [/telefoon|scherm|netflix|serie|gamen|game|tiktok|insta/g, 'Scherm', 'Leg je telefoon 45 minuten voor bedtijd weg, het liefst buiten de slaapkamer.'],
    [/gegeten|zwaar eten|laat eten/g, 'Laat gegeten', 'Eet je laatste maaltijd 2 tot 3 uur voor bedtijd. Een volle maag houdt je lichaam bezig als het zou moeten herstellen.'],
    [/alcohol|bier|wijn|drank/g, 'Alcohol', 'Alcohol helpt inslapen, maar breekt je diepe slaap en REM-slaap op. Stop 3 uur voor bedtijd, of houd het bij één glas.'],
    [/plas|wc|toilet/g, 'Wakker om te plassen', 'Drink je water vooral overdag en minder in de 2 uur voor bedtijd.'],
    [/warm|heet|zweet/g, 'Te warm', 'Te warm slaapt ondiep. Raam open of een dunner dekbed; 17-19 °C is ideaal.'],
    [/lawaai|geluid|licht/g, 'Lawaai of licht', 'Oordopjes en een slaapmasker zijn de goedkoopste upgrade voor je slaap. Probeer ze een week.'],
    [/kind|baby|zoon|dochter/g, 'Kinderen', 'Gebroken nachten door de kinderen? Bescherm dan vooral het begin: zo vroeg mogelijk naar bed, want die eerste uren zijn het diepst.'],
    [/pijn|spierpijn|blessure/g, 'Pijn', 'Pijn houdt je wakker. Een warme douche voor bed en een extra kussen ter ondersteuning helpen. Houdt het aan, meld het dan bij je coach.'],
    [/laat getraind|laat trainen|avondtraining/g, 'Laat getraind', 'Train je laat, plan dan minstens 2 tot 3 uur tussen je training en bedtijd, en neem daarna geen pre-workout of cafeïne.'],
  ]
  for (const [re, titel, uitleg] of opmerkingen) {
    const n = telt(re)
    if (n >= 1) tips.push({ titel, tekst: uitleg, gewicht: 22 + n * 6 })
  }

  if (!tips.length) {
    tips.push({ titel: 'Geen tip, je bent goed bezig', tekst: `Gemiddeld ${nl(c.uren)} uur, een ${nl(c.kwaliteit)} en vaste tijden. Zo houden.`, gewicht: 0 })
  }
  return tips.sort((a, b) => b.gewicht - a.gewicht)
}
