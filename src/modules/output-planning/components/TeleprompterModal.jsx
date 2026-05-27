// src/modules/output-planning/components/TeleprompterModal.jsx
// Fullscreen teleprompter with optional in-browser camera + recording.
// One device, one screen: live camera fills the background, script scrolls
// over it, MediaRecorder captures the stream. Stop reveals a preview with
// a download link.
//
// Recording notes:
// - `video/mp4` is preferred on iOS Safari; everywhere else we fall back
//   to `video/webm` (vp9 if available, otherwise default vp8).
// - Selfie mode mirrors the *preview* only via CSS scaleX(-1) — the actual
//   recorded stream stays un-mirrored so viewers see text correctly.
// - getUserMedia requires HTTPS (or localhost). Camera stream is fully torn
//   down when the modal closes and on browser unload to avoid orphan tracks.

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Play, Pause, RotateCcw, Minus, Plus,
  Video, VideoOff, Circle, Square, Download, RefreshCw, Camera,
} from 'lucide-react'

const GOLD = '#FFD700'
const RED  = '#ef4444'

const SPEED_MIN = 1
const SPEED_MAX = 10
const speedToPxPerSec = (s) => 15 + (s - 1) * 12

const FONT_MIN = 1.4
const FONT_MAX = 4.0
const FONT_STEP = 0.2

// Pick the best supported recorder mime. iOS Safari's MediaRecorder
// (since iOS 14.3) is quirky: it reports support for several mime types
// but only reliably *records* with `video/mp4` (H.264 + AAC). Chrome/
// Android prefer WebM. Probing in this order keeps both happy.
const pickMime = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  const ua = navigator.userAgent || ''
  const isAppleWebKit = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua))
  const candidates = isAppleWebKit
    ? [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
    : [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ]
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  // Last resort: let the browser pick its own default.
  return ''
}

const mmss = (totalSec) => {
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TeleprompterModal({ isOpen, onClose, script, title }) {
  const scrollRef = useRef(null)
  const rafRef = useRef(null)
  const lastTickRef = useRef(0)

  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(4)
  const [fontRem, setFontRem] = useState(2.4)
  // Mirror toggle was for teleprompter-glass setups; removed to declutter
  // the bottom bar — keep `mirrored` as a constant so existing transform
  // logic stays valid without re-rendering related code paths.
  const mirrored = false

  // Camera + recording state
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordStartRef = useRef(0)
  const elapsedTimerRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [facing, setFacing] = useState('user') // 'user' (selfie) | 'environment' (back)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState(null)
  const [recordedMime, setRecordedMime] = useState('')

  // ── Teleprompter scroll loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setPlaying(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [isOpen, script])

  const tick = useCallback((ts) => {
    const el = scrollRef.current
    if (!el) return
    if (!lastTickRef.current) lastTickRef.current = ts
    const dt = (ts - lastTickRef.current) / 1000
    lastTickRef.current = ts
    el.scrollTop += speedToPxPerSec(speed) * dt
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      setPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [speed])

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTickRef.current = 0
      return
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, tick])

  // Spacebar = play/pause. Esc = close.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p) }
      if (e.code === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // ── Camera lifecycle ─────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }, [])

  const startCamera = useCallback(async (preferredFacing = facing) => {
    setCameraError('')
    try {
      // Tear down any prior stream first (when toggling front/back).
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: preferredFacing,
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      })
      streamRef.current = stream
      // Trigger render so the <video> tag mounts; the useEffect below will
      // wire srcObject once the ref is non-null (avoids the "ref is null on
      // first paint" race).
      setCameraOn(true)
    } catch (err) {
      console.error('Camera start failed:', err)
      setCameraError(err?.message || 'Camera kon niet starten')
      setCameraOn(false)
    }
  }, [facing])

  // Attach the stream to the <video> element after React has mounted it.
  // Doing this in an effect avoids the race where startCamera fires before
  // the conditional <video> tag exists in the DOM.
  useEffect(() => {
    if (!cameraOn) return
    const el = videoRef.current
    const stream = streamRef.current
    if (!el || !stream) return
    if (el.srcObject !== stream) el.srcObject = stream
    el.muted = true
    const p = el.play()
    if (p?.catch) p.catch(() => { /* iOS may reject if not user-gesture; ignore */ })
  }, [cameraOn])

  const toggleCamera = () => {
    if (cameraOn) stopCamera()
    else startCamera()
  }

  const flipCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    if (cameraOn) await startCamera(next)
  }

  // Clean up on close + on unmount.
  useEffect(() => {
    if (!isOpen) {
      // Stop any active recording + camera when modal closes.
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop() } catch { /* ignore */ }
      }
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
      stopCamera()
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
        setRecordedUrl(null)
      }
      setRecording(false)
      setElapsed(0)
    }
  }, [isOpen, stopCamera, recordedUrl])

  useEffect(() => () => {
    // True unmount only: release camera tracks + any active timer.
    // `recordedUrl` is intentionally NOT in deps — revoking it here on every
    // change would unmount-revoke a URL we still want to show in the preview.
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
  }, [])

  // ── Recording ────────────────────────────────────────────────────────────
  // Centralised finaliser — builds the blob from collected chunks and shows
  // the preview overlay. Called from both `onstop` and a stop-fallback to
  // work around iOS Safari occasionally not firing `onstop` reliably.
  const finalizeRecording = useCallback((mime) => {
    if (!recording && !recorderRef.current) return
    if (chunksRef.current.length === 0) {
      setCameraError('Opname leeg — kon geen videofragmenten ontvangen.')
      setRecording(false)
      if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null }
      return
    }
    const type = mime || recordedMime || chunksRef.current[0]?.type || 'video/webm'
    const blob = new Blob(chunksRef.current, { type })
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(URL.createObjectURL(blob))
    setRecording(false)
    if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null }
  }, [recording, recordedMime, recordedUrl])

  const startRecording = () => {
    if (!streamRef.current) return
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      setRecordedUrl(null)
    }
    const mime = pickMime()
    if (!mime) {
      setCameraError('Deze browser ondersteunt geen video-opname.')
      return
    }
    chunksRef.current = []
    setRecordedMime(mime)
    let recorder
    try {
      // If pickMime returned '' (no supported candidates) we still try to
      // create one and let the UA pick a default.
      recorder = mime
        ? new MediaRecorder(streamRef.current, { mimeType: mime })
        : new MediaRecorder(streamRef.current)
      console.log('MediaRecorder mime in use:', recorder.mimeType || mime)
    } catch (err) {
      console.error('MediaRecorder failed:', err)
      setCameraError(`Opname kon niet starten (${mime || 'no mime'}).`)
      return
    }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => finalizeRecording(recorder.mimeType || mime)
    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e)
      setCameraError('Opname-fout — probeer opnieuw.')
    }
    // 1000ms timeslice — iOS Safari only reliably emits `dataavailable`
    // events when a timeslice is set; without one the chunk array stays
    // empty until stop() and frequently never arrives at all.
    recorder.start(1000)
    recorderRef.current = recorder
    setRecording(true)
    recordStartRef.current = Date.now()
    setElapsed(0)
    elapsedTimerRef.current = setInterval(() => {
      setElapsed((Date.now() - recordStartRef.current) / 1000)
    }, 250)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setPlaying(true)
  }

  const stopRecording = () => {
    setPlaying(false)
    const recorder = recorderRef.current
    if (!recorder) return
    if (recorder.state === 'inactive') {
      // Already stopped — finalise from whatever we have.
      finalizeRecording(recordedMime)
      return
    }
    try {
      // Ask for any pending chunk before stopping; harmless if unsupported.
      if (typeof recorder.requestData === 'function' && recorder.state === 'recording') {
        try { recorder.requestData() } catch { /* ignore */ }
      }
      recorder.stop()
    } catch (err) {
      console.error('recorder.stop failed:', err)
    }
    // Safety net for iOS Safari: if onstop doesn't fire within 1.5s,
    // finalise from chunks we already have.
    setTimeout(() => {
      if (recording) finalizeRecording(recordedMime)
    }, 1500)
  }

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
  }

  if (!isOpen) return null

  const restart = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setPlaying(true)
  }

  const text = (script || '').trim() || '(geen script ingevuld)'

  const btn = (active, opts = {}) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 44, minHeight: 44, padding: '0 0.75rem',
    background: active ? GOLD : 'rgba(255,255,255,0.08)',
    color: active ? '#000' : '#fff',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', touchAction: 'manipulation',
    fontSize: '0.85rem', fontWeight: 700,
    gap: '0.4rem',
    opacity: opts.disabled ? 0.4 : 1,
    pointerEvents: opts.disabled ? 'none' : 'auto',
  })

  // Side-strip control styles — square buttons stacked vertically, compact
  // so the strip stays out of the way of the script.
  const sideBtn = {
    width: 40, height: 40, padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', touchAction: 'manipulation',
  }
  const sideLabel = {
    textAlign: 'center', fontSize: '0.7rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em',
    minHeight: 14, lineHeight: 1,
  }
  const sideDivider = {
    height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.15rem 0',
  }

  // The selfie cam should *look* mirrored for the user, but back-cam
  // shouldn't. Recorded stream is never mirrored either way.
  const previewMirror = facing === 'user'

  const downloadName = `myarc-${(title || 'opname').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').slice(0, 40)}-${Date.now()}.${recordedMime.includes('mp4') ? 'mp4' : 'webm'}`

  const modal = (
    <div style={{
      position: 'fixed', inset: 0,
      // 100dvh respects the iOS Safari dynamic viewport so the bottom row
      // sits above the URL bar instead of underneath it.
      height: '100dvh',
      background: '#000', zIndex: 2147483600,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Camera preview behind everything */}
      {cameraOn && (
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
            zIndex: 0,
          }}
        />
      )}
      {/* Dim overlay so the script stays readable over busy backgrounds */}
      {cameraOn && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 1,
        }} />
      )}

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 2,
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: 'calc(0.75rem + env(safe-area-inset-top)) 0.75rem 0.75rem 0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: cameraOn ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.85)',
      }}>
        <div style={{
          flex: 1, color: '#fff', fontSize: '0.85rem', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title || 'Teleprompter'}
        </div>
        {recording && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.55rem', borderRadius: 6,
            background: 'rgba(239,68,68,0.18)', color: RED,
            fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: RED,
              animation: 'tele-rec-pulse 1s ease-in-out infinite',
            }} />
            REC {mmss(elapsed)}
          </div>
        )}
        <button onClick={onClose} style={btn(false)} title="Sluiten (Esc)">
          <X size={18} />
        </button>
      </div>

      {/* Scrolling script */}
      <div
        ref={scrollRef}
        style={{
          position: 'relative', zIndex: 2,
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '40vh 1.25rem',
          transform: mirrored ? 'scaleX(-1)' : 'none',
        }}
      >
        <div style={{
          maxWidth: 900, margin: '0 auto',
          fontSize: `${fontRem}rem`, lineHeight: 1.55, fontWeight: 700,
          color: '#fff', textAlign: 'center', whiteSpace: 'pre-wrap',
          letterSpacing: '-0.005em',
          textShadow: cameraOn ? '0 2px 12px rgba(0,0,0,0.85), 0 0 30px rgba(0,0,0,0.5)' : 'none',
        }}>
          {text}
        </div>
      </div>

      {/* Camera error toast */}
      {cameraError && (
        <div style={{
          position: 'absolute', bottom: 200, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.95)', color: '#fff',
          padding: '0.6rem 0.9rem', borderRadius: 8,
          fontSize: '0.8rem', fontWeight: 700, zIndex: 10,
          maxWidth: '90%', textAlign: 'center',
        }}>
          {cameraError}
        </div>
      )}

      {/* Bottom controls */}
      <div style={{
        position: 'relative', zIndex: 2,
        flexShrink: 0,
        // Generous bottom padding so the +/− and tempo row sit comfortably
        // above the Safari URL bar + iPhone home-indicator. We add a fixed
        // 4rem buffer on top of `safe-area-inset-bottom` because Safari's
        // bottom bar isn't part of the safe-area inset value on iOS — it
        // overlays content even when the inset reports 0.
        padding: '0.75rem 0.75rem calc(4rem + env(safe-area-inset-bottom)) 0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: cameraOn ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}>
        {/* Row 1: record + play */}
        <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!cameraOn && (
            <button onClick={toggleCamera} style={btn(false)} title="Camera aanzetten">
              <Camera size={16} /> Camera aan
            </button>
          )}
          {cameraOn && !recording && (
            <button
              onClick={startRecording}
              style={{ ...btn(false), background: RED, color: '#fff', minWidth: 130 }}
              title="Opname starten"
            >
              <Circle size={14} fill="#fff" /> Opname
            </button>
          )}
          {recording && (
            <button
              onClick={stopRecording}
              style={{ ...btn(false), background: '#fff', color: '#000', minWidth: 130 }}
              title="Stop opname"
            >
              <Square size={14} fill="#000" /> Stop
            </button>
          )}
          <button onClick={() => setPlaying(p => !p)} style={btn(playing)} title="Play/pauze (spatie)">
            {playing ? <Pause size={18} /> : <Play size={18} />}
            {playing ? 'Pauze' : 'Start'}
          </button>
          <button onClick={restart} style={btn(false)} title="Opnieuw vanaf begin">
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Row 2: camera helpers only — tekst+tempo controls verhuisd naar
            de floating side-strip rechts in beeld. */}
        {cameraOn && (
          <div style={{ display: 'flex', gap: '0.45rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={flipCamera} style={btn(false)} title="Camera wisselen (voor/achter)">
              <RefreshCw size={16} /> {facing === 'user' ? 'Achter' : 'Voor'}
            </button>
            <button onClick={toggleCamera} style={btn(false)} title="Camera uit">
              <VideoOff size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Floating side-strip — tekst-grootte + tempo, vertikaal gestapeld
          op de rechterzijkant ter hoogte van het script. Komt los van de
          onderbalk zodat 'ie nooit onder de Safari URL-bar valt. */}
      <div style={{
        position: 'absolute', zIndex: 3,
        right: 'calc(0.5rem + env(safe-area-inset-right))',
        top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: '0.4rem',
        padding: '0.45rem 0.4rem',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={() => setFontRem(f => Math.min(FONT_MAX, +(f + FONT_STEP).toFixed(2)))}
          style={sideBtn} title="Grotere tekst"
        >
          <Plus size={18} />
        </button>
        <div style={sideLabel}>A</div>
        <button
          onClick={() => setFontRem(f => Math.max(FONT_MIN, +(f - FONT_STEP).toFixed(2)))}
          style={sideBtn} title="Kleinere tekst"
        >
          <Minus size={18} />
        </button>
        <div style={sideDivider} />
        <button
          onClick={() => setSpeed(s => Math.min(SPEED_MAX, s + 1))}
          style={sideBtn} title="Sneller"
          disabled={speed >= SPEED_MAX}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
        <div style={{ ...sideLabel, color: GOLD }}>{speed}</div>
        <button
          onClick={() => setSpeed(s => Math.max(SPEED_MIN, s - 1))}
          style={sideBtn} title="Langzamer"
          disabled={speed <= SPEED_MIN}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Post-record preview overlay */}
      {recordedUrl && !recording && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.96)',
          zIndex: 20, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            flexShrink: 0,
            padding: 'calc(0.75rem + env(safe-area-inset-top)) 0.75rem 0.75rem 0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
              Opname klaar
            </div>
            <button onClick={discardRecording} style={btn(false)} title="Sluiten">
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: 0 }}>
            <video
              src={recordedUrl}
              controls
              playsInline
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, background: '#000' }}
            />
          </div>
          <div style={{
            flexShrink: 0,
            padding: '0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom)) 0.75rem',
            display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <a
              href={recordedUrl}
              download={downloadName}
              // On iOS Safari the `download` attribute is mostly ignored;
              // tapping the link opens the video full-screen instead. From
              // there the share-sheet lets the user save to Photos. We hint
              // that in a small label below the button.
              target="_blank"
              rel="noreferrer"
              style={{ ...btn(false), background: GOLD, color: '#000', textDecoration: 'none', minWidth: 160 }}
            >
              <Download size={16} /> Opslaan
            </a>
            <button onClick={discardRecording} style={btn(false)}>
              <Video size={16} /> Opnieuw
            </button>
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            textAlign: 'center', color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem', padding: '0 1rem', pointerEvents: 'none',
          }}>
            Op iPhone: tik <strong>Opslaan</strong> → video opent → deel-icoon → <strong>Bewaar video</strong>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tele-rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )

  return createPortal(modal, document.body)
}
