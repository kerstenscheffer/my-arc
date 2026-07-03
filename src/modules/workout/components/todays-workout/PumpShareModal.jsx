// src/modules/workout/components/todays-workout/PumpShareModal.jsx
// "Strava-style" pump-share flow. Camera → snap → stats overlay → share/save.
//
// Two stages:
//   1. CAPTURE — live camera preview with a shutter button.
//   2. EDIT    — draw the captured frame + stats overlay onto a canvas,
//                offer "Opslaan" (uploads to pump-photos + pump_photos table
//                via the existing db.uploadPumpPhoto helper) and "Delen"
//                (Web Share API with the rendered file).
//
// The recorded stream is never mirrored. The selfie preview is mirrored via
// CSS so it feels natural, but we snap from the un-mirrored video frame.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Camera, RefreshCw, Download, Share2, Save, CheckCircle,
  Loader2, Circle, ArrowLeft,
} from 'lucide-react'

const GOLD = '#FFD700'

const STATS_THEME = {
  bg: 'rgba(0,0,0,0.55)',
  accent: GOLD,
  text: '#fff',
  sub: 'rgba(255,255,255,0.85)',
}

// Format helpers — kept inline so this component is self-contained.
const formatDate = (d = new Date()) =>
  d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

const formatVolume = (kg) => {
  if (!kg || Number.isNaN(kg)) return null
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')}k`
  return String(Math.round(kg))
}

const formatTimerCompact = (sec) => {
  if (!sec || Number.isNaN(sec)) return null
  const totalMin = Math.round(sec / 60)
  if (totalMin < 60) return `${totalMin}m`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}u${m}` : `${h}u`
}

// Draws clean text-only overlay on the photo. No background cards, no boxes —
// pure typography met sterke drop-shadow zodat het over elke foto leesbaar is.
//
// Layout:
//   linksboven:  [WORKOUT] / "voltooid" (goud) / datum (muted)
//   rechtsboven: "MY ARC" mark
//   onderaan:    stats-rij, grote gouden cijfers met kleine labels eronder
const drawStatsOverlay = (ctx, canvas, stats) => {
  const W = canvas.width
  const H = canvas.height
  const margin = Math.round(W * 0.06)

  const applyShadow = () => {
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = Math.max(8, Math.round(H * 0.012))
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = Math.round(H * 0.0035)
  }
  const clearShadow = () => {
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  ctx.textBaseline = 'top'
  applyShadow()

  // ── LINKSBOVEN: "[NAAM]" + "voltooid" + datum ──
  const titleSize = Math.round(H * 0.072)
  const subSize = Math.round(H * 0.032)
  const dateSize = Math.round(H * 0.022)

  ctx.textAlign = 'left'
  ctx.font = `900 ${titleSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = STATS_THEME.text
  const rawName = (stats.workoutName || 'Workout').trim()
  // Eerste woord — meestal "Push", "Pull", "Legs". Capitalized.
  const firstWord = rawName.split(/\s+/)[0]
  const cleanName = (firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase())
  ctx.fillText(cleanName, margin, margin)

  ctx.font = `800 italic ${subSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = STATS_THEME.accent
  ctx.fillText('voltooid', margin, margin + titleSize + Math.round(H * 0.002))

  ctx.font = `600 ${dateSize}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(
    stats.dateLabel || formatDate(),
    margin,
    margin + titleSize + subSize + Math.round(H * 0.016)
  )

  // ── RECHTSBOVEN: MY ARC ──
  ctx.textAlign = 'right'
  ctx.font = `900 ${Math.round(H * 0.022)}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = STATS_THEME.accent
  ctx.fillText('MY ARC', W - margin, margin + Math.round(H * 0.003))

  // ── ONDERAAN: stats-rij, geen vakken — alleen tekst.
  // KCAL komt altijd uit de ACSM MET-formule (formule 1). Met timer = echte
  // tijd; zonder timer = geschatte tijd uit sets × 2.5 min.
  //   - Met timer:    OEF · SETS · KCAL · TIJD
  //   - Zonder timer: OEF · SETS · KCAL · KG
  const hasTimer = stats.timerSec != null && stats.timerSec > 0
  const items = []
  if (stats.exercisesCount != null)
    items.push({ value: String(stats.exercisesCount), label: 'OEF' })
  if (stats.setsCount != null)
    items.push({ value: String(stats.setsCount), label: 'SETS' })
  if (stats.kcal != null)
    items.push({ value: String(stats.kcal), label: 'KCAL' })
  if (hasTimer) {
    const t = formatTimerCompact(stats.timerSec)
    if (t) items.push({ value: t, label: 'TIJD' })
  } else if (stats.volume != null) {
    items.push({ value: formatVolume(stats.volume), label: 'KG' })
  }

  if (items.length > 0) {
    // Labels duidelijk leesbaar — flink vergroot t.o.v. eerdere versie zodat ze
    // niet meer in het niets verdwijnen. ~55% van de cijfergrootte.
    const numberSize = Math.round(H * 0.058)
    const labelSize = Math.round(H * 0.028)
    const numbersBaseY = H - margin - numberSize - labelSize - Math.round(H * 0.024)
    const labelsBaseY = numbersBaseY + numberSize + Math.round(H * 0.01)
    const innerW = W - margin * 2
    const slotW = innerW / items.length

    ctx.textAlign = 'center'
    items.forEach((it, i) => {
      const cx = margin + slotW * i + slotW / 2
      ctx.fillStyle = STATS_THEME.accent
      ctx.font = `900 ${numberSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillText(it.value, cx, numbersBaseY)
      ctx.fillStyle = '#fff'
      ctx.font = `900 ${labelSize}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillText(it.label, cx, labelsBaseY)
    })
  }

  clearShadow()
}

export default function PumpShareModal({
  isOpen, onClose, client, db, stats = {},
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [phase, setPhase] = useState('capture') // 'capture' | 'edit' | 'done'
  const [facing, setFacing] = useState('user') // selfie default for pump shot
  const [cameraError, setCameraError] = useState('')
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [capturedUrl, setCapturedUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [saved, setSaved] = useState(false)
  // Bumps every time we have a fresh stream — triggers the bind-effect even
  // when `isOpen` / `phase` haven't changed (e.g. after flipCamera).
  const [streamVersion, setStreamVersion] = useState(0)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async (preferredFacing = facing) => {
    setCameraError('')
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: preferredFacing,
          width:  { ideal: 1920 },
          height: { ideal: 1920 },
        },
        audio: false,
      })
      streamRef.current = stream
      // Direct bind — the <video> tag is already in the DOM because
      // phase='capture' is the initial render. The bind-effect below is a
      // safety net for cases where the ref isn't ready yet (rare).
      const el = videoRef.current
      if (el) {
        el.srcObject = stream
        el.muted = true
        el.playsInline = true
        const p = el.play()
        if (p?.catch) p.catch(() => { /* iOS may reject; bind-effect retries */ })
      }
      setStreamVersion(v => v + 1)
    } catch (e) {
      console.error('Camera start failed:', e)
      setCameraError(e?.message || 'Camera kon niet starten — sta toegang toe.')
    }
  }, [facing])

  // Safety-net binder — retriggers whenever streamVersion bumps or the user
  // re-enters capture phase. Ensures the <video> tag picks up the stream
  // even if the direct-bind in startCamera ran before the ref was ready.
  useEffect(() => {
    if (!isOpen) return
    if (phase !== 'capture') return
    if (!streamRef.current) return
    const el = videoRef.current
    if (!el) return
    if (el.srcObject !== streamRef.current) el.srcObject = streamRef.current
    el.muted = true
    el.playsInline = true
    const p = el.play()
    if (p?.catch) p.catch(() => { /* ignore */ })
  }, [isOpen, phase, streamVersion])

  // Boot/teardown when the modal opens/closes.
  useEffect(() => {
    if (isOpen) {
      setPhase('capture')
      setCapturedBlob(null)
      if (capturedUrl) { URL.revokeObjectURL(capturedUrl); setCapturedUrl(null) }
      setSaved(false)
      startCamera()
    } else {
      stopCamera()
      if (capturedUrl) { URL.revokeObjectURL(capturedUrl); setCapturedUrl(null) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => () => {
    // Final cleanup on unmount.
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }, [])

  const flipCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    await startCamera(next)
    // Re-bind after stream swap; effect above will pick it up via state change.
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play?.()?.catch?.(() => {})
    }
  }

  const snap = async () => {
    const video = videoRef.current
    if (!video || !streamRef.current) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) {
      setCameraError('Camera nog niet klaar — wacht even en probeer opnieuw.')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // Recorded image must NOT be mirrored even though selfie preview is.
    ctx.drawImage(video, 0, 0, w, h)
    drawStatsOverlay(ctx, canvas, { ...stats, dateLabel: stats.dateLabel || formatDate() })
    canvasRef.current = canvas
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
    if (!blob) {
      setCameraError('Foto maken mislukt.')
      return
    }
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedBlob(blob)
    setCapturedUrl(URL.createObjectURL(blob))
    stopCamera()
    setPhase('edit')
  }

  const retake = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedUrl(null)
    setCapturedBlob(null)
    setSaved(false)
    setPhase('capture')
    startCamera()
  }

  const saveToLibrary = async () => {
    if (!capturedBlob || !client?.id) return
    setBusy(true); setBusyLabel('Opslaan…')
    try {
      // db.uploadPumpPhoto expects a File-like object with .name + .split() ext.
      const fileName = `pump-${Date.now()}.jpg`
      const file = new File([capturedBlob], fileName, { type: 'image/jpeg' })
      await db.uploadPumpPhoto(
        client.id,
        file,
        stats.workoutName ? `Pump na ${stats.workoutName}` : null,
        new Date().toISOString().split('T')[0]
      )
      setSaved(true)
      // Korte "Opgeslagen ✓" feedback, dan automatisch terug naar de gallery
      // zodat de zojuist-geüploade foto direct zichtbaar is.
      setTimeout(() => { if (onClose) onClose() }, 600)
    } catch (e) {
      console.error('Pump photo upload failed:', e)
      setCameraError(`Opslaan mislukt — ${e?.message || e}`)
    } finally {
      setBusy(false); setBusyLabel('')
    }
  }

  const shareOrDownload = async () => {
    if (!capturedBlob) return
    const fileName = `myarc-pump-${Date.now()}.jpg`
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' })

    // Try Web Share API with files (works on iOS Safari + Android Chrome).
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My pump',
          text: stats.workoutName ? `${stats.workoutName} — MY ARC` : 'MY ARC',
        })
        return
      } catch (err) {
        if (err?.name !== 'AbortError') console.error('share failed:', err)
        // fall through to download fallback
      }
    }
    // Fallback: trigger a download.
    const a = document.createElement('a')
    a.href = capturedUrl || URL.createObjectURL(capturedBlob)
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (!isOpen) return null

  const btn = (variant = 'ghost', extras = {}) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 48, padding: '0 1rem', gap: '0.45rem',
    background: variant === 'primary'
      ? GOLD
      : variant === 'success'
        ? 'rgba(16,185,129,0.18)'
        : 'rgba(255,255,255,0.08)',
    color: variant === 'primary' ? '#000'
      : variant === 'success' ? '#10b981'
        : '#fff',
    border: variant === 'success' ? '1px solid rgba(16,185,129,0.35)' : 'none',
    borderRadius: 10,
    fontSize: '0.9rem', fontWeight: 800,
    cursor: 'pointer', touchAction: 'manipulation',
    ...extras,
  })

  const previewMirror = facing === 'user'

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, height: '100dvh',
      background: '#000', zIndex: 2147483600,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: 'calc(0.75rem + env(safe-area-inset-top)) 0.85rem 0.65rem 0.85rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {phase === 'edit' && (
          <button
            onClick={retake}
            style={{ ...btn('ghost'), minHeight: 40, minWidth: 40, padding: 0 }}
            title="Opnieuw"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
          {phase === 'capture' ? 'Pump foto' : 'Klaar om te delen'}
        </div>
        <button onClick={onClose} style={{ ...btn('ghost'), minHeight: 40, minWidth: 40, padding: 0 }} title="Sluiten">
          <X size={18} />
        </button>
      </div>

      {/* CAPTURE: live preview */}
      {phase === 'capture' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: previewMirror ? 'scaleX(-1)' : 'none',
            }}
          />
          {cameraError && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(239,68,68,0.95)', color: '#fff',
              padding: '0.7rem 1rem', borderRadius: 10,
              fontSize: '0.85rem', fontWeight: 700, maxWidth: '85%',
              textAlign: 'center',
            }}>
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* EDIT: rendered photo with overlay */}
      {phase === 'edit' && capturedUrl && (
        <div style={{
          flex: 1, padding: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#000',
        }}>
          <img
            src={capturedUrl}
            alt="Pump"
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10 }}
          />
        </div>
      )}

      {/* Footer */}
      <div style={{
        flexShrink: 0,
        padding: '0.75rem 0.85rem calc(0.85rem + env(safe-area-inset-bottom)) 0.85rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.92)',
      }}>
        {phase === 'capture' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '0.75rem',
          }}>
            <button
              onClick={flipCamera}
              style={{ ...btn('ghost'), minWidth: 48 }}
              title="Camera wisselen"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={snap}
              style={{
                width: 76, height: 76, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', border: `4px solid ${GOLD}`,
                cursor: 'pointer', touchAction: 'manipulation',
              }}
              title="Maak foto"
            >
              <Circle size={48} fill="#000" stroke="#000" />
            </button>
            <div style={{ width: 48 }} />
          </div>
        )}

        {phase === 'edit' && (
          <>
            {cameraError && (
              <div style={{
                padding: '0.5rem 0.7rem', borderRadius: 6, marginBottom: '0.5rem',
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                {cameraError}
              </div>
            )}
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: '0.5rem',
            }}>
              <button onClick={saveToLibrary} disabled={busy || saved} style={btn(saved ? 'success' : 'ghost')}>
                {saved
                  ? <><CheckCircle size={16} /> Opgeslagen</>
                  : busy
                    ? <><Loader2 size={16} className="ps-spin" /> {busyLabel || 'Opslaan…'}</>
                    : <><Save size={16} /> Opslaan</>}
              </button>
              <button onClick={shareOrDownload} style={btn('primary')}>
                <Share2 size={16} /> Delen
              </button>
              {!isMobile && (
                <a
                  href={capturedUrl || '#'}
                  download={`myarc-pump-${Date.now()}.jpg`}
                  style={{ ...btn('ghost'), textDecoration: 'none' }}
                >
                  <Download size={16} /> Download
                </a>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes ps-spin { to { transform: rotate(360deg); } }
        .ps-spin { animation: ps-spin 1s linear infinite; }
      `}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
