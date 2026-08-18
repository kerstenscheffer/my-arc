// src/modules/lead-management/utils/exportStatsPDF.js
// Bouwt een PDF die de stats-modal 1-op-1 spiegelt: dezelfde SIMPELE inline-
// stijl (icoon + wit getal + klein grijs label), GEEN omkaderde cards of
// gekleurde tabellen. De waarden komen letterlijk uit de modal (countItems /
// pctItems), zodat PDF en scherm identiek zijn.
//
// Secties (net als de modal, Campagnes open, ZONDER grafiek/calls/bron/verplaats):
//   1. Header (titel + periode + gegenereerd-stempel)
//   2. Aantallen   (inline flow — countItems uit de modal)
//   3. Percentages (inline flow — pctItems uit de modal, met breuk eronder)
//   4. Man / Vrouw (legenda, als gender aanwezig)
//   5. Campagnes   (per campagne: Aantallen + Percentages inline, ná campagne-bericht)
//
// Keep this dumb: no Supabase, no React. Caller passes everything computed.

import jsPDF from 'jspdf'

const GOLD  = [255, 215, 0]
const WHITE = [255, 255, 255]
const GRAY  = [150, 150, 150]     // labels
const DIM   = [110, 110, 110]     // breuken / subtekst
const LINE  = [44, 44, 44]
const BLACK = [0, 0, 0]
const MUTED = [120, 120, 120]

// Lucide icon-nodes (viewBox 0 0 24 24), zodat de PDF dezelfde iconen toont als
// de stats-balk op het scherm.
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
  calendar: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { width: 18, height: 18, x: 3, y: 4, rx: 2 }],
    ['path', { d: 'M3 10h18' }],
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
  xCircle: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['path', { d: 'm15 9-6 6' }],
    ['path', { d: 'm9 9 6 6' }],
  ],
  ban: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['path', { d: 'm4.9 4.9 14.2 14.2' }],
  ],
}

// Modal-labels → icon-key (de modal stuurt alleen label/value/color mee).
const LABEL_ICON = {
  'Nieuwe leads': 'userPlus', 'Follow-ups': 'send', 'Reacties': 'messageCircle',
  'Voorgesteld': 'phone', 'Ingepland': 'calendarCheck', 'Calls geboekt': 'calendar',
  'Call gevoerd': 'phone', 'Sales': 'trophy', 'Omzet': 'euro', 'No-shows': 'userX',
  'Afgewezen': 'phoneOff', 'Sale verloren': 'xCircle', 'Niet geschikt': 'ban',
  'Response': 'messageCircle', 'Opvolg': 'send', 'Voorstel→call': 'phone',
  'Show-up': 'calendarCheck', 'No-show': 'userX', 'Close rate': 'trophy',
}

function iconToSvg(nodes, color, strokeWidth = 2.2, size = 128) {
  const inner = nodes.map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')} />`
  ).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

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
    periodLabel, generatedAt, coachName,
    countItems = [], pctItems = [], gender = null, campaignBreakdown = null,
  } = payload

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  let y = margin

  // Zwarte achtergrond (zoals de modal). Elke pagina wordt gevuld.
  const paintBg = () => { doc.setFillColor(...BLACK); doc.rect(0, 0, pageW, pageH, 'F') }
  paintBg()
  const newPage = () => { doc.addPage(); paintBg(); y = margin }
  const ensure = (h) => { if (y + h > pageH - 34) newPage() }

  // ─── Iconen vooraf renderen (uniek per icon-key + kleur) ───
  const withKeys = (items) => items.map(it => ({ ...it, iconKey: it.iconKey || LABEL_ICON[it.label] || null }))
  const cItems = withKeys(countItems)
  const pItems = withKeys(pctItems)

  // Campagne-items (spiegelt CampaignStatCard).
  const campCards = (campaignBreakdown?.campaigns || []).map(c => {
    const s = c.stages || {}
    const pc = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')
    return {
      name: c.name || '—',
      counts: [
        { label: 'Getagd',      value: String(c.total || 0),         color: '#a855f7', iconKey: 'userPlus' },
        { label: 'Reacties',    value: String(s.replied || 0),       color: '#10b981', iconKey: 'messageCircle' },
        { label: 'Voorgesteld', value: String(s.callProposed || 0),  color: '#a855f7', iconKey: 'phone' },
        { label: 'Ingepland',   value: String(s.callScheduled || 0), color: '#06b6d4', iconKey: 'calendarCheck' },
        { label: 'Sale',        value: String(s.sale || 0),          color: '#FFD700', iconKey: 'trophy' },
        { label: 'Opvolg',      value: String(c.followupCount || 0), color: '#f59e0b', iconKey: 'send' },
      ],
      pcts: [
        { label: 'Reactie',       value: pc(s.replied || 0, c.total || 0),          color: '#10b981', iconKey: 'messageCircle', sub: `${s.replied || 0} van ${c.total || 0}` },
        { label: 'Voorstel',      value: pc(s.callProposed || 0, c.total || 0),     color: '#a855f7', iconKey: 'phone',        sub: `${s.callProposed || 0} van ${c.total || 0}` },
        { label: 'Voorstel→call', value: pc(s.callScheduled || 0, s.callProposed || 0), color: '#06b6d4', iconKey: 'calendarCheck', sub: `${s.callScheduled || 0} van ${s.callProposed || 0}` },
        { label: 'Close',         value: pc(s.sale || 0, s.callScheduled || 0),     color: '#22c55e', iconKey: 'trophy',       sub: `${s.sale || 0} van ${s.callScheduled || 0}` },
      ],
    }
  })

  const iconMap = new Map()
  const allItems = [...cItems, ...pItems, ...campCards.flatMap(c => [...c.counts, ...c.pcts])]
  const uniqueIcons = new Map()
  for (const it of allItems) {
    if (!it.iconKey || !ICON_NODES[it.iconKey]) continue
    const k = `${it.iconKey}|${it.color}`
    if (!uniqueIcons.has(k)) uniqueIcons.set(k, { iconKey: it.iconKey, color: it.color })
  }
  await Promise.all([...uniqueIcons.entries()].map(async ([k, v]) => {
    const png = await svgToPngDataUrl(iconToSvg(ICON_NODES[v.iconKey], v.color))
    iconMap.set(k, png)
  }))

  // ─── Inline stat-flow (icoon + wit getal + klein grijs label [+ breuk]) ───
  const ICON = 11, GAP = 15
  const drawStatFlow = (items) => {
    const hasSub = items.some(i => i.sub)
    const rowH = hasSub ? 36 : 28
    ensure(rowH)
    let x = margin
    for (const it of items) {
      // Breedte meten
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
      const numW = doc.getTextWidth(String(it.value))
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5)
      const labW = doc.getTextWidth((it.label || '').toUpperCase())
      let subW = 0
      if (it.sub) { doc.setFontSize(5.5); subW = doc.getTextWidth(it.sub) }
      const itemW = Math.max(ICON + 4 + numW, labW, subW)
      // Wrap
      if (x + itemW > pageW - margin) { x = margin; y += rowH; ensure(rowH) }
      // Icoon
      const png = it.iconKey ? iconMap.get(`${it.iconKey}|${it.color}`) : null
      if (png) { try { doc.addImage(png, 'PNG', x, y - 1, ICON, ICON) } catch { /* skip */ } }
      // Getal (wit)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...WHITE)
      doc.text(String(it.value), x + ICON + 4, y + 9)
      // Label (grijs)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...GRAY)
      doc.text((it.label || '').toUpperCase(), x, y + 20)
      // Breuk (dim)
      if (it.sub) { doc.setFontSize(5.5); doc.setTextColor(...DIM); doc.text(it.sub, x, y + 28) }
      x += itemW + GAP
    }
    y += rowH + 6
  }

  const sectionLabel = (text) => {
    ensure(24)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...GRAY)
    doc.text(text.toUpperCase(), margin, y)
    y += 14
  }

  // ─── HEADER ───
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...WHITE)
  doc.text(`Lead stat — ${periodLabel || '—'}`, margin, 46)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY)
  doc.text(`${coachName ? coachName + ' · ' : ''}Gegenereerd ${generatedAt || ''}`, pageW - margin, 46, { align: 'right' })
  doc.setDrawColor(...LINE); doc.setLineWidth(0.5); doc.line(margin, 58, pageW - margin, 58)
  y = 82

  // ─── AANTALLEN ───
  if (cItems.length) { sectionLabel('Aantallen'); drawStatFlow(cItems) }

  // ─── PERCENTAGES ───
  if (pItems.length) { y += 4; sectionLabel('Percentages'); drawStatFlow(pItems) }

  // ─── MAN / VROUW ───
  if (gender && (gender.male || gender.female)) {
    y += 4
    sectionLabel('Man / Vrouw (alle leads)')
    ensure(30)
    const dot = (cx, cy, rgb) => { doc.setFillColor(...rgb); doc.circle(cx, cy, 3, 'F') }
    // Man
    dot(margin + 3, y + 2, [59, 130, 246])
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
    doc.text('Man', margin + 12, y + 5)
    doc.setTextColor(59, 130, 246); doc.text(`${gender.malePct ?? 0}%`, margin + 38, y + 5)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY)
    doc.text(`(${gender.male ?? 0})`, margin + 66, y + 5)
    // Vrouw
    dot(margin + 3, y + 18, [236, 72, 153])
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
    doc.text('Vrouw', margin + 12, y + 21)
    doc.setTextColor(236, 72, 153); doc.text(`${gender.femalePct ?? 0}%`, margin + 46, y + 21)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRAY)
    doc.text(`(${gender.female ?? 0})`, margin + 74, y + 21)
    y += 30
    if (gender.unknown) {
      doc.setFontSize(7); doc.setTextColor(...DIM)
      doc.text(`${gender.unknown} nog niet ingevuld`, margin, y)
      y += 12
    }
  }

  // ─── CAMPAGNES (per campagne: Aantallen + Percentages, ná campagne-bericht) ───
  if (campCards.length) {
    y += 8
    sectionLabel(`Campagnes${campaignBreakdown?.totalLeads ? ` · ${campaignBreakdown.totalLeads} getagd (alle tijd)` : ''}`)
    for (const c of campCards) {
      ensure(90)
      // Naam
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHITE)
      doc.text(c.name, margin, y); y += 14
      // Aantallen
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...DIM)
      doc.text('AANTALLEN', margin, y); y += 9
      drawStatFlow(c.counts)
      // Percentages
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...DIM)
      doc.text('PERCENTAGES', margin, y); y += 9
      drawStatFlow(c.pcts)
      y += 6
      // Dunne scheidingslijn tussen campagnes
      doc.setDrawColor(...LINE); doc.setLineWidth(0.4); doc.line(margin, y, pageW - margin, y)
      y += 12
    }
  }

  // ─── FOOTER op elke pagina ───
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED)
    doc.text(`MY ARC · ${periodLabel || ''}`, margin, pageH - 18)
    doc.text(`${i} / ${total}`, pageW - margin, pageH - 18, { align: 'right' })
  }

  const safeLabel = (periodLabel || 'periode').replace(/[^a-z0-9\-]/gi, '_').slice(0, 40)
  const filename = `leadstats-${safeLabel}.pdf`
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  return { blob, url, filename }
}
