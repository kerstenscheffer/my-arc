// src/modules/videos/video-tab-components/VideoEditModal.jsx
// v2.0 — Volledige editor (titel, beschrijving, URL, categorie, thumbnail, default_pages)
// Brand styling, createPortal, correcte page_context keys
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Edit, X, Globe, Camera, Image as ImageIcon, Check, Youtube,
  Home, Dumbbell, Utensils, ShoppingCart, Camera as TrackingIcon, Phone, User
} from 'lucide-react'
import useIsMobile from '../../../hooks/useIsMobile'
import videoService from '../VideoService'

const GOLD = '#FFD700'

// ── Page keys matchen ClientDashboard ──
const PAGE_OPTIONS = [
  { value: 'home',         label: 'Home',         icon: Home },
  { value: 'workout',      label: 'Workout',      icon: Dumbbell },
  { value: 'meal',         label: 'Meal',         icon: Utensils },
  { value: 'boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { value: 'tracking',     label: 'Tracking',     icon: TrackingIcon },
  { value: 'calls',        label: 'Calls',        icon: Phone },
  { value: 'profile',      label: 'Profile',      icon: User }
]

export default function VideoEditModal({ 
  video, 
  onClose, 
  onSave,
  customCategories = [],
  db
}) {
  const [formData, setFormData] = useState({
    title: video.title || '',
    description: video.description || '',
    video_url: video.video_url || '',
    category_id: video.category_id || null,
    default_pages: video.default_pages || [],
    show_in_slider: video.show_in_slider || false
  })
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(video.thumbnail_url || null)
  const [thumbnailChanged, setThumbnailChanged] = useState(false)
  const [saving, setSaving] = useState(false)

  const isMobile = useIsMobile()

  // Lock body scroll
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  const togglePage = (pageValue) => {
    if (formData.default_pages.includes(pageValue)) {
      setFormData({
        ...formData,
        default_pages: formData.default_pages.filter(p => p !== pageValue)
      })
    } else {
      setFormData({
        ...formData,
        default_pages: [...formData.default_pages, pageValue]
      })
    }
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnailFile(file)
      setThumbnailChanged(true)
      const reader = new FileReader()
      reader.onload = (e) => setThumbnailPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setThumbnailChanged(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.video_url.trim()) {
      alert('Titel en URL zijn verplicht')
      return
    }

    setSaving(true)
    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        video_url: formData.video_url.trim(),
        category_id: formData.category_id || null,
        default_pages: formData.default_pages,
        show_in_slider: formData.show_in_slider
      }

      // Handle thumbnail upload if changed
      if (thumbnailChanged) {
        if (thumbnailFile) {
          const user = await db?.getCurrentUser?.()
          const coachId = user?.id || video.coach_id
          const uploadResult = await videoService.uploadThumbnail(thumbnailFile, coachId)
          if (uploadResult.success) {
            updates.thumbnail_url = uploadResult.thumbnailUrl
          } else {
            alert('Thumbnail upload mislukt: ' + uploadResult.error)
            setSaving(false)
            return
          }
        } else {
          // User verwijderde thumbnail
          updates.thumbnail_url = null
        }
      }

      const result = await videoService.updateVideo(video.id, updates)

      if (result.success) {
        if (onSave) await onSave()
        onClose()
      } else {
        alert('Fout bij opslaan: ' + (result.error || 'Onbekend'))
      }
    } catch (error) {
      console.error('Error updating video:', error)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  // Shared styles
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
        zIndex: 10001,
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
              Video bewerken
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {video.title}
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
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div
          className="edit-modal-body"
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
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.4
              }}
            />
          </div>

          {/* ── CATEGORIE ── */}
          <div style={{
            padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
          }}>
            <label style={{
              ...labelStyle,
              color: customCategories.length > 0 ? GOLD : 'rgba(255, 255, 255, 0.3)'
            }}>
              Categorie
              {customCategories.length === 0 && (
                <span style={{
                  marginLeft: '0.4rem',
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: 0
                }}>
                  — maak er eerst één aan
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
              Thumbnail
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
                  alt="Thumbnail"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '0.4rem',
                  right: '0.4rem',
                  display: 'flex',
                  gap: '0.3rem'
                }}>
                  <label
                    htmlFor="thumbnail-replace"
                    style={{
                      padding: '0.35rem 0.55rem',
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.55rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    Vervang
                  </label>
                  <button
                    onClick={removeThumbnail}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: 'rgba(239, 68, 68, 0.85)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
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
                </div>
                {thumbnailChanged && thumbnailFile && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.4rem',
                    left: '0.4rem',
                    padding: '0.2rem 0.45rem',
                    background: GOLD,
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
                    Nieuwe afbeelding
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="thumbnail-replace"
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
              id="thumbnail-replace"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* ── STANDAARD PAGINA'S ── */}
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
              <Globe size={10} />
              Standaard zichtbaar op
              {formData.default_pages.length > 0 && (
                <span style={{
                  marginLeft: '0.3rem',
                  padding: '0.1rem 0.35rem',
                  background: GOLD,
                  color: '#000',
                  borderRadius: '3px',
                  fontSize: '0.5rem',
                  fontWeight: '800',
                  letterSpacing: 0
                }}>
                  {formData.default_pages.length}
                </span>
              )}
            </label>
            <div style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.4)',
              lineHeight: 1.4,
              marginBottom: '0.5rem'
            }}>
              Video automatisch zichtbaar bij alle clients op deze pagina's.
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: '0.3rem'
            }}>
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
                      border: isSelected
                        ? `1px solid ${GOLD}`
                        : '1px solid rgba(255, 255, 255, 0.08)',
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

          <div style={{ height: '0.5rem' }} />
        </div>

        {/* ── ACTIONS ── */}
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
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
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
            onClick={handleSave}
            disabled={saving || !formData.title.trim() || !formData.video_url.trim()}
            style={{
              flex: 2,
              padding: '0.625rem',
              background: saving || !formData.title.trim() || !formData.video_url.trim()
                ? 'rgba(255, 215, 0, 0.2)'
                : GOLD,
              border: 'none',
              borderRadius: '6px',
              color: saving || !formData.title.trim() || !formData.video_url.trim()
                ? 'rgba(0, 0, 0, 0.4)'
                : '#000',
              fontSize: '0.7rem',
              fontWeight: '800',
              cursor: saving || !formData.title.trim() || !formData.video_url.trim()
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
            {saving ? (
              <>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'vm-spin 0.8s linear infinite'
                }} />
                Opslaan...
              </>
            ) : (
              <>
                <Edit size={13} />
                Opslaan
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .edit-modal-body::-webkit-scrollbar { display: none; }
        @keyframes vm-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  )
}
