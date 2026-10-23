// src/pages/mijn-split/splitPdf.js
// De split als A4-PDF in de stijl van de ontbijtgids: zwart vel, Anton-koppen,
// Source Sans voor de tekst, een foto bovenaan elke training. Opbouw:
// cover → week → één pagina per training (oefeningen + logboek voor 4 weken)
// → hoe je hem uitvoert → coaching-aanbod. Getekend met jsPDF met de fonts
// ingebed, zodat de tekst scherp blijft. Fonts en foto's staan in
// public/mijn-split/ en worden pas geladen als iemand op downloaden drukt.
import jsPDF from 'jspdf'
import { DAG_NAAM, WEEK, DOELEN } from './splitRegels'

const MAP = '/mijn-split/'
const B = 210
const H = 297
const M = 9

const ZWART = [14, 14, 14]
const KAART = [24, 24, 24]
const LIJN = [44, 44, 44]
const WIT = [255, 255, 255]
const ZACHT = [205, 205, 205]
const GRIJS = [140, 140, 140]
const DOF = [85, 85, 85]

// Welke foto bij welke dag. Thuis heeft eigen foto's: de gymfoto's laten
// machines zien die je thuis niet hebt.
const FOTO = {
  push: 'push', pull: 'pull', legs: 'legs',
  upper_borst: 'upper', upper_rug: 'pull',
  full_a: 'full', full_b: 'legs', full_c: 'upper',
}
const FOTO_THUIS = {
  push: 'thuis2', pull: 'thuis', legs: 'thuis3',
  upper_borst: 'thuis2', upper_rug: 'thuis',
  full_a: 'thuis2', full_b: 'thuis', full_c: 'thuis3',
}

const TEKST = {
  push: {
    intro: 'Alles wat duwt: eerst de zware drukoefeningen, daarna de isolatie.',
    tip: 'Houd je schouderbladen laag en naar achteren bij elke drukoefening. Dan doet je borst het werk en blijven je schouders heel.',
    weet: 'Je triceps werken bij elke drukoefening mee. Daarom staan ze aan het eind: dan zijn ze al voorvermoeid en heb je minder gewicht nodig.',
  },
  pull: {
    intro: 'Alles wat trekt: brede rug, dikke rug, en als laatste je biceps.',
    tip: 'Denk "ellebogen naar je heupen" in plaats van "trekken met je handen". Dan voel je het in je rug en niet alleen in je armen.',
    weet: 'Geeft je grip het eerder op dan je rug? Gebruik lifting straps. Je traint je rug, niet je onderarmen.',
  },
  legs: {
    intro: 'De zwaarste dag van de week. Begin fris en neem je rust serieus.',
    tip: 'Ga zo diep als je kunt met een neutrale rug. Een volle beweging levert meer op dan extra kilo\'s op een halve.',
    weet: 'Een spier groeit het hardst als hij belast wordt in de gestrekte positie. Juist het onderste stuk van de squat telt dus.',
  },
  upper: {
    intro: 'Borst, rug, schouders en armen in één training.',
    tip: 'Rust echt de volle tijd bij de eerste twee oefeningen. Korter rusten kost je herhalingen op de volgende set.',
    weet: 'Twee sets tot dicht bij falen geven vrijwel dezelfde groei als vier sets waar je nog veel overhoudt. Kwaliteit boven kwantiteit.',
  },
  full: {
    intro: 'Benen, duwen, trekken en een paar isolaties.',
    tip: 'Gaat de laatste oefening steeds slechter? Draai de volgorde de week erna om, zodat elke spier een keer fris aan de beurt is.',
    weet: 'Met full body raak je elke spier meerdere keren per week. Mis je een training, dan heb je toch alles al een keer getraind.',
  },
  full_b: {
    intro: 'Benen, duwen, trekken en een paar isolaties, met andere oefeningen dan training A.',
    tip: 'Kies bij lunges en split squats een gewicht waarmee je beide benen netjes afmaakt. Begin altijd met je zwakste been.',
    weet: 'Eenbenige oefeningen trainen je benen even goed als zware squats, met veel minder belasting op je onderrug.',
  },
  full_c: {
    intro: 'De laatste training van de week: alles nog één keer, met weer andere oefeningen.',
    tip: 'Merk je dat je nog moe bent van eerder in de week? Houd dezelfde gewichten aan en focus op een strakke uitvoering.',
    weet: 'Door elke training andere oefeningen te doen, belast je je spieren net anders. Dat houdt je gewrichten fris.',
  },
}
const tekstVoor = (code) => TEKST[code] || TEKST[code.startsWith('upper') ? 'upper' : code.startsWith('full') ? 'full' : 'push']

const INTENSITEIT = { beginner: '2-3 herh. over', gevorderd: '1-2 herh. over', ervaren: '0-1 herh. over' }

// ── laden ────────────────────────────────────────────────────────────────

const laad = async (bestand) => {
  const r = await fetch(MAP + bestand)
  if (!r.ok) throw new Error(`${bestand}: ${r.status}`)
  return new Uint8Array(await r.arrayBuffer())
}
const naarBase64 = (bytes) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const FONTS = [
  ['Anton-Regular.ttf', 'Anton', 'normal'],
  ['SourceSans3-Regular.ttf', 'Source', 'normal'],
  ['SourceSans3-Bold.ttf', 'Source', 'bold'],
  ['SourceSans3-Black.ttf', 'Source', 'black'],
]

// ── kleine helpers ───────────────────────────────────────────────────────

const minuten = (rust) => {
  const m = String(rust || '').replace(',', '.').match(/([\d.]+)\s*(min|sec|s)?/i)
  if (!m) return 1.5
  const n = parseFloat(m[1])
  return /^s/i.test(m[2] || '') ? n / 60 : n
}
// Werksets × (± 45 s per set + rust), plus 8 min opwarmen, op 5 min afgerond.
const duur = (oef) => Math.round((8 + oef.reduce((t, o) => t + (Number(o.sets) || 0) * (0.75 + minuten(o.rust)), 0)) / 5) * 5
const totaalSets = (oef) => oef.reduce((t, o) => t + (Number(o.sets) || 0), 0)
const tweeCijfers = (n) => String(n).padStart(2, '0')

function maakTekenaar(doc) {
  const kleur = (c) => doc.setTextColor(c[0], c[1], c[2])
  const font = (fam, stijl, pt) => { doc.setFont(fam, stijl); doc.setFontSize(pt) }

  // Tekst met letterafstand (de kleine kapitale labels uit de ontbijtgids).
  const label = (t, x, y, { pt = 6.5, stijl = 'bold', c = GRIJS, ruimte = 0.9, align = 'left' } = {}) => {
    font('Source', stijl, pt); kleur(c)
    const s = String(t).toUpperCase()
    const w = doc.getTextWidth(s) + ruimte * (s.length - 1)
    const x0 = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x
    doc.text(s, x0, y, { charSpace: ruimte })
    return w
  }

  const achtergrond = () => { doc.setFillColor(...ZWART); doc.rect(0, 0, B, H, 'F') }

  const kop = (rechts) => {
    font('Anton', 'normal', 10.5); kleur(WIT)
    doc.text('MY ARC', M, 11)
    if (rechts) label(rechts, B - M, 10.6, { c: ZACHT, align: 'right' })
  }

  const voet = (links, rechts) => {
    doc.setDrawColor(...LIJN); doc.setLineWidth(0.2)
    doc.line(M, H - 12, B - M, H - 12)
    label(links, M, H - 6.5, { stijl: 'normal', c: DOF, ruimte: 0.8 })
    if (rechts) { font('Anton', 'normal', 9); kleur(DOF); doc.text(rechts, B - M, H - 6.3, { align: 'right' }) }
  }

  // Alinea met vette aanloop: "1. Warm-up." + gewone tekst, netjes doorlopend.
  const alinea = (vet, rest, x, y, breed, pt = 9.5, regel = 4.6, c = ZACHT) => {
    font('Source', 'bold', pt)
    const vetW = vet ? doc.getTextWidth(vet + ' ') : 0
    font('Source', 'normal', pt)
    const woorden = String(rest).split(' ')
    const regels = []
    let huidig = '', ruimte = breed - vetW
    for (const w of woorden) {
      const probeer = huidig ? `${huidig} ${w}` : w
      if (doc.getTextWidth(probeer) > ruimte && huidig) { regels.push(huidig); huidig = w; ruimte = breed }
      else huidig = probeer
    }
    if (huidig) regels.push(huidig)
    if (vet) { font('Source', 'bold', pt); kleur(WIT); doc.text(vet, x, y) }
    font('Source', 'normal', pt); kleur(c)
    regels.forEach((r, i) => doc.text(r, i === 0 ? x + vetW : x, y + i * regel))
    return regels.length * regel
  }

  const blok = (titel, tekst, x, y, w, h) => {
    doc.setFillColor(...KAART); doc.setDrawColor(...LIJN); doc.setLineWidth(0.2)
    doc.roundedRect(x, y, w, h, 1.2, 1.2, 'FD')
    label(`${titel} —`, x + 4, y + 6, { pt: 6, c: WIT })
    font('Source', 'normal', 8.3); kleur(ZACHT)
    doc.text(doc.splitTextToSize(tekst, w - 8), x + 4, y + 11.5, { lineHeightFactor: 1.45 })
  }
  const blokHoogte = (tekst, w) => {
    font('Source', 'normal', 8.3)
    return 15 + (doc.splitTextToSize(tekst, w - 8).length - 1) * 4.2
  }

  const vinkje = (cx, cy, r = 2.4) => {
    doc.setFillColor(...WIT); doc.circle(cx, cy, r, 'F')
    doc.setDrawColor(...ZWART); doc.setLineWidth(0.55)
    doc.lines([[r * 0.35, r * 0.38], [r * 0.65, -r * 0.8]], cx - r * 0.48, cy + 0.05)
  }

  return { kleur, font, label, achtergrond, kop, voet, alinea, blok, blokHoogte, vinkje }
}

// ── de PDF ───────────────────────────────────────────────────────────────

export async function maakSplitPdf({ voornaam, split, locatie, dagen, tips, doel, niveau }) {
  const thuis = locatie === 'thuis'
  const uniek = [...new Set(split.dagen)].filter(c => dagen[c])
  const fotoVan = (c) => (thuis ? FOTO_THUIS : FOTO)[c] || (thuis ? 'thuis' : 'full')
  const coverNaam = thuis ? 'cover-thuis' : 'cover'
  const fotoNamen = [...new Set([coverNaam, ...uniek.map(fotoVan)])]

  const [fontData, fotoData, transformaties] = await Promise.all([
    Promise.all(FONTS.map(([f]) => laad(`fonts/${f}`))),
    Promise.all(fotoNamen.map(f => laad(`${f}.jpg`))),
    Promise.all([1, 2, 3].map(i => laad(`transformatie-${i}.jpg`).then(b => b, () => null))),
  ])
  const foto = Object.fromEntries(fotoNamen.map((f, i) => [f, fotoData[i]]))

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  FONTS.forEach(([f, fam, stijl], i) => {
    doc.addFileToVFS(f, naarBase64(fontData[i]))
    doc.addFont(f, fam, stijl)
  })
  const t = maakTekenaar(doc)
  const { kleur, font, label, achtergrond, kop, voet, alinea, blok, blokHoogte, vinkje } = t

  const naam = (voornaam || '').trim()
  const doelLabel = DOELEN.find(d => d.key === doel)?.label || ''
  const minuut = Math.max(...uniek.map(c => duur(dagen[c].oefeningen)))
  const paginas = 1 + 1 + uniek.length + 1 + 1
  const nr = (p) => `${tweeCijfers(p)} / ${tweeCijfers(paginas)}`
  const voetLinks = naam ? `Split van ${naam}` : 'MY ARC Kersten'

  // 1. Cover ───────────────────────────────────────────────────────────────
  achtergrond()
  doc.addImage(foto[coverNaam], 'JPEG', 0, 0, B, H, coverNaam, 'FAST')
  kop('Trainingsschema')

  const titel = split.naam.toUpperCase()
  let pt = 78, regels
  for (; pt >= 40; pt -= 2) {
    font('Anton', 'normal', pt)
    regels = doc.splitTextToSize(titel, B - 2 * 18)
    if (regels.length <= 2) break
  }
  const regelH = pt * 0.3528 * 1.0
  const titelOnder = 222
  const titelBoven = titelOnder - (regels.length - 1) * regelH
  label([`${split.dagen.length} dagen`, thuis ? 'thuis' : 'gym', doelLabel].filter(Boolean).join('   ·   '),
    B / 2, titelBoven - pt * 0.3528 * 0.85 - 5, { pt: 8, c: WIT, ruimte: 1.1, align: 'center' })
  font('Anton', 'normal', pt); kleur(WIT)
  regels.forEach((r, i) => doc.text(r, B / 2, titelBoven + i * regelH, { align: 'center' }))

  doc.setDrawColor(...WIT); doc.setLineWidth(0.5)
  doc.line(B / 2 - 7, titelOnder + 9, B / 2 + 7, titelOnder + 9)
  font('Source', 'bold', 13); kleur(ZACHT)
  const sub = naam
    ? `Gemaakt voor ${naam}: ${split.dagen.length} trainingen per week, elke oefening, set en rust uitgeschreven.`
    : `${split.dagen.length} trainingen per week, elke oefening, set en rust uitgeschreven.`
  const subRegels = doc.splitTextToSize(sub, 150)
  doc.text(subRegels, B / 2, titelOnder + 19, { align: 'center', lineHeightFactor: 1.3 })
  font('Source', 'black', 13); kleur(WIT)
  doc.text(`Elke training klaar in ongeveer ${minuut} minuten.`, B / 2, titelOnder + 19 + subRegels.length * 6.1, { align: 'center' })

  label('MY ARC Fitness', M, H - 6.5, { pt: 7, c: ZACHT, ruimte: 1 })
  font('Source', 'normal', 7.5); kleur(ZACHT)
  doc.text('myarcfitness.com', B - M, H - 6.5, { align: 'right' })

  // 2. Week ────────────────────────────────────────────────────────────────
  doc.addPage(); achtergrond()
  kop(split.naam)
  font('Anton', 'normal', 30); kleur(WIT)
  doc.text('DIT IS JE WEEK', M, 30)
  font('Source', 'normal', 10); kleur(ZACHT)
  const waarom = doc.splitTextToSize(split.waarom, 130)
  doc.text(waarom, M, 39, { lineHeightFactor: 1.45 })

  const rijH = 30
  let y = 39 + waarom.length * 5 + 8
  const nummerVan = Object.fromEntries(uniek.map((c, i) => [c, i + 1]))
  WEEK.forEach((d) => {
    const idx = split.week.indexOf(d)
    const code = idx >= 0 ? split.dagen[idx] : null
    const dag = code ? dagen[code] : null
    const midden = y + rijH / 2

    doc.setLineWidth(0.25)
    if (dag) { doc.setFillColor(...KAART); doc.setDrawColor(...LIJN); doc.roundedRect(M, y + 4, 22, 22, 1.2, 1.2, 'FD') }
    else { doc.setDrawColor(...LIJN); doc.roundedRect(M, y + 4, 22, 22, 1.2, 1.2, 'S') }
    font('Anton', 'normal', 16); kleur(dag ? WIT : DOF)
    doc.text(d.toUpperCase(), M + 11, midden + 2.8, { align: 'center' })

    if (dag) {
      const oef = dag.oefeningen
      font('Anton', 'normal', 13); kleur(GRIJS)
      doc.text(tweeCijfers(nummerVan[code]), M + 29, midden + 1.5)
      font('Anton', 'normal', 17); kleur(WIT)
      doc.text(DAG_NAAM[code].toUpperCase(), M + 40, midden - 1)
      font('Source', 'normal', 9.5); kleur(GRIJS)
      doc.text(dag.focus || '', M + 40, midden + 5.5)
      font('Source', 'black', 10.5); kleur(WIT)
      doc.text(`${oef.length} oefeningen`, B - M, midden - 3.5, { align: 'right' })
      doc.text(`${totaalSets(oef)} werksets`, B - M, midden + 1.5, { align: 'right' })
      font('Source', 'normal', 9); kleur(GRIJS)
      doc.text(`± ${duur(oef)} min`, B - M, midden + 6.5, { align: 'right' })
    } else {
      font('Anton', 'normal', 17); kleur(DOF)
      doc.text('RUST', M + 40, midden - 1)
      font('Source', 'normal', 9.5); kleur(DOF)
      doc.text('Herstel. Wandel je stappen en slaap goed.', M + 40, midden + 5.5)
    }
    doc.setDrawColor(...LIJN); doc.setLineWidth(0.2)
    doc.line(M, y + rijH, B - M, y + rijH)
    y += rijH
  })
  voet(voetLinks, nr(2))

  // 3. Eén pagina per training ─────────────────────────────────────────────
  uniek.forEach((code, i) => {
    const dag = dagen[code]
    const oef = dag.oefeningen
    const tekst = tekstVoor(code)
    const fotoNaam = fotoVan(code)
    doc.addPage(); achtergrond()
    const fotoH = B * 640 / 1240
    doc.addImage(foto[fotoNaam], 'JPEG', 0, 0, B, fotoH, fotoNaam, 'FAST')
    kop(`Training ${tweeCijfers(i + 1)} van ${tweeCijfers(uniek.length)}`)

    const wanneer = split.week.filter((_, k) => split.dagen[k] === code).join(' + ')
    label(`Training ${tweeCijfers(i + 1)}   ·   ${wanneer}`, M, fotoH - 25, { pt: 6.5, c: WIT, ruimte: 1.1 })
    font('Anton', 'normal', 40); kleur(WIT)
    doc.text(DAG_NAAM[code].toUpperCase(), M, fotoH - 9)

    let y = fotoH + 7
    font('Source', 'normal', 9.5); kleur(ZACHT)
    doc.text(`${dag.focus}. ${tekst.intro}`, M, y)
    y += 5
    doc.setDrawColor(...LIJN); doc.setLineWidth(0.2); doc.line(M, y, B - M, y)
    const kolom = (B - 2 * M) / 3
    const stats = [
      ['Per training', `${oef.length} oefeningen  ·  ${totaalSets(oef)} sets`],
      ['Tijd', `± ${duur(oef)} min totaal`],
      ['Elke set', INTENSITEIT[niveau] || INTENSITEIT.gevorderd],
    ]
    stats.forEach(([l, w], k) => {
      const x = M + k * kolom + (k ? 5 : 0)
      if (k) { doc.setDrawColor(...LIJN); doc.line(x - 5, y + 4, x - 5, y + 13) }
      label(l, x, y + 6.5, { pt: 6, c: WIT, stijl: 'black' })
      font('Source', 'bold', 11); kleur(WIT)
      doc.text(w, x, y + 12)
    })
    y += 17
    doc.line(M, y, B - M, y)

    y += 8.5
    font('Anton', 'normal', 15); kleur(WIT)
    doc.text('OEFENINGEN', M, y)
    y += 5
    font('Source', 'normal', 7.5); kleur(DOF)
    doc.text('Logboek: schrijf per week je gewicht × herhalingen op. Zo zie je zwart op wit dat je sterker wordt.', M, y)

    // Tabel: oefening | sets × reps | rust | week 1-4
    const xSets = 98, xRust = 117, xWeek = 124
    const weekW = (B - M - xWeek) / 4
    y += 7
    label('Oefening', M, y, { pt: 5.6, c: DOF })
    label('Sets × reps', xSets, y, { pt: 5.6, c: WIT, align: 'right' })
    label('Rust', xRust, y, { pt: 5.6, c: DOF, align: 'right' })
    for (let w = 0; w < 4; w++) label(`Week ${w + 1}`, xWeek + w * weekW + weekW - 1, y, { pt: 5.6, c: DOF, align: 'right' })
    y += 2.5
    doc.setDrawColor(...LIJN); doc.line(M, y, B - M, y)
    const rij = oef.length > 6 ? 7.8 : 8.6
    oef.forEach((o, k) => {
      const mid = y + rij / 2 + 1.2
      font('Source', 'normal', 6.5); kleur(DOF)
      doc.text(tweeCijfers(k + 1), M, mid)
      font('Source', 'normal', 9); kleur(WIT)
      doc.text(doc.splitTextToSize(o.naam, xSets - M - 26)[0], M + 6, mid)
      font('Source', 'black', 9); kleur(WIT)
      doc.text(`${o.sets ?? ''} × ${o.reps || ''}`, xSets, mid, { align: 'right' })
      font('Source', 'normal', 8.5); kleur(GRIJS)
      doc.text(o.rust || '', xRust, mid, { align: 'right' })
      doc.setDrawColor(...LIJN); doc.setLineWidth(0.2)
      for (let w = 0; w < 4; w++) {
        const x = xWeek + w * weekW + 3
        doc.setDrawColor(70, 70, 70); doc.line(x, mid + 0.8, x + weekW - 4, mid + 0.8)
      }
      y += rij
      doc.setDrawColor(...LIJN); doc.line(M, y, B - M, y)
    })

    y += 8.5
    font('Anton', 'normal', 15); kleur(WIT)
    doc.text('UITVOERING', M, y)
    y += 6.5
    const rustTekst = oef[0]?.rust || '2 min'
    const stappen = [
      ['1. Opwarmen.', 'Vijf minuten licht cardio, dan twee opwarmsets op de helft en driekwart van je werkgewicht.'],
      ['2. Werksets.', tips[0]],
      ['3. Rust.', `Neem ${rustTekst} tussen de sets. Pas als je ademhaling rustig is, begin je aan de volgende.`],
      ['4. Noteren.', 'Schrijf je gewicht en herhalingen in het logboek. Volgende week: één herhaling of een paar kilo meer.'],
    ]
    stappen.forEach(([v, r]) => { y += alinea(v, r, M, y, B - 2 * M, 9.3, 4.4) + 1.4 })

    y += 2
    const bw = (B - 2 * M - 4) / 2
    const bh = Math.max(blokHoogte(tekst.tip, bw), blokHoogte(tekst.weet, bw))
    blok('Tip', tekst.tip, M, y, bw, bh)
    blok('Wist je dat', tekst.weet, M + bw + 4, y, bw, bh)

    voet(voetLinks, nr(3 + i))
  })

  // 4. Zo haal je er alles uit ─────────────────────────────────────────────
  doc.addPage(); achtergrond()
  kop(split.naam)
  font('Anton', 'normal', 30); kleur(WIT)
  doc.text('ZO HAAL JE ER ALLES UIT', M, 30)
  font('Source', 'normal', 10); kleur(ZACHT)
  doc.text(doc.splitTextToSize('Het schema is het halve werk. Deze vier regels bepalen of je over acht weken zichtbaar verschil ziet.', 140), M, 39, { lineHeightFactor: 1.45 })

  const regelsLijst = [
    ['Intensiteit', tips[0]],
    ['Progressie', tips[1]],
    ['Voeding', tips[2]],
    ['Herstel', 'Slaap zeven à negen uur. Op rustdagen wandel je en train je niet extra zwaar: je spieren groeien tussen de trainingen, niet tijdens.'],
  ]
  y = 58
  regelsLijst.forEach(([kopje, r], k) => {
    font('Anton', 'normal', 26); kleur(DOF)
    doc.text(tweeCijfers(k + 1), M, y + 9)
    font('Anton', 'normal', 15); kleur(WIT)
    doc.text(kopje.toUpperCase(), M + 20, y + 3)
    font('Source', 'normal', 10); kleur(ZACHT)
    const r2 = doc.splitTextToSize(r, B - 2 * M - 20)
    doc.text(r2, M + 20, y + 9.5, { lineHeightFactor: 1.45 })
    y += 14 + r2.length * 5.1
    doc.setDrawColor(...LIJN); doc.setLineWidth(0.2); doc.line(M, y, B - M, y)
    y += 8
  })

  // Voorbeeld van dubbele progressie.
  y += 2
  const vbH = 52
  doc.setFillColor(...KAART); doc.setDrawColor(...LIJN); doc.roundedRect(M, y, B - 2 * M, vbH, 1.2, 1.2, 'FD')
  label('Voorbeeld — zo werkt progressie', M + 5, y + 8, { pt: 6.5, c: WIT })
  const vb = [
    ['Week 1', '60 kg × 8, 60 kg × 7', 'Begin onderaan de reps.'],
    ['Week 2', '60 kg × 9, 60 kg × 8', 'Eén herhaling erbij.'],
    ['Week 3', '60 kg × 11, 60 kg × 10', 'Blijf herhalingen stapelen.'],
    ['Week 4', '60 kg × 12, 60 kg × 12', 'Bovenkant bereikt.'],
    ['Week 5', '62,5 kg × 8, 62,5 kg × 8', 'Gewicht erbij, terug naar 8.'],
  ]
  vb.forEach(([w, s, u], k) => {
    const yy = y + 16 + k * 7.2
    font('Source', 'bold', 9.5); kleur(GRIJS); doc.text(w, M + 5, yy)
    font('Source', 'black', 9.5); kleur(WIT); doc.text(s, M + 28, yy)
    font('Source', 'normal', 9.5); kleur(ZACHT); doc.text(u, M + 85, yy)
  })
  voet(voetLinks, nr(paginas - 1))

  // 5. Coaching ────────────────────────────────────────────────────────────
  doc.addPage(); achtergrond()
  const top = 50
  font('Anton', 'normal', 30); kleur(WIT)
  doc.text('WIL JIJ 6 WEKEN GRATIS COACHING?', B / 2, top, { align: 'center' })
  const punten = ['Persoonlijk voedingsplan', 'Persoonlijk trainingsplan', '1-op-1 begeleiding', 'Stok achter de deur', 'Alles in 1 app']
  font('Source', 'black', 13)
  const puntW = Math.max(...punten.map(p => doc.getTextWidth(p))) + 8
  const px = B / 2 - puntW / 2
  punten.forEach((p, k) => {
    const yy = top + 16 + k * 8.6
    vinkje(px + 2.4, yy - 1.5)
    font('Source', 'black', 13); kleur(WIT)
    doc.text(p, px + 8, yy)
  })
  const fotos = transformaties.filter(Boolean)
  if (fotos.length) {
    const fw = 58, fh = fw * 1350 / 1080, gat = 4
    const startX = B / 2 - (fotos.length * fw + (fotos.length - 1) * gat) / 2
    fotos.forEach((f, k) => doc.addImage(f, 'JPEG', startX + k * (fw + gat), top + 66, fw, fh, `transformatie-${k}`, 'FAST'))
  }
  font('Source', 'black', 17); kleur(WIT)
  doc.text('DM mij "CHALLENGE" voor meer informatie', B / 2, top + 66 + 72.5 + 16, { align: 'center' })
  label('MY ARC Kersten', M, H - 6.5, { stijl: 'normal', c: DOF, ruimte: 0.8 })
  font('Source', 'normal', 7); kleur(DOF)
  doc.text('@myarcfitness', B - M, H - 6.5, { align: 'right' })

  return doc
}

export async function downloadSplitPdf(opties) {
  const doc = await maakSplitPdf(opties)
  doc.save(`mijn-split-${opties.split.dagen.length}-dagen.pdf`)
}
