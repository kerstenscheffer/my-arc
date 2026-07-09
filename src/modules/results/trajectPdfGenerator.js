// src/modules/results/trajectPdfGenerator.js
// Bouwt de eind-van-traject-PDF (HTML → print → PDF) in MY ARC-stijl.

const GOLD = '#ffd700'
const LOGO = '/ma-coaching-logo.png'

const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
}
const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Kleine SVG-lijngrafiek voor het gewichtverloop.
function weightChartSVG(series) {
  if (!series || series.length < 2) return ''
  const W = 720, H = 260, pad = 40
  const ws = series.map(s => Number(s.weight))
  const min = Math.min(...ws), max = Math.max(...ws)
  const range = max - min || 1
  const x = (i) => pad + (i / (series.length - 1)) * (W - pad * 2)
  const y = (v) => pad + (1 - (v - min) / range) * (H - pad * 2)
  const pts = series.map((s, i) => `${x(i)},${y(Number(s.weight))}`).join(' ')
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
    <polyline points="${pts}" fill="none" stroke="${GOLD}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(0)}" cy="${y(ws[0])}" r="6" fill="#fff"/>
    <circle cx="${x(series.length - 1)}" cy="${y(ws[ws.length - 1])}" r="6" fill="${GOLD}"/>
  </svg>`
}

export function generateTrajectHTML(data, meta = {}) {
  const { weight, photoPair, strength = [], period } = data || {}
  const clientName = esc(meta.clientName || 'Klant')
  const coachText = esc(meta.coachText || '').replace(/\n/g, '<br>')
  const periodStr = period ? `${fmtDate(period.start)} — ${fmtDate(period.end)}` : ''

  // Foto-maandlabels
  let photoLabels = { left: 'Maand 1', right: 'Maand 2' }
  if (photoPair) {
    const m = Math.max(1, monthsBetween(new Date(photoPair.first.photo_date), new Date(photoPair.last.photo_date)) + 1)
    photoLabels = { left: 'Maand 1', right: `Maand ${m}` }
  }

  const weightBlock = weight ? `
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${esc(weight.first.weight)}<span>kg</span></div><div class="stat-lbl">Start</div></div>
      <div class="arrow">→</div>
      <div class="stat"><div class="stat-num">${esc(weight.last.weight)}<span>kg</span></div><div class="stat-lbl">Nu</div></div>
      <div class="diff ${weight.diff <= 0 ? 'good' : ''}">${weight.diff > 0 ? '+' : ''}${esc(weight.diff)} kg</div>
    </div>
    ${weightChartSVG(weight.series)}
  ` : `<div class="empty">Geen gewicht-data.</div>`

  const strengthBlock = strength.length ? strength.map(g => `
    <div class="muscle">
      <div class="muscle-h">${esc(g.label)}</div>
      ${g.exercises.map(ex => {
    const has = ex.start != null && ex.end != null
    const gain = has ? Math.round((ex.end - ex.start) * 10) / 10 : null
    return `<div class="ex">
          <div class="ex-name">${esc(ex.name)}<span class="ex-count">${esc(ex.count)}×</span></div>
          <div class="ex-prog">${has
        ? `<span>${esc(ex.start)}kg</span><span class="ar">→</span><span class="end">${esc(ex.end)}kg</span>${gain > 0 ? `<span class="gain">+${esc(gain)}kg</span>` : ''}`
        : '<span class="muted">geen gewicht gelogd</span>'}</div>
        </div>`
  }).join('')}
    </div>`).join('') : `<div class="empty">Geen kracht-data.</div>`

  const photoBlock = photoPair ? `
    <div class="ba">
      <div class="ba-half"><img src="${esc(photoPair.first.photo_url)}"/><span class="ba-lbl left">${photoLabels.left}</span></div>
      <div class="ba-half"><img src="${esc(photoPair.last.photo_url)}"/><span class="ba-lbl right">${photoLabels.right}</span></div>
    </div>` : `<div class="empty">Nog geen before/after-foto's.</div>`

  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><title>Traject — ${clientName}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Inter', Arial, sans-serif; background: #000; color: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 22mm 18mm; background: #000; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${GOLD}; }
  h1 { font-size: 40px; font-weight: 900; letter-spacing: -.02em; margin: 6px 0; }
  h2 { font-size: 24px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 18px; }
  .muted { color: #9ca3af; }
  .empty { color: #6b7280; padding: 24px 0; }
  /* Cover */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cover img { width: 240px; margin-bottom: 30px; }
  .cover .name { font-size: 30px; font-weight: 800; color: ${GOLD}; margin-top: 4px; }
  .cover .period { color: #9ca3af; margin-top: 10px; font-size: 14px; }
  /* Weight */
  .stat-row { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .stat-num { font-size: 46px; font-weight: 900; letter-spacing: -.03em; }
  .stat-num span { font-size: 18px; color: #9ca3af; margin-left: 4px; }
  .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; font-weight: 700; }
  .arrow { font-size: 34px; color: ${GOLD}; }
  .diff { margin-left: auto; font-size: 26px; font-weight: 900; color: #ef4444; }
  .diff.good { color: #22c55e; }
  /* Photos */
  .ba { display: flex; gap: 8px; height: 210mm; }
  .ba-half { flex: 1; position: relative; overflow: hidden; border-radius: 10px; background: #111; }
  .ba-half img { width: 100%; height: 100%; object-fit: cover; }
  .ba-lbl { position: absolute; bottom: 16px; font-style: italic; font-weight: 900; font-size: 28px; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.9); }
  .ba-lbl.left { left: 16px; } .ba-lbl.right { right: 16px; }
  /* Strength */
  .muscle { margin-bottom: 18px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 14px 16px; background: #141414; }
  .muscle-h { font-size: 13px; font-weight: 800; color: ${GOLD}; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px; }
  .ex { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-top: 1px solid rgba(255,255,255,.05); }
  .ex:first-of-type { border-top: none; }
  .ex-name { font-size: 15px; font-weight: 700; }
  .ex-count { color: #6b7280; font-size: 12px; margin-left: 8px; }
  .ex-prog { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
  .ex-prog .ar { color: ${GOLD}; }
  .ex-prog .end { color: #fff; }
  .ex-prog .gain { color: #22c55e; font-size: 13px; }
  .ex-prog .muted { font-weight: 500; font-size: 13px; }
  /* Coach message */
  .msg { font-size: 17px; line-height: 1.7; color: #e5e7eb; white-space: pre-wrap; }
  .logo-foot { position: absolute; bottom: 14mm; left: 0; right: 0; text-align: center; }
  .logo-foot img { width: 120px; opacity: .9; }
</style></head><body>

  <div class="page cover">
    <img src="${LOGO}" alt="MA Coaching"/>
    <div class="eyebrow">Transformatie</div>
    <h1>Jouw traject</h1>
    <div class="name">${clientName}</div>
    ${periodStr ? `<div class="period">${esc(periodStr)}</div>` : ''}
  </div>

  <div class="page">
    <div class="eyebrow">Gewicht</div>
    <h2>Gewichtsprogressie</h2>
    ${weightBlock}
    <div class="logo-foot"><img src="${LOGO}"/></div>
  </div>

  <div class="page">
    <div class="eyebrow">Foto's</div>
    <h2>Before / after</h2>
    ${photoBlock}
  </div>

  <div class="page">
    <div class="eyebrow">Kracht</div>
    <h2>Krachtprogressie per spiergroep</h2>
    ${strengthBlock}
    <div class="logo-foot"><img src="${LOGO}"/></div>
  </div>

  ${coachText ? `<div class="page">
    <div class="eyebrow">Van je coach</div>
    <h2>Een woord voor jou</h2>
    <div class="msg">${coachText}</div>
    <div class="logo-foot"><img src="${LOGO}"/></div>
  </div>` : ''}

</body></html>`
}

export function openTrajectForPrint(data, meta) {
  const html = generateTrajectHTML(data, meta)
  const loading = document.createElement('div')
  loading.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px 40px;font:700 13px sans-serif;letter-spacing:2px;text-transform:uppercase;z-index:99999'
  loading.textContent = 'PDF MAKEN...'
  document.body.appendChild(loading)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html); win.document.close()
    win.onload = () => setTimeout(() => win.print(), 700)
  } else {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open(); doc.write(html); doc.close()
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1500) }, 800)
  }
  if (document.body.contains(loading)) document.body.removeChild(loading)
}
