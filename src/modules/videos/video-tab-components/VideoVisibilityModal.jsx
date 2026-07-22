// src/modules/videos/video-tab-components/VideoVisibilityModal.jsx
// Eén modal voor "waar/aan wie is deze video zichtbaar". Geopend via de knop
// op een videokaart. Twee modi via één toggle:
//   - Standaard voor IEDEREEN  -> default_pages (pagina's) + show_in_slider
//   - Alleen aan PERSONEN       -> per-client video_assignments (aanvinken)
// Plus een globale zichtbaar/verborgen schakelaar (is_active).
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Globe, Check, PlayCircle, Home, Dumbbell, Utensils, ShoppingCart, Camera, Phone, User, Eye, EyeOff, Users } from 'lucide-react'
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

// Legacy pagina-sleutels -> huidige client-pagina's. 'progress' was de oude
// naam voor de tracking-pagina; zonder deze mapping telde'ie wel mee in de
// badge maar had geen knop (onzichtbaar geselecteerd).
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

const clientName = (c, idx) =>
  (c.first_name && c.last_name) ? `${c.first_name} ${c.last_name}`
  : c.first_name || c.last_name || c.email || `Client ${idx + 1}`

export default function VideoVisibilityModal({ video, clients = [], onClose, onSaved }) {
  const isMobile = useIsMobile()
  const hadDefaults = (Array.isArray(video.default_pages) && video.default_pages.length > 0) || !!video.show_in_slider

  const [isActive, setIsActive] = useState(video.is_active !== false)
  const [forEveryone, setForEveryone] = useState(hadDefaults)
  const [pages, setPages] = useState(normalizePages(video.default_pages))
  const [showInSlider, setShowInSlider] = useState(!!video.show_in_slider)
  const [selectedClients, setSelectedClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Huidige per-client toewijzingen inladen zodat de personen-lijst de al
  // toegewezen mensen voorvinkt, en om de modus goed te raden.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const rows = await videoService.getVideoAssignments(video.id)
      if (!alive) return
      const clientIds = [...new Set((rows || []).map(r => r.client_id).filter(Boolean))]
      setSelectedClients(clientIds)
      // Geen standaard-instellingen maar wél toewijzingen -> personen-modus.
      if (!hadDefaults && clientIds.length > 0) {
        setForEveryone(false)
        const pageCtx = normalizePages((rows || []).map(r => r.page_context).filter(Boolean))
        if (pageCtx.length) setPages(pageCtx)
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [video.id, hadDefaults])

  const togglePage = (p) => setPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  const toggleClient = (id) => setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const allSelected = clients.length > 0 && selectedClients.length === clients.length
  const toggleAll = () => setSelectedClients(allSelected ? [] : clients.map(c => c.id))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!isActive) {
        await videoService.updateVideo(video.id, { is_active: false })
      } else if (forEveryone) {
        await videoService.updateVideo(video.id, { is_active: true, default_pages: pages, show_in_slider: showInSlider })
        await videoService.clearVideoAssignments(video.id) // niet meer per-persoon
      } else {
        // Personen-modus: geen standaard, wel per-client toewijzingen (vervang de set).
        await videoService.updateVideo(video.id, { is_active: true, default_pages: [], show_in_slider: false })
        await videoService.clearVideoAssignments(video.id)
        if (selectedClients.length > 0) {
          const targetPages = pages.length ? pages : ['home']
          for (const page of targetPages) {
            await videoService.assignVideo(video.id, selectedClients, { pageContext: page })
          }
        }
      }
      onSaved?.()
      onClose()
    } catch (e) {
      console.error('visibility save failed:', e)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = { display: 'block', fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }
  const toggleBtn = (on, color = GOLD) => ({ width: 40, height: 22, background: on ? color : 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0, padding: 0, touchAction: 'manipulation' })
  const knob = (on) => ({ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease' })

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#0a0a0a', width: '100%', maxWidth: isMobile ? '100%' : '470px', maxHeight: isMobile ? '92vh' : '90vh', borderRadius: isMobile ? '12px 12px 0 0' : '12px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>Zichtbaarheid</div>
            <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Master: zichtbaar of verborgen */}
          <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${isActive ? '#10b981' : '#ef4444'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isActive ? <Eye size={16} color="#10b981" /> : <EyeOff size={16} color="#ef4444" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '0.15rem' }}>{isActive ? 'Video zichtbaar' : 'Video verborgen'}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{isActive ? 'Zichtbaar volgens de instellingen hieronder.' : 'Verschijnt nergens — ongeacht de instellingen hieronder.'}</div>
              </div>
              <button onClick={() => setIsActive(v => !v)} style={toggleBtn(isActive, '#10b981')}><div style={knob(isActive)} /></button>
            </div>
          </div>

          <div style={{ opacity: isActive ? 1 : 0.4, pointerEvents: isActive ? 'auto' : 'none' }}>
            {/* Modus: iedereen of personen */}
            <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: `3px solid ${forEveryone ? GOLD : '#3b82f6'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {forEveryone ? <Globe size={16} color={GOLD} /> : <Users size={16} color="#3b82f6" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '0.15rem' }}>Standaard zichtbaar voor iedereen</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{forEveryone ? 'Alle clients (ook nieuwe) zien deze video.' : 'Uit: alleen de aangevinkte personen krijgen de video.'}</div>
                </div>
                <button onClick={() => setForEveryone(v => !v)} style={toggleBtn(forEveryone, GOLD)}><div style={knob(forEveryone)} /></button>
              </div>
            </div>

            {/* Pagina's — geldt voor beide modi (waar verschijnt de video) */}
            <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: pages.length > 0 ? `3px solid ${GOLD}` : '3px solid transparent' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Globe size={10} /> Zichtbaar op
                {pages.length > 0 && <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: GOLD, color: '#000', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800 }}>{pages.length}</span>}
              </label>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {forEveryone ? 'Op welke pagina(’s) iedereen de video standaard ziet.' : 'Op welke pagina(’s) de gekozen personen de video zien.'}
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

            {/* Iedereen -> slider toggle */}
            {forEveryone && (
              <div style={{ padding: isMobile ? '0.85rem 0.95rem' : '0.95rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: showInSlider ? `3px solid ${GOLD}` : '3px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <PlayCircle size={16} color={showInSlider ? GOLD : 'rgba(255,255,255,0.3)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>Tonen in home-slider</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Verschijnt in de auto-roterende slider bovenaan de home-pagina.</div>
                  </div>
                  <button onClick={() => setShowInSlider(v => !v)} style={toggleBtn(showInSlider)}><div style={knob(showInSlider)} /></button>
                </div>
              </div>
            )}

            {/* Personen -> client-lijst */}
            {!forEveryone && (
              <div style={{ padding: isMobile ? '0.85rem 0.95rem 0.5rem' : '0.95rem 1.125rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={10} /> Personen
                    <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: selectedClients.length ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800 }}>{selectedClients.length}/{clients.length}</span>
                  </label>
                  <button onClick={toggleAll} style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 5, color: GOLD, fontSize: '0.55rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', touchAction: 'manipulation' }}>{allSelected ? 'Geen' : 'Alle'}</button>
                </div>
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', maxHeight: '38vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {loading ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Laden…</div>
                  ) : clients.length === 0 ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Geen clients gevonden</div>
                  ) : clients.map((c, idx) => {
                    const sel = selectedClients.includes(c.id)
                    return (
                      <button key={c.id} onClick={() => toggleClient(c.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.65rem', background: sel ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', borderBottom: idx < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', borderLeft: sel ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', color: '#fff', fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: sel ? 700 : 600, textAlign: 'left', minHeight: '40px', touchAction: 'manipulation', textTransform: 'capitalize' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${sel ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`, background: sel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        {clientName(c, idx)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: isMobile ? '0.625rem 0.95rem' : '0.75rem 1.125rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', touchAction: 'manipulation' }}>Annuleer</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.625rem', background: GOLD, border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.7rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '42px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: saving ? 0.6 : 1, touchAction: 'manipulation' }}><Check size={13} />{saving ? 'Opslaan…' : 'Opslaan'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
