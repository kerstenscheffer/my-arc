// src/modules/client-meal-builder/components/BarcodeScanner.jsx
// Food-app inspired: gold theme, soft frame, in-viewfinder helper text,
// silent feedback (no scan-line), late hints, bottom Zoeken|Barcode pill.

import React, { useState, useEffect, useRef, createElement } from 'react'
import {
  BarcodeFormat, DecodeHintType, MultiFormatReader,
  RGBLuminanceSource, HybridBinarizer, BinaryBitmap,
} from '@zxing/library'
import { X, Keyboard, Camera, CheckCircle, Zap, ZapOff, Search, ScanLine, Image as ImageIcon } from 'lucide-react'
import { leesBarcodeUitFoto } from './leesBarcodeUitFoto'
import { colors, radius, space, type, border } from '../../../ui/tokens'
import { Capacitor, registerPlugin } from '@capacitor/core'

// De scanner van de telefoon zelf, alleen in de iPhone-app (12 nov 2026).
// Via de webweergave vroeg iOS bij elke scan opnieuw om de camera; de native
// scanner vraagt het één keer per installatie. Rechtstreeks geregistreerd en
// niet via het pakket @capacitor/barcode-scanner geïmporteerd: dat sleept een
// web-scanner mee de bundel in die we niet gebruiken. Oudere app-versies
// hebben de plugin niet en houden de camera-in-de-pagina hieronder.
const AppScanner = registerPlugin('CapacitorBarcodeScanner')
const heeftAppScanner = () => {
  try {
    return Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('CapacitorBarcodeScanner')
  } catch { return false }
}

const G = {
  primary: '#FFD700',
  primarySoft: 'rgba(255, 215, 0, 0.15)',
  primaryBorder: 'rgba(255, 215, 0, 0.35)',
}

// Eén gevulde witte knop per keer: de actie die nu aan de beurt is.
const knopStijl = (primair, uit) => ({
  width: '100%', maxWidth: 300, minHeight: 48,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space[2],
  background: primair ? colors.textPrimary : colors.surface,
  border: 'none', borderRadius: radius.btn,
  color: primair ? colors.onAccent : colors.textPrimary,
  fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
  opacity: uit ? 0.5 : 1, cursor: uit ? 'default' : 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

export default function BarcodeScanner({ onScan, onClose, onSwitchToSearch }) {
  const isMobile = window.innerWidth <= 768
  const videoRef = useRef(null)
  const nativeRef = useRef(null)
  const readerRef = useRef(null)
  const timeoutRef = useRef(null)
  const appBezigRef = useRef(false)

  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [status, setStatus] = useState('idle') // idle, scanning, success, timeout, error
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [scanTime, setScanTime] = useState(0)
  const fotoRef = useRef(null)
  const invoerRef = useRef(null)
  const galerijRef = useRef(null)
  const [fotoKeuze, setFotoKeuze] = useState(false)
  const [fotoLezen, setFotoLezen] = useState(false)
  const [fotoFout, setFotoFout] = useState(false)

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

  // true = de app-scanner heeft het afgehandeld (ook bij annuleren).
  const startAppScanner = async () => {
    if (!heeftAppScanner()) return false
    if (appBezigRef.current) return true
    appBezigRef.current = true
    try {
      const uit = await AppScanner.scanBarcode({
        hint: 17, // alle soorten; Apple leest EAN en UPC hoe dan ook samen
        scanInstructions: 'Richt op de barcode', scanButton: false, scanText: ' ',
        cameraDirection: 1, scanOrientation: 1,
        cancelButtonAccessibilityLabel: 'Sluiten',
      })
      const code = String(uit?.ScanResult || '').trim()
      if (code) { handleScanSuccess(code); return true }
    } catch (e) {
      console.warn('app-scanner gestopt:', e?.message)
    } finally {
      appBezigRef.current = false
    }
    // Geannuleerd of geen camera: handmatig invoeren, met de weg terug naar
    // scannen en zoeken die daar al staat.
    setManualMode(true)
    return true
  }

  const startScanning = async () => {
    try {
      if (await startAppScanner()) return
      setStatus('scanning')

      // Eerst de ingebouwde lezer proberen; die is niet kieskeurig over de
      // stand van de barcode. Pas als die er niet is, ZXing.
      if (await startNativeScanner()) return

      // Eigen leeslus in plaats van decodeFromConstraints.
      //
      // Waarom: ZXing probeert een gedraaide barcode pas nadat de eerste
      // poging is mislukt, en doet dat op het volledige camerabeeld van
      // 1920x1080 met TRY_HARDER aan. In JavaScript op een telefoon is die
      // tweede poging zo traag dat je 'm in de praktijk zelden haalt — de
      // ene stand leest vlot, de andere voelt alsof hij niet werkt.
      //
      // Hier verkleinen we het beeld eerst en bieden we elke frame allebei
      // de standen aan, elk als eigen poging. Twee kleine pogingen zijn
      // samen sneller dan één grote met een trage herkansing erachteraan.
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const lezer = new MultiFormatReader()
      lezer.setHints(hints)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920 }, height: { ideal: 1080 },
        },
      })
      const videoElement = videoRef.current
      if (!videoElement) { stream.getTracks().forEach(t => t.stop()); return }
      videoElement.srcObject = stream
      videoElement.setAttribute('playsinline', 'true')
      await videoElement.play()

      // Langste zijde terug naar 1280. Genoeg detail voor een EAN-13 en
      // ruwweg de helft van het rekenwerk van een volledig 1080p-beeld.
      const MAX_ZIJDE = 1280
      const doek = document.createElement('canvas')
      const ctx = doek.getContext('2d', { willReadFrequently: true })
      const gedraaid = document.createElement('canvas')
      const ctxGedraaid = gedraaid.getContext('2d', { willReadFrequently: true })

      const leesDoek = (c, x) => {
        const { width: w, height: h } = c
        if (!w || !h) return null
        const beeld = x.getImageData(0, 0, w, h).data
        // Grijswaarden, groen zwaarder gewogen — zoals ZXing zelf ook doet.
        const grijs = new Uint8ClampedArray(w * h)
        for (let i = 0, j = 0; i < grijs.length; i++, j += 4) {
          grijs[i] = (beeld[j] + 2 * beeld[j + 1] + beeld[j + 2]) / 4
        }
        const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(grijs, w, h)))
        try {
          return lezer.decodeWithState(bitmap)
        } catch {
          // Niets gevonden in dit beeld. Volgende poging of volgende frame.
          return null
        } finally {
          // decodeWithState houdt status vast tussen aanroepen; zonder reset
          // blijft een mislukte poging de volgende beinvloeden.
          lezer.reset()
        }
      }

      readerRef.current = { stream, interval: null }
      readerRef.current.interval = setInterval(() => {
        const v = videoRef.current
        if (!v || v.readyState < 2 || !v.videoWidth) return

        const schaal = Math.min(1, MAX_ZIJDE / Math.max(v.videoWidth, v.videoHeight))
        const w = Math.round(v.videoWidth * schaal)
        const h = Math.round(v.videoHeight * schaal)
        if (doek.width !== w || doek.height !== h) {
          doek.width = w; doek.height = h
          gedraaid.width = h; gedraaid.height = w
        }
        ctx.drawImage(v, 0, 0, w, h)

        // Stand 1: zoals de camera hem geeft.
        let uitkomst = leesDoek(doek, ctx)

        // Stand 2: een kwartslag gedraaid. Een streepjescode wordt langs
        // horizontale lijnen gelezen, dus wat rechtop staat is pas leesbaar
        // nadat het is gekanteld. Beide richtingen zijn gelijkwaardig, want
        // ZXing leest een regel ook achterstevoren.
        if (!uitkomst) {
          ctxGedraaid.save()
          ctxGedraaid.translate(h, 0)
          ctxGedraaid.rotate(Math.PI / 2)
          ctxGedraaid.drawImage(doek, 0, 0)
          ctxGedraaid.restore()
          uitkomst = leesDoek(gedraaid, ctxGedraaid)
        }

        if (uitkomst?.getText) handleScanSuccess(uitkomst.getText())
      }, 200)

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
      // Sinds we een eigen leeslus draaien staat hier {stream, interval},
      // niet meer een ZXing-lezer met .reset().
      clearInterval(readerRef.current.interval)
      readerRef.current.stream?.getTracks?.().forEach(t => t.stop())
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

  const kiesFoto = async (e) => {
    const bestand = e.target.files?.[0]
    e.target.value = ''
    if (!bestand) return
    setFotoFout(false)
    setFotoLezen(true)
    try {
      const code = await leesBarcodeUitFoto(bestand)
      if (code) handleScanSuccess(code)
      else setFotoFout(true)
    } catch (err) {
      console.warn('Foto van barcode niet gelezen:', err?.message)
      setFotoFout(true)
    } finally {
      setFotoLezen(false)
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
          alignItems: 'center', justifyContent: 'center', padding: space[8], paddingBottom: 96,
        }}>
          <div style={{ ...type.title, marginBottom: space[2], textAlign: 'center' }}>
            Barcode invoeren
          </div>
          <div style={{ ...type.body, marginBottom: space[6], textAlign: 'center', maxWidth: 300 }}>
            {status === 'error'
              ? 'De camera opent niet op dit toestel. Maak een foto van de barcode of typ de cijfers.'
              : 'Typ de cijfers onder de streepjescode'}
          </div>

          <input
            ref={invoerRef}
            type="text" inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="8710400000000"
            autoFocus={status !== 'error'}
            style={{
              width: '100%', maxWidth: 300, height: 52, boxSizing: 'border-box',
              background: colors.surface, border: 'none', borderRadius: radius.btn,
              color: colors.textPrimary, fontFamily: 'inherit',
              fontSize: 22, fontWeight: 800,
              textAlign: 'center', letterSpacing: '0.04em',
              outline: 'none', marginBottom: space[3],
            }}
          />

          <button onClick={handleManualSubmit}
            disabled={manualBarcode.length < 8}
            style={knopStijl(manualBarcode.length >= 8, manualBarcode.length < 8)}
          >
            Zoeken
          </button>

          {/* Foto via de camera-app: werkt ook als de live camera niet opent.
              Twee invoervelden: met `capture` opent de camera meteen, zonder de
              fotokiezer. Desktop heeft geen camera-app: daar direct een bestand. */}
          <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={kiesFoto} style={{ display: 'none' }} />
          <input ref={galerijRef} type="file" accept="image/*" onChange={kiesFoto} style={{ display: 'none' }} />
          {fotoKeuze ? (
            <div style={{ display: 'flex', gap: space[2], width: '100%', maxWidth: 300, marginTop: space[2] }}>
              <button onClick={() => { setFotoKeuze(false); fotoRef.current?.click() }} style={{ ...knopStijl(true, false), flex: 1, minWidth: 0 }}>
                <Camera size={17} strokeWidth={2.6} /> Camera
              </button>
              <button onClick={() => { setFotoKeuze(false); galerijRef.current?.click() }} style={{ ...knopStijl(true, false), flex: 1, minWidth: 0 }}>
                <ImageIcon size={17} strokeWidth={2.6} /> Foto kiezen
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setFotoFout(false); if (isMobile) setFotoKeuze(true); else galerijRef.current?.click() }}
              disabled={fotoLezen}
              style={{ ...knopStijl(manualBarcode.length < 8, fotoLezen), marginTop: space[2] }}
            >
              <Camera size={17} strokeWidth={2.6} /> {fotoLezen ? 'Foto lezen…' : 'Foto van barcode'}
            </button>
          )}
          {fotoFout && (
            <div style={{ ...type.body, color: colors.textPrimary, marginTop: space[3], textAlign: 'center', maxWidth: 300 }}>
              Geen barcode gevonden. Maak de foto dichterbij en scherp, of typ de cijfers.
            </div>
          )}
        </div>
      )}

      {/* ═══ ONDERBALK — Zoeken | Barcode | Typ ═══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: space[4],
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${space[4]}px)`,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'center', zIndex: 10,
      }}>
        <div style={{
          position: 'relative', display: 'flex', width: '100%', maxWidth: 360,
          background: colors.surface, border: border.subtle,
          borderRadius: radius.pill, padding: 3,
        }}>
          <div style={{
            position: 'absolute', top: 3, bottom: 3,
            left: `calc(3px + (100% - 6px) * ${(manualMode ? 2 : 1) / 3})`, width: 'calc((100% - 6px) / 3)',
            background: colors.textPrimary, borderRadius: radius.pill,
            transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {[
            { id: 'zoek', label: 'Zoeken', Icoon: Search, aan: false, doe: () => { if (onSwitchToSearch) onSwitchToSearch(); else if (onClose) onClose() } },
            { id: 'scan', label: 'Barcode', Icoon: ScanLine, aan: !manualMode, doe: () => {
              if (!manualMode) return
              setFotoFout(false); setManualMode(false); setStatus('idle'); setScanTime(0)
            } },
            { id: 'typ', label: 'Typ', Icoon: Keyboard, aan: manualMode, doe: () => {
              // Stond het typscherm al open na een camerafout: dan alleen het toetsenbord.
              if (manualMode) { setStatus('idle'); invoerRef.current?.focus(); return }
              stopScanning(); setManualMode(true); setStatus('idle'); setScanTime(0)
            } },
          ].map(({ id, label, Icoon, aan, doe }) => (
            <button key={id} onClick={doe} style={{
              position: 'relative', zIndex: 1, flex: 1, minWidth: 0, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'transparent', border: 'none', borderRadius: radius.pill,
              color: aan ? colors.onAccent : colors.textPrimary,
              fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
              cursor: 'pointer', transition: 'color 0.15s ease',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              {createElement(Icoon, { size: 16, strokeWidth: 2.6 })} {label}
            </button>
          ))}
        </div>
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
