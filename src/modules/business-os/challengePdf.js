// src/modules/business-os/challengePdf.js
//
// Het overzicht uit Klanten → Challenge als pdf om te delen (16 nov 2026,
// Kersten). Zelfde cijfers en dezelfde klanten als op het scherm, op wit met
// zwarte tekst zodat het ook geprint leesbaar is. jsPDF wordt pas geladen als
// je op de knop drukt.

const euro = (n) => `€ ${Math.round(Number(n) || 0).toLocaleString('nl-NL')}`

// kop: { titel, sub }
// getallen: [{ label, waarde, sub }]
// groepen: [{ naam, rijen: [[naam, week, traject, eisen, eindcall, stand, bedrag, watNu]] }]
// lijsten: [{ naam, totaal, regels: [{ naam, sub, bedrag }] }]
export async function maakChallengePdf({ kop, getallen, groepen, lijsten = [] }) {
  const [pdfMod, tabelMod] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  // De bundel levert de klasse als default, Node als benoemde export: beide vormen opvangen.
  const JsPDF = pdfMod.jsPDF || pdfMod.default?.jsPDF || pdfMod.default
  const autoTable = tabelMod.autoTable || tabelMod.default?.default || tabelMod.default
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const breed = doc.internal.pageSize.getWidth()
  const marge = 12

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(0)
  doc.text(kop.titel, marge, 16)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90)
  doc.text(kop.sub, marge, 22)

  // Kerncijfers naast elkaar.
  const kolom = (breed - marge * 2) / Math.max(1, getallen.length)
  getallen.forEach((g, i) => {
    const x = marge + i * kolom
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(0)
    doc.text(String(g.waarde), x, 33)
    doc.setFontSize(8.5); doc.text(g.label, x, 38)
    if (g.sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110); doc.text(String(g.sub), x, 42, { maxWidth: kolom - 3 }) }
  })

  const stijl = { font: 'helvetica', fontSize: 8.5, cellPadding: 1.6, textColor: 20, lineColor: 215, lineWidth: 0.1 }
  const kopStijl = { fillColor: [20, 20, 20], textColor: 255, fontStyle: 'bold', fontSize: 8 }
  let y = 49
  for (const g of groepen) {
    if (!g.rijen.length) continue
    autoTable(doc, {
      startY: y, margin: { left: marge, right: marge }, styles: stijl, headStyles: kopStijl, theme: 'grid',
      head: [[{ content: `${g.naam} · ${g.rijen.length}`, colSpan: 8, styles: { fillColor: [235, 235, 235], textColor: 0, fontSize: 9.5 } }],
        ['Naam', 'Week', 'Traject', 'Eisen', 'Eindcall', 'Stand', 'Bedrag', 'Wat nu']],
      body: g.rijen,
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 46 }, 1: { cellWidth: 16 }, 2: { cellWidth: 52 }, 3: { cellWidth: 18 }, 4: { cellWidth: 36 }, 5: { cellWidth: 26 }, 6: { cellWidth: 22, halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 5
  }

  // De bedragen achter de kerncijfers: wie zit er in Zeker, Toegezegd, Onzeker.
  const gevuld = lijsten.filter(l => l.regels.length)
  if (gevuld.length) {
    doc.addPage()
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(0)
    doc.text('Bedragen per groep', marge, 16)
    y = 21
    for (const l of gevuld) {
      autoTable(doc, {
        startY: y, margin: { left: marge, right: marge }, styles: stijl, headStyles: kopStijl, theme: 'grid',
        head: [[{ content: `${l.naam} · ${euro(l.totaal)}`, colSpan: 3, styles: { fillColor: [235, 235, 235], textColor: 0, fontSize: 9.5 } }],
          ['Naam', 'Toelichting', 'Bedrag']],
        body: l.regels.map(r => [r.naam, r.sub || '', r.bedrag != null ? euro(r.bedrag) : '']),
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 2: { cellWidth: 30, halign: 'right' } },
      })
      y = doc.lastAutoTable.finalY + 5
    }
  }

  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(140)
    doc.text(`MY ARC · ${kop.titel} · pagina ${p} van ${paginas}`, marge, doc.internal.pageSize.getHeight() - 6)
  }
  doc.save(`${kop.bestand}.pdf`)
}
