// src/modules/results/components/CardGeneratorTab.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react'

const isMobile = window.innerWidth <= 768
const GOLD = '#FFD700'

// ─── Google Fonts laden voor canvas ──────────────────────────────────────────
const FONTS = [
  { label: 'Classic (Georgia)',   value: 'Georgia',       google: false },
  { label: 'Modern (Arial)',      value: 'Arial',         google: false },
  { label: 'Anton',               value: 'Anton',         google: true  },
  { label: 'Poppins',             value: 'Poppins',       google: true  },
  { label: 'Oswald',              value: 'Oswald',        google: true  },
  { label: 'Bebas Neue',          value: 'Bebas Neue',    google: true  },
  { label: 'Montserrat',          value: 'Montserrat',    google: true  },
  { label: 'Impact',              value: 'Impact',        google: false },
  { label: 'Times New Roman',     value: 'Times New Roman', google: false },
]

async function ensureFontsLoaded() {
  const googleFonts = FONTS.filter(f => f.google).map(f => f.value.replace(' ', '+'))
  if (googleFonts.length === 0) return
  const id = 'card-composer-gfonts'
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${googleFonts.map(f => f + ':wght@400;700').join('&family=')}&display=swap`
    document.head.appendChild(link)
  }
  await document.fonts.ready
}

// ─── Canvas helper ────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y)
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r)
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h)
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r)
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
}

function drawBg(ctx, cx, y, w, h, hex, opacity, radius) {
  if (opacity <= 0) return
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  ctx.fillStyle = `rgba(${r},${g},${b},${opacity/100})`
  rr(ctx, cx - w/2, y - h + h*0.1, w, h, radius)
  ctx.fill()
}

const GOAL_CONFIG = {
  weight_loss:  { detect: ['weight_down'] },
  fat_loss:     { detect: ['weight_down'] },
  muscle_gain:  { detect: ['weight_up', 'pr'] },
  recomp:       { detect: ['pr'] },
  strength:     { detect: ['pr'] },
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function SLabel({ children }) {
  return <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: '5px' }}>{children}</div>
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!value)} style={{ width: '26px', height: '14px', borderRadius: '7px', background: value ? GOLD : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '14px' : '2px', width: '10px', height: '10px', borderRadius: '50%', background: value ? '#000' : 'rgba(255,255,255,0.4)', transition: 'left 0.12s' }} />
      </div>
      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
    </label>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', flexShrink: 0, minWidth: '60px' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: GOLD, cursor: 'pointer', height: '2px' }} />
      <span style={{ fontSize: '9px', color: GOLD, fontWeight: 700, minWidth: '28px', textAlign: 'right' }}>{value}{unit}</span>
    </div>
  )
}

function TInput({ value, onChange, rows = 1 }) {
  if (rows > 1) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '6px 8px', borderRadius: '5px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
  )
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '6px 8px', borderRadius: '5px', outline: 'none', fontFamily: 'inherit' }} />
  )
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <SLabel>{title}</SLabel>
      {children}
    </div>
  )
}

// ─── Default settings ─────────────────────────────────────────────────────────
const DEFAULT = {
  titleText: 'KLANT RESULTATEN', beforeLabel: 'BEFORE', afterLabel: 'AFTER',
  durOverride: '', bottomText: 'DM me "RESULT" voor meer info',
  showTitle: true, showLabels: true, showKg: true, showDur: true, showBottom: true,
  numScale: 18, heroScale: 16, titleScale: 6.5, bottomScale: 3.8,
  dmFont: 'Georgia', dmBold: true, dmBg: '#000000', dmBgOpacity: 70, dmColor: '#ffffff', dmRadius: 40,
  titleFont: 'Arial', titleBold: true, titleColor: '#FFD700',
  titleBg: '#000000', titleBgOpacity: 0, titleBgRadius: 10,
  numBg: '#000000', numBgOpacity: 0, numBgRadius: 10,
  heroBg: '#000000', heroBgOpacity: 0, heroBgRadius: 10,
  titleY: 10, numY: 42, heroY: 62, bottomY: 92, overlayOpacity: 55,
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CardGeneratorTab({ client, data, db }) {
  const [selected, setSelected]         = useState(null)
  const [downloading, setDownloading]   = useState(false)

  // Foto
  const [photos, setPhotos]             = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // '3/62'
  const [photosOpen, setPhotosOpen]     = useState(false)
  const [coachId, setCoachId]           = useState(null)

  // Settings — spread DEFAULT
  const [titleText, setTitleText]       = useState(DEFAULT.titleText)
  const [beforeLabel, setBeforeLabel]   = useState(DEFAULT.beforeLabel)
  const [afterLabel, setAfterLabel]     = useState(DEFAULT.afterLabel)
  const [durOverride, setDurOverride]   = useState(DEFAULT.durOverride)
  const [bottomText, setBottomText]     = useState(DEFAULT.bottomText)
  const [showTitle, setShowTitle]       = useState(DEFAULT.showTitle)
  const [showLabels, setShowLabels]     = useState(DEFAULT.showLabels)
  const [showKg, setShowKg]             = useState(DEFAULT.showKg)
  const [showDur, setShowDur]           = useState(DEFAULT.showDur)
  const [showBottom, setShowBottom]     = useState(DEFAULT.showBottom)
  const [numScale, setNumScale]         = useState(DEFAULT.numScale)
  const [heroScale, setHeroScale]       = useState(DEFAULT.heroScale)
  const [titleScale, setTitleScale]     = useState(DEFAULT.titleScale)
  const [bottomScale, setBottomScale]   = useState(DEFAULT.bottomScale)
  const [dmFont, setDmFont]             = useState(DEFAULT.dmFont)
  const [dmBold, setDmBold]             = useState(DEFAULT.dmBold)
  const [dmBg, setDmBg]                 = useState(DEFAULT.dmBg)
  const [dmBgOpacity, setDmBgOpacity]   = useState(DEFAULT.dmBgOpacity)
  const [dmColor, setDmColor]           = useState(DEFAULT.dmColor)
  const [dmRadius, setDmRadius]         = useState(DEFAULT.dmRadius)
  const [titleFont, setTitleFont]       = useState(DEFAULT.titleFont)
  const [titleBold, setTitleBold]       = useState(DEFAULT.titleBold)
  const [titleColor, setTitleColor]     = useState(DEFAULT.titleColor)
  const [titleBg, setTitleBg]           = useState(DEFAULT.titleBg)
  const [titleBgOpacity, setTitleBgOpacity] = useState(DEFAULT.titleBgOpacity)
  const [titleBgRadius, setTitleBgRadius] = useState(DEFAULT.titleBgRadius)
  const [numBg, setNumBg]               = useState(DEFAULT.numBg)
  const [numBgOpacity, setNumBgOpacity] = useState(DEFAULT.numBgOpacity)
  const [numBgRadius, setNumBgRadius]   = useState(DEFAULT.numBgRadius)
  const [heroBg, setHeroBg]             = useState(DEFAULT.heroBg)
  const [heroBgOpacity, setHeroBgOpacity] = useState(DEFAULT.heroBgOpacity)
  const [heroBgRadius, setHeroBgRadius] = useState(DEFAULT.heroBgRadius)
  const [titleY, setTitleY]             = useState(DEFAULT.titleY)
  const [numY, setNumY]                 = useState(DEFAULT.numY)
  const [heroY, setHeroY]               = useState(DEFAULT.heroY)
  const [bottomY, setBottomY]           = useState(DEFAULT.bottomY)
  const [overlayOpacity, setOverlayOpacity] = useState(DEFAULT.overlayOpacity)

  // Presets
  const [presets, setPresets]           = useState([])
  const [presetName, setPresetName]     = useState('')
  const [savingPreset, setSavingPreset] = useState(false)
  const [showPresetInput, setShowPresetInput] = useState(false)

  const canvasRef  = useRef(null)
  const previewRef = useRef(null)
  const fileRef    = useRef(null)

  // Load fonts on mount
  useEffect(() => { ensureFontsLoaded() }, [])

  useEffect(() => {
    if (!db) return
    db.getCurrentUser().then(u => {
      if (u) { setCoachId(u.id); loadPhotos(u.id); loadPresets(u.id) }
    }).catch(console.error)
  }, [db])

  useEffect(() => { buildPreview() },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [titleText, beforeLabel, afterLabel, durOverride, bottomText,
     showTitle, showLabels, showKg, showDur, showBottom,
     numScale, heroScale, titleScale, bottomScale,
     dmFont, dmBold, dmBg, dmBgOpacity, dmColor, dmRadius,
     titleFont, titleBold, titleColor, titleBg, titleBgOpacity, titleBgRadius, numBg, numBgOpacity, numBgRadius, heroBg, heroBgOpacity, heroBgRadius,
     titleY, numY, heroY, bottomY, overlayOpacity,
     selectedPhoto, selected])

  // ── Photos ──────────────────────────────────────────────────────────────────
  async function loadPhotos(uid) {
    try {
      const { data: files } = await db.supabase.storage
        .from('coach-photos').list(uid + '/', { sortBy: { column: 'created_at', order: 'desc' } })
      if (!files) return
      const urls = files.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
        const { data: u } = db.supabase.storage.from('coach-photos').getPublicUrl(uid + '/' + f.name)
        return { name: f.name, url: u.publicUrl }
      })
      setPhotos(urls)
      if (urls.length && !selectedPhoto) setSelectedPhoto(urls[0])
    } catch (e) { console.error(e) }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length || !coachId) return
    setUploading(true)
    setUploadProgress(`0/${files.length}`)
    let done = 0
    // Upload in batches of 5 parallel
    const batchSize = 5
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      await Promise.all(batch.map(async file => {
        try {
          const ext = file.name.split('.').pop()
          await db.supabase.storage.from('coach-photos').upload(`${coachId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`, file)
        } catch (err) { console.error('Upload failed:', file.name, err) }
        done++
        setUploadProgress(`${done}/${files.length}`)
      }))
    }
    await loadPhotos(coachId)
    setUploading(false)
    setUploadProgress(null)
    e.target.value = ''
  }

  async function deletePhoto(name) {
    if (!coachId) return
    await db.supabase.storage.from('coach-photos').remove([`${coachId}/${name}`])
    const updated = photos.filter(p => p.name !== name)
    setPhotos(updated)
    if (selectedPhoto?.name === name) setSelectedPhoto(updated[0] || null)
  }

  // ── Presets ─────────────────────────────────────────────────────────────────
  async function loadPresets(uid) {
    const { data } = await db.supabase
      .from('card_composer_presets')
      .select('id, name, settings')
      .eq('coach_id', uid)
      .order('created_at', { ascending: false })
    setPresets(data || [])
  }

  function getCurrentSettings() {
    return { titleText, beforeLabel, afterLabel, durOverride, bottomText, showTitle, showLabels, showKg, showDur, showBottom, numScale, heroScale, titleScale, bottomScale, dmFont, dmBold, dmBg, dmBgOpacity, dmColor, dmRadius, titleFont, titleBold, titleColor, titleBg, titleBgOpacity, titleBgRadius, numBg, numBgOpacity, numBgRadius, heroBg, heroBgOpacity, heroBgRadius, titleY, numY, heroY, bottomY, overlayOpacity }
  }

  async function savePreset() {
    if (!presetName.trim() || !coachId) return
    setSavingPreset(true)
    await db.supabase.from('card_composer_presets').insert({
      coach_id: coachId, name: presetName.trim(), settings: getCurrentSettings()
    })
    setPresetName(''); setShowPresetInput(false)
    await loadPresets(coachId)
    setSavingPreset(false)
  }

  async function deletePreset(id) {
    await db.supabase.from('card_composer_presets').delete().eq('id', id)
    setPresets(prev => prev.filter(p => p.id !== id))
  }

  function applyPreset(s) {
    setTitleText(s.titleText ?? DEFAULT.titleText)
    setBeforeLabel(s.beforeLabel ?? DEFAULT.beforeLabel)
    setAfterLabel(s.afterLabel ?? DEFAULT.afterLabel)
    setDurOverride(s.durOverride ?? DEFAULT.durOverride)
    setBottomText(s.bottomText ?? DEFAULT.bottomText)
    setShowTitle(s.showTitle ?? DEFAULT.showTitle)
    setShowLabels(s.showLabels ?? DEFAULT.showLabels)
    setShowKg(s.showKg ?? DEFAULT.showKg)
    setShowDur(s.showDur ?? DEFAULT.showDur)
    setShowBottom(s.showBottom ?? DEFAULT.showBottom)
    setNumScale(s.numScale ?? DEFAULT.numScale)
    setHeroScale(s.heroScale ?? DEFAULT.heroScale)
    setTitleScale(s.titleScale ?? DEFAULT.titleScale)
    setBottomScale(s.bottomScale ?? DEFAULT.bottomScale)
    setDmFont(s.dmFont ?? DEFAULT.dmFont)
    setDmBold(s.dmBold ?? DEFAULT.dmBold)
    setDmBg(s.dmBg ?? DEFAULT.dmBg)
    setDmBgOpacity(s.dmBgOpacity ?? DEFAULT.dmBgOpacity)
    setDmRadius(s.dmRadius ?? DEFAULT.dmRadius)
    setTitleFont(s.titleFont ?? DEFAULT.titleFont)
    setTitleBold(s.titleBold ?? DEFAULT.titleBold)
    setTitleColor(s.titleColor ?? DEFAULT.titleColor)
    setTitleBg(s.titleBg ?? DEFAULT.titleBg)
    setTitleBgOpacity(s.titleBgOpacity ?? DEFAULT.titleBgOpacity)
    setTitleBgRadius(s.titleBgRadius ?? DEFAULT.titleBgRadius)
    setNumBg(s.numBg ?? DEFAULT.numBg)
    setNumBgOpacity(s.numBgOpacity ?? DEFAULT.numBgOpacity)
    setNumBgRadius(s.numBgRadius ?? DEFAULT.numBgRadius)
    setHeroBg(s.heroBg ?? DEFAULT.heroBg)
    setHeroBgOpacity(s.heroBgOpacity ?? DEFAULT.heroBgOpacity)
    setHeroBgRadius(s.heroBgRadius ?? DEFAULT.heroBgRadius)
    setDmColor(s.dmColor ?? DEFAULT.dmColor)
    setTitleY(s.titleY ?? DEFAULT.titleY)
    setNumY(s.numY ?? DEFAULT.numY)
    setHeroY(s.heroY ?? DEFAULT.heroY)
    setBottomY(s.bottomY ?? DEFAULT.bottomY)
    setOverlayOpacity(s.overlayOpacity ?? DEFAULT.overlayOpacity)
  }

  // ── Canvas ──────────────────────────────────────────────────────────────────
  async function loadImg(url) {
    return new Promise((res, rej) => {
      const img = new Image(); img.crossOrigin = 'anonymous'
      img.onload = () => res(img); img.onerror = rej
      img.src = url + '?t=' + Date.now()
    })
  }

  async function buildCanvas(canvas, W, H, r) {
    await ensureFontsLoaded()
    const ctx = canvas.getContext('2d')
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)

    // Foto
    if (selectedPhoto) {
      try {
        const img = await loadImg(selectedPhoto.url)
        const scale = Math.max(W / img.width, H / img.height)
        const dw = img.width * scale, dh = img.height * scale
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
      } catch { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H) }
    } else {
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H)
    }

    // Overlay
    ctx.fillStyle = `rgba(0,0,0,${overlayOpacity / 100})`
    ctx.fillRect(0, 0, W, H)

    if (!r) { drawDM(ctx, W, H); return }

    const cx = W / 2
    const s  = W > 500 ? 1 : 0.56
    const d  = r.after - r.before
    const ds = (d > 0 ? '+' : '') + parseFloat(Math.abs(d).toFixed(1)) + r.unit
    const sub = durOverride.trim() || ((r.exercise ? r.exercise.toUpperCase() + ' · ' : '') + 'IN ' + r.weeks + ' WEKEN')

    // Titel
    if (showTitle) {
      const sz = Math.round(W * titleScale / 100)
      const tY = Math.round(H * titleY / 100)
      drawBg(ctx, cx, tY + Math.round(sz*0.15), ctx.measureText ? (() => { ctx.font = `bold ${sz}px Arial`; return ctx.measureText(titleText).width + sz })() : W*0.6, sz * 1.5, titleBg, titleBgOpacity, titleBgRadius)
      ctx.fillStyle = titleColor
      ctx.font = `${titleBold ? 'bold' : 'normal'} ${sz}px ${titleFont}`
      ctx.textAlign = 'center'
      ctx.fillText(titleText, cx, tY)
    }

    // BEFORE / AFTER
    const nSz  = Math.round(W * numScale / 100)
    const lSz  = Math.round(nSz * 0.18)
    const kgSz = Math.round(nSz * 0.22)
    const baY  = Math.round(H * numY / 100)
    const bX   = Math.round(W * 0.27)
    const aX   = Math.round(W * 0.73)

    // Achtergrond voor cijfers blok
    if (numBgOpacity > 0) {
      const blockH = nSz + lSz + Math.round(24*s)
      const blockW = W * 0.8
      drawBg(ctx, cx, baY + Math.round(nSz*0.25), blockW, blockH, numBg, numBgOpacity, numBgRadius)
    }
    if (showLabels) {
      ctx.fillStyle = GOLD; ctx.font = `bold ${lSz}px Arial`; ctx.textAlign = 'center'
      ctx.fillText(beforeLabel, bX, baY - nSz - Math.round(8*s))
      ctx.fillText(afterLabel, aX, baY - nSz - Math.round(8*s))
    }
    ctx.fillStyle = GOLD; ctx.font = `bold ${nSz}px Arial`
    ctx.fillText(r.before, bX, baY); ctx.fillText(r.after, aX, baY)

    if (showKg) {
      ctx.fillStyle = 'rgba(255,215,0,0.5)'; ctx.font = `bold ${kgSz}px Arial`
      ctx.fillText(r.unit, bX, baY + Math.round(nSz*0.2)); ctx.fillText(r.unit, aX, baY + Math.round(nSz*0.2))
    }

    // Pijl
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = `bold ${Math.round(nSz*0.65)}px Arial`
    ctx.fillText('→', cx, baY - Math.round(nSz*0.08))

    // Hero diff
    const hSz = Math.round(W * heroScale / 100)
    const hY  = Math.round(H * heroY / 100)
    if (heroBgOpacity > 0) {
      ctx.font = `bold ${hSz}px Arial`
      const heroW = ctx.measureText(ds).width + hSz
      const durH  = showDur ? Math.round(hSz * 0.32 * 1.5) : 0
      drawBg(ctx, cx, hY + Math.round(hSz*0.2) + durH, heroW, hSz * 1.4 + durH, heroBg, heroBgOpacity, heroBgRadius)
    }
    ctx.fillStyle = GOLD; ctx.font = `bold ${hSz}px Arial`; ctx.textAlign = 'center'
    ctx.fillText(ds, cx, hY)

    if (showDur) {
      const dSz = Math.round(hSz * 0.32)
      ctx.fillStyle = 'rgba(255,215,0,0.7)'; ctx.font = `bold ${dSz}px Arial`
      ctx.fillText(sub, cx, hY + dSz + Math.round(8*s))
    }

    drawDM(ctx, W, H)
  }

  function drawDM(ctx, W, H) {
    if (!showBottom || !bottomText.trim()) return
    const s     = W > 500 ? 1 : 0.56
    const sz    = Math.round(W * bottomScale / 100)
    const pad   = Math.round(20 * s)
    const lineH = Math.round(sz * 1.4)
    const weight = dmBold ? 'bold' : 'normal'
    ctx.font = `${weight} ${sz}px ${dmFont}`

    const lines = bottomText.split('\n').filter(l => l.trim())
    const maxW  = lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0)
    const bw    = maxW + pad * 2
    const bh    = lines.length * lineH + Math.round(18 * s)
    const bx    = (W - bw) / 2
    const by    = Math.round(H * bottomY / 100) - bh
    const rad   = Math.round(bh * dmRadius / 100)

    const hex = dmBg.replace('#', '')
    const r2 = parseInt(hex.substring(0,2), 16)
    const g2 = parseInt(hex.substring(2,4), 16)
    const b2 = parseInt(hex.substring(4,6), 16)
    ctx.fillStyle = `rgba(${r2},${g2},${b2},${dmBgOpacity / 100})`
    rr(ctx, bx, by, bw, bh, rad); ctx.fill()

    ctx.fillStyle = dmColor; ctx.textAlign = 'center'
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, by + Math.round(10*s) + sz + i * lineH)
    })
  }

  async function buildPreview() {
    if (!previewRef.current) return
    await buildCanvas(previewRef.current, 480, 853, selected)
  }

  async function download() {
    if (!selected) return
    setDownloading(true)
    try {
      await buildCanvas(canvasRef.current, 1080, 1920, selected)
      const a = document.createElement('a')
      a.href = canvasRef.current.toDataURL('image/jpeg', 0.93)
      a.download = `myarc-post-${client?.first_name?.toLowerCase() || 'result'}.jpg`
      a.click()
    } catch (e) { console.error(e) }
    setDownloading(false)
  }

  // Results
  const results = useMemo(() => {
    if (!data || !client) return []
    const list = [], config = GOAL_CONFIG[client.primary_goal] || GOAL_CONFIG.weight_loss
    if (data.weights.length >= 2) {
      const first = data.weights[0], last = data.weights[data.weights.length-1]
      const diff  = parseFloat((last.weight - first.weight).toFixed(1))
      const weeks = Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / (7*24*3600*1000)))
      const ok    = (config.detect.includes('weight_down') && diff <= -2) || (config.detect.includes('weight_up') && diff >= 1)
      if (ok) list.push({ id:'w', icon:diff<0?'📉':'📈', before:first.weight, after:last.weight, unit:'kg', diff, weeks, label:(diff<0?'':'+') + diff+'kg', title:Math.abs(diff)+'kg '+(diff<0?'afgevallen':'aangekomen'), detail:`${first.weight} → ${last.weight}kg · ${weeks}w` })
    }
    Object.entries(data.prsByExercise).forEach(([name, records]) => {
      if (records.length < 2) return
      const diff  = parseFloat((records[records.length-1].weight - records[0].weight).toFixed(1))
      const weeks = Math.max(1, Math.round((new Date(records[records.length-1].date) - new Date(records[0].date)) / (7*24*3600*1000)))
      if (diff < 5) return
      list.push({ id:`pr-${name}`, icon:'💪', exercise:name, before:records[0].weight, after:records[records.length-1].weight, unit:'kg', diff, weeks, label:`+${diff}kg`, title:`${name} +${diff}kg`, detail:`${records[0].weight} → ${records[records.length-1].weight}kg · ${weeks}w` })
    })
    return list
  }, [data, client])

  useEffect(() => { if (results.length && !selected) setSelected(results[0]) }, [results])

  if (!client || !data) return <Empty text="Selecteer een client links" />
  if (!results.length) return <Empty text="Onvoldoende data. Minimaal -2kg of +5kg PR vereist." />

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 200px)', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Links: instellingen ── */}
      <div style={{ flex: '0 0 240px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%' }}>

        {/* Presets */}
        <Section title="Presets">
          {presets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '4px' }}>
              {presets.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => applyPreset(p.settings)} style={{ flex: 1, background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '5px', color: GOLD, fontSize: '10px', fontWeight: 700, padding: '5px 8px', cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    {p.name}
                  </button>
                  <button onClick={() => deletePreset(p.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '12px', cursor: 'pointer', padding: '4px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>×</button>
                </div>
              ))}
            </div>
          )}
          {showPresetInput ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={presetName} onChange={e => setPresetName(e.target.value)}
                placeholder="Preset naam..."
                onKeyDown={e => e.key === 'Enter' && savePreset()}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '5px 7px', borderRadius: '4px', outline: 'none' }} />
              <button onClick={savePreset} disabled={savingPreset || !presetName.trim()} style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 800, padding: '5px 8px', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {savingPreset ? '...' : 'Sla op'}
              </button>
              <button onClick={() => { setShowPresetInput(false); setPresetName('') }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer' }}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowPresetInput(true)} style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              + Huidige instellingen opslaan
            </button>
          )}
        </Section>

        {/* Resultaat */}
        <Section title="Resultaat">
          {results.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '5px', cursor: 'pointer', background: selected?.id === r.id ? 'rgba(255,215,0,0.08)' : 'transparent', border: selected?.id === r.id ? `1px solid rgba(255,215,0,0.25)` : '1px solid transparent', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <span>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: selected?.id === r.id ? GOLD : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{r.detail}</div>
              </div>
            </div>
          ))}
        </Section>

        {/* Foto's — inklapbaar */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setPhotosOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
              Jouw foto's {photos.length > 0 && <span style={{ color: GOLD }}>({photos.length})</span>}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', transform: photosOpen ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
          </button>
          {/* Geselecteerde foto preview — altijd zichtbaar */}
          {selectedPhoto && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src={selectedPhoto.url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: `2px solid ${GOLD}` }} />
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPhoto.name}</span>
            </div>
          )}
          {photosOpen && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {uploading ? (uploadProgress ? `Uploaden ${uploadProgress}...` : 'Uploaden...') : '+ Foto\'s uploaden'}
              </button>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {photos.map(p => (
                  <div key={p.name} style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                    <img src={p.url} alt="" onClick={() => setSelectedPhoto(p)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: selectedPhoto?.name === p.name ? `2px solid ${GOLD}` : '2px solid transparent' }} />
                    <button onClick={() => deletePhoto(p.name)}
                      style={{ position: 'absolute', top: '-3px', right: '-3px', width: '14px', height: '14px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>×</button>
                  </div>
                ))}
                {photos.length === 0 && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>Nog geen foto's</div>}
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>

        {/* Teksten */}
        <Section title="Teksten">
          <div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Titel</div><TInput value={titleText} onChange={setTitleText} /></div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Font</div>
              <select value={titleFont} onChange={e => setTitleFont(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '5px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                {FONTS.map(f => <option key={f.value} value={f.value} style={{ background: '#111' }}>{f.label}</option>)}
              </select>
            </div>
            <Toggle label="Bold" value={titleBold} onChange={setTitleBold} />
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Kleur</div>
              <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)}
                style={{ width: '34px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Before</div><TInput value={beforeLabel} onChange={setBeforeLabel} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>After</div><TInput value={afterLabel} onChange={setAfterLabel} /></div>
          </div>
          <div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Duur (leeg = auto)</div><TInput value={durOverride} onChange={setDurOverride} /></div>
          <div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>DM tekst</div><TInput value={bottomText} onChange={setBottomText} rows={2} /></div>

          {/* DM tekst opmaak */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Font</div>
              <select value={dmFont} onChange={e => setDmFont(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', padding: '5px 6px', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}>
                {FONTS.map(f => <option key={f.value} value={f.value} style={{ background: '#111', fontFamily: f.value }}>{f.label}</option>)}
              </select>
            </div>
            <Toggle label="Bold" value={dmBold} onChange={setDmBold} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Achtergrond</div>
              <input type="color" value={dmBg} onChange={e => setDmBg(e.target.value)}
                style={{ width: '34px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Transparantie</div>
              <input type="range" min={0} max={100} value={dmBgOpacity} onChange={e => setDmBgOpacity(Number(e.target.value))}
                style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '6px', marginBottom: '2px' }}>Border radius</div>
              <input type="range" min={0} max={50} value={dmRadius} onChange={e => setDmRadius(Number(e.target.value))}
                style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>Tekst</div>
              <input type="color" value={dmColor} onChange={e => setDmColor(e.target.value)}
                style={{ width: '34px', height: '24px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }} />
            </div>
          </div>
        </Section>

        {/* Achtergronden */}
        <Section title="Achtergronden">
          {[
            { label: 'Titel', bg: titleBg, setBg: setTitleBg, op: titleBgOpacity, setOp: setTitleBgOpacity, rad: titleBgRadius, setRad: setTitleBgRadius },
            { label: 'Cijfers', bg: numBg, setBg: setNumBg, op: numBgOpacity, setOp: setNumBgOpacity, rad: numBgRadius, setRad: setNumBgRadius },
            { label: 'Diff', bg: heroBg, setBg: setHeroBg, op: heroBgOpacity, setOp: setHeroBgOpacity, rad: heroBgRadius, setRad: setHeroBgRadius },
          ].map(el => (
            <div key={el.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginBottom: '5px', fontWeight: 700 }}>{el.label}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={el.bg} onChange={e => el.setBg(e.target.value)}
                  style={{ width: '30px', height: '22px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>Opacity</div>
                  <input type="range" min={0} max={100} value={el.op} onChange={e => el.setOp(Number(e.target.value))}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>Radius</div>
                  <input type="range" min={0} max={40} value={el.rad} onChange={e => el.setRad(Number(e.target.value))}
                    style={{ width: '100%', accentColor: GOLD, cursor: 'pointer' }} />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Zichtbaarheid */}
        <Section title="Zichtbaar">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Toggle label="Titel" value={showTitle} onChange={setShowTitle} />
            <Toggle label="Labels" value={showLabels} onChange={setShowLabels} />
            <Toggle label="kg" value={showKg} onChange={setShowKg} />
            <Toggle label="Duur" value={showDur} onChange={setShowDur} />
            <Toggle label="DM tekst" value={showBottom} onChange={setShowBottom} />
          </div>
        </Section>

        {/* Groottes */}
        <Section title="Grootte">
          <Slider label="Cijfers" value={numScale} min={8} max={28} step={0.5} onChange={setNumScale} />
          <Slider label="Diff getal" value={heroScale} min={8} max={30} step={0.5} onChange={setHeroScale} />
          <Slider label="Titel" value={titleScale} min={3} max={12} step={0.5} onChange={setTitleScale} />
          <Slider label="DM tekst" value={bottomScale} min={2} max={7} step={0.5} onChange={setBottomScale} />
        </Section>

        {/* Posities */}
        <Section title="Hoogte (%)">
          <Slider label="Titel" value={titleY} min={2} max={30} onChange={setTitleY} unit="%" />
          <Slider label="Cijfers" value={numY} min={20} max={75} onChange={setNumY} unit="%" />
          <Slider label="Diff" value={heroY} min={35} max={85} onChange={setHeroY} unit="%" />
          <Slider label="DM tekst" value={bottomY} min={70} max={98} onChange={setBottomY} unit="%" />
        </Section>

        {/* Overlay */}
        <Section title="Overlay">
          <Slider label="Donkerheid" value={overlayOpacity} min={0} max={85} onChange={setOverlayOpacity} unit="%" />
        </Section>

      </div>

      {/* ── Rechts: preview + download ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Preview</div>
        <div style={{ flex: 1, background: '#111', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <canvas ref={previewRef} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', borderRadius: '6px' }} />
        </div>
        <button onClick={download} disabled={downloading || !selected}
          style={{ background: GOLD, color: '#000', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, padding: '11px', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          {downloading ? 'Genereren...' : 'Download story JPG (1080×1920)'}
        </button>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>9:16 story formaat · direct te posten</div>
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>{text}</div>
}
