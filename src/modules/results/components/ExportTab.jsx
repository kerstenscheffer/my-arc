// src/modules/results/components/ExportTab.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react'

const isMobile = window.innerWidth <= 768
const GOLD = '#FFD700'
const fmtShort = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}

function dlCanvas(canvas, filename) {
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png'); a.download = filename; a.click()
}

function getYRange(vals) {
  const spread = Math.max(Math.max(...vals) - Math.min(...vals), 0.5)
  return { minV: Math.min(...vals) - spread * 0.25, maxV: Math.max(...vals) + spread * 0.25 }
}

// ─── Shared UI controls ───────────────────────────────────────────────────────
function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!value)} style={{ width: '28px', height: '16px', borderRadius: '8px', background: value ? GOLD : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '14px' : '2px', width: '12px', height: '12px', borderRadius: '50%', background: value ? '#000' : 'rgba(255,255,255,0.4)', transition: 'left 0.15s' }} />
      </div>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </label>
  )
}
function ControlRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{children}</div>
}
function Lbl({ children }) {
  return <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{children}</span>
}
function DateInput({ value, onChange, min, max }) {
  return <input type="date" value={value} min={min} max={max} onChange={e => onChange(e.target.value)}
    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', outline: 'none', colorScheme: 'dark' }} />
}
function DlBtn({ onClick, disabled, children }) {
  return <button onClick={onClick} disabled={disabled}
    style={{ background: disabled ? 'rgba(255,255,255,0.06)' : GOLD, color: disabled ? 'rgba(255,255,255,0.2)' : '#000', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 800, padding: '8px 16px', cursor: disabled ? 'not-allowed' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}>
    {children}
  </button>
}

// ─── Core draw function — used by both weight + PR charts ─────────────────────
// accentColor: GOLD for weight, '#f97316' for PR
function drawResultCard(ctx, W, H, {
  vals, firstDate, lastDate, diffStr, durStr,
  pillText, showName, clientName, accentColor,
  bg = 'transparent', showPill = true, showLabels = true,
  showKg = true, showChart = true, showDates = true,
  numColor = null
}) {
  ctx.clearRect(0, 0, W, H)

  // Achtergrond
  const onWhite = bg === 'white'
  if (bg === 'black') { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H) }
  if (bg === 'white') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H) }

  // Adaptieve kleuren op basis van achtergrond
  const textPrimary   = onWhite ? 'rgba(0,0,0,0.85)'   : 'rgba(255,255,255,0.85)'
  const textSecondary = onWhite ? 'rgba(0,0,0,0.5)'    : 'rgba(255,255,255,0.5)'
  const textFaint     = onWhite ? 'rgba(0,0,0,0.3)'    : 'rgba(255,255,255,0.3)'
  const divider       = onWhite ? 'rgba(0,0,0,0.1)'    : 'rgba(255,255,255,0.1)'
  const arrowColor    = onWhite ? 'rgba(0,0,0,0.5)'    : 'rgba(255,255,255,0.85)'
  const beforeColor   = numColor || (onWhite ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.4)')
  const beforeKgColor = numColor ? numColor : (onWhite ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)')
  const areaColor     = accentColor === GOLD
    ? (onWhite ? 'rgba(200,160,0,0.1)' : 'rgba(255,215,0,0.07)')
    : (onWhite ? 'rgba(200,80,0,0.1)'  : 'rgba(249,115,22,0.07)')

  const large  = W > 500
  const s      = large ? 1 : 0.56

  // ── Tekstgroottes — leesbaar op elke achtergrond ──
  const pillSz = Math.round(large ? 14 : 10)   // pill branding
  const lblSz  = Math.round(large ? 22 : 14)   // BEFORE / AFTER labels
  const numSz  = Math.round(large ? 72 : 44)   // de gewichten
  const kgSz   = Math.round(large ? 22 : 14)   // kg suffix
  const heroSz = Math.round(large ? 80 : 48)   // -1.7kg
  const durSz  = Math.round(large ? 28 : 18)   // in 4 weken
  const pillH  = Math.round(pillSz + 10)

  // ── Kolommen: BEFORE centraal links, AFTER centraal rechts ──
  // Niet aan de randen maar dichter naar het midden
  const beforeCX = Math.round(W * 0.27)
  const afterCX  = Math.round(W * 0.73)
  const pb       = Math.round(18 * s)
  const pl       = Math.round(18 * s)
  const pr       = Math.round(18 * s)

  // ── Y posities (dynamisch opgebouwd) ──
  const pillY   = 14
  const lblY    = pillY + pillH + Math.round(10 * s)           // BEFORE/AFTER label baseline
  const numY    = lblY + Math.round(6 * s) + numSz             // gewicht baseline
  const heroY   = numY + Math.round(14 * s) + heroSz           // diff getal baseline
  const durY    = heroY + Math.round(8 * s) + durSz            // duur baseline
  const chartTop = durY + Math.round(16 * s)                   // chart begint hier

  const iW  = W - pl - pr
  const iH  = H - chartTop - pb
  const { minV, maxV } = getYRange(vals)
  const toX = i => pl + (i / Math.max(vals.length - 1, 1)) * iW
  const toY = v => chartTop + iH - ((v - minV) / (maxV - minV)) * iH

  // ── 1. GRAFIEK EERST ──
  if (showChart && iH > 20) {
    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(vals.length - 1), H); ctx.lineTo(toX(0), H); ctx.closePath()
    ctx.fillStyle = areaColor
    ctx.fill()
    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.strokeStyle = accentColor; ctx.lineWidth = large ? 3 : 2; ctx.lineJoin = 'round'; ctx.stroke()
    const dotR = large ? 6 : 4
    ;[[0, vals[0]], [vals.length - 1, vals[vals.length - 1]]].forEach(([i, v]) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(v), dotR, 0, Math.PI * 2)
      ctx.fillStyle = accentColor; ctx.fill()
    })
    const dSz = Math.round(large ? 13 : 9)
    ctx.fillStyle = textFaint; ctx.font = `bold ${dSz}px Arial`
    ctx.textAlign = 'left';  ctx.fillText(fmtShort(firstDate), toX(0), H - 4)
    ctx.textAlign = 'right'; ctx.fillText(fmtShort(lastDate), toX(vals.length - 1), H - 4)
    ctx.strokeStyle = divider; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pl, chartTop - 8); ctx.lineTo(W - pr, chartTop - 8); ctx.stroke()
  }

  // ── 2. PILL center ──
  if (showPill) {
  ctx.font = `bold ${pillSz}px Arial`
  const tw = ctx.measureText(pillText).width
  ctx.fillStyle = accentColor; rr(ctx, W / 2 - tw / 2 - 12, pillY, tw + 24, pillH, pillH / 2); ctx.fill()
  ctx.fillStyle = accentColor === GOLD ? '#000' : '#fff'
  ctx.textAlign = 'center'; ctx.fillText(pillText, W / 2, pillY + pillSz + 3)

  if (showName && clientName) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = `bold ${Math.round(12 * s)}px Arial`
    ctx.fillText(clientName, W / 2, pillY + pillH + Math.round(12 * s))
  }
  } // end showPill

  // ── 3. BEFORE label + getal + kg ──
  const first = vals[0], last = vals[vals.length - 1]

  // BEFORE label
  if (showLabels) {
  ctx.fillStyle = beforeColor; ctx.font = `bold ${lblSz}px Arial`
  ctx.textAlign = 'center'; ctx.fillText('BEFORE', beforeCX, lblY)
  } // end showLabels (before)

  // BEFORE getal — meet breedte zodat kg er direct achter komt
  ctx.fillStyle = beforeColor; ctx.font = `bold ${numSz}px Arial`
  const beforeNumW = ctx.measureText(first.toFixed(1)).width
  const beforeStart = beforeCX - (beforeNumW + kgSz * 1.2) / 2
  ctx.textAlign = 'left'
  ctx.fillText(first.toFixed(1), beforeStart, numY)

  // BEFORE kg — direct na het getal, zelfde baseline
  if (showKg) {
  ctx.fillStyle = beforeKgColor; ctx.font = `bold ${kgSz}px Arial`
  ctx.fillText('kg', beforeStart + beforeNumW + 3, numY)
  } // end showKg

  // ── 4. PIJL center — groot, wit, bold ──
  const arrSz = Math.round(numSz * 0.75)
  const arrowY = Math.round((lblY + numY) / 2) + Math.round(numSz * 0.12)
  ctx.font = `bold ${arrSz}px Arial`; ctx.textAlign = 'center'
  ctx.strokeStyle = arrowColor; ctx.lineWidth = large ? 4 : 2.5; ctx.strokeText('→', W / 2, arrowY)
  ctx.fillStyle = arrowColor; ctx.fillText('→', W / 2, arrowY)

  // ── 5. AFTER label + getal + kg ──
  // afterNumW/afterStart buiten showLabels zodat kg ze ook kan gebruiken
  ctx.font = `bold ${numSz}px Arial`
  const afterNumW  = ctx.measureText(last.toFixed(1)).width
  const afterStart = afterCX - (afterNumW + kgSz * 1.2) / 2

  if (showLabels) {
    ctx.fillStyle = beforeColor
    ctx.font = `bold ${lblSz}px Arial`; ctx.textAlign = 'center'
    ctx.fillText('AFTER', afterCX, lblY)
  }

  ctx.fillStyle = accentColor; ctx.font = `bold ${numSz}px Arial`
  ctx.fillStyle = numColor || accentColor
  ctx.textAlign = 'left'
  ctx.fillText(last.toFixed(1), afterStart, numY)

  if (showKg) {
    ctx.fillStyle = accentColor === GOLD ? 'rgba(255,215,0,0.4)' : 'rgba(249,115,22,0.4)'
    ctx.font = `bold ${kgSz}px Arial`
    ctx.fillText('kg', afterStart + afterNumW + 3, numY)
  }

  // ── 6. HERO DIFF ──
  ctx.fillStyle = accentColor; ctx.font = `bold ${heroSz}px Arial`
  ctx.textAlign = 'center'; ctx.fillText(diffStr, W / 2, heroY)

  // ── 7. DUUR ──
  ctx.fillStyle = textPrimary; ctx.font = `bold ${durSz}px Arial`
  ctx.fillText(durStr, W / 2, durY)
}

// ─── WEIGHT CHART ─────────────────────────────────────────────────────────────
function WeightChart({ client, weights }) {
  const canvasRef  = useRef(null)
  const previewRef = useRef(null)
  const [showName, setShowName]     = useState(false)
  const [bg, setBg]                 = useState('transparent')
  const [showPill, setShowPill]     = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showKg, setShowKg]         = useState(true)
  const [showChart, setShowChart]   = useState(true)
  const [numColor, setNumColor]       = useState(null)
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  const minDate = weights[0]?.date || ''
  const maxDate = weights[weights.length - 1]?.date || ''

  useEffect(() => { setDateFrom(minDate); setDateTo(maxDate) }, [client?.id, minDate, maxDate])

  const filtered = useMemo(() =>
    weights.filter(w => (!dateFrom || w.date >= dateFrom) && (!dateTo || w.date <= dateTo)),
    [weights, dateFrom, dateTo]
  )

  function buildParams(data, cl) {
    const vals  = data.map(w => w.weight)
    const diff  = parseFloat((vals[vals.length - 1] - vals[0]).toFixed(1))
    const days  = Math.round((new Date(data[data.length - 1].date) - new Date(data[0].date)) / 86400000)
    const weeks = Math.round(days / 7)
    return {
      vals,
      firstDate:   data[0].date,
      lastDate:    data[data.length - 1].date,
      diffStr:     (diff < 0 ? '' : '+') + diff + 'kg',
      durStr:      weeks >= 2 ? `in ${weeks} weken` : `in ${days} dagen`,
      pillText:    'CLIENT RESULTS · MY ARC',
      showName, clientName: cl ? cl.first_name + ' ' + (cl.last_name || '') : '',
      accentColor: GOLD,
      bg, showPill, showLabels, showKg, showChart, numColor,
    }
  }

  useEffect(() => {
    if (previewRef.current && filtered.length >= 2) {
      const c = previewRef.current; c.width = 480; c.height = 320
      drawResultCard(c.getContext('2d'), 480, 320, buildParams(filtered, client))
    }
  }, [filtered, showName, bg, showPill, showLabels, showKg, showChart, numColor, client])

  function download() {
    if (filtered.length < 2) return
    const c = canvasRef.current; c.width = 900; c.height = 480
    drawResultCard(c.getContext('2d'), 900, 480, buildParams(filtered, client))
    dlCanvas(c, `myarc-gewicht-${client.first_name.toLowerCase()}.png`)
  }

  const hasData = filtered.length >= 2

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '4px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>📉 Gewicht</div>
      <ControlRow>
        <Lbl>Van</Lbl><DateInput value={dateFrom} onChange={setDateFrom} min={minDate} max={dateTo || maxDate} />
        <Lbl>Tot</Lbl><DateInput value={dateTo} onChange={setDateTo} min={dateFrom || minDate} max={maxDate} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={!hasData}>Download PNG</DlBtn>
      </ControlRow>
      <ControlRow>
        <Lbl>Achtergrond</Lbl>
        {['transparent','black','white'].map(b => (
          <button key={b} onClick={() => setBg(b)} style={{ padding: '4px 10px', borderRadius: '5px', border: bg === b ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)', background: b === 'black' ? '#0a0a0a' : b === 'white' ? '#fff' : 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 0 0 / 8px 8px', color: b === 'white' ? '#000' : '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer', minWidth: '52px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {b === 'transparent' ? 'Transp.' : b === 'black' ? 'Zwart' : 'Wit'}
          </button>
        ))}
        <Toggle label="Naam" value={showName} onChange={setShowName} />
      </ControlRow>
      <ControlRow>
        <Lbl>Elementen</Lbl>
        <Toggle label="Pill" value={showPill} onChange={setShowPill} />
        <Toggle label="Labels" value={showLabels} onChange={setShowLabels} />
        <Toggle label="kg" value={showKg} onChange={setShowKg} />
        <Toggle label="Grafiek" value={showChart} onChange={setShowChart} />
      </ControlRow>
      <ControlRow>
        <Lbl>Cijfers & labels</Lbl>
        {[['Accent',null],['Wit','#ffffff'],['Goud','#FFD700'],['Zwart','#111'],['Grijs','rgba(180,180,180,0.8)']].map(([label, val]) => (
          <button key={label} onClick={() => setNumColor(val)} style={{ padding: '3px 8px', borderRadius: '4px', border: numColor === val ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)', background: val || 'linear-gradient(135deg,#FFD700 50%,#f97316 50%)', color: val === '#111' ? '#fff' : val === '#ffffff' ? '#000' : '#000', fontSize: '9px', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minWidth: '38px' }}>
            {label}
          </button>
        ))}
      </ControlRow>
      <ControlRow>
        <Lbl>Cijfers & labels</Lbl>
        {[['Accent',null],['Wit','#ffffff'],['Goud','#FFD700'],['Zwart','#111'],['Grijs','rgba(180,180,180,0.8)']].map(([label, val]) => (
          <button key={label} onClick={() => setNumColor(val)} style={{ padding: '3px 8px', borderRadius: '4px', border: numColor === val ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.1)', background: val || 'linear-gradient(135deg,#FFD700 50%,#f97316 50%)', color: val === '#111' ? '#fff' : val === '#ffffff' ? '#000' : '#000', fontSize: '9px', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minWidth: '38px' }}>
            {label}
          </button>
        ))}
      </ControlRow>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ marginTop: '8px', background: '#111', borderRadius: '8px', overflow: 'hidden', maxWidth: '420px' }}>
        {hasData
          ? <canvas ref={previewRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          : <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Onvoldoende data</div>
        }
      </div>
    </div>
  )
}

// ─── PR CHART ────────────────────────────────────────────────────────────────
function PRChart({ client, prsByExercise }) {
  const canvasRef  = useRef(null)
  const previewRef = useRef(null)
  const exercises  = Object.keys(prsByExercise)
  const [exercise, setExercise] = useState(exercises[0] || '')
  const [showName, setShowName]     = useState(false)
  const [bg, setBg]                 = useState('transparent')
  const [showPill, setShowPill]     = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showKg, setShowKg]         = useState(true)
  const [showChart, setShowChart]   = useState(true)
  const [numColor, setNumColor]       = useState(null)
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  const records = useMemo(() => prsByExercise[exercise] || [], [exercise, prsByExercise])
  const minDate = records[0]?.date || ''
  const maxDate = records[records.length - 1]?.date || ''

  useEffect(() => { setDateFrom(minDate); setDateTo(maxDate) }, [exercise, minDate, maxDate])

  const filtered = useMemo(() =>
    records.filter(r => (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)),
    [records, dateFrom, dateTo]
  )

  function buildParams(data, ex, cl) {
    const vals  = data.map(r => r.weight)
    const diff  = parseFloat((vals[vals.length - 1] - vals[0]).toFixed(1))
    const days  = Math.round((new Date(data[data.length - 1].date) - new Date(data[0].date)) / 86400000)
    const weeks = Math.round(days / 7)
    return {
      vals,
      firstDate:   data[0].date,
      lastDate:    data[data.length - 1].date,
      diffStr:     '+' + diff.toFixed(1) + 'kg',
      durStr:      weeks >= 2 ? `in ${weeks} weken` : `in ${days} dagen`,
      pillText:    (ex.substring(0, 22) + ' · MY ARC').toUpperCase(),
      showName, clientName: cl ? cl.first_name + ' ' + (cl.last_name || '') : '',
      accentColor: '#f97316',
      bg, showPill, showLabels, showKg, showChart, numColor,
    }
  }

  useEffect(() => {
    if (previewRef.current && filtered.length >= 2) {
      const c = previewRef.current; c.width = 480; c.height = 320
      drawResultCard(c.getContext('2d'), 480, 320, buildParams(filtered, exercise, client))
    }
  }, [filtered, showName, bg, showPill, showLabels, showKg, showChart, numColor, exercise, client])

  function download() {
    if (filtered.length < 2) return
    const c = canvasRef.current; c.width = 900; c.height = 480
    drawResultCard(c.getContext('2d'), 900, 480, buildParams(filtered, exercise, client))
    dlCanvas(c, `myarc-pr-${exercise.toLowerCase().replace(/\s+/g, '-')}.png`)
  }

  const hasData = filtered.length >= 2

  if (!exercises.length) return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>💪 PR progressie</div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Geen PR data gevonden.</div>
    </div>
  )

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '4px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>💪 PR progressie</div>
      <ControlRow>
        <Lbl>Oefening</Lbl>
        <select value={exercise} onChange={e => setExercise(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer', maxWidth: isMobile ? '140px' : '220px' }}>
          {exercises.map(ex => <option key={ex} value={ex} style={{ background: '#111' }}>{ex}</option>)}
        </select>
        <Lbl>Van</Lbl><DateInput value={dateFrom} onChange={setDateFrom} min={minDate} max={dateTo || maxDate} />
        <Lbl>Tot</Lbl><DateInput value={dateTo} onChange={setDateTo} min={dateFrom || minDate} max={maxDate} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={!hasData}>Download PNG</DlBtn>
      </ControlRow>
      <ControlRow>
        <Lbl>Achtergrond</Lbl>
        {['transparent','black','white'].map(b => (
          <button key={b} onClick={() => setBg(b)} style={{ padding: '4px 10px', borderRadius: '5px', border: bg === b ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)', background: b === 'black' ? '#0a0a0a' : b === 'white' ? '#fff' : 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 0 0 / 8px 8px', color: b === 'white' ? '#000' : '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer', minWidth: '52px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            {b === 'transparent' ? 'Transp.' : b === 'black' ? 'Zwart' : 'Wit'}
          </button>
        ))}
        <Toggle label="Naam" value={showName} onChange={setShowName} />
      </ControlRow>
      <ControlRow>
        <Lbl>Elementen</Lbl>
        <Toggle label="Pill" value={showPill} onChange={setShowPill} />
        <Toggle label="Labels" value={showLabels} onChange={setShowLabels} />
        <Toggle label="kg" value={showKg} onChange={setShowKg} />
        <Toggle label="Grafiek" value={showChart} onChange={setShowChart} />
      </ControlRow>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ marginTop: '8px', background: '#111', borderRadius: '8px', overflow: 'hidden', maxWidth: '420px' }}>
        {hasData
          ? <canvas ref={previewRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          : <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Onvoldoende data</div>
        }
      </div>
    </div>
  )
}

// ─── FOTO VERGELIJKING ────────────────────────────────────────────────────────
function PhotoComparison({ client, photos }) {
  const canvasRef  = useRef(null)
  const previewRef = useRef(null)
  const [firstIdx, setFirstIdx] = useState(0)
  const [lastIdx, setLastIdx]   = useState(Math.max(0, photos.length - 1))
  const [showName, setShowName] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => { setFirstIdx(0); setLastIdx(Math.max(0, photos.length - 1)) }, [client?.id, photos.length])
  useEffect(() => { if (photos.length >= 2) renderPreview() }, [firstIdx, lastIdx, showName, photos])

  async function loadImg(url) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = 'anonymous'
      img.onload = () => res(img)
      img.onerror = () => rej(new Error('Foto laden mislukt — check Supabase Storage CORS'))
      img.src = url + '?t=' + Date.now()
    })
  }

  async function drawComp(canvas, W, H) {
    const ctx = canvas.getContext('2d')
    canvas.width = W; canvas.height = H
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)
    const p1 = photos[firstIdx], p2 = photos[lastIdx]
    const [img1, img2] = await Promise.all([loadImg(p1.photo_url), loadImg(p2.photo_url)])
    const photoW = Math.floor(W / 2) - 2, photoH = H - 56
    const drawP = (img, x) => {
      const sc = Math.min(photoW / img.width, photoH / img.height)
      ctx.drawImage(img, x + (photoW - img.width * sc) / 2, 40 + (photoH - img.height * sc) / 2, img.width * sc, img.height * sc)
    }
    drawP(img1, 0); drawP(img2, photoW + 4)
    ctx.strokeStyle = 'rgba(255,215,0,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(W / 2, 30); ctx.lineTo(W / 2, H - 8); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = GOLD; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'
    ctx.fillText('BEFORE', photoW / 2, 22); ctx.fillText('AFTER', photoW + 4 + photoW / 2, 22)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = 'bold 11px Arial'
    ctx.fillText(fmtShort(p1.photo_date), photoW / 2, 36)
    ctx.fillText(fmtShort(p2.photo_date), photoW + 4 + photoW / 2, 36)
    if (showName) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left'
      ctx.fillText(client.first_name + ' ' + (client.last_name || ''), 12, 16)
    }
    ctx.fillStyle = GOLD; rr(ctx, W / 2 - 70, H - 26, 140, 20, 10); ctx.fill()
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'
    ctx.fillText('MY ARC · CLIENT RESULTS', W / 2, H - 12)
  }

  async function renderPreview() {
    if (!previewRef.current || photos.length < 2) return
    setError(null)
    try { await drawComp(previewRef.current, 480, 360) } catch (e) { setError(e.message) }
  }

  async function download() {
    if (photos.length < 2) return
    setLoading(true); setError(null)
    try { await drawComp(canvasRef.current, 900, 680); dlCanvas(canvasRef.current, `myarc-foto-${client.first_name.toLowerCase()}.png`) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  if (!photos.length) return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>📸 Foto vergelijking</div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Geen progress foto's gevonden.</div>
    </div>
  )
  if (photos.length < 2) return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>📸 Foto vergelijking</div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Minimaal 2 foto's nodig ({photos.length} beschikbaar).</div>
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>📸 Foto vergelijking</div>
      <ControlRow>
        <Lbl>Before</Lbl>
        <select value={firstIdx} onChange={e => setFirstIdx(Number(e.target.value))}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
          {photos.map((p, i) => <option key={i} value={i} style={{ background: '#111' }}>{fmtShort(p.photo_date)}</option>)}
        </select>
        <Lbl>After</Lbl>
        <select value={lastIdx} onChange={e => setLastIdx(Number(e.target.value))}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
          {photos.map((p, i) => <option key={i} value={i} style={{ background: '#111' }}>{fmtShort(p.photo_date)}</option>)}
        </select>
        <Toggle label="Naam" value={showName} onChange={setShowName} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={loading || firstIdx === lastIdx}>{loading ? 'Even geduld...' : 'Download PNG'}</DlBtn>
      </ControlRow>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {error && <div style={{ margin: '6px 0', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '10px', color: '#ef4444' }}>{error}<br /><span style={{ opacity: 0.7 }}>Tip: Supabase Storage → CORS → Origin: *, Methods: GET</span></div>}
      <div style={{ marginTop: '8px', background: '#111', borderRadius: '8px', overflow: 'hidden', maxWidth: '420px' }}>
        <canvas ref={previewRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ExportTab({ client, data }) {
  if (!client) return <Empty text="Selecteer een client" />
  if (!data)   return <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>Laden...</div>
  return (
    <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <WeightChart client={client} weights={data.weights} />
      <PRChart client={client} prsByExercise={data.prsByExercise} />
      <PhotoComparison client={client} photos={data.photos} />
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>{text}</div>
}
