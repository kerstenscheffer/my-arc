// src/modules/client-meal-builder/components/BarcodeScanner.jsx
// Food-app inspired: gold theme, soft frame, in-viewfinder helper text,
// silent feedback (no scan-line), late hints, bottom Zoeken|Barcode pill.

import React, { useState, useEffect, useRef } from 'react'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { BrowserMultiFormatReader } from '@zxing/library'
import { X, Keyboard, Camera, CheckCircle, Zap, ZapOff, Search, ScanLine } from 'lucide-react'

const G = {
  primary: '#FFD700',
  primarySoft: 'rgba(255, 215, 0, 0.15)',
  primaryBorder: 'rgba(255, 215, 0, 0.35)',
}

export default function BarcodeScanner({ onScan, onClose, onSwitchToSearch }) {
  const isMobile = window.innerWidth <= 768
  const videoRef = useRef(null)
  const nativeRef = useRef(null)
  const readerRef = useRef(null)
  const timeoutRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [status, setStatus] = useState('idle') // idle, scanning, success, timeout, error
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [scanTime, setScanTime] = useState(0)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  useEffect(() => {
    if (!manualMode && !scanning) startScanning()
    return () => { stopScanning(); if (timeoutRef.current) clearInterval(timeoutRef.current) }
  }, [manualMode])

  // Silent timer — used only for late hint + 25s timeout fallback
  useEffect(() => {
    if (status === 'scanning') {
      setScanTime(0)
      timeoutRef.current = setInterval(() => {
        setScanTime(prev => {
          if (prev >= 25) {
            setStatus('timeout')
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timeoutRef.current) clearInterval(timeoutRef.current)
    }
    return () => { if (timeoutRef.current) clearInterval(timeoutRef.current) }
  }, [status])

  // De ingebouwde barcodelezer van de telefoon (Chrome op Android, en recente
  // Safari). Die leest een barcode onder élke hoek en is een stuk sneller dan
  // ZXing in JavaScript. Lukt het niet, dan valt hij door naar ZXing — dus we
  // verliezen niets waar hij ontbreekt.
  const startNativeScanner = async () => {
    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return false
    try {
      const formaten = await window.BarcodeDetector.getSupportedFormats()
      const wil = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'].filter(f => formaten.includes(f))
      if (!wil.length) return false

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920 }, height: { ideal: 1080 },
        },
      })
      const videoElement = videoRef.current
      if (!videoElement) { stream.getTracks().forEach(t => t.stop()); return false }
      videoElement.srcObject = stream
      videoElement.setAttribute('playsinline', 'true')
      await videoElement.play()

      const detector = new window.BarcodeDetector({ formats: wil })
      nativeRef.current = { stream, interval: null }
      nativeRef.current.interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        try {
          const codes = await detector.detect(videoRef.current)
          const raw = codes?.[0]?.rawValue
          if (raw) handleScanSuccess(raw)
        } catch { /* frame overslaan; volgende tik proberen we opnieuw */ }
      }, 250)
      return true
    } catch (e) {
      console.warn('native barcodelezer niet bruikbaar, terug naar ZXing:', e?.message)
      return false
    }
  }

  const startScanning = async () => {
    try {
      setStatus('scanning')

      // Eerst de ingebouwde lezer proberen; die is niet kieskeurig over de
      // stand van de barcode. Pas als die er niet is, ZXing.
      if (await startNativeScanner()) return

      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const codeReader = new BrowserMultiFormatReader(hints, 500)
      readerRef.current = codeReader

      const videoElement = videoRef.current
      if (!videoElement) return

      const devices = await codeReader.listVideoInputDevices()
      if (devices.length === 0) throw new Error('Geen camera gevonden')

      let selectedDevice = devices[0]
      if (isMobile && devices.length > 1) {
        const back = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        )
        if (back) selectedDevice = back
      }

      await codeReader.decodeFromConstraints(
        {
          video: {
            deviceId: selectedDevice.deviceId,
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: 1920 }, height: { ideal: 1080 },
            focusMode: 'continuous'
          }
        },
        videoElement,
        (result) => {
          if (result) {
            handleScanSuccess(result.text)
          }
        }
      )

      setScanning(true)
    } catch (error) {
      console.error('Scanner failed:', error.message)
      setStatus('error')
      setManualMode(true)
    }
  }

  const stopScanning = () => {
    if (nativeRef.current) {
      clearInterval(nativeRef.current.interval)
      nativeRef.current.stream?.getTracks?.().forEach(t => t.stop())
      nativeRef.current = null
    }
    if (readerRef.current) {
      try { readerRef.current.reset() } catch { /* reader already torn down */ }
      readerRef.current = null
    }
    setScanning(false)
  }

  const handleScanSuccess = (barcode) => {
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
    setStatus('success')
    stopScanning()
    setTimeout(() => onScan(barcode), 500)
  }

  const handleManualSubmit = () => {
    if (manualBarcode.trim() && manualBarcode.length >= 8) {
      if (window.navigator.vibrate) window.navigator.vibrate(50)
      onScan(manualBarcode.trim())
    }
  }

  const retryScanning = () => {
    stopScanning()
    setStatus('idle')
    setScanTime(0)
    setTimeout(() => startScanning(), 200)
  }

  const toggleTorch = async () => {
    if (!videoRef.current) return
    try {
      const track = videoRef.current.srcObject?.getVideoTracks()[0]
      const caps = track?.getCapabilities()
      if (caps?.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torchEnabled }] })
        setTorchEnabled(!torchEnabled)
      }
    } catch { /* torch unsupported on this device */ }
  }

  // Helper text under the frame. Stays calm — only changes after 8s.
  const helperText = () => {
    if (status === 'success') return 'Gevonden!'
    if (status === 'timeout') return 'Niet herkend — probeer opnieuw of voer handmatig in'
    if (status === 'error')   return 'Camera niet beschikbaar'
    if (status === 'scanning' && scanTime >= 18) return 'Zorg voor goed licht of voer handmatig in'
    if (status === 'scanning' && scanTime >= 8)  return 'Houd stil — iets dichter op de barcode. Draaien hoeft niet.'
    return 'Barcode in het kader — liggend of staand, allebei goed'
  }

  const helperColor = () => {
    if (status === 'success') return G.primary
    if (status === 'timeout' || status === 'error') return 'rgba(239, 68, 68, 0.85)'
    return 'rgba(255, 255, 255, 0.85)'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      zIndex: 99999, display: 'flex', flexDirection: 'column',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease'
    }}>

      {/* ═══ TOP BAR ═══ — close button only, torch moved to camera overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
        paddingTop: `calc(env(safe-area-inset-top, 0) + ${isMobile ? '0.875rem' : '1.25rem'})`,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={onClose} aria-label="Sluiten" style={{
          width: '38px', height: '38px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation'
        }}>
          <X size={18} color="#fff" />
        </button>

        <div style={{
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: '700',
          color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          Voeding loggen
        </div>

        {/* Placeholder to keep title centered */}
        <div style={{ width: '38px', height: '38px' }} />
      </div>

      {/* ═══ CAMERA VIEW ═══ */}
      {!manualMode && (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

          {/* Vierkant kader: een productbarcode is breder dan hoog, dus een
              staand vak liet mensen hun product draaien — en wie dat niet
              doorhad kwam er niet doorheen. Vierkant accepteert allebei, en
              de tekst eronder zegt het er expliciet bij. */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, calc(-50% - 28px))',
            width: isMobile ? 'min(78vw, 300px)' : '320px',
            height: isMobile ? 'min(78vw, 300px)' : '320px',
            border: `1.5px solid ${
              status === 'success' ? G.primary
              : status === 'timeout' ? 'rgba(239,68,68,0.55)'
              : 'rgba(255,255,255,0.45)'
            }`,
            borderRadius: '20px', pointerEvents: 'none',
            transition: 'border-color 0.3s ease',
            boxShadow: status === 'success'
              ? `0 0 0 2px ${G.primarySoft}, 0 0 32px rgba(255, 215, 0, 0.25)`
              : 'none',
            overflow: 'hidden',
          }}>
            {/* Scanlijn. Blijft een horizontale streep die op en neer gaat,
                maar hij dekt nu het hele vierkant: hij toont dát er gescand
                wordt, niet in welke stand je iets moet houden. */}
            {status === 'scanning' && (
              <div style={{
                position: 'absolute',
                left: '6%', right: '6%',
                height: 2,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.95) 50%, transparent 100%)',
                boxShadow: '0 0 10px rgba(255,215,0,0.65)',
                animation: 'bsScanLine 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate',
                willChange: 'transform',
              }} />
            )}

            {/* Success flash */}
            {status === 'success' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: G.primarySoft,
                borderRadius: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'bsFadeIn 0.2s ease'
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: G.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={32} color="#000" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>

          {/* Helper text directly UNDER the scan frame */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% + ${isMobile ? '180px' : '200px'}))`,
            maxWidth: isMobile ? '88vw' : '420px',
            textAlign: 'center',
            fontSize: isMobile ? '0.82rem' : '0.88rem',
            fontWeight: '600',
            color: helperColor(),
            lineHeight: 1.4,
            padding: '0 1rem',
            transition: 'color 0.2s ease',
            pointerEvents: 'none',
          }}>
            {helperText()}
          </div>

          {/* Torch/flash button — floats bottom-right of camera view, clearly separated from close (top-left) */}
          {!manualMode && (
            <button onClick={toggleTorch} aria-label="Flits" style={{
              position: 'absolute',
              bottom: isMobile ? '130px' : '155px',
              right: isMobile ? '1.25rem' : '1.5rem',
              width: '44px', height: '44px', borderRadius: '50%',
              background: torchEnabled ? G.primarySoft : 'rgba(0,0,0,0.55)',
              border: torchEnabled ? `1.5px solid ${G.primaryBorder}` : '1.5px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation',
              backdropFilter: 'blur(8px)',
              zIndex: 11,
            }}>
              {torchEnabled
                ? <Zap size={20} color={G.primary} fill={G.primary} />
                : <ZapOff size={20} color="rgba(255,255,255,0.6)" />}
            </button>
          )}

          {/* Timeout retry buttons — anchored above the bottom pill */}
          {status === 'timeout' && (
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '120px' : '140px',
              left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '0.5rem',
              padding: '0 1rem',
            }}>
              <button onClick={retryScanning} style={{
                padding: '0.6rem 1rem', background: G.primarySoft,
                border: `1px solid ${G.primaryBorder}`, borderRadius: '8px',
                color: G.primary, fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', touchAction: 'manipulation', minHeight: '40px',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <ScanLine size={14} /> Opnieuw
              </button>
              <button onClick={() => { stopScanning(); setManualMode(true) }} style={{
                padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', touchAction: 'manipulation', minHeight: '40px',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <Keyboard size={14} /> Handmatig
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ MANUAL MODE ═══ */}
      {manualMode && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{
            fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem'
          }}>
            Barcode invoeren
          </div>
          <div style={{
            fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', textAlign: 'center'
          }}>
            Typ de cijfers onder de streepjescode
          </div>

          <input
            type="text" inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="8710400000000"
            autoFocus
            style={{
              width: '100%', maxWidth: '300px', height: '52px',
              background: 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${G.primaryBorder}`,
              borderRadius: '10px', color: '#fff',
              fontSize: '1.2rem', fontWeight: '700',
              textAlign: 'center', letterSpacing: '0.08em',
              outline: 'none', marginBottom: '0.75rem'
            }}
          />

          <button onClick={handleManualSubmit}
            disabled={!manualBarcode.trim() || manualBarcode.length < 8}
            style={{
              width: '100%', maxWidth: '300px', height: '48px',
              background: manualBarcode.length >= 8 ? G.primary : 'rgba(255, 215, 0, 0.15)',
              border: 'none', borderRadius: '10px',
              color: manualBarcode.length >= 8 ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: '0.9rem', fontWeight: '800',
              cursor: manualBarcode.length >= 8 ? 'pointer' : 'default',
              touchAction: 'manipulation'
            }}
          >
            Zoeken
          </button>
        </div>
      )}

      {/* ═══ BOTTOM SEGMENTED CONTROL — Zoeken | Barcode ═══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0.875rem 1rem 1.25rem' : '1.25rem 1.5rem 1.5rem',
        paddingBottom: `calc(env(safe-area-inset-bottom, 0) + ${isMobile ? '0.875rem' : '1.25rem'})`,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'center', zIndex: 10
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          padding: '4px',
          backdropFilter: 'blur(20px)',
        }}>
          <button
            onClick={() => {
              if (onSwitchToSearch) onSwitchToSearch()
              else if (onClose) onClose()
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '999px',
              color: 'rgba(255, 255, 255, 0.55)',
              fontSize: '0.82rem', fontWeight: '600',
              cursor: 'pointer', touchAction: 'manipulation',
              minHeight: '38px',
            }}
          >
            <Search size={15} strokeWidth={2.4} /> Zoeken
          </button>
          <button
            onClick={() => {
              // Already on barcode — if in manual mode, toggle back to camera
              if (manualMode) {
                setManualMode(false)
                setStatus('idle')
                setScanTime(0)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1.25rem',
              background: '#000',
              border: 'none',
              borderRadius: '999px',
              color: G.primary,
              fontSize: '0.82rem', fontWeight: '700',
              cursor: 'pointer', touchAction: 'manipulation',
              minHeight: '38px',
              boxShadow: `0 2px 12px rgba(255, 215, 0, 0.15)`,
            }}
          >
            <ScanLine size={15} strokeWidth={2.4} /> Barcode
          </button>
        </div>

        {/* Subtle "handmatig" link below the segmented control */}
        {!manualMode && (
          <button onClick={() => { stopScanning(); setManualMode(true); setStatus('idle'); setScanTime(0) }}
            style={{
              position: 'absolute',
              right: isMobile ? '1rem' : '1.5rem',
              bottom: `calc(env(safe-area-inset-bottom, 0) + ${isMobile ? '1.55rem' : '2rem'})`,
              padding: '0.4rem 0.6rem',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '0.7rem', fontWeight: '600',
              cursor: 'pointer', touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            <Keyboard size={13} /> Typ
          </button>
        )}
        {manualMode && (
          <button onClick={() => { setManualMode(false); setStatus('idle'); setScanTime(0) }}
            style={{
              position: 'absolute',
              right: isMobile ? '1rem' : '1.5rem',
              bottom: `calc(env(safe-area-inset-bottom, 0) + ${isMobile ? '1.55rem' : '2rem'})`,
              padding: '0.4rem 0.6rem',
              background: 'transparent',
              border: 'none',
              color: G.primary,
              fontSize: '0.7rem', fontWeight: '600',
              cursor: 'pointer', touchAction: 'manipulation',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            <Camera size={13} /> Camera
          </button>
        )}
      </div>

      <style>{`
        @keyframes bsFadeIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bsScanLine {
          0%   { top: 4%;  }
          100% { top: calc(100% - 4% - 2px); }
        }
      `}</style>
    </div>
  )
}
