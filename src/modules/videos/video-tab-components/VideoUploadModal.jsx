// src/modules/videos/video-tab-components/VideoUploadModal.jsx
// v2.0 — Brand styling (flush/goud) + mijn categorie dropdown + category_id support
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Upload, X, Youtube, Camera, Image as ImageIcon, Globe, Check, Home, Dumbbell, Utensils, ShoppingCart, Phone, User } from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

const GOLD = '#FFD700'

// Pagina's matchen ClientDashboard — zelfde set als de edit-modal. Een video
// met een pagina in default_pages verschijnt AUTOMATISCH bij alle clients (ook
// nieuwe) op die pagina. Dit is de enige bron van waarheid voor "standaard".
const PAGE_OPTIONS = [
  { value: 'home',         label: 'Home',         icon: Home },
  { value: 'workout',      label: 'Workout',      icon: Dumbbell },
  { value: 'meal',         label: 'Meal',         icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',     icon: Camera },
  { value: 'calls',        label: 'Calls',        icon: Phone },
  { value: 'profile',      label: 'Profile',      icon: User },
]

export default function VideoUploadModal({
  onClose,
  onSave,
  categories = [],
  customCategories = [],
  clients = [],
  db
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    category: 'motivation',
    category_id: null,
    tags: [],
    difficulty_level: 'beginner',
    best_time_to_watch: 'anytime',
    default_pages: [],
    show_in_slider: false
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Voor wie is deze video? 'everyone' = standaard zichtbaar voor alle clients
  // (via default_pages/slider). 'specific' = alleen losse toewijzing aan gekozen
  // klant(en) op één pagina.
  const [audience, setAudience] = useState('everyone')
  const [selectedClientIds, setSelectedClientIds] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [assignPage, setAssignPage] = useState('home')

  const toggleClient = (id) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const clientName = (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || 'Klant'
  const filteredClients = (clients || []).filter(c =>
    !clientSearch.trim() || clientName(c).toLowerCase().includes(clientSearch.toLowerCase())
  )

  const isMobile = useIsMobile()

  const togglePage = (pageValue) => {
    setFormData(prev => prev.default_pages.includes(pageValue)
      ? { ...prev, default_pages: prev.default_pages.filter(p => p !== pageValue) }
      : { ...prev, default_pages: [...prev.default_pages, pageValue] })
  }

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setThumbnailPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url) {
      alert('Vul minimaal een titel en video URL in')
      return
    }
    if (audience === 'specific' && selectedClientIds.length === 0) {
      alert('Kies minimaal één klant, of kies "Iedereen".')
      return
    }

    setUploading(true)
    try {
      let thumbnailUrl = null

      if (thumbnailFile) {
        const user = await db.getCurrentUser()
        const uploadResult = await videoService.uploadThumbnail(thumbnailFile, user.id)

        if (uploadResult.success) {
          thumbnailUrl = uploadResult.thumbnailUrl
        } else {
          alert(`Thumbnail upload mislukt: ${uploadResult.error}`)
        }
      }

      const specific = audience === 'specific'
      await onSave({
        ...formData,
        // Specifieke toewijzing → niet standaard voor iedereen tonen.
        default_pages: specific ? [] : formData.default_pages,
        show_in_slider: specific ? false : formData.show_in_slider,
        thumbnail_url: thumbnailUrl,
        // Doorgegeven aan CoachVideoTab om ná createVideo toe te wijzen.
        _audience: audience,
        _clientIds: specific ? selectedClientIds : [],
        _assignPage: assignPage,
      })
    } catch (error) {
      console.error('Error creating video:', error)
      alert('Er ging iets mis bij het uploaden')
    } finally {
      setUploading(false)
    }
  }

  // Shared label styling
  const labelStyle = {
    display: 'block',
    fontSize: '0.4rem',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.4rem'
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    background: '#000',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    color: '#fff',
    fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: '600',
    outline: 'none'
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 10000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: isMobile ? '100%' : '560px',
          maxHeight: isMobile ? '92vh' : '88vh',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateZ(0)'
        }}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem'
            }}>
              Video Library
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em'
            }}>
              Nieuwe video
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY — scrollable */}
        <div
          className="upload-modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* ── TITEL ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={labelStyle}>Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Bv. Welkom bij MY ARC — App Uitleg"
              style={inputStyle}
            />
          </div>

          {/* ── YOUTUBE URL ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Youtube size={10} />
              YouTube URL *
            </label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=... of /shorts/..."
              style={inputStyle}
            />
          </div>

          {/* ── BESCHRIJVING ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={labelStyle}>Beschrijving</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Wat kan de client hier leren?"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.4
              }}
            />
          </div>

          {/* ── MIJN CATEGORIE (custom) ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              color: customCategories.length > 0 ? GOLD : 'rgba(255, 255, 255, 0.3)'
            }}>
              Mijn categorie
              {customCategories.length === 0 && (
                <span style={{
                  marginLeft: '0.4rem',
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: 0
                }}>
                  — nog geen gemaakt
                </span>
              )}
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData({
                ...formData,
                category_id: e.target.value || null
              })}
              disabled={customCategories.length === 0}
              style={{
                ...inputStyle,
                cursor: customCategories.length === 0 ? 'not-allowed' : 'pointer',
                opacity: customCategories.length === 0 ? 0.4 : 1
              }}
            >
              <option value="" style={{ background: '#0a0a0a' }}>
                — Geen categorie —
              </option>
              {customCategories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#0a0a0a' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── TAG / LEGACY CATEGORY ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={labelStyle}>Type / Tag</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} style={{ background: '#0a0a0a' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── THUMBNAIL ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Camera size={10} />
              Thumbnail (aanbevolen voor shorts)
            </label>

            {thumbnailPreview ? (
              <div style={{
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                aspectRatio: '16 / 9',
                background: '#000'
              }}>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <button
                  onClick={() => {
                    setThumbnailFile(null)
                    setThumbnailPreview(null)
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.4rem',
                    right: '0.4rem',
                    width: '28px',
                    height: '28px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <X size={14} />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '0.4rem',
                  left: '0.4rem',
                  padding: '0.2rem 0.45rem',
                  background: 'rgba(16, 185, 129, 0.9)',
                  borderRadius: '4px',
                  fontSize: '0.55rem',
                  fontWeight: '800',
                  color: '#000',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}>
                  <Check size={10} strokeWidth={3} />
                  Geüpload
                </div>
              </div>
            ) : (
              <label
                htmlFor="thumbnail-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '1.25rem',
                  background: '#000',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '88px'
                }}
              >
                <ImageIcon size={22} color="rgba(255, 255, 255, 0.2)" />
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Kies afbeelding
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: 'rgba(255, 255, 255, 0.25)'
                }}>
                  JPG of PNG — max 5MB
                </div>
              </label>
            )}

            <input
              id="thumbnail-upload"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* ── VOOR WIE? — Iedereen vs specifieke klant(en) ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={labelStyle}>Voor wie is deze video?</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[
                { key: 'everyone', label: 'Iedereen', Icon: Globe, sub: 'Alle clients' },
                { key: 'specific', label: 'Specifieke klant', Icon: User, sub: 'Kies wie' },
              ].map(opt => {
                const on = audience === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setAudience(opt.key)}
                    style={{
                      flex: 1, padding: '0.6rem 0.5rem',
                      background: on ? GOLD : 'transparent',
                      border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', cursor: 'pointer',
                      color: on ? '#000' : 'rgba(255,255,255,0.55)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <opt.Icon size={15} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{opt.label}</span>
                    <span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.7 }}>{opt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── SPECIFIEKE KLANT(EN) — picker + pagina ── */}
          {audience === 'specific' && (
            <div style={{
              padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              borderLeft: `3px solid ${GOLD}`,
            }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={10} />
                Kies klant(en)
                {selectedClientIds.length > 0 && (
                  <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: GOLD, color: '#000', borderRadius: '3px', fontSize: '0.5rem', fontWeight: 800, letterSpacing: 0 }}>
                    {selectedClientIds.length}
                  </span>
                )}
              </label>

              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Zoek klant…"
                style={{ ...inputStyle, marginBottom: '0.4rem' }}
              />

              <div style={{
                maxHeight: '168px', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: '#000',
              }}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                    Geen klanten gevonden.
                  </div>
                ) : filteredClients.map(c => {
                  const on = selectedClientIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleClient(c.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.65rem', background: on ? 'rgba(255,215,0,0.1)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', textAlign: 'left',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, flexShrink: 0, borderRadius: '4px',
                        border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.2)'}`,
                        background: on ? GOLD : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {on && <Check size={11} strokeWidth={3} color="#000" />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', fontWeight: 700, color: on ? '#fff' : 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clientName(c)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Op welke pagina verschijnt de video bij deze klant(en)? */}
              <label style={{ ...labelStyle, marginTop: '0.6rem' }}>Verschijnt op pagina</label>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.3rem' }}>
                {PAGE_OPTIONS.map(page => {
                  const Icon = page.icon
                  const on = assignPage === page.value
                  return (
                    <button
                      key={page.value}
                      onClick={() => setAssignPage(page.value)}
                      style={{
                        padding: '0.5rem 0.4rem',
                        background: on ? GOLD : 'transparent',
                        border: on ? `1px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px', color: on ? '#000' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        textTransform: 'uppercase', letterSpacing: '0.03em', minHeight: '38px',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Icon size={12} />
                      {page.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {audience === 'everyone' && (<>
          {/* ── STANDAARD ZICHTBAAR OP (default_pages) ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            borderLeft: formData.default_pages.length > 0 ? `3px solid ${GOLD}` : '3px solid transparent',
            transition: 'border-left-color 0.2s ease'
          }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={10} />
              Standaard zichtbaar voor iedereen op
              {formData.default_pages.length > 0 && (
                <span style={{ marginLeft: '0.3rem', padding: '0.1rem 0.35rem', background: GOLD, color: '#000', borderRadius: '3px', fontSize: '0.5rem', fontWeight: '800', letterSpacing: 0 }}>
                  {formData.default_pages.length}
                </span>
              )}
            </label>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
              Automatisch zichtbaar bij ALLE clients (ook nieuwe) op de gekozen pagina's. Laat leeg om de video alleen los toe te wijzen.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '0.3rem' }}>
              {PAGE_OPTIONS.map(page => {
                const Icon = page.icon
                const isSelected = formData.default_pages.includes(page.value)
                return (
                  <button
                    key={page.value}
                    onClick={() => togglePage(page.value)}
                    style={{
                      padding: '0.55rem 0.4rem',
                      background: isSelected ? GOLD : 'transparent',
                      border: isSelected ? `1px solid ${GOLD}` : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: isSelected ? '#000' : 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '40px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={12} />
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── IN HOME-SLIDER? ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            borderLeft: formData.show_in_slider ? `3px solid ${GOLD}` : '3px solid transparent',
            transition: 'border-left-color 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '700', color: '#fff', marginBottom: '0.15rem' }}>
                  Tonen in home-slider
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.4 }}>
                  Verschijnt in de auto-roterende slider bovenaan de home-pagina (voor alle clients).
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, show_in_slider: !formData.show_in_slider })}
                style={{ width: '40px', height: '22px', background: formData.show_in_slider ? GOLD : 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0, padding: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <div style={{ position: 'absolute', top: '2px', left: formData.show_in_slider ? '20px' : '2px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: 'left 0.2s ease' }} />
              </button>
            </div>
          </div>
          </>)}

          {/* Filler to ensure action buttons aren't flush against last field */}
          <div style={{ height: '0.5rem' }} />
        </div>

        {/* ── ACTIONS (sticky bottom) ── */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.125rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
          background: '#0a0a0a'
        }}>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: uploading ? 'not-allowed' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Annuleer
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !formData.title || !formData.video_url}
            style={{
              flex: 2,
              padding: '0.625rem',
              background: uploading || !formData.title || !formData.video_url
                ? 'rgba(255, 215, 0, 0.2)'
                : GOLD,
              border: 'none',
              borderRadius: '6px',
              color: uploading || !formData.title || !formData.video_url
                ? 'rgba(0, 0, 0, 0.4)'
                : '#000',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: uploading || !formData.title || !formData.video_url
                ? 'not-allowed'
                : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '42px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'vm-spin 0.8s linear infinite'
                }} />
                Uploaden...
              </>
            ) : (
              <>
                <Upload size={13} />
                Video toevoegen
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .upload-modal-body::-webkit-scrollbar { display: none; }
        @keyframes vm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )
}
