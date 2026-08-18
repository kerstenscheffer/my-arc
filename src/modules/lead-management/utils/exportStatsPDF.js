// src/modules/lead-management/utils/exportStatsPDF.js
// Builds a styled multi-section PDF from the WeekStatsModal data.
// Uses jsPDF + jspdf-autotable (same toolchain as PDFExportService).
//
// Sections (spiegelt de stats-modal: Stats + Campagnes, GEEN grafiek/calls/
// bron/verplaatsingen):
//   1. Header (title, period label, generated-on stamp)
//   2. Overzicht — totalen (Aantallen, dezelfde headline-cards als de modal)
//   3. Kerncijfers — percentages (response, call, sale, close…)
//   4. Campagnes — aantallen (per campagne, ná campagne-bericht)
//   5. Campagnes — percentages (per campagne)
//
// Keep this dumb: no Supabase calls, no React. Caller passes a `payload`
// object with everything already computed.

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const GOLD = [255, 215, 0]
const GREEN = [16, 185, 129]
const RED   = [239, 68, 68]
const BLUE  = [59, 130, 246]
const PURPLE= [139, 92, 246]
const DARK  = [10, 10, 10]
const LIGHT = [245, 245, 245]
const MUTED = [120, 120, 120]
// Zwarte-pagina-thema
const BLACK   = [0, 0, 0]
const WHITE   = [255, 255, 255]
const GRAY    = [176, 176, 176]   // secundaire tekst op zwart
const CARD    = [18, 18, 18]      // kaart-achtergrond
const ROW      = [14, 14, 14]     // tabelrij
const ROW_ALT  = [24, 24, 24]     // zebra-rij
const LINE      = [44, 44, 44]    // subtiele lijnen

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${v}%`)
const fmtDelta = (v) => {
  if (v === null || v === undefined) return '—'
  return `${v > 0 ? '+' : ''}${v}`
}

// Lucide icon-tekeningen (viewBox 0 0 24 24), exact overgenomen uit lucide-react,
// zodat de PDF-headline dezelfde iconen toont als de stats-balk in de kanban.
const ICON_NODES = {
  userPlus: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['circle', { cx: 9, cy: 7, r: 4 }],
    ['line', { x1: 19, x2: 19, y1: 8, y2: 14 }],
    ['line', { x1: 22, x2: 16, y1: 11, y2: 11 }],
  ],
  send: [
    ['path', { d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z' }],
    ['path', { d: 'm21.854 2.147-10.94 10.939' }],
  ],
  messageCircle: [
    ['path', { d: 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719' }],
  ],
  phone: [
    ['path', { d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384' }],
  ],
  calendarCheck: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { width: 18, height: 18, x: 3, y: 4, rx: 2 }],
    ['path', { d: 'M3 10h18' }],
    ['path', { d: 'm9 16 2 2 4-4' }],
  ],
  trophy: [
    ['path', { d: 'M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978' }],
    ['path', { d: 'M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978' }],
    ['path', { d: 'M18 9h1.5a1 1 0 0 0 0-5H18' }],
    ['path', { d: 'M4 22h16' }],
    ['path', { d: 'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z' }],
    ['path', { d: 'M6 9H4.5a1 1 0 0 1 0-5H6' }],
  ],
  euro: [
    ['path', { d: 'M4 10h12' }],
    ['path', { d: 'M4 14h9' }],
    ['path', { d: 'M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2' }],
  ],
  userX: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['circle', { cx: 9, cy: 7, r: 4 }],
    ['line', { x1: 17, x2: 22, y1: 8, y2: 13 }],
    ['line', { x1: 22, x2: 17, y1: 8, y2: 13 }],
  ],
  phoneOff: [
    ['path', { d: 'M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272' }],
    ['path', { d: 'M22 2 2 22' }],
    ['path', { d: 'M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473' }],
  ],
}

// Bouwt een standalone SVG-string uit een icon-node-array met de gewenste kleur.
function iconToSvg(nodes, color, strokeWidth = 2.2, size = 128) {
  const inner = nodes.map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

// Rendert een SVG-string naar een PNG-dataURL via een canvas. Faalt dit
// (bv. tainted canvas), dan resolven we naar null en tekent de kaart zonder icoon.
function svgToPngDataUrl(svg, sizePx = 128) {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = sizePx; canvas.height = sizePx
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, sizePx, sizePx)
          const data = canvas.toDataURL('image/png')
          URL.revokeObjectURL(url)
          resolve(data)
        } catch { URL.revokeObjectURL(url); resolve(null) }
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      img.src = url
    } catch { resolve(null) }
  })
}

export async function exportStatsPDF(payload) {
  const {
    periodLabel, periodSubtitle, coachName, generatedAt,
    activity, reactionStats, ratios, funnel, campaignBreakdown,
    revenueVisible = true, // owner/solo → true; teamlid → false (geen omzet)
  } = payload

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  // Zwarte pagina-achtergrond. Elke pagina wordt gevuld: pagina 1 hier, latere
  // pagina's via de willDrawPage-hook (autoTable) of newPage() (handmatig).
  const paintBg = () => { doc.setFillColor(...BLACK); doc.rect(0, 0, pageW, pageH, 'F') }
  paintBg()
  const painted = new Set([1]) // pagina 1 is al zwart; niet nogmaals overschilderen
  const bgHook = () => {
    const p = doc.internal.getCurrentPageInfo().pageNumber
    if (!painted.has(p)) { paintBg(); painted.add(p) }
  }
  const newPage = () => {
    doc.addPage(); paintBg()
    painted.add(doc.internal.getCurrentPageInfo().pageNumber)
    y = margin
  }
  // Gedeelde donkere tabelstijl: witte tekst op zwart, subtiele lijnen, zebra.
  // De willDrawPage-hook maakt door autoTable toegevoegde pagina's ook zwart.
  const darkTable = (extra = {}) => ({
    theme: 'grid',
    styles: { textColor: WHITE, fillColor: ROW, lineColor: LINE, lineWidth: 0.5, fontSize: 9, cellPadding: 6, valign: 'middle' },
    alternateRowStyles: { fillColor: ROW_ALT },
    margin: { left: margin, right: margin },
    willDrawPage: bgHook,
    ...extra,
  })

  // ─── HEADER ────────────────────────────────────────────────────────────────
  // Eén grote, bold witte titel met de periode erin — geen dubbele periode meer.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...WHITE)
  doc.text(`Lead stat (${periodLabel || '—'})`, margin, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  const right = (coachName ? `${coachName} · ` : '') + `Gegenereerd ${generatedAt}`
  doc.text(right, pageW - margin, 68, { align: 'right' })
  // Gouden scheidingslijn onder de header
  doc.setDrawColor(...GOLD); doc.setLineWidth(1)
  doc.line(margin, 80, pageW - margin, 80)
  y = 104

  // Sectiekop met gouden titel + optionele uitleg-regel eronder ("wat zie je
  // hier en waarom is het belangrijk"). Zo weet de coach per blok wat 'ie leest.
  const section = (label, description) => {
    if (y > 700) newPage()
    doc.setTextColor(...GOLD)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(label.toUpperCase(), margin, y)
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.6)
    doc.line(margin, y + 4, pageW - margin, y + 4)
    y += 14
    if (description) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...GRAY)
      const lines = doc.splitTextToSize(description, pageW - 2 * margin)
      doc.text(lines, margin, y + 2)
      y += lines.length * 10 + 6
    } else {
      y += 4
    }
  }

  section('Overzicht — totalen deze periode',
    'De belangrijkste aantallen in één oogopslag: van nieuwe leads bovenaan de funnel tot sales en omzet onderaan.')

  // ─── HEADLINE — exact dezelfde 8 stats als de kanban-stats-balk (icoon +
  // kleur + getal), in een 4×2 raster. Zo herkent de coach de PDF direct van
  // het scherm. Datavelden komen 1-op-1 uit dezelfde bronnen als de balk.
  const omzet = Math.round(funnel?.sale?.omzet || 0)
  const reacties = reactionStats?.reactionEventsInWindow
    ?? reactionStats?.reactionsInWindow
    ?? reactionStats?.reactedLeads ?? 0
  const headlineCards = [
    { label: 'Nieuwe leads',     value: activity?.newOutreach || 0,          hex: '#3b82f6', rgb: [59, 130, 246],  node: ICON_NODES.userPlus },
    { label: 'Follow-ups',       value: activity?.followUps || 0,            hex: '#f59e0b', rgb: [245, 158, 11],  node: ICON_NODES.send },
    { label: 'Reacties',         value: reacties,                            hex: '#10b981', rgb: [16, 185, 129],  node: ICON_NODES.messageCircle },
    { label: 'Call voorgesteld', value: funnel?.callProposed?.count || 0,    hex: '#a855f7', rgb: [168, 85, 247],  node: ICON_NODES.phone },
    { label: 'Call ingepland',   value: funnel?.callScheduled?.count || 0,   hex: '#06b6d4', rgb: [6, 182, 212],   node: ICON_NODES.calendarCheck },
    { label: 'Sales',            value: funnel?.sale?.count || 0,            hex: '#FFD700', rgb: [255, 215, 0],   node: ICON_NODES.trophy },
    ...(revenueVisible ? [{ label: 'Omzet', value: '€' + omzet.toLocaleString('nl-NL'), hex: '#22c55e', rgb: [34, 197, 94], node: ICON_NODES.euro }] : []),
    { label: 'No-shows',         value: funnel?.noShow?.count || 0,          hex: '#ef4444', rgb: [239, 68, 68],   node: ICON_NODES.userX },
    { label: 'Call afgewezen',   value: funnel?.callRejected?.count || 0,    hex: '#f97316', rgb: [249, 115, 22],  node: ICON_NODES.phoneOff },
  ]
  // Iconen vooraf parallel naar PNG renderen; mislukt er één, dan tekent die
  // kaart gewoon zonder icoon.
  const iconPngs = await Promise.all(
    headlineCards.map(c => svgToPngDataUrl(iconToSvg(c.node, c.hex)))
  )

  const COLS = 4
  const GAP = 8
  const ROW_GAP = 8
  const cardW = (pageW - margin * 2 - (COLS - 1) * GAP) / COLS
  const cardH = 72
  headlineCards.forEach((c, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = margin + col * (cardW + GAP)
    const cy = y + row * (cardH + ROW_GAP)
    // Kaart-achtergrond + subtiele rand voor contrast op zwart
    doc.setFillColor(...CARD)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, cy, cardW, cardH, 6, 6, 'FD')
    // Kleuraccent bovenaan
    doc.setFillColor(...c.rgb)
    doc.roundedRect(x, cy, cardW, 3, 1.5, 1.5, 'F')
    // Icoon (gecentreerd bovenin) — de kleur zit in het icoon
    const png = iconPngs[i]
    if (png) {
      const iconSize = 17
      try { doc.addImage(png, 'PNG', x + cardW / 2 - iconSize / 2, cy + 11, iconSize, iconSize) } catch { /* skip icoon */ }
    }
    // Groot getal — wit, zoals de stats-balk op het scherm
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.setTextColor(...WHITE)
    doc.text(String(c.value), x + cardW / 2, cy + 46, { align: 'center' })
    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(c.label.toUpperCase(), x + cardW / 2, cy + 61, { align: 'center' })
  })
  const CARD_ROWS = Math.ceil(headlineCards.length / COLS)
  y += CARD_ROWS * cardH + (CARD_ROWS - 1) * ROW_GAP + 18

  // ─── KERNCIJFERS (percentages) ─────────────────────────────────────────────
  // De totale AANTALLEN staan al in het overzicht bovenaan (nieuwe leads, sales,
  // omzet, no-shows...). Hier draait alles om de VERHOUDINGEN. De losse
  // Activiteit-/Reactie-/Funnel-tabellen zijn bewust weg: dat was dubbel met het
  // overzicht en "verplaatsingen" is niet actiegericht. Dit is de getrimde versie.
  if (ratios) {
    section('Kerncijfers — percentages',
      'De verhoudingen die er echt toe doen. Percentage met de onderliggende aantallen erachter, en waarom je erop stuurt.')
    const eurFmt = (v) => (v === null || v === undefined ? '—' : '€' + Number(v).toLocaleString('nl-NL'))
    autoTable(doc, darkTable({
      startY: y,
      head: [['Kerncijfer', 'Waarde', 'Detail', 'Waarom belangrijk']],
      body: [
        ['Response rate',          fmtPct(ratios.responseRate),        ratios.responseFraction || '—', 'Reageert je outreach? (reacties / nieuwe leads)'],
        ['Voorstel → ingepland',   fmtPct(ratios.proposedToScheduled), ratios.proposedFraction || '—', 'Boekt een voorgestelde call ook echt een afspraak'],
        ['Show-up rate',           fmtPct(ratios.showRate),            ratios.showFraction || '—',     'Ingeplande calls die ook echt komen opdagen'],
        ['No-show rate',           fmtPct(ratios.noShowRate),          ratios.noShowFraction || '—',   'Calls die niet komen opdagen — hoe lager, hoe beter'],
        ['Close rate',             fmtPct(ratios.closeRate),           ratios.closeFraction || '—',    'Gehouden calls die sluiten in een sale (sales / getoond)'],
        ...(revenueVisible ? [['Bedrag per sales call',  eurFmt(ratios.amountPerCall),       ratios.amountPerCallFraction || '—', 'Wat een ingeplande call gemiddeld oplevert (omzet / calls)']] : []),
        ['Opvolg rate',            fmtPct(ratios.chaseShare),          ratios.chaseFraction || '—',    'Aandeel leads dat een follow-up nodig had'],
      ],
      headStyles: { fillColor: GREEN, textColor: BLACK, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 108, textColor: WHITE },
        1: { halign: 'right', fontStyle: 'bold', cellWidth: 50, textColor: WHITE },
        2: { halign: 'right', cellWidth: 70, textColor: GRAY },
        3: { textColor: GRAY, fontSize: 8 },
      },
    }))
    y = doc.lastAutoTable.finalY + 16
  }

  // ─── CAMPAGNES (all-time, ná campagne-bericht) ─────────────────────────────
  // Zelfde blok als "Campagnes open" in de stats-modal: per campagne de
  // Aantallen + Percentages. Grafiek/calls/bron/verplaatsingen staan bewust
  // NIET in de PDF — alleen Stats (boven) + Campagnes.
  if (campaignBreakdown && (campaignBreakdown.campaigns || []).length > 0) {
    const camps = campaignBreakdown.campaigns
    section('Campagnes — aantallen',
      `Per campagne alle getagde leads en wat er ná het campagne-bericht gebeurde. ${campaignBreakdown.totalLeads || 0} leads getagd (alle tijd).`)
    autoTable(doc, darkTable({
      startY: y,
      head: [['Campagne', 'Getagd', 'Reacties', 'Voorgesteld', 'Ingepland', 'Sale', 'Opvolg']],
      body: camps.map(c => {
        const s = c.stages || {}
        return [
          c.name || '—',
          String(c.total || 0),
          String(s.replied || 0),
          String(s.callProposed || 0),
          String(s.callScheduled || 0),
          String(s.sale || 0),
          String(c.followupCount || 0),
        ]
      }),
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', textColor: GRAY },
      },
    }))
    y = doc.lastAutoTable.finalY + 16

    section('Campagnes — percentages',
      'De verhoudingen per campagne: reactie-%, voorstel-%, en de doorstroom naar call en sale.')
    const pc = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
    autoTable(doc, darkTable({
      startY: y,
      head: [['Campagne', 'Reactie', 'Voorstel', 'Voorstel→call', 'Close']],
      body: camps.map(c => {
        const s = c.stages || {}
        return [
          c.name || '—',
          pc(s.replied || 0, c.total || 0),
          pc(s.callProposed || 0, c.total || 0),
          pc(s.callScheduled || 0, s.callProposed || 0),
          pc(s.sale || 0, s.callScheduled || 0),
        ]
      }),
      headStyles: { fillColor: PURPLE, textColor: WHITE, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    }))
    y = doc.lastAutoTable.finalY + 14
  }

  // ─── FOOTER on every page ──────────────────────────────────────────────────
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(`MY ARC · ${periodLabel || ''}`, margin, doc.internal.pageSize.getHeight() - 18)
    doc.text(`${i} / ${total}`, pageW - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' })
  }

  // Filename: stats-2026-05-27.pdf (anchor date) or range.
  const safeLabel = (periodLabel || 'periode').replace(/[^a-z0-9\-]/gi, '_').slice(0, 40)
  const filename = `leadstats-${safeLabel}.pdf`

  // Niet meteen downloaden: geef een preview-blob + filename terug zodat de
  // aanroeper eerst een voorbeeld kan tonen, met een eigen download-knop.
  // (opts.download === true → toch direct opslaan, als fallback.)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  return { blob, url, filename }
}
