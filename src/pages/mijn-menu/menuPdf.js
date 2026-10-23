// src/pages/mijn-menu/menuPdf.js
// Het weekmenu als A4-PDF, in dezelfde stijl als de split (zelfde fonts,
// logo, kleuren en tekenhulpjes uit mijn-split/splitPdf.js). Opbouw:
// cover → jouw cijfers → je week in één oogopslag → één pagina per dag →
// recepten → boodschappenlijst → afsluiter.
//
// Gerechtfoto's: per gerecht de eigen foto of de fallback (resolveFoodImage),
// in de browser vierkant bijgesneden via een canvas. Lukt een foto niet
// (CORS, offline, of in de test zonder canvas), dan een donker vlak.
import jsPDF from 'jspdf'
import { resolveFoodImage } from '../../modules/meal-plan/foodImageFallback'
import { B, H, M, KAART, LIJN, WIT, ZACHT, GRIJS, DOF, laad, naarBase64, FONTS, tweeCijfers, LOGO_VERHOUDING, maakTekenaar } from '../mijn-split/splitPdf'
import { DOELEN, MOMENT_NAAM, MOMENTEN, dagTotaal, hoeveel, boodschappen, verwachting, kgTekst } from './menuRegels'

const laadMenu = async (bestand) => {
  const r = await fetch(`/mijn-menu/${bestand}`)
  if (!r.ok) throw new Error(`${bestand}: ${r.status}`)
  return new Uint8Array(await r.arrayBuffer())
}

export const fotoUrl = (g, maat = 480) => {
  const url = resolveFoodImage({ name: g.naam, image_url: g.foto, slot: g.moment }, { size: maat })
  if (/images\.unsplash\.com/.test(url) && !/[?&]w=/.test(url)) return `${url}${url.includes('?') ? '&' : '?'}w=${maat}&q=70&fit=crop`
  return url
}

// Vierkante JPEG van een gerechtfoto, of null.
async function fotoVierkant(url, px = 360) {
  try {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null
    const r = await fetch(url, { mode: 'cors' })
    if (!r.ok) return null
    const bmp = await createImageBitmap(await r.blob())
    const c = document.createElement('canvas')
    c.width = px; c.height = px
    const s = Math.min(bmp.width, bmp.height)
    c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, px, px)
    return c.toDataURL('image/jpeg', 0.78)
  } catch { return null }
}

const kgOfGram = (g) => (g >= 1000 ? `${(Math.round(g / 100) / 10).toString().replace('.', ',')} kg` : `${Math.round(g / 10) * 10} g`)

export async function maakMenuPdf({ voornaam, doel, cijfers, week, aantal }) {
  const naam = (voornaam || '').trim()
  const uniek = []
  const gezien = new Set()
  week.forEach(d => d.maaltijden.forEach(m => { if (!m.leeg && !gezien.has(m.naam)) { gezien.add(m.naam); uniek.push(m) } }))

  const [fontData, logo, cover, ...fotos] = await Promise.all([
    Promise.all(FONTS.map(([f]) => laad(`fonts/${f}`))),
    laad('logo-wit.png').then(b => b, () => null),
    laadMenu('cover.jpg').then(b => b, () => null),
    ...uniek.map(g => fotoVierkant(fotoUrl(g))),
  ])
  const fotoVan = Object.fromEntries(uniek.map((g, i) => [g.naam, fotos[i]]))

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  FONTS.forEach(([f, fam, stijl], i) => { doc.addFileToVFS(f, naarBase64(fontData[i])); doc.addFont(f, fam, stijl) })
  const { kleur, font, label, achtergrond, tekenLogo, kop, voet, blok, blokHoogte } = maakTekenaar(doc, logo)
  const voetLinks = naam ? `Menu van ${naam}` : 'MY ARC Kersten'
  let pagina = 1
  const nieuwePagina = (rechts) => { doc.addPage(); pagina += 1; achtergrond(); kop(rechts); return pagina }
  const gemiddeld = week.map(dagTotaal).reduce((t, d) => ({ kcal: t.kcal + d.kcal / 7, eiwit: t.eiwit + d.eiwit / 7 }), { kcal: 0, eiwit: 0 })
  const doelLabel = DOELEN.find(d => d.key === doel)?.label || ''

  const fotoVak = (g, x, y, w) => {
    const data = fotoVan[g.naam]
    doc.setFillColor(...KAART); doc.roundedRect(x, y, w, w, 1.5, 1.5, 'F')
    if (data) doc.addImage(data, 'JPEG', x, y, w, w, `f-${g.naam}`, 'FAST')
  }

  // 1. Cover ───────────────────────────────────────────────────────────────
  achtergrond()
  if (cover) doc.addImage(cover, 'JPEG', 0, 0, B, H, 'menu-cover', 'FAST')
  tekenLogo(B / 2 - 9, 14, 18 / LOGO_VERHOUDING)
  label([`${cijfers.kcal} kcal`, `${aantal} maaltijden`, doelLabel].filter(Boolean).join('   ·   '), B / 2, 182, { pt: 8, c: WIT, ruimte: 1.1, align: 'center' })
  font('Anton', 'normal', 70); kleur(WIT)
  doc.text('JOUW WEEKMENU', B / 2, 208, { align: 'center' })
  doc.setDrawColor(...WIT); doc.setLineWidth(0.5); doc.line(B / 2 - 7, 219, B / 2 + 7, 219)
  font('Source', 'bold', 13); kleur(ZACHT)
  const sub = doc.splitTextToSize(`${naam ? `Gemaakt voor ${naam}: ` : ''}7 dagen, elke maaltijd op de gram uitgerekend op jouw calorieën.`, 150)
  doc.text(sub, B / 2, 229, { align: 'center', lineHeightFactor: 1.3 })
  font('Source', 'black', 13); kleur(WIT)
  doc.text(`Gemiddeld ${Math.round(gemiddeld.eiwit)} gram eiwit per dag.`, B / 2, 229 + sub.length * 6.1, { align: 'center' })
  label('Voedingsschema', M, H - 6.5, { pt: 7, c: ZACHT, ruimte: 1 })
  font('Source', 'normal', 7.5); kleur(ZACHT); doc.text('myarcfitness.com', B - M, H - 6.5, { align: 'right' })

  // 2. Jouw cijfers ────────────────────────────────────────────────────────
  nieuwePagina('Jouw cijfers')
  font('Anton', 'normal', 30); kleur(WIT); doc.text('JOUW CIJFERS', M, 30)
  font('Source', 'normal', 10); kleur(ZACHT)
  doc.text(doc.splitTextToSize('Berekend op je lengte, gewicht, leeftijd en hoe actief je bent. Dit is je startpunt: na twee weken weet je of het klopt.', 140), M, 39, { lineHeightFactor: 1.45 })
  // Groot getal
  label('Per dag', M, 57, { pt: 6.5, c: WIT, stijl: 'black' })
  font('Anton', 'normal', 50); kleur(WIT); doc.text(String(cijfers.kcal), M, 77)
  const kw = doc.getTextWidth(String(cijfers.kcal))
  font('Anton', 'normal', 18); kleur(GRIJS); doc.text('KCAL', M + kw + 3, 77)
  // Macro's als drie vakken
  const vakW = (B - 2 * M - 8) / 3
  ;[['Eiwit', cijfers.eiwit], ['Koolhydraten', cijfers.kh], ['Vet', cijfers.vet]].forEach(([l, g], k) => {
    const x = M + k * (vakW + 4)
    doc.setFillColor(...KAART); doc.setDrawColor(...LIJN); doc.setLineWidth(0.2); doc.roundedRect(x, 84, vakW, 22, 1.2, 1.2, 'FD')
    label(l, x + 4, 90.5, { pt: 6, c: GRIJS })
    font('Anton', 'normal', 20); kleur(WIT); doc.text(`${g} G`, x + 4, 102)
  })
  // Wat je mag verwachten: verbranding − eten = verschil → kilo's.
  const v = verwachting(cijfers)
  const duizend = (n) => Math.round(n).toLocaleString('nl-NL')
  font('Anton', 'normal', 15); kleur(WIT); doc.text('WAT JE MAG VERWACHTEN', M, 120)
  const tw = (B - 2 * M - 2 * 8) / 3
  const verschilLabel = v.soort === 'tekort' ? 'Tekort per dag' : v.soort === 'overschot' ? 'Overschot per dag' : 'Verschil per dag'
  ;[['Je verbrandt', `${duizend(v.tdee)} kcal`], ['Je eet', `${duizend(v.eet)} kcal`], [verschilLabel, `${v.perDag > 0 ? '+' : v.perDag < 0 ? '−' : ''}${duizend(Math.abs(v.perDag))} kcal`]].forEach(([l, w], k) => {
    const x = M + k * (tw + 8)
    const accent = k === 2 && v.soort !== 'onderhoud'
    doc.setFillColor(...KAART); doc.setDrawColor(...(accent ? [134, 239, 172] : LIJN)); doc.setLineWidth(accent ? 0.4 : 0.2)
    doc.roundedRect(x, 125, tw, 20, 1.2, 1.2, 'FD')
    label(l, x + 4, 131.5, { pt: 6, c: GRIJS })
    font('Source', 'black', 12.5); if (accent) doc.setTextColor(134, 239, 172); else kleur(WIT)
    doc.text(w, x + 4, 140)
    if (k < 2) { font('Source', 'black', 16); kleur(WIT); doc.text(k === 0 ? '−' : '=', x + tw + 4, 137.5, { align: 'center' }) }
  })
  if (v.soort === 'onderhoud') {
    font('Source', 'black', 13); kleur(WIT); doc.text('Je gewicht blijft ongeveer gelijk', M, 156)
  } else {
    font('Anton', 'normal', 24); doc.setTextColor(134, 239, 172); doc.text(`≈ ${kgTekst(v.kgPerWeek)} KG`, M, 157)
    const gw = doc.getTextWidth(`≈ ${kgTekst(v.kgPerWeek)} KG`)
    font('Source', 'bold', 11); kleur(WIT); doc.text(v.soort === 'tekort' ? 'vet eraf per week' : 'erbij per week', M + gw + 3, 156.5)
  }
  font('Source', 'normal', 9); kleur(ZACHT)
  const vz = v.soort === 'tekort' ? `Dat is ${duizend(Math.abs(v.perWeek))} kcal per week, ongeveer ${kgTekst(v.kgIn8)} kg in 8 weken. Schatting: 7.700 kcal is ongeveer 1 kg vet; de eerste week zie je vaak meer door vocht.`
    : v.soort === 'overschot' ? `Dat is ${duizend(v.perWeek)} kcal per week. Train je zwaar, dan gaat het grootste deel naar spier. Schatting: 7.700 kcal is ongeveer 1 kg.`
      : 'Je eet rond wat je verbrandt: vet eraf en spier erbij gaat tegelijk. Kijk vooral naar de spiegel en je kracht.'
  const vzr = doc.splitTextToSize(vz, B - 2 * M)
  doc.text(vzr, M, 163, { lineHeightFactor: 1.4 })

  // Hoe berekend
  const yb = 163 + vzr.length * 4.4 + 8
  font('Anton', 'normal', 15); kleur(WIT); doc.text('ZO IS HET BEREKEND', M, yb)
  const regels = [
    ['Wat je verbrandt', `${cijfers.tdee} kcal per dag, met je activiteit meegerekend.`],
    ['Je doel', doel === 'vetverlies' ? `${cijfers.tdee - cijfers.kcal} kcal minder dan je verbrandt, zodat er vet af gaat.` : doel === 'spiermassa' ? `${cijfers.kcal - cijfers.tdee} kcal extra, genoeg om spier op te bouwen zonder onnodig vet.` : 'Rond je onderhoud: vet eraf en spier erbij gaat het best zonder groot tekort.'],
    ['Eiwit', 'Rond 2 gram per kilo lichaamsgewicht. Dat houdt je spieren vast en maakt verzadigd.'],
    ['Vet en koolhydraten', cijfers.veelVet ? 'Vet rond 0,6 gram per kilo: je hebt nog genoeg vet in reserve. De rest koolhydraten voor energie en je trainingen.' : 'Vet rond 1 gram per kilo, de rest koolhydraten voor energie en je trainingen.'],
  ]
  let y = yb + 9
  regels.forEach(([kopje, r]) => {
    font('Source', 'bold', 9.8); kleur(WIT); doc.text(kopje, M, y)
    font('Source', 'normal', 9.8); kleur(ZACHT)
    const t = doc.splitTextToSize(r, B - 2 * M - 45); doc.text(t, M + 45, y, { lineHeightFactor: 1.4 })
    y += Math.max(7, t.length * 4.8 + 2.5)
    doc.setDrawColor(...LIJN); doc.line(M, y - 3.5, B - M, y - 3.5)
  })
  // Verdeling over de dag
  y += 6
  font('Anton', 'normal', 15); kleur(WIT); doc.text('ZO VERDEEL JE JE DAG', M, y)
  y += 6
  const momenten = MOMENTEN[aantal] || MOMENTEN[4]
  const mw = (B - 2 * M - (momenten.length - 1) * 4) / momenten.length
  momenten.forEach(([m, deel], k) => {
    const x = M + k * (mw + 4)
    doc.setFillColor(...KAART); doc.setDrawColor(...LIJN); doc.roundedRect(x, y, mw, 18, 1.2, 1.2, 'FD')
    label(MOMENT_NAAM[m], x + 4, y + 6.5, { pt: 6, c: GRIJS })
    font('Source', 'black', 12); kleur(WIT); doc.text(`± ${Math.round(cijfers.kcal * deel)} kcal`, x + 4, y + 13.5)
  })
  y += 26
  const tip = 'Weeg jezelf de komende twee weken elke ochtend en neem het weekgemiddelde. Gaat het niet de goede kant op, dan schuif je 150 à 200 kcal en kijk je opnieuw.'
  const bh = blokHoogte(tip, B - 2 * M)
  blok('Tip', tip, M, y, B - 2 * M, bh)
  voet(voetLinks, tweeCijfers(pagina))

  // 3. Je week ────────────────────────────────────────────────────────────
  nieuwePagina('Je week')
  font('Anton', 'normal', 30); kleur(WIT); doc.text('DIT EET JE DEZE WEEK', M, 30)
  y = 44
  const kolomX = [M + 30]
  const kolomW = (B - M - kolomX[0]) / momenten.length
  momenten.forEach(([m], k) => label(MOMENT_NAAM[m], kolomX[0] + k * kolomW, y, { pt: 6, c: GRIJS }))
  y += 4
  doc.setDrawColor(...LIJN); doc.line(M, y, B - M, y)
  week.forEach(d => {
    const rijH = 30
    font('Anton', 'normal', 14); kleur(WIT); doc.text(d.dag.slice(0, 2).toUpperCase(), M, y + 9)
    font('Source', 'normal', 7.5); kleur(GRIJS); doc.text(`${dagTotaal(d).kcal} kcal`, M, y + 14)
    d.maaltijden.forEach((g, k) => {
      const x = kolomX[0] + k * kolomW
      if (g.leeg) return
      font('Source', 'bold', 8.3); kleur(WIT)
      doc.text(doc.splitTextToSize(g.naam, kolomW - 4).slice(0, 3), x, y + 7, { lineHeightFactor: 1.25 })
      font('Source', 'normal', 7); kleur(GRIJS); doc.text(`${g.kcal} kcal · ${g.eiwit} g eiwit`, x, y + rijH - 6)
    })
    y += rijH
    doc.setDrawColor(...LIJN); doc.line(M, y, B - M, y)
  })
  voet(voetLinks, tweeCijfers(pagina))

  // 4. Per dag ────────────────────────────────────────────────────────────
  week.forEach(d => {
    nieuwePagina(d.dag)
    font('Anton', 'normal', 34); kleur(WIT); doc.text(d.dag.toUpperCase(), M, 32)
    const t = dagTotaal(d)
    const stats = [['Calorieën', `${t.kcal} kcal`], ['Eiwit', `${t.eiwit} g`], ['Koolhydraten', `${t.kh} g`], ['Vet', `${t.vet} g`]]
    const sw = (B - 2 * M) / 4
    doc.setDrawColor(...LIJN); doc.setLineWidth(0.2); doc.line(M, 38, B - M, 38)
    stats.forEach(([l, w], k) => {
      const x = M + k * sw + (k ? 4 : 0)
      if (k) doc.line(x - 4, 41, x - 4, 50)
      label(l, x, 44, { pt: 6, c: WIT, stijl: 'black' })
      font('Source', 'bold', 11); kleur(WIT); doc.text(w, x, 49.5)
    })
    doc.line(M, 54, B - M, 54)
    const vakH = (H - 62 - 16) / d.maaltijden.length
    d.maaltijden.forEach((g, k) => {
      const y0 = 60 + k * vakH
      const fw = Math.min(38, vakH - 8)
      if (g.leeg) {
        font('Source', 'normal', 9); kleur(GRIJS); doc.text(`${MOMENT_NAAM[g.moment]}: met jouw keuzes was hier geen gerecht voor.`, M, y0 + 8)
        return
      }
      fotoVak(g, M, y0, fw)
      const x = M + fw + 6
      const breed = B - M - x
      label(`${MOMENT_NAAM[g.moment]}${g.minuten ? `   ·   ${g.minuten} min` : ''}`, x, y0 + 4, { pt: 6, c: GRIJS })
      font('Source', 'black', 12); kleur(WIT)
      const titel = doc.splitTextToSize(g.naam, breed).slice(0, 2)
      doc.text(titel, x, y0 + 10.5, { lineHeightFactor: 1.15 })
      let yy = y0 + 10.5 + titel.length * 5.2
      font('Source', 'bold', 8.5); kleur(ZACHT)
      doc.text(`${g.kcal} kcal   ·   ${g.eiwit} g eiwit   ·   ${g.kh} g kh   ·   ${g.vet} g vet`, x, yy)
      yy += 5.5
      // Ingrediënten in twee kolommen.
      font('Source', 'normal', 8.3); kleur(ZACHT)
      const half = Math.ceil(g.ingredienten.length / 2)
      g.ingredienten.forEach((i, n) => {
        const kx = x + (n < half ? 0 : breed / 2)
        const ky = yy + (n % half) * 4.3
        font('Source', 'bold', 8.3); kleur(WIT)
        const h = hoeveel(i)
        doc.text(h, kx, ky)
        const hw = doc.getTextWidth(`${h} `)
        font('Source', 'normal', 8.3); kleur(ZACHT)
        doc.text(doc.splitTextToSize(i.naam, breed / 2 - hw - 2)[0], kx + hw, ky)
      })
      if (k < d.maaltijden.length - 1) { doc.setDrawColor(...LIJN); doc.line(M, y0 + vakH - 3, B - M, y0 + vakH - 3) }
    })
    voet(voetLinks, tweeCijfers(pagina))
  })

  // 5. Recepten ───────────────────────────────────────────────────────────
  nieuwePagina('Recepten')
  font('Anton', 'normal', 30); kleur(WIT); doc.text('RECEPTEN', M, 30)
  font('Source', 'normal', 10); kleur(ZACHT); doc.text('De hoeveelheden staan per dag bij het gerecht. Hier lees je hoe je het maakt.', M, 39)
  y = 50
  uniek.forEach(g => {
    font('Source', 'normal', 9)
    const stappen = (g.stappen || []).map((s, n) => doc.splitTextToSize(`${n + 1}. ${s}`, B - 2 * M - 30))
    const hoog = 12 + stappen.reduce((t, s) => t + s.length * 4.4 + 1.2, 0) + 4
    if (y + Math.max(hoog, 28) > H - 18) { voet(voetLinks, tweeCijfers(pagina)); nieuwePagina('Recepten'); y = 24 }
    fotoVak(g, M, y, 24)
    const x = M + 30
    font('Source', 'black', 11); kleur(WIT); doc.text(doc.splitTextToSize(g.naam, B - M - x)[0], x, y + 5)
    label(`${MOMENT_NAAM[g.moment]}${g.minuten ? `   ·   ${g.minuten} min` : ''}`, x, y + 10, { pt: 5.8, c: GRIJS })
    let yy = y + 16
    font('Source', 'normal', 9); kleur(ZACHT)
    if (!stappen.length) { doc.text('Alles op een bord of in een bakje en klaar.', x, yy); yy += 5 }
    stappen.forEach(s => { doc.text(s, x, yy, { lineHeightFactor: 1.35 }); yy += s.length * 4.4 + 1.2 })
    y = Math.max(yy, y + 28) + 4
    doc.setDrawColor(...LIJN); doc.line(M, y - 3, B - M, y - 3)
  })
  voet(voetLinks, tweeCijfers(pagina))

  // 6. Boodschappenlijst ─────────────────────────────────────────────────
  nieuwePagina('Boodschappen')
  font('Anton', 'normal', 30); kleur(WIT); doc.text('BOODSCHAPPENLIJST', M, 30)
  font('Source', 'normal', 10); kleur(ZACHT); doc.text('Alles voor de hele week bij elkaar opgeteld. Vink af wat je hebt.', M, 39)
  const lijst = boodschappen(week)
  const kolW = (B - 2 * M - 8) / 2
  let kol = 0
  y = 50
  const regelH = 5.6
  lijst.forEach(groep => {
    const nodig = 9 + groep.items.length * regelH
    if (y + nodig > H - 18) {
      if (kol === 0) { kol = 1; y = 50 } else { voet(voetLinks, tweeCijfers(pagina)); nieuwePagina('Boodschappen'); kol = 0; y = 24 }
    }
    const x = M + kol * (kolW + 8)
    label(groep.afdeling, x, y, { pt: 6.3, c: WIT, stijl: 'black' })
    y += 5
    groep.items.forEach(it => {
      doc.setDrawColor(90, 90, 90); doc.setLineWidth(0.3); doc.roundedRect(x, y - 2.8, 3.2, 3.2, 0.6, 0.6, 'S')
      font('Source', 'normal', 9); kleur(ZACHT)
      doc.text(doc.splitTextToSize(it.naam, kolW - 30)[0], x + 5.5, y)
      font('Source', 'bold', 9); kleur(WIT)
      const stuks = Math.round((it.stuks || 0) * 2) / 2
      const h = stuks >= 0.5 && it.eenheid ? hoeveel({ stuks, eenheid: it.eenheid }) : kgOfGram(it.gram)
      doc.text(h, x + kolW, y, { align: 'right' })
      y += regelH
    })
    y += 4
  })
  if (/havermout/i.test(JSON.stringify(lijst))) {
    font('Source', 'normal', 7.5); kleur(GRIJS)
    doc.text('Glutenvrij? Kies dan glutenvrije havermout.', M, H - 16)
  }
  voet(voetLinks, tweeCijfers(pagina))

  // 7. Afsluiter ─────────────────────────────────────────────────────────
  doc.addPage(); pagina += 1; achtergrond()
  tekenLogo(B / 2 - 10, 40, 20 / LOGO_VERHOUDING)
  font('Anton', 'normal', 30); kleur(WIT)
  doc.text('DIT MENU, MAAR DAN OP MAAT?', B / 2, 82, { align: 'center' })
  font('Source', 'normal', 10.5); kleur(ZACHT)
  doc.text(doc.splitTextToSize('Een menu op papier is een begin. Het verschil zit in bijsturen: wat werkt voor jou, wat past in jouw week en waar loop je op vast.', 150), B / 2, 92, { align: 'center', lineHeightFactor: 1.45 })
  const punten = ['Persoonlijk voedingsplan in mijn app', 'Gerechten wisselen wanneer je wilt', 'Elke week bijsturen op je resultaat', '1-op-1 begeleiding']
  font('Source', 'black', 13)
  const pw = Math.max(...punten.map(p => doc.getTextWidth(p))) + 8
  punten.forEach((p, k) => {
    const yy = 118 + k * 9
    doc.setFillColor(...WIT); doc.circle(B / 2 - pw / 2 + 2.4, yy - 1.5, 2.4, 'F')
    doc.setDrawColor(14, 14, 14); doc.setLineWidth(0.55)
    doc.lines([[0.84, 0.91], [1.56, -1.92]], B / 2 - pw / 2 + 1.25, yy - 1.45)
    font('Source', 'black', 13); kleur(WIT); doc.text(p, B / 2 - pw / 2 + 8, yy)
  })
  font('Source', 'black', 17); kleur(WIT)
  doc.text('DM mij "APP" voor meer informatie', B / 2, 170, { align: 'center' })
  label('MY ARC Kersten', M, H - 6.5, { stijl: 'normal', c: DOF, ruimte: 0.8 })
  font('Source', 'normal', 7); kleur(DOF); doc.text('@myarcfitness', B - M, H - 6.5, { align: 'right' })

  return doc
}

export async function downloadMenuPdf(opties) {
  const doc = await maakMenuPdf(opties)
  doc.save('mijn-weekmenu.pdf')
}
