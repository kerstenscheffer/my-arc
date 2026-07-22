// src/modules/videos/video-tab-components/VideoVisibilityModal.jsx
// Gerichte "waar toon ik deze video"-modal, geopend via de primaire knop op
// een videokaart. Stelt de STANDAARD zichtbaarheid in voor ALLE clients:
//   - default_pages: op welke pagina('s) de video standaard verschijnt
//   - show_in_slider: of'ie in de home-slider komt
// Slaat op via videoService.updateVideo — geen per-client toewijzingen meer.
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Globe, Check, PlayCircle, Home, Dumbbell, Utensils, ShoppingCart, Camera, Phone, User } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

const GOLD = '#FFD700'

const PAGE_OPTIONS = [
  { value: 'home',         label: 'Home',         icon: Home },
  { value: 'workout',      label: 'Workout',      icon: Dumbbell },
  { value: 'meal',         label: 'Meal',         icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',     icon: Camera },
  { value: 'calls',        label: 'Calls',        icon: Phone },
  { value: 'profile',      label: 'Profile',      icon: User },
]

export default function VideoVisibilityModal({ video, onClose, onSaved }) {
  const isMobile = useIsMobile()
  const [defaultPages, setDefaultPages] = useState(Array.isArray(video.default_pages) ? video.default_pages : [])
  const [showInSlider, setShowInSlider] = useState(!!video.show_in_slider)
  const [saving, setSaving] = useState(false)

  const togglePage = (p) => {
    setDefaultPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await videoService.updateVideo(video.id, {
        default_pages: defaultPages,
        show_in_slider: showInSlider,
      })
      if (result?.success) {
        onSaved?.()
        onClose()
      } else {
        alert('Opslaan mislukt: ' + (result?.error || 'onbekende fout'))
      }
    } catch (e) {
      console.error('visibility save failed:', e)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#0a0a0a', width: '100%', maxWidth: isMobile ? '100%' : '460px', maxHeight: isMobile ? '92vh' : '88vh', borderRadius: isMobile ? '12px 12px 0 0' : '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>
              Zichtbaarheid
            </div>
            <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {video.title}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Standaard pagina's */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: defaultPages.length > 0 ? `3px solid ${GOLD}` : '3px solid transparent' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={10} />
              Standaard zichtbaar voor iedereen op
              {defaultPages.length > 0 && (
                <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: GOLD, color: '#000', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800 }}>{defaultPages.length}</span>
              )}
            </label>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              Automatisch zichtbaar bij ALLE clients (ook nieuwe) op de gekozen pagina's.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.3rem' }}>
              {PAGE_OPTIONS.map(page => {
                const Icon = page.icon
                const isSelected = defaultPages.includes(page.value)
                return (
                  <button
                    key={page.value}
                    onClick={() => togglePage(page.value)}
                    style={{ padding: '0.55rem 0.4rem', background: isSelected ? GOLD : 'transparent', border: isSelected ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: isSelected ? '#000' : 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.03em', touchAction: 'manipulation', minHeight: '40px' }}
                  >
                    <Icon size={12} />
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Home-slider toggle */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: showInSlider ? `3px solid ${GOLD}` : '3px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <PlayCircle size={16} color={showInSlider ? GOLD : 'rgba(255,255,255,0.3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>
                  Tonen in home-slider
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                  Verschijnt in de auto-roterende slider bovenaan de home-pagina.
                </div>
              </div>
              <button
                onClick={() => setShowInSlider(v => !v)}
                style={{ width: 40, height: 22, background: showInSlider ? GOLD : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0, touchAction: 'manipulation' }}
              >
                <div style={{ position: 'absolute', top: 2, left: showInSlider ? 20 : 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: isMobile ? '0.625rem 0.95rem' : '0.75rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', touchAction: 'manipulation' }}>
            Annuleer
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.625rem', background: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.7rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: saving ? 0.6 : 1, touchAction: 'manipulation' }}>
            <Check size={13} />
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
