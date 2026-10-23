// src/pages/mijn-split/splitPdf.js
// De split als A4-PDF: zwarte kopbalk met het witte MA-logo, daarna de week en
// per trainingsdag een tabel. Getekend met jsPDF (geen schermfoto), zodat de
// tekst scherp blijft en een lange split netjes over pagina's doorloopt.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DAG_NAAM, WEEK } from './splitRegels'

const laadLogo = async () => {
  try {
    const blob = await (await fetch('/ma-logo-header.png')).blob()
    return await new Promise((ok, nee) => {
      const r = new FileReader()
      r.onload = () => ok(r.result)
      r.onerror = nee
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

export async function downloadSplitPdf({ voornaam, split, locatie, dagen, tips }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const B = doc.internal.pageSize.getWidth()
  const M = 16

  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, B, 34, 'F')
  const logo = await laadLogo()
  if (logo) doc.addImage(logo, 'PNG', M - 4, 3, 56, 28)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text(voornaam ? `Split van ${voornaam}` : 'Mijn split', B - M, 20, { align: 'right' })

  let y = 48
  doc.setTextColor(17, 17, 17)
  doc.setFontSize(20); doc.text(split.naam, M, y)
  y += 7
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90, 90, 90)
  doc.text(`${split.dagen.length} dagen per week · ${locatie === 'thuis' ? 'thuis' : 'gym'}`, M, y)
  y += 6
  const waarom = doc.splitTextToSize(split.waarom, B - 2 * M)
  doc.text(waarom, M, y)
  y += waarom.length * 4.5 + 5

  // Weekoverzicht: zeven vakjes, trainingsdagen zwart.
  const vak = (B - 2 * M - 6 * 2) / 7
  WEEK.forEach((d, i) => {
    const idx = split.week.indexOf(d)
    const x = M + i * (vak + 2)
    if (idx >= 0) { doc.setFillColor(17, 17, 17); doc.rect(x, y, vak, 16, 'F'); doc.setTextColor(255, 255, 255) }
    else { doc.setDrawColor(210, 210, 210); doc.rect(x, y, vak, 16); doc.setTextColor(150, 150, 150) }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text(d, x + vak / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
    const label = idx >= 0 ? DAG_NAAM[split.dagen[idx]] : 'Rust'
    doc.text(doc.splitTextToSize(label, vak - 2), x + vak / 2, y + 11, { align: 'center' })
  })
  y += 26

  split.dagen.forEach((code, i) => {
    const dag = dagen[code]
    if (!dag) return
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [[{ content: `${split.week[i]} · ${DAG_NAAM[code]}` }, { content: dag.focus || '', colSpan: 3, styles: { halign: 'right', fontStyle: 'normal', fontSize: 8.5 } }],
             ['Oefening', 'Sets', 'Reps', 'Rust']],
      body: dag.oefeningen.map(o => [o.naam, String(o.sets ?? ''), o.reps || '', o.rust || '']),
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9.5, textColor: [17, 17, 17], cellPadding: { top: 1.6, bottom: 1.6, left: 2, right: 2 }, lineColor: [225, 225, 225], lineWidth: { bottom: 0.2 } },
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255] },
      didParseCell: (c) => {
        if (c.section === 'head' && c.row.index === 0) { c.cell.styles.fillColor = [17, 17, 17]; c.cell.styles.textColor = [255, 255, 255]; if (c.column.index === 0) c.cell.styles.fontSize = 11 }
        if (c.section === 'head' && c.row.index === 1) { c.cell.styles.textColor = [120, 120, 120]; c.cell.styles.fontSize = 8 }
      },
      columnStyles: { 1: { cellWidth: 16, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' } },
      rowPageBreak: 'avoid',
    })
    y = doc.lastAutoTable.finalY + 6
  })

  // Uitvoering onderaan, op een nieuwe pagina als het niet meer past.
  const H = doc.internal.pageSize.getHeight()
  doc.setFontSize(9.5)
  const tipRegels = tips.map(t => doc.splitTextToSize(`•  ${t}`, B - 2 * M))
  const nodig = 8 + tipRegels.reduce((n, r) => n + r.length * 4.5 + 2, 0)
  if (y + nodig > H - 16) { doc.addPage(); y = 20 }
  doc.setTextColor(17, 17, 17); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('Zo voer je hem uit', M, y)
  y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60)
  tipRegels.forEach(r => {
    doc.text(r, M, y)
    y += r.length * 4.5 + 2
  })

  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p)
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('MY ARC · myarcfitness.com', M, H - 8)
    doc.text(`${p}/${n}`, B - M, H - 8, { align: 'right' })
  }

  doc.save(`mijn-split-${split.dagen.length}-dagen.pdf`)
}
