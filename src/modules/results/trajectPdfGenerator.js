// src/modules/results/trajectPdfGenerator.js
// Bouwt de eind-van-traject-PDF (HTML → print → PDF) in MY ARC-stijl.
// Koppen gebruiken 'Poppins' (zwaar, 800/900) als merk-font.

const GOLD = '#ffd700'
const LOGO = '/ma-coaching-logo.png'
// Zelfde avatar als het coach-bericht op de client-home (ronde face-crop).
const COACH_PHOTO = 'https://i.ibb.co/mCQzTZrZ/ea169061-c9f1-4b4d-ab88-fc746cbde003.jpg'

// Thematische thumbnails voor de inleiding-kaartjes (workout / maaltijd / coach).
// workout + meal worden nog aangeleverd; zet ze in /public op deze paden.
const INTRO_THUMB = {
  workout: '/intro-workout.jpg',
  meal: '/intro-meal.jpg',
  coach: '/coach-kersten.png',
}

const fmtDate = (d) => {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
}
const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const truncate = (s, n = 20) => { const t = String(s ?? ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t }

// Kleur per spiergroep (zoals in het kracht-overzicht).
const MUSCLE_COLOR = {
  chest: '#ef4444', back: '#FFD700', legs: '#10b981', shoulders: '#f59e0b',
  biceps: '#a855f7', triceps: '#06b6d4', glutes: '#ec4899', abs: '#ec4899', overig: '#94a3b8',
}

// Mini staafgrafiek (sparkline) van de gewichtsprogressie van één oefening.
function sparkHTML(series, baseColor) {
  const vals = (series || []).filter(v => typeof v === 'number' && !isNaN(v))
  if (vals.length < 2) return ''
  const slice = vals.slice(-12)
  const mn = Math.min(...slice), mx = Math.max(...slice), rng = mx - mn || 1
  const minH = 5, maxH = 20
  const ratio = slice[slice.length - 1] / (slice[0] || slice[slice.length - 1] || 1)
  const accent = ratio >= 1.05 ? '#22c55e' : ratio <= 0.95 ? '#ef4444' : baseColor
  return `<div class="spark">${slice.map((v, i) => {
    const h = (minH + ((v - mn) / rng) * (maxH - minH)).toFixed(1)
    const last = i === slice.length - 1
    return `<span class="sbar" style="height:${h}px;background:${last ? accent : baseColor};opacity:${last ? 1 : 0.35}"></span>`
  }).join('')}</div>`
}

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
  const { weight, photoPair, angles = {}, strength = [], period } = data || {}
  const clientName = esc(meta.clientName || 'Klant')
  const firstName = esc((meta.clientName || '').trim().split(/\s+/)[0] || 'daar')
  const hasCoachText = !!(meta.coachText || '').trim()
  const coachText = esc(meta.coachText || '').replace(/\n/g, '<br>')
  const hasJourney = !!(meta.journeyText || '').trim()
  const journeyText = esc(meta.journeyText || '').replace(/\n/g, '<br>')
  const hasPlan = !!(meta.planText || '').trim()
  const planText = esc(meta.planText || '').replace(/\n/g, '<br>')
  const hasClosing = hasCoachText || hasPlan
  const hasWorkout = !!(meta.workoutText || '').trim()
  const workoutText = esc(meta.workoutText || '').replace(/\n/g, '<br>')
  const hasCover = !!(meta.coverText || '').trim()
  const coverText = esc(meta.coverText || '').replace(/\n/g, '<br>')
  const hasIntro = !!(meta.introText || '').trim()
  const introText = esc(meta.introText || '').replace(/\n/g, '<br>')
  const hasPhoto = !!(meta.photoText || '').trim()
  const photoText = esc(meta.photoText || '').replace(/\n/g, '<br>')

  // Coach-bericht in de stijl van de client-home: ronde avatar + "BERICHT VAN
  // KERSTEN" in goud + de tekst.
  const coachMsg = (bodyHtml) => `<div class="coach-msg">
    <img class="cm-photo" src="${COACH_PHOTO}"/>
    <div class="cm-body">
      <div class="cm-head">Bericht van Kersten</div>
      ${bodyHtml}
    </div>
  </div>`
  const periodStr = period ? `${fmtDate(period.start)} t/m ${fmtDate(period.end)}` : ''

  // Inleiding-thumbnails: elke kaart een mini before/after in homepage-stijl
  // (before | after + MA-overlay). Verschillende hoeken zodat ze variëren.
  const availPairs = ['front', 'side', 'back'].map(k => angles[k]).filter(p => p?.before)
  const fallbackPair = availPairs[0] || (photoPair ? { before: photoPair.first, after: photoPair.last } : null)
  const pairFor = (k) => (angles[k]?.before ? angles[k] : fallbackPair)
  const miniOf = (pair) => pair && pair.before ? `<div class="toc-mini">
      <div class="tm-half l"><img src="${esc(pair.before.photo_url)}"/></div>
      <div class="tm-half r"><img src="${esc((pair.after || pair.before).photo_url)}"/></div>
      <img class="tm-ov" src="${LOGO}"/>
    </div>` : ''
  const singleThumb = (url, extra = '') => `<img class="toc-thumb ${extra}" src="${esc(url)}" onerror="this.style.display='none'"/>`

  // Inhoudsopgave (dynamisch: optionele secties tellen mee in de nummering).
  // Kaart 1 = transformatie (back); kracht = workout; voeding = maaltijd; coach = jij.
  const sections = [
    { t: 'Gewicht- & fotoprogressie', d: 'Je gewicht over de maanden, met front, side en back naast elkaar.', tail: miniOf(pairFor('back')) },
    { t: 'Krachtprogressie per spiergroep', d: 'Je meest gedane oefeningen, van startgewicht naar eindgewicht.', tail: singleThumb(INTRO_THUMB.workout) },
    ...(hasJourney ? [{ t: 'Voedingsprogressie', d: 'Jouw verhaal: hoe je binnenkwam en wat we hebben bereikt.', tail: singleThumb(INTRO_THUMB.meal) }] : []),
    ...(hasClosing ? [{ t: 'Coach-woord & plan', d: 'Een persoonlijke boodschap en je vooruitzicht voor de komende tijd.', tail: singleThumb(INTRO_THUMB.coach, 'toc-coach') }] : []),
  ]
  const tocHtml = sections.map((s, i) => `
      <div class="toc-item">
        <div class="toc-n">${String(i + 1).padStart(2, '0')}</div>
        <div class="toc-txt"><div class="toc-t">${esc(s.t)}</div><div class="toc-d">${esc(s.d)}</div></div>
        ${s.tail || ''}
      </div>`).join('')

  // Back/side/front als cover-stijl kaarten (before | after + MA-overlay).
  const ANGLE_LABELS = { front: 'Front', side: 'Side', back: 'Back' }
  const pairLabels = (pair) => {
    if (!pair?.after) return { l: 'Maand 1', r: '' }
    const m = Math.max(1, monthsBetween(new Date(pair.before.photo_date), new Date(pair.after.photo_date)) + 1)
    return { l: 'Maand 1', r: `Maand ${m}` }
  }
  const coverCard = (pair) => {
    const lb = pairLabels(pair)
    return `<div class="ba-card">
      <div class="bc-half l"><img src="${esc(pair.before.photo_url)}"/>${lb.l ? `<span class="bc-lbl">${lb.l}</span>` : ''}</div>
      <div class="bc-half r"><img src="${esc((pair.after || pair.before).photo_url)}"/>${lb.r ? `<span class="bc-lbl">${lb.r}</span>` : ''}</div>
      <img class="bc-ov" src="${LOGO}"/>
    </div>`
  }
  const angleCols = ['back', 'side', 'front'].map(k => {
    const p = angles[k]
    if (!p || !p.before) return ''
    return `<div class="ba-col"><div class="ba-col-h">${ANGLE_LABELS[k]}</div>${coverCard(p)}</div>`
  }).join('')
  const hasAngles = ['front', 'side', 'back'].some(k => angles[k]?.before)

  // Foto-maandlabels
  let photoLabels = { left: 'Maand 1', right: 'Maand 2' }
  if (photoPair) {
    const m = Math.max(1, monthsBetween(new Date(photoPair.first.photo_date), new Date(photoPair.last.photo_date)) + 1)
    photoLabels = { left: 'Maand 1', right: `Maand ${m}` }
  }

  // Cover-visual: exact als de tracking-pagina (BeforeAfterCard) — 4:5-kaart met
  // de before/after-foto's en de MA-logo-overlay er gecentreerd overheen, plus
  // "Maand 1 / Maand X" op de foto.
  const coverPhoto = photoPair ? `
    <div class="cover-photo">
      <div class="ba-half l"><img src="${esc(photoPair.first.photo_url)}"/><span class="m-lbl">${photoLabels.left}</span></div>
      <div class="ba-half r"><img src="${esc(photoPair.last.photo_url)}"/><span class="m-lbl">${photoLabels.right}</span></div>
      <img class="overlay" src="${LOGO}"/>
    </div>` : `
    <div class="cover-photo cover-photo--empty"><img class="overlay" src="${LOGO}"/></div>`

  const weightBlock = weight ? `
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${esc(weight.first.weight)}<span>kg</span></div><div class="stat-lbl">Start</div></div>
      <div class="arrow">→</div>
      <div class="stat"><div class="stat-num">${esc(weight.last.weight)}<span>kg</span></div><div class="stat-lbl">Nu</div></div>
      <div class="diff ${weight.diff <= 0 ? 'good' : ''}">${weight.diff > 0 ? '+' : ''}${esc(weight.diff)} kg</div>
    </div>
    ${weightChartSVG(weight.series)}
  ` : `<div class="empty">Geen gewicht-data.</div>`

  const strengthBlock = strength.length ? `<div class="muscle-grid">${strength.map(g => {
    const baseColor = MUSCLE_COLOR[g.muscle] || GOLD
    return `<div class="muscle">
      <div class="muscle-h"><span class="dot" style="background:${baseColor}"></span>${esc(g.label)}</div>
      ${g.exercises.map(ex => {
    const showFrom = ex.start != null && ex.end != null && ex.start !== ex.end
    const kg = ex.end != null
      ? `<span class="ex-kg">${showFrom ? `<span class="from">${esc(ex.start)}</span><span class="ar">→</span>` : ''}${esc(ex.end)}kg</span>`
      : '<span class="ex-kg muted">—</span>'
    return `<div class="ex">
          <div class="ex-name"><span class="ex-nm" title="${esc(ex.name)}">${esc(truncate(ex.name, 20))}</span><span class="ex-count">${esc(ex.count)}×</span></div>
          <div class="ex-right">${sparkHTML(ex.series, baseColor)}${kg}</div>
        </div>`
  }).join('')}
    </div>`
  }).join('')}</div>` : `<div class="empty">Geen kracht-data.</div>`

  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><title>Traject van ${clientName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 0; }
  body { font-family: 'Poppins', Arial, sans-serif; background: #000; color: #fff; }
  .page { width: 210mm; height: 297mm; overflow: hidden; padding: 22mm 18mm 30mm; background: #000; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  /* Vaste footer per pagina */
  .foot { position: absolute; left: 0; right: 0; bottom: 12mm; height: 16mm; display: flex; align-items: center; justify-content: center; }
  .foot img { height: 16mm; width: 60mm; object-fit: cover; object-position: center bottom; opacity: .9; }
  .display { font-family: 'Poppins', sans-serif; font-weight: 900; }
  .eyebrow { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: ${GOLD}; }
  h1 { font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 50px; line-height: 1; letter-spacing: -.02em; text-transform: uppercase; margin: 8px 0 6px; }
  h2 { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 27px; letter-spacing: -.02em; text-transform: uppercase; margin-bottom: 18px; }
  .muted { color: #9ca3af; }
  .empty { color: #6b7280; padding: 24px 0; }
  /* Cover */
  .cover { padding: 0; display: flex; flex-direction: column; align-items: center; }
  .cover-head { padding: 12mm 18mm 8mm; text-align: center; }
  .cover-head .name { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 30px; text-transform: uppercase; letter-spacing: -.01em; color: ${GOLD}; margin-top: 2px; }
  .cover-head .period { color: #9ca3af; margin-top: 8px; font-size: 13px; font-weight: 600; letter-spacing: .04em; }
  /* 4:5-kaart, identiek aan de tracking-pagina */
  .cover-photo { position: relative; width: 174mm; height: 217.5mm; background: transparent; border-radius: 18px; }
  .cover-photo .ba-half { position: absolute; top: 0; bottom: 0; width: 50%; overflow: hidden; }
  .cover-photo .ba-half.l { left: 0; border-top-left-radius: 18px; border-bottom-left-radius: 18px; }
  .cover-photo .ba-half.r { right: 0; border-top-right-radius: 18px; border-bottom-right-radius: 18px; }
  .cover-photo .ba-half img { width: 100%; height: 100%; object-fit: cover; }
  .cover-photo .overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; pointer-events: none; z-index: 1; border-radius: 18px; }
  .cover-photo .m-lbl { position: absolute; bottom: 13%; left: 0; right: 0; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 900; font-style: italic; font-size: 30px; color: #fff; z-index: 2; }
  .cover-photo--empty { display: flex; align-items: center; justify-content: center; }
  .cover.has-msg .cover-photo { width: 150mm; height: 187.5mm; }
  .cover-msg { width: 100%; box-sizing: border-box; padding: 16px 18mm 0; }
  /* Weight */
  .stat-row { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .stat-num { font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 48px; letter-spacing: -.03em; }
  .stat-num span { font-size: 18px; color: #9ca3af; margin-left: 4px; font-weight: 700; }
  .stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; font-weight: 700; }
  .arrow { font-size: 34px; color: ${GOLD}; }
  .diff { margin-left: auto; font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 28px; color: #ef4444; }
  .diff.good { color: #22c55e; }
  /* Strength */
  .muscle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .muscle { border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 11px 13px; background: #141414; }
  .muscle-h { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 13px; color: ${GOLD}; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 7px; display: flex; align-items: center; gap: 7px; }
  .muscle-h .dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
  .ex { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-top: 1px solid rgba(255,255,255,.05); }
  .ex:first-of-type { border-top: none; }
  .ex-name { flex: 1 1 auto; min-width: 0; display: flex; align-items: baseline; font-size: 13px; font-weight: 700; overflow: hidden; }
  .ex-nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ex-count { color: #6b7280; font-size: 11px; margin-left: 6px; flex-shrink: 0; }
  .ex-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .spark { display: flex; align-items: flex-end; gap: 1px; height: 20px; }
  .sbar { width: 3px; border-radius: 1px; display: block; }
  .ex-kg { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 14px; color: ${GOLD}; line-height: 1; white-space: nowrap; text-align: right; }
  .ex-kg .from { color: #9ca3af; font-weight: 700; }
  .ex-kg .ar { color: ${GOLD}; margin: 0 3px; }
  .ex-kg.muted { color: #6b7280; }
  /* Inleiding */
  .intro { font-size: 17px; line-height: 1.7; color: #d1d5db; margin-bottom: 30px; max-width: 155mm; }
  .toc { display: flex; flex-direction: column; gap: 12px; }
  .toc-item { display: flex; align-items: center; gap: 16px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; padding: 14px 16px; background: #141414; }
  .toc-n { font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 22px; color: ${GOLD}; line-height: 1; min-width: 34px; }
  .toc-txt { flex: 1; }
  .toc-t { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 17px; color: #fff; }
  .toc-d { font-size: 14px; color: #9ca3af; margin-top: 3px; line-height: 1.5; }
  .toc-thumb { width: 58px; height: 72px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
  .toc-mini { position: relative; width: 58px; height: 72px; flex-shrink: 0; display: flex; background: #111; }
  .toc-mini .tm-half { width: 50%; overflow: hidden; }
  .toc-mini .tm-half.l { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
  .toc-mini .tm-half.r { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }
  .toc-mini .tm-half img { width: 100%; height: 100%; object-fit: cover; }
  .toc-mini .tm-ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; border-radius: 10px; }
  /* Progressie-pagina (foto + gewicht) */
  .pcol { display: flex; flex-direction: column; }
  .wprog { flex: 0 0 auto; margin-bottom: 14px; }
  .wprog .stat-row { margin-bottom: 10px; }
  .wprog svg { display: block; height: 42mm; width: auto; max-width: 100%; margin: 0 auto; }
  .ba-grid { flex: 1 1 0; min-height: 0; display: flex; gap: 12px; align-items: flex-start; }
  .ba-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .ba-col-h { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 14px; color: ${GOLD}; text-transform: uppercase; letter-spacing: .04em; text-align: center; margin-bottom: 8px; }
  .ba-card { position: relative; width: 100%; aspect-ratio: 4 / 5; background: #111; }
  .ba-card .bc-half { position: absolute; top: 0; bottom: 0; width: 50%; overflow: hidden; }
  .ba-card .bc-half.l { left: 0; border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
  .ba-card .bc-half.r { right: 0; border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
  .ba-card .bc-half img { width: 100%; height: 100%; object-fit: cover; }
  .ba-card .bc-ov { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; border-radius: 12px; z-index: 1; }
  .ba-card .bc-lbl { position: absolute; bottom: 9%; left: 0; right: 0; text-align: center; font-family: 'Poppins', sans-serif; font-weight: 900; font-style: italic; font-size: 14px; color: #fff; z-index: 2; }
  /* Coach message */
  .msg { font-size: 17px; line-height: 1.7; color: #e5e7eb; white-space: pre-wrap; }
  .coach-msg { display: flex; gap: 14px; align-items: flex-start; }
  .cm-photo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(255,215,0,.45); background: #f0f0f0; }
  .cm-body { flex: 1; min-width: 0; }
  .cm-head { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 11px; color: ${GOLD}; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
  .cm-text { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,.78); font-weight: 500; white-space: pre-wrap; }
  .cm-wrap { margin-top: 22px; }
  .plan { margin-top: 20px; border-top: 1px solid rgba(255,215,0,.25); padding-top: 16px; }
  .plan-h { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 15px; color: ${GOLD}; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 10px; }
</style></head><body>

  <div class="page cover${hasCover ? ' has-msg' : ''}">
    <div class="cover-head">
      <div class="eyebrow">Transformatie</div>
      <h1>Jouw traject</h1>
      <div class="name">${clientName}</div>
      ${periodStr ? `<div class="period">${esc(periodStr)}</div>` : ''}
    </div>
    ${coverPhoto}
    ${hasCover ? `<div class="cover-msg">${coachMsg(`<div class="cm-text">${coverText}</div>`)}</div>` : ''}
  </div>

  <div class="page">
    <div class="eyebrow">Inleiding</div>
    <h2>Jouw traject in beeld</h2>
    <p class="intro">Beste ${firstName}, in dit rapport blikken we samen terug op jouw traject. Van je eerste tot je laatste dag hebben we alles bijgehouden. Hieronder zie je zwart-op-wit wat er is veranderd. Wees trots op wat je hebt neergezet.</p>
    <div class="toc">${tocHtml}</div>
    ${hasIntro ? `<div class="cm-wrap">${coachMsg(`<div class="cm-text">${introText}</div>`)}</div>` : ''}
    <div class="foot"><img src="${LOGO}"/></div>
  </div>

  <div class="page pcol">
    <div class="eyebrow">Progressie</div>
    <h2>Foto- &amp; gewichtsprogressie</h2>
    <div class="wprog">${weightBlock}</div>
    ${hasAngles ? `<div class="ba-grid">${angleCols}</div>` : `<div class="empty">Nog geen front/side/back-foto's.</div>`}
    ${hasPhoto ? `<div class="cm-wrap">${coachMsg(`<div class="cm-text">${photoText}</div>`)}</div>` : ''}
    <div class="foot"><img src="${LOGO}"/></div>
  </div>

  <div class="page">
    <div class="eyebrow">Kracht</div>
    <h2>Krachtprogressie per spiergroep</h2>
    ${strengthBlock}
    ${hasWorkout ? `<div class="cm-wrap">${coachMsg(`<div class="cm-text">${workoutText}</div>`)}</div>` : ''}
    <div class="foot"><img src="${LOGO}"/></div>
  </div>

  ${hasJourney ? `<div class="page">
    <div class="eyebrow">Voeding</div>
    <h2>Voedingsprogressie</h2>
    ${coachMsg(`<div class="cm-text">${journeyText}</div>`)}
    <div class="foot"><img src="${LOGO}"/></div>
  </div>` : ''}

  ${hasClosing ? `<div class="page">
    <div class="eyebrow">Van je coach</div>
    <h2>Coach-woord &amp; plan</h2>
    ${coachMsg(`
      ${hasCoachText ? `<div class="cm-text">${coachText}</div>` : ''}
      ${hasPlan ? `<div class="plan"><div class="plan-h">Jouw plan &amp; vooruitzicht</div><div class="cm-text">${planText}</div></div>` : ''}
    `)}
    <div class="foot"><img src="${LOGO}"/></div>
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
    win.onload = () => setTimeout(() => win.print(), 900)
  } else {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open(); doc.write(html); doc.close()
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1500) }, 1000)
  }
  if (document.body.contains(loading)) document.body.removeChild(loading)
}
