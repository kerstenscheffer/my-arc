// src/modules/client-meal-builder/components/BarcodeScanner.jsx
// 🎯 v3.0 - Clean UX: subtle instructions, active feedback, timeout handling
import React, { useState, useEffect, useRef } from 'react'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { BrowserMultiFormatReader } from '@zxing/library'
import { X, Keyboard, Camera, CheckCircle, Zap, ZapOff, AlertCircle } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const isMobile = window.innerWidth <= 768
  const videoRef = useRef(null)
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

  // Timer for active scanning feedback
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

  const startScanning = async () => {
    try {
      setStatus('scanning')

      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E
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
        (result, error) => {
          if (result) {
            console.log('🎯 Barcode detected:', result.text)
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
    if (readerRef.current) {
      try { readerRef.current.reset() } catch {}
      readerRef.current = null
    }
    setScanning(false)
  }

  const handleScanSuccess = (barcode) => {
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100])
    setStatus('success')
    stopScanning()
    setTimeout(() => onScan(barcode), 600)
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
    } catch {}
  }

  // Scanning hint text based on time
  const getScanHint = () => {
    if (scanTime < 5) return 'Richt op de barcode'
    if (scanTime < 12) return 'Houd stil, iets dichterbij'
    if (scanTime < 20) return 'Zorg voor goed licht'
    return 'Probeer handmatig invoeren'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      zIndex: 99999, display: 'flex', flexDirection: 'column',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease'
    }}>

      {/* ═══ TOP BAR ═══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: isMobile ? '0.875rem 1rem' : '1.25rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '800', color: '#fff' }}>
            Scan barcode
          </div>
          <div style={{
            fontSize: '0.6rem', fontWeight: '600', marginTop: '0.15rem',
            color: status === 'success' ? '#10b981'
              : status === 'timeout' ? 'rgba(239,68,68,0.7)'
              : 'rgba(255,255,255,0.4)'
          }}>
            {status === 'scanning' ? getScanHint()
              : status === 'success' ? 'Gevonden!'
              : status === 'timeout' ? 'Barcode niet herkend'
              : status === 'error' ? 'Camera niet beschikbaar'
              : 'Starten...'}
          </div>
        </div>

        <button onClick={onClose} style={{
          width: '40px', height: '40px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', touchAction: 'manipulation'
        }}>
          <X size={18} color="#fff" />
        </button>
      </div>

      {/* ═══ CAMERA VIEW ═══ */}
      {!manualMode && (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

          {/* Scan area frame */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '280px' : '360px', height: isMobile ? '130px' : '160px',
            border: `3px solid ${status === 'success' ? '#10b981' : status === 'timeout' ? 'rgba(239,68,68,0.5)' : 'rgba(16, 185, 129, 0.6)'}`,
            borderRadius: '8px', pointerEvents: 'none',
            transition: 'border-color 0.3s ease'
          }}>
            {/* Corner markers */}
            {['tl', 'tr', 'bl', 'br'].map(c => (
              <div key={c} style={{
                position: 'absolute', width: '24px', height: '24px',
                ...(c === 'tl' && { top: '-3px', left: '-3px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981' }),
                ...(c === 'tr' && { top: '-3px', right: '-3px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981' }),
                ...(c === 'bl' && { bottom: '-3px', left: '-3px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981' }),
                ...(c === 'br' && { bottom: '-3px', right: '-3px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981' }),
                borderRadius: '4px'
              }} />
            ))}

            {/* Success checkmark */}
            {status === 'success' && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'bsFadeIn 0.2s ease'
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={32} color="#fff" />
                </div>
              </div>
            )}
          </div>

          {/* Scan line animation */}
          {status === 'scanning' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '280px' : '360px', height: '2px',
              background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
              animation: 'bsScanLine 1.8s linear infinite',
              opacity: 0.8
            }} />
          )}

          {/* Timeout overlay */}
          {status === 'timeout' && (
            <div style={{
              position: 'absolute', bottom: isMobile ? '110px' : '130px',
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.9)', padding: '1rem 1.25rem',
              borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)',
              maxWidth: '85%', textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                <AlertCircle size={14} color="rgba(239,68,68,0.7)" />
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(239,68,68,0.7)' }}>
                  Barcode niet herkend
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Zorg dat de barcode goed zichtbaar is in het kader, of voer de code handmatig in.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={retryScanning} style={{
                  flex: 1, padding: '0.5rem', background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px',
                  color: '#10b981', fontSize: '0.7rem', fontWeight: '700',
                  cursor: 'pointer', touchAction: 'manipulation', minHeight: '36px'
                }}>
                  Opnieuw
                </button>
                <button onClick={() => { stopScanning(); setManualMode(true) }} style={{
                  flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                  color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: '700',
                  cursor: 'pointer', touchAction: 'manipulation', minHeight: '36px'
                }}>
                  Handmatig
                </button>
              </div>
            </div>
          )}

          {/* Scanning time indicator (subtle dots) */}
          {status === 'scanning' && scanTime > 2 && (
            <div style={{
              position: 'absolute', bottom: isMobile ? '110px' : '130px',
              left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '4px', alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#10b981',
                  opacity: (scanTime % 3 === i) ? 1 : 0.2,
                  transition: 'opacity 0.3s ease'
                }} />
              ))}
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
            fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem', textAlign: 'center'
          }}>
            Typ de cijfers onder de streepjescode
          </div>

          <input
            type="text" inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="8710400000000"
            autoFocus
            style={{
              width: '100%', maxWidth: '280px', height: '52px',
              background: 'rgba(255,255,255,0.06)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px', color: '#fff',
              fontSize: '1.2rem', fontWeight: '700',
              textAlign: 'center', letterSpacing: '0.08em',
              outline: 'none', marginBottom: '0.75rem'
            }}
          />

          <button onClick={handleManualSubmit}
            disabled={!manualBarcode.trim() || manualBarcode.length < 8}
            style={{
              width: '100%', maxWidth: '280px', height: '48px',
              background: manualBarcode.length >= 8 ? '#10b981' : 'rgba(16,185,129,0.15)',
              border: 'none', borderRadius: '6px',
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

      {/* ═══ BOTTOM BAR ═══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '1rem 1rem 1.5rem' : '1.5rem',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'center', gap: '0.75rem', zIndex: 10
      }}>
        {!manualMode && (
          <button onClick={toggleTorch} style={{
            width: '48px', height: '48px',
            background: torchEnabled ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)',
            border: torchEnabled ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation'
          }}>
            {torchEnabled ? <Zap size={20} color="#fbbf24" /> : <ZapOff size={20} color="rgba(255,255,255,0.4)" />}
          </button>
        )}

        <button onClick={() => { if (!manualMode) stopScanning(); setManualMode(!manualMode); setStatus('idle'); setScanTime(0) }}
          style={{
            flex: 1, maxWidth: '240px', height: '48px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '6px', color: '#10b981',
            fontSize: '0.85rem', fontWeight: '700',
            cursor: 'pointer', touchAction: 'manipulation',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
          }}
        >
          {manualMode ? <><Camera size={16} /> Camera</> : <><Keyboard size={16} /> Handmatig</>}
        </button>
      </div>

      <style>{`
        @keyframes bsScanLine {
          0% { margin-top: -65px; }
          100% { margin-top: 65px; }
        }
        @keyframes bsFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
