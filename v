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

// ─── COMBINED: Card + Chart ───────────────────────────────────────────────────
function WeightChart({ client, weights }) {
  const canvasRef  = useRef(null)
  const previewRef = useRef(null)
  const [showName, setShowName] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  const minDate = weights[0]?.date || ''
  const maxDate = weights[weights.length-1]?.date || ''

  useEffect(() => { setDateFrom(minDate); setDateTo(maxDate) }, [client?.id, minDate, maxDate])

  const filtered = useMemo(() =>
    weights.filter(w => (!dateFrom || w.date >= dateFrom) && (!dateTo || w.date <= dateTo)),
    [weights, dateFrom, dateTo]
  )

  useEffect(() => {
    if (previewRef.current && filtered.length >= 2) draw(previewRef.current, filtered, client, showName, 480, 256)
  }, [filtered, showName, client])

  function draw(canvas, data, cl, showN, W, H) {
    const ctx = canvas.getContext('2d')
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)

    const vals     = data.map(w => w.weight)
    const first    = vals[0]
    const last     = vals[vals.length - 1]
    const diff     = parseFloat((last - first).toFixed(1))
    const diffStr  = (diff < 0 ? '' : '+') + diff + 'kg'
    const days     = Math.round((new Date(data[data.length-1].date) - new Date(data[0].date)) / 86400000)
    const weeks    = Math.round(days / 7)
    const durStr   = weeks >= 2 ? `in ${weeks} weken` : `in ${days} dagen`
    const large    = W > 400
    const s        = large ? 1 : 0.56

    // ── Afmetingen ──
    // Card sectie: bovenste 62%
    // Chart sectie: onderste 38%
    const chartTop  = Math.round(H * 0.44)
    const pl = Math.round(18*s), pr = Math.round(18*s), pb = Math.round(16*s)
    const iW = W - pl - pr
    const iH = H - chartTop - pb
    const { minV, maxV } = getYRange(vals)
    const toX = i => pl + (i / Math.max(vals.length-1, 1)) * iW
    const toY = v => chartTop + iH - ((v - minV) / (maxV - minV)) * iH

    // ── Pill bovenin center ──
    const pillH  = Math.round(14*s)
    const pillSz = Math.round(8*s)
    ctx.font = `bold ${pillSz}px Arial`
    const pillTxt = 'CLIENT RESULTS · MY ARC'
    const tw = ctx.measureText(pillTxt).width
    ctx.fillStyle = GOLD; rr(ctx, W/2 - tw/2 - 10, 12, tw + 20, pillH, pillH/2); ctx.fill()
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(pillTxt, W/2, 12 + pillSz + 2)

    // Naam
    if (showN) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `bold ${Math.round(9*s)}px Arial`
      ctx.fillText(cl.first_name + ' ' + (cl.last_name || ''), W/2, 12 + pillH + Math.round(12*s))
    }

    // ── BEFORE / AFTER nummers ──
    const numSz  = Math.round(large ? 58 : 34)
    const lblSz  = Math.round(large ? 10 : 7)
    const numY   = Math.round(12 + pillH + (large ? 54 : 34))

    // BEFORE label
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = `bold ${lblSz}px Arial`
    ctx.textAlign = 'left'; ctx.fillText('BEFORE', pl, numY - numSz - 2)
    // BEFORE getal
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `bold ${numSz}px Arial`
    ctx.fillText(first.toFixed(1), pl, numY)
    // kg unit
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `bold ${Math.round(numSz*0.3)}px Arial`
    const bw = ctx.measureText(first.toFixed(1)).width
    ctx.fillText('kg', pl + bw + 3, numY - Math.round(numSz*0.15))

    // Arrow center
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = `bold ${Math.round(numSz*0.85)}px Arial`
    ctx.textAlign = 'center'; ctx.fillText('→', W/2, numY - Math.round(numSz*0.5))

    // AFTER label
    ctx.fillStyle = 'rgba(255,215,0,0.5)'; ctx.font = `bold ${lblSz}px Arial`
    ctx.textAlign = 'right'; ctx.fillText('AFTER', W - pr, numY - numSz - 2)
    // AFTER getal
    ctx.fillStyle = GOLD; ctx.font = `bold ${numSz}px Arial`
    ctx.fillText(last.toFixed(1), W - pr, numY)
    // kg unit
    ctx.fillStyle = 'rgba(255,215,0,0.4)'; ctx.font = `bold ${Math.round(numSz*0.3)}px Arial`
    ctx.fillText('kg', W - pr + 2, numY - Math.round(numSz*0.15))

    // ── Hero diff + duur center ──
    const heroSz = Math.round(large ? 72 : 42)
    const durSz  = Math.round(large ? 24 : 15)
    const heroY  = numY + Math.round(large ? 18 : 12)

    ctx.fillStyle = GOLD; ctx.font = `bold ${heroSz}px Arial`; ctx.textAlign = 'center'
    ctx.fillText(diffStr, W/2, heroY + heroSz)

    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = `bold ${durSz}px Arial`
    ctx.fillText(durStr, W/2, heroY + heroSz + durSz + Math.round(4*s))

    // ── Scheidingslijn ──
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pl, chartTop - 4); ctx.lineTo(W - pr, chartTop - 4); ctx.stroke()

    // ── Chart: area ──
    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(vals.length-1), H); ctx.lineTo(toX(0), H); ctx.closePath()
    ctx.fillStyle = 'rgba(255,215,0,0.06)'; ctx.fill()

    // ── Chart: lijn ──
    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.strokeStyle = GOLD; ctx.lineWidth = large ? 2.5 : 1.5; ctx.lineJoin = 'round'; ctx.stroke()

    // ── Dots ──
    const dotR = large ? 5 : 3
    ;[[0, vals[0]], [vals.length-1, vals[vals.length-1]]].forEach(([i, v]) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(v), dotR, 0, Math.PI*2); ctx.fillStyle = GOLD; ctx.fill()
    })

    // ── Datum labels ──
    const dSz = Math.round(large ? 10 : 7)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${dSz}px Arial`
    ctx.textAlign = 'left';  ctx.fillText(fmtShort(data[0].date), toX(0), H - 3)
    ctx.textAlign = 'right'; ctx.fillText(fmtShort(data[data.length-1].date), toX(vals.length-1), H - 3)
  }

  function download() {
    if (filtered.length < 2) return
    draw(canvasRef.current, filtered, client, showName, 900, 460)
    dlCanvas(canvasRef.current, `myarc-gewicht-${client.first_name.toLowerCase()}.png`)
  }

  const hasData = filtered.length >= 2

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '4px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>📉 Gewicht</div>
      <ControlRow>
        <Lbl>Van</Lbl><DateInput value={dateFrom} onChange={setDateFrom} min={minDate} max={dateTo||maxDate} />
        <Lbl>Tot</Lbl><DateInput value={dateTo} onChange={setDateTo} min={dateFrom||minDate} max={maxDate} />
        <Toggle label="Naam" value={showName} onChange={setShowName} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={!hasData}>Download PNG</DlBtn>
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
  const [showName, setShowName] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  const records = useMemo(() => prsByExercise[exercise] || [], [exercise, prsByExercise])
  const minDate = records[0]?.date || ''
  const maxDate = records[records.length-1]?.date || ''

  useEffect(() => { setDateFrom(minDate); setDateTo(maxDate) }, [exercise, minDate, maxDate])

  const filtered = useMemo(() =>
    records.filter(r => (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)),
    [records, dateFrom, dateTo]
  )

  useEffect(() => {
    if (previewRef.current && filtered.length >= 2) draw(previewRef.current, filtered, exercise, client, showName, 480, 256)
  }, [filtered, showName, exercise, client])

  function draw(canvas, data, ex, cl, showN, W, H) {
    const ctx = canvas.getContext('2d')
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)

    const vals    = data.map(r => r.weight)
    const first   = vals[0]
    const last    = vals[vals.length-1]
    const diff    = parseFloat((last - first).toFixed(1))
    const days    = Math.round((new Date(data[data.length-1].date) - new Date(data[0].date)) / 86400000)
    const weeks   = Math.round(days / 7)
    const durStr  = weeks >= 2 ? `in ${weeks} weken` : `in ${days} dagen`
    const large   = W > 400
    const s       = large ? 1 : 0.56
    const ACC     = '#f97316'

    const chartTop = Math.round(H * 0.44)
    const pl = Math.round(18*s), pr = Math.round(18*s), pb = Math.round(16*s)
    const iW = W - pl - pr, iH = H - chartTop - pb
    const { minV, maxV } = getYRange(vals)
    const toX = i => pl + (i / Math.max(vals.length-1, 1)) * iW
    const toY = v => chartTop + iH - ((v - minV) / (maxV - minV)) * iH

    // Pill
    const pillH  = Math.round(14*s), pillSz = Math.round(8*s)
    ctx.font = `bold ${pillSz}px Arial`
    const pt = (ex.substring(0, 24) + ' · MY ARC').toUpperCase()
    const tw = ctx.measureText(pt).width
    ctx.fillStyle = ACC; rr(ctx, W/2 - tw/2 - 10, 12, tw+20, pillH, pillH/2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(pt, W/2, 12+pillSz+2)

    if (showN) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `bold ${Math.round(9*s)}px Arial`
      ctx.fillText(cl.first_name + ' ' + (cl.last_name || ''), W/2, 12+pillH+Math.round(12*s))
    }

    const numSz = Math.round(large ? 58 : 34)
    const lblSz = Math.round(large ? 10 : 7)
    const numY  = Math.round(12 + pillH + (large ? 54 : 34))

    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = `bold ${lblSz}px Arial`
    ctx.textAlign = 'left'; ctx.fillText('BEFORE', pl, numY - numSz - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `bold ${numSz}px Arial`
    ctx.fillText(first.toFixed(1), pl, numY)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `bold ${Math.round(numSz*0.3)}px Arial`
    ctx.fillText('kg', pl + ctx.measureText(first.toFixed(1)).width + 3, numY - Math.round(numSz*0.15))

    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = `bold ${Math.round(numSz*0.85)}px Arial`
    ctx.textAlign = 'center'; ctx.fillText('→', W/2, numY - Math.round(numSz*0.5))

    ctx.fillStyle = 'rgba(249,115,22,0.5)'; ctx.font = `bold ${lblSz}px Arial`
    ctx.textAlign = 'right'; ctx.fillText('AFTER', W-pr, numY - numSz - 2)
    ctx.fillStyle = ACC; ctx.font = `bold ${numSz}px Arial`
    ctx.fillText(last.toFixed(1), W-pr, numY)
    ctx.fillStyle = 'rgba(249,115,22,0.4)'; ctx.font = `bold ${Math.round(numSz*0.3)}px Arial`
    ctx.fillText('kg', W-pr+2, numY - Math.round(numSz*0.15))

    const heroSz = Math.round(large ? 72 : 42)
    const durSz  = Math.round(large ? 24 : 15)
    const heroY  = numY + Math.round(large ? 18 : 12)

    ctx.fillStyle = ACC; ctx.font = `bold ${heroSz}px Arial`; ctx.textAlign = 'center'
    ctx.fillText('+' + diff.toFixed(1) + 'kg', W/2, heroY + heroSz)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = `bold ${durSz}px Arial`
    ctx.fillText(durStr, W/2, heroY + heroSz + durSz + Math.round(4*s))

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pl, chartTop-4); ctx.lineTo(W-pr, chartTop-4); ctx.stroke()

    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(vals.length-1), H); ctx.lineTo(toX(0), H); ctx.closePath()
    ctx.fillStyle = 'rgba(249,115,22,0.06)'; ctx.fill()

    ctx.beginPath(); ctx.moveTo(toX(0), toY(vals[0]))
    vals.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.strokeStyle = ACC; ctx.lineWidth = large ? 2.5 : 1.5; ctx.lineJoin = 'round'; ctx.stroke()

    const dotR = large ? 5 : 3
    ;[[0, vals[0]], [vals.length-1, vals[vals.length-1]]].forEach(([i, v]) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(v), dotR, 0, Math.PI*2); ctx.fillStyle = ACC; ctx.fill()
    })

    const dSz = Math.round(large ? 10 : 7)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = `${dSz}px Arial`
    ctx.textAlign = 'left';  ctx.fillText(fmtShort(data[0].date), toX(0), H-3)
    ctx.textAlign = 'right'; ctx.fillText(fmtShort(data[data.length-1].date), toX(vals.length-1), H-3)
  }

  function download() {
    if (filtered.length < 2) return
    draw(canvasRef.current, filtered, exercise, client, showName, 900, 460)
    dlCanvas(canvasRef.current, `myarc-pr-${exercise.toLowerCase().replace(/\s+/g,'-')}.png`)
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
        <Lbl>Van</Lbl><DateInput value={dateFrom} onChange={setDateFrom} min={minDate} max={dateTo||maxDate} />
        <Lbl>Tot</Lbl><DateInput value={dateTo} onChange={setDateTo} min={dateFrom||minDate} max={maxDate} />
        <Toggle label="Naam" value={showName} onChange={setShowName} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={!hasData}>Download PNG</DlBtn>
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
  const [lastIdx, setLastIdx]   = useState(Math.max(0, photos.length-1))
  const [showName, setShowName] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => { setFirstIdx(0); setLastIdx(Math.max(0, photos.length-1)) }, [client?.id, photos.length])
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
    const photoW = Math.floor(W/2)-2, photoH = H-56
    const drawP = (img, x) => {
      const sc = Math.min(photoW/img.width, photoH/img.height)
      ctx.drawImage(img, x+(photoW-img.width*sc)/2, 40+(photoH-img.height*sc)/2, img.width*sc, img.height*sc)
    }
    drawP(img1, 0); drawP(img2, photoW+4)
    ctx.strokeStyle='rgba(255,215,0,0.15)'; ctx.lineWidth=1; ctx.setLineDash([4,4])
    ctx.beginPath(); ctx.moveTo(W/2,30); ctx.lineTo(W/2,H-8); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle=GOLD; ctx.font='bold 14px Arial'; ctx.textAlign='center'
    ctx.fillText('BEFORE', photoW/2, 22); ctx.fillText('AFTER', photoW+4+photoW/2, 22)
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='bold 11px Arial'
    ctx.fillText(fmtShort(p1.photo_date), photoW/2, 36); ctx.fillText(fmtShort(p2.photo_date), photoW+4+photoW/2, 36)
    if (showName) { ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font='bold 12px Arial'; ctx.textAlign='left'; ctx.fillText(client.first_name+' '+(client.last_name||''), 12, 16) }
    ctx.fillStyle=GOLD; rr(ctx, W/2-70, H-26, 140, 20, 10); ctx.fill()
    ctx.fillStyle='#000'; ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.fillText('MY ARC · CLIENT RESULTS', W/2, H-12)
  }

  async function renderPreview() {
    if (!previewRef.current || photos.length < 2) return
    setError(null); try { await drawComp(previewRef.current, 480, 360) } catch(e) { setError(e.message) }
  }

  async function download() {
    if (photos.length < 2) return
    setLoading(true); setError(null)
    try { await drawComp(canvasRef.current, 900, 680); dlCanvas(canvasRef.current, `myarc-foto-${client.first_name.toLowerCase()}.png`) }
    catch(e) { setError(e.message) }
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
          {photos.map((p,i) => <option key={i} value={i} style={{ background: '#111' }}>{fmtShort(p.photo_date)}</option>)}
        </select>
        <Lbl>After</Lbl>
        <select value={lastIdx} onChange={e => setLastIdx(Number(e.target.value))}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
          {photos.map((p,i) => <option key={i} value={i} style={{ background: '#111' }}>{fmtShort(p.photo_date)}</option>)}
        </select>
        <Toggle label="Naam" value={showName} onChange={setShowName} />
        <div style={{ flex: 1 }} />
        <DlBtn onClick={download} disabled={loading||firstIdx===lastIdx}>{loading ? 'Even geduld...' : 'Download PNG'}</DlBtn>
      </ControlRow>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {error && <div style={{ margin: '6px 0', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '10px', color: '#ef4444' }}>{error}<br/><span style={{ opacity: 0.7 }}>Tip: Supabase Storage → CORS → Origin: *, Methods: GET</span></div>}
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
