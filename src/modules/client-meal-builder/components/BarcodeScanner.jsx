import React, { useState, useEffect, useRef } from 'react'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { BrowserMultiFormatReader } from '@zxing/library'
import { X, Keyboard, Camera, CheckCircle, Zap, ZapOff } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const isMobile = window.innerWidth <= 768
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  
  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [status, setStatus] = useState('idle')
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    scanAttempts: 0,
    lastError: '',
    cameraResolution: '',
    fps: 0
  })
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])
  
  useEffect(() => {
    if (!manualMode && !scanning) {
      startScanning()
    }
    
    return () => {
      stopScanning()
    }
  }, [manualMode])
  
  const startScanning = async () => {
    try {
      console.log('📷 ========== STARTING EAN/UPC SCANNER ==========')
      setStatus('scanning')
      
      // CRITICAL FIX: Only scan EAN-13, EAN-8, UPC-A, UPC-E (food barcodes)
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      
      const codeReader = new BrowserMultiFormatReader(hints, 500)
      readerRef.current = codeReader
      console.log('✅ EAN/UPC Reader created (4 formats only)')
      
      const videoElement = videoRef.current
      if (!videoElement) {
        console.error('❌ Video element not found')
        return
      }
      console.log('✅ Video element found')
      
      const devices = await codeReader.listVideoInputDevices()
      console.log('📹 Available cameras:', devices.length)
      devices.forEach((device, idx) => {
        console.log(`  [${idx}] ${device.label}`)
      })
      
      if (devices.length === 0) {
        throw new Error('No camera found')
      }
      
      let selectedDevice = devices[0]
      if (isMobile && devices.length > 1) {
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        if (backCamera) {
          selectedDevice = backCamera
          console.log('📱 Using back camera:', backCamera.label)
        }
      } else {
        console.log('📷 Using camera:', selectedDevice.label)
      }
      
      const constraints = {
        video: {
          deviceId: selectedDevice.deviceId,
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: 'continuous'
        }
      }
      
      console.log('🎯 Scanning ONLY: EAN-13, EAN-8, UPC-A, UPC-E')
      
      let scanCount = 0
      const startTime = Date.now()
      
      await codeReader.decodeFromConstraints(
        constraints,
        videoElement,
        (result, error) => {
          scanCount++
          
          if (result) {
            console.log('🎯 ========== BARCODE DETECTED ==========')
            console.log('📊 Scan attempts:', scanCount)
            console.log('⏱️ Time taken:', ((Date.now() - startTime) / 1000).toFixed(2), 'seconds')
            console.log('📝 Barcode:', result.text)
            console.log('🔤 Format:', result.getBarcodeFormat())
            console.log('=========================================')
            handleScanSuccess(result.text)
          }
          
          if (error) {
            const errorMsg = error.message || error.toString()
            
            if (scanCount % 20 === 0) {
              const elapsed = (Date.now() - startTime) / 1000
              const fps = Math.round(scanCount / elapsed)
              console.log(`📊 Progress: ${scanCount} scans in ${elapsed.toFixed(1)}s (${fps} fps)`)
              
              setDebugInfo({
                scanAttempts: scanCount,
                lastError: errorMsg.includes('NotFoundException') ? 'Looking for barcode...' : errorMsg,
                fps: fps,
                cameraResolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`
              })
            }
          }
        }
      )
      
      setTimeout(() => {
        if (videoElement.videoWidth && videoElement.videoHeight) {
          const resolution = `${videoElement.videoWidth}x${videoElement.videoHeight}`
          console.log('📐 Video resolution:', resolution)
        }
      }, 1000)
      
      setScanning(true)
      console.log('✅ ========== SCANNER STARTED ==========')
      console.log('💡 IMPORTANT TIPS:')
      console.log('  ✓ Hold barcode FLAT and HORIZONTAL')
      console.log('  ✓ 15-20cm distance from camera')
      console.log('  ✓ Good lighting (not too dark)')
      console.log('  ✓ Keep camera STEADY for 2-3 seconds')
      console.log('  ✓ Fill the green box with barcode')
      console.log('=========================================')
      
    } catch (error) {
      console.error('❌ ========== SCANNER FAILED ==========')
      console.error('Error:', error.message)
      console.error('=========================================')
      setStatus('error')
      setDebugInfo(prev => ({
        ...prev,
        lastError: error.message
      }))
      setManualMode(true)
    }
  }
  
  const stopScanning = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
        console.log('📷 Scanner stopped - Final stats:', debugInfo)
      } catch (error) {
        console.log('⚠️ Stop error:', error.message)
      }
      readerRef.current = null
    }
    setScanning(false)
  }
  
  const handleScanSuccess = (barcode) => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100])
    }
    
    setStatus('success')
    stopScanning()
    
    setTimeout(() => {
      onScan(barcode)
    }, 800)
  }
  
  const handleManualSubmit = () => {
    if (manualBarcode.trim() && manualBarcode.length >= 8) {
      console.log('✅ Manual barcode:', manualBarcode)
      if (window.navigator.vibrate) {
        window.navigator.vibrate(50)
      }
      onScan(manualBarcode.trim())
    }
  }
  
  const toggleTorch = async () => {
    if (!videoRef.current) return
    
    try {
      const stream = videoRef.current.srcObject
      if (!stream) return
      
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled }]
        })
        setTorchEnabled(!torchEnabled)
      }
    } catch (error) {
      console.log('Torch not supported')
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease'
    }}>
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '900',
            color: '#fff',
            margin: 0,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            Scan Barcode
          </h2>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0.25rem 0 0',
            fontWeight: '300',
            fontFamily: 'monospace'
          }}>
            {status === 'scanning' ? (
              `${debugInfo.scanAttempts} scans | ${debugInfo.fps} fps | ${debugInfo.cameraResolution}`
            ) : 
             status === 'success' ? '✅ Gevonden!' :
             status === 'error' ? `❌ ${debugInfo.lastError}` : 
             'Initialiseren...'}
          </p>
        </div>
        
        <button onClick={onClose} style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)'
        }}>
          <X size={20} color="#fff" />
        </button>
      </div>
      
      {!manualMode && (
        <div style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          
          <video ref={videoRef} style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }} />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '300px' : '400px',
            height: isMobile ? '140px' : '180px',
            border: `4px solid ${status === 'success' ? '#10b981' : 'rgba(16, 185, 129, 0.8)'}`,
            borderRadius: '12px',
            pointerEvents: 'none',
            boxShadow: status === 'success' 
              ? '0 0 60px rgba(16, 185, 129, 0.8)'
              : '0 0 40px rgba(16, 185, 129, 0.4)',
            animation: status === 'scanning' ? 'pulse 2s infinite' : 'none'
          }}>
            {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(corner => (
              <div key={corner} style={{
                position: 'absolute',
                width: '35px',
                height: '35px',
                ...(corner === 'topLeft' && { top: '-4px', left: '-4px', borderTop: '5px solid #10b981', borderLeft: '5px solid #10b981' }),
                ...(corner === 'topRight' && { top: '-4px', right: '-4px', borderTop: '5px solid #10b981', borderRight: '5px solid #10b981' }),
                ...(corner === 'bottomLeft' && { bottom: '-4px', left: '-4px', borderBottom: '5px solid #10b981', borderLeft: '5px solid #10b981' }),
                ...(corner === 'bottomRight' && { bottom: '-4px', right: '-4px', borderBottom: '5px solid #10b981', borderRight: '5px solid #10b981' }),
                borderRadius: '6px'
              }} />
            ))}
            
            {status === 'success' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70px',
                height: '70px',
                background: 'rgba(16, 185, 129, 0.95)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'scaleIn 0.3s ease',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.8)'
              }}>
                <CheckCircle size={40} color="#fff" />
              </div>
            )}
          </div>
          
          {status === 'scanning' && (
            <>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isMobile ? '300px' : '400px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                animation: 'scanLine 2s linear infinite',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.9)'
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '120px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                maxWidth: '90%',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1rem',
                  color: '#10b981',
                  fontWeight: '700',
                  marginBottom: '0.5rem'
                }}>
                  📍 HOUD BARCODE IN GROEN VIERKANT
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.4
                }}>
                  Horizontaal • 15-20cm afstand • Steady houden
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {manualMode && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <Keyboard size={40} color="#10b981" />
          </div>
          
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Voer barcode in
          </h3>
          
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Type de cijfers onder de barcode
          </p>
          
          <input
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="5449000000996"
            autoFocus
            style={{
              width: '100%',
              maxWidth: '300px',
              height: '56px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0',
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.1em',
              outline: 'none',
              marginBottom: '1rem'
            }}
          />
          
          <button
            onClick={handleManualSubmit}
            disabled={!manualBarcode.trim() || manualBarcode.length < 8}
            style={{
              width: '100%',
              maxWidth: '300px',
              height: '56px',
              background: manualBarcode.trim() && manualBarcode.length >= 8
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(16, 185, 129, 0.2)',
              border: 'none',
              borderRadius: '0',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '800',
              cursor: manualBarcode.trim() && manualBarcode.length >= 8 ? 'pointer' : 'not-allowed',
              opacity: manualBarcode.trim() && manualBarcode.length >= 8 ? 1 : 0.5
            }}
          >
            Zoek Ingredient
          </button>
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: isMobile ? '1.5rem 1rem 2rem' : '2rem',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        zIndex: 10
      }}>
        
        {!manualMode && (
          <button onClick={toggleTorch} style={{
            width: '56px',
            height: '56px',
            background: torchEnabled ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: torchEnabled ? '2px solid rgba(251, 191, 36, 0.5)' : '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}>
            {torchEnabled ? <Zap size={24} color="#fbbf24" /> : <ZapOff size={24} color="rgba(255, 255, 255, 0.6)" />}
          </button>
        )}
        
        <button
          onClick={() => {
            if (!manualMode) stopScanning()
            setManualMode(!manualMode)
          }}
          style={{
            flex: 1,
            maxWidth: '300px',
            height: '56px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '0',
            color: '#10b981',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {manualMode ? (
            <>
              <Camera size={20} />
              Camera
            </>
          ) : (
            <>
              <Keyboard size={20} />
              Manual
            </>
          )}
        </button>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.03); }
        }
        @keyframes scanLine {
          0% { top: calc(50% - 70px); }
          100% { top: calc(50% + 70px); }
        }
        @keyframes scaleIn {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
