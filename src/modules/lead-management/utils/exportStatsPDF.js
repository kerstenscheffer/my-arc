// src/modules/lead-management/utils/exportStatsPDF.js
// Builds a styled multi-section PDF from the WeekStatsModal data.
// Uses jsPDF + jspdf-autotable (same toolchain as PDFExportService).
//
// Sections:
//   1. Header (title, period label, generated-on stamp)
//   2. Activity (nieuwe leads, follow-ups, verplaatsingen)
//   3. Reactie (gereageerd, niet gereageerd, opvolg)
//   4. Conversie ratio's (response, opvolg-share, call, sale, close)
//   5. Funnel (per stage)
//   6. Source-breakdown (per campaign + per magnet) — includes message preview
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
    activity, reactionStats, ratios, funnel, sourceBreakdown,
  } = payload

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = margin

  // ─── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, 80, 'F')
  doc.setTextColor(...GOLD)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Lead-management stats', margin, 38)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(periodLabel || '—', margin, 58)
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text(periodSubtitle || '', margin, 72)
  doc.setFontSize(8)
  const right = (coachName ? `${coachName} · ` : '') + `Gegenereerd ${generatedAt}`
  doc.text(right, pageW - margin, 72, { align: 'right' })
  y = 100

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
    { label: 'Omzet',            value: '€' + omzet.toLocaleString('nl-NL'), hex: '#22c55e', rgb: [34, 197, 94], node: ICON_NODES.euro },
    { label: 'No-shows',         value: funnel?.noShow?.count || 0,          hex: '#ef4444', rgb: [239, 68, 68],   node: ICON_NODES.userX },
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
    // Kaart-achtergrond
    doc.setFillColor(20, 20, 20)
    doc.roundedRect(x, cy, cardW, cardH, 6, 6, 'F')
    // Kleuraccent bovenaan
    doc.setFillColor(...c.rgb)
    doc.roundedRect(x, cy, cardW, 3, 1.5, 1.5, 'F')
    // Icoon (gecentreerd bovenin)
    const png = iconPngs[i]
    if (png) {
      const iconSize = 17
      try { doc.addImage(png, 'PNG', x + cardW / 2 - iconSize / 2, cy + 11, iconSize, iconSize) } catch { /* skip icoon */ }
    }
    // Groot getal
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(17)
    doc.setTextColor(...c.rgb)
    doc.text(String(c.value), x + cardW / 2, cy + 46, { align: 'center' })
    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(180, 180, 180)
    doc.text(c.label.toUpperCase(), x + cardW / 2, cy + 61, { align: 'center' })
  })
  y += 2 * cardH + ROW_GAP + 18

  // Small helper: section title.
  const section = (label) => {
    if (y > 720) { doc.addPage(); y = margin }
    doc.setTextColor(...GOLD)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(label.toUpperCase(), margin, y)
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.6)
    doc.line(margin, y + 4, pageW - margin, y + 4)
    y += 16
  }

  // ─── ACTIVITY ──────────────────────────────────────────────────────────────
  section('Activiteit')
  autoTable(doc, {
    startY: y,
    head: [['Statistiek', 'Waarde']],
    body: [
      ['Nieuwe leads',    String(activity?.newOutreach || 0)],
      ['Follow-ups',      String(activity?.followUps || 0)],
      ['Verplaatsingen',  String(activity?.totalMovements || 0)],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: GOLD, textColor: DARK, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  })
  y = doc.lastAutoTable.finalY + 14

  // ─── REACTIE ───────────────────────────────────────────────────────────────
  if (reactionStats) {
    section('Reactie')
    autoTable(doc, {
      startY: y,
      head: [['Statistiek', 'Waarde']],
      body: [
        ['Gereageerd (reply_count > 0)',  String(reactionStats.reactedLeads || 0)],
        ['Niet gereageerd',               String(reactionStats.notReactedYet || 0)],
        ['Leads die follow-up kregen',    String(reactionStats.followedLeads || 0)],
        ['Opvolg verstuurd in periode',   String(reactionStats.followupsInWindow || 0)],
        ['Totaal nieuwe leads in periode', String(reactionStats.newLeads || 0)],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 14
  }

  // ─── RATIOS ────────────────────────────────────────────────────────────────
  if (ratios) {
    section("Kerncijfers")
    autoTable(doc, {
      startY: y,
      head: [['Stat', 'Waarde', 'Detail']],
      body: [
        ['Response rate',  fmtPct(ratios.responseRate), ratios.responseFraction || ''],
        ['Opvolg rate',    fmtPct(ratios.chaseShare),   ratios.chaseFraction || ''],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 14
  }

  // ─── FUNNEL ────────────────────────────────────────────────────────────────
  if (funnel) {
    section('Funnel')
    autoTable(doc, {
      startY: y,
      head: [['Fase', 'Movements']],
      body: [
        ['Calls voorgesteld', String(funnel.callProposed?.count  || 0)],
        ['Calls ingepland',   String(funnel.callScheduled?.count || 0)],
        ['Sales gemaakt',     String(funnel.sale?.count          || 0)],
        ['No shows',          String(funnel.noShow?.count        || 0)],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 14
  }

  // ─── SOURCE BREAKDOWN ──────────────────────────────────────────────────────
  if (sourceBreakdown) {
    const allSources = [
      ...(sourceBreakdown.campaigns || []).map(c => ({ ...c, type: 'Campagne' })),
      ...(sourceBreakdown.magnets || []).map(m => ({ ...m, type: 'Lead magnet' })),
    ]
    if (allSources.length > 0) {
      section('Bron-breakdown')
      const rows = allSources.map(s => {
        // Match the on-screen labels: "Call ingepl." uses scheduled only.
        const scheduledCalls = s.stages?.callScheduled || 0
        const responseRate = s.total > 0 ? Math.round(((s.repliedLeads || 0) / s.total) * 100) : null
        const callRate     = s.total > 0 ? Math.round((scheduledCalls / s.total) * 100) : null
        const saleRate     = s.total > 0 ? Math.round(((s.stages?.sale || 0) / s.total) * 100) : null
        return [
          s.type,
          s.name || '—',
          String(s.total || 0),
          String(s.repliedLeads || 0),
          String(scheduledCalls),
          String(s.stages?.sale || 0),
          fmtPct(responseRate),
          fmtPct(callRate),
          fmtPct(saleRate),
        ]
      })
      autoTable(doc, {
        startY: y,
        head: [['Type', 'Naam', 'Leads', 'Reactie', 'Ingepl.', 'Sales', 'Resp%', 'Call ingepl.%', 'Sale%']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: GOLD, textColor: DARK, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 110 },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'right', fontStyle: 'bold' },
          8: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin },
      })
      y = doc.lastAutoTable.finalY + 14

      // Add per-campaign message-text appendix on a fresh page if any.
      const campaignsWithMsg = (sourceBreakdown.campaigns || []).filter(c => c.messageText)
      if (campaignsWithMsg.length > 0) {
        doc.addPage(); y = margin
        section('Outreach-berichten')
        for (const c of campaignsWithMsg) {
          if (y > 720) { doc.addPage(); y = margin }
          doc.setFontSize(10)
          doc.setTextColor(...GOLD)
          doc.setFont('helvetica', 'bold')
          doc.text(c.name, margin, y)
          y += 12
          if (c.platform || c.purpose) {
            doc.setFontSize(8)
            doc.setTextColor(...MUTED)
            doc.text(`${c.platform || ''}${c.platform && c.purpose ? ' · ' : ''}${c.purpose || ''}`, margin, y)
            y += 10
          }
          doc.setFontSize(9)
          doc.setTextColor(60, 60, 60)
          doc.setFont('helvetica', 'normal')
          const lines = doc.splitTextToSize(c.messageText, pageW - 2 * margin)
          doc.text(lines, margin, y)
          y += lines.length * 11 + 14
        }
      }
    }
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
  doc.save(`leadstats-${safeLabel}.pdf`)
}
