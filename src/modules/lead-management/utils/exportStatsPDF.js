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

export function exportStatsPDF(payload) {
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

  // ─── HEADLINE — prominent big-number summary right under the header.
  // Coach should see "wat is er deze periode gebeurd" in 1 oogopslag,
  // zonder eerst door tabellen heen te scannen.
  const headlineCards = [
    { label: 'Nieuwe leads',       value: activity?.newOutreach || 0,        color: GOLD },
    { label: 'Gereageerd',         value: reactionStats?.reactedLeads || 0,  color: BLUE },
    { label: 'Call voorgesteld',   value: funnel?.callProposed?.count || 0,  color: RED },
    { label: 'Calls ingepland',    value: funnel?.callScheduled?.count || 0, color: GOLD },
    { label: 'Sales',              value: funnel?.sale?.count || 0,          color: GREEN },
  ]
  const cardW = (pageW - margin * 2 - (headlineCards.length - 1) * 6) / headlineCards.length
  headlineCards.forEach((c, i) => {
    const x = margin + i * (cardW + 6)
    // Card background
    doc.setFillColor(20, 20, 20)
    doc.roundedRect(x, y, cardW, 64, 6, 6, 'F')
    // Color accent stripe on top
    doc.setFillColor(...c.color)
    doc.roundedRect(x, y, cardW, 3, 1.5, 1.5, 'F')
    // Big number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(...c.color)
    doc.text(String(c.value), x + cardW / 2, y + 36, { align: 'center' })
    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text(c.label.toUpperCase(), x + cardW / 2, y + 52, { align: 'center' })
  })
  y += 64 + 18

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
