// src/modules/videos/video-tab-components/CourseVisibilityModal.jsx
// Cursus-niveau zichtbaarheid: maak een HELE cursus in één actie standaar
// zichtbaar op pagina('s) + in de home-slider. Alle video's van de cursus
// krijgen dezelfde default_pages + slider-vlag; de client-kant groepeert ze
// automatisch onder één cursus-kaart per pagina.
//
// Bewust getrimde variant van VideoVisibilityModal: geen per-persoon lijst —
// cursussen aan losse personen toewijzen gebeurt via de "Toewijzen"-knop.
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { X, Globe, Check, PlayCircle, Home, Dumbbell, Utensils, ShoppingCart, Camera, Phone, User, GraduationCap } from 'lucide-react'
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

const PAGE_ALIAS = { progress: 'tracking' }
const VALID_PAGES = new Set(PAGE_OPTIONS.map(o => o.value))
const normalizePages = (arr) => {
  const out = []
  for (const p of (arr || [])) {
    const key = PAGE_ALIAS[p] || p
    if (VALID_PAGES.has(key) && !out.includes(key)) out.push(key)
  }
  return out
}

export default function CourseVisibilityModal({ course, onClose, onSaved }) {
  const modalHost = useModalHost()
  const isMobile = useIsMobile()
  const [pages, setPages] = useState([])
  const [showInSlider, setShowInSlider] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Huidige zichtbaarheid afleiden uit de cursus-video's (unie van default_pages).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const vis = await videoService.getCourseVisibility(course.id)
      if (!alive) return
      setPages(normalizePages(vis.pages))
      setShowInSlider(!!vis.showInSlider)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [course.id])

  const togglePage = (p) => setPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await videoService.setCourseVisibility(course.id, { pages, showInSlider })
      if (!res.success) { alert('Opslaan mislukt: ' + (res.error || 'onbekende fout')); return }
      onSaved?.()
      onClose()
    } catch (e) {
      console.error('course visibility save failed:', e)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }
  const toggleBtn = (on, color = GOLD) => ({ width: 40, height: 22, background: on ? color : 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0, touchAction: 'manipulation' })
  const knob = (on) => ({ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease' })
  const nowhere = pages.length === 0 && !showInSlider

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#0a0a0a', width: '100%', maxWidth: isMobile ? '100%' : '470px', maxHeight: isMobile ? '92vh' : '90vh', borderRadius: isMobile ? '12px 12px 0 0' : '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={10} color={GOLD} /> Cursus-zichtbaarheid</div>
            <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Uitleg */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Globe size={16} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                In één keer alle {course.videoCount || ''} video's van deze cursus standaard zichtbaar maken voor iedereen. De client ziet ze gegroepeerd onder één cursus-kaart op de gekozen pagina('s).
              </div>
            </div>
          </div>

          {/* Pagina's */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: pages.length > 0 ? `3px solid ${GOLD}` : '3px solid transparent' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={10} /> Zichtbaar op
              {pages.length > 0 && <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: GOLD, color: '#000', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800 }}>{pages.length}</span>}
            </label>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              Op welke pagina('s) iedereen de cursus standaard ziet.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.3rem' }}>
              {PAGE_OPTIONS.map(page => {
                const Icon = page.icon
                const sel = pages.includes(page.value)
                return (
                  <button key={page.value} onClick={() => togglePage(page.value)} style={{ padding: '0.55rem 0.4rem', background: sel ? GOLD : 'transparent', border: sel ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: sel ? '#000' : 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.03em', touchAction: 'manipulation', minHeight: '40px' }}>
                    <Icon size={12} />{page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Slider */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: showInSlider ? `3px solid ${GOLD}` : '3px solid transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <PlayCircle size={16} color={showInSlider ? GOLD : 'rgba(255,255,255,0.3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>Tonen in home-slider</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>De cursus-video's verschijnen in de auto-roterende slider bovenaan de home-pagina.</div>
              </div>
              <button onClick={() => setShowInSlider(v => !v)} style={toggleBtn(showInSlider)}><div style={knob(showInSlider)} /></button>
            </div>
          </div>

          {/* Waarschuwing bij "nergens" */}
          {!loading && nowhere && (
            <div style={{ padding: isMobile ? '0.7rem 0.95rem' : '0.75rem 1.125rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
              Niks geselecteerd → de cursus is straks nergens standaard zichtbaar (bestaande persoonlijke toewijzingen blijven staan).
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: isMobile ? '0.625rem 0.95rem' : '0.75rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', touchAction: 'manipulation' }}>Annuleer</button>
          <button onClick={handleSave} disabled={saving || loading} style={{ flex: 2, padding: '0.625rem', background: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.7rem', fontWeight: 800, cursor: (saving || loading) ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: (saving || loading) ? 0.6 : 1, touchAction: 'manipulation' }}><Check size={13} />{saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      </div>
    </div>,
    modalHost
  )
}
