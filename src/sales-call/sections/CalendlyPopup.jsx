// src/sales-call/sections/CalendlyPopup.jsx
// In-page Calendly-overlay (goud thema). Opent de kalender als modal op dezelfde
// pagina zodat bezoekers niet wegnavigeren. Laadt widget.js één keer en init de
// inline widget in de eigen container.
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const GOLD = '#ffba09'

export default function CalendlyPopup({ isOpen, onClose, isMobile, url }) {
  const widgetRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  // Calendly in het paginathema (donker + goud) via kleur-params op de URL.
  const themedUrl = url + (url.includes('?') ? '&' : '?') +
    'hide_gdpr_banner=1&background_color=0a0a0a&text_color=ffffff&primary_color=ffba09'

  // Laad het script + init de widget zodra de popup open is.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const init = () => {
      if (cancelled) return
      const el = widgetRef.current
      if (el && window.Calendly) {
        el.innerHTML = ''
        try {
          window.Calendly.initInlineWidget({ url: themedUrl, parentElement: el, prefill: {}, utm: {} })
          setLoaded(true)
        } catch (e) { console.error('Calendly init error:', e) }
      }
    }

    if (window.Calendly) {
      setTimeout(init, 100)
    } else {
      let script = document.querySelector('script[src*="assets.calendly.com/assets/external/widget.js"]')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        script.async = true
        document.body.appendChild(script)
      }
      script.addEventListener('load', () => setTimeout(init, 120), { once: true })
    }

    return () => { cancelled = true }
  }, [isOpen, themedUrl])

  // ESC sluit de popup.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1.25rem', animation: 'cpFade 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a', width: '100%', maxWidth: isMobile ? '100%' : 1040,
          height: isMobile ? '92vh' : '90vh',
          borderRadius: isMobile ? '20px 20px 0 0' : 16,
          border: `1px solid ${GOLD}33`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: isMobile ? 'cpSlide 0.3s cubic-bezier(0.4,0,0.2,1)' : 'cpScale 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '1rem 1.1rem' : '1.1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            Plan je <span style={{ color: GOLD }}>gratis strategiegesprek</span>
          </span>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
            <X size={18} />
          </button>
        </div>

        {/* Widget */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#0a0a0a' }}>
          <div ref={widgetRef} style={{ position: 'absolute', inset: 0, minWidth: 300 }} />
          {!loaded && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${GOLD}33`, borderTopColor: GOLD, borderRadius: '50%', animation: 'cpSpin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 600 }}>Kalender laden...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cpFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cpSlide { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes cpScale { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes cpSpin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
