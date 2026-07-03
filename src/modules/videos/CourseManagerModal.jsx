// src/modules/videos/CourseManagerModal.jsx
// Cursus aanmaken/bewerken: titel + beschrijving + selecteer welke video's erin zitten.
// Toewijzing gebeurt apart via de bestaande VideoAssignModal (hergebruik).
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, GraduationCap, Search } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import videoService from './VideoService'

const GOLD = '#FFD700'

export default function CourseManagerModal({ course, videos = [], onClose, onSaved }) {
  const isMobile = useIsMobile()
  const [title, setTitle] = useState(course?.title || '')
  const [description, setDescription] = useState(course?.description || '')
  // Behoud volgorde: array van video_ids
  const [selectedIds, setSelectedIds] = useState(course?.videoIds || [])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = videos.filter(v =>
    !search.trim() || (v.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!title.trim()) { setError('Geef de cursus een naam.'); return }
    if (selectedIds.length === 0) { setError('Selecteer minimaal 1 video.'); return }
    setSaving(true); setError('')
    try {
      // Thumbnail van de cursus = thumbnail van de eerste video (handig fallback).
      const firstVideo = videos.find(v => v.id === selectedIds[0])
      const thumb = firstVideo ? videoService.getThumbnailUrl(firstVideo) : null
      const payload = { title: title.trim(), description: description.trim() || null, thumbnail_url: thumb }
      const res = course?.id
        ? await videoService.updateCourse(course.id, payload, selectedIds)
        : await videoService.createCourse(payload, selectedIds)
      if (!res.success) { setError(res.error || 'Opslaan mislukt'); setSaving(false); return }
      onSaved?.()
      onClose?.()
    } catch (e) {
      setError(e?.message || 'Opslaan mislukt'); setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.75rem', background: '#000',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff',
    fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
  }

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : '1rem'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0a0a0a', width: '100%', maxWidth: isMobile ? '100%' : 560,
        maxHeight: isMobile ? '92vh' : '88vh', borderRadius: isMobile ? '12px 12px 0 0' : 12,
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '0.85rem 1rem' : '1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <GraduationCap size={20} color={GOLD} />
          <div style={{ flex: 1, fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 800, color: '#fff' }}>
            {course?.id ? 'Cursus bewerken' : 'Nieuwe cursus'}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0.85rem 1rem' : '1rem 1.2rem' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Cursusnaam (bv. Onboarding basis)" style={{ ...inputStyle, marginBottom: '0.6rem' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Korte beschrijving (optioneel)" rows={2} style={{ ...inputStyle, marginBottom: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }} />

          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Video's in deze cursus ({selectedIds.length})
          </div>

          {/* Zoek video's */}
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek video…" style={{ ...inputStyle, paddingLeft: '2rem' }} />
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Geen video's</div>
            ) : filtered.map((v, idx) => {
              const sel = selectedIds.includes(v.id)
              const order = selectedIds.indexOf(v.id)
              return (
                <button key={v.id} onClick={() => toggle(v.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.55rem 0.65rem', background: sel ? 'rgba(255,215,0,0.08)' : 'transparent',
                  border: 'none', borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderLeft: sel ? `3px solid ${GOLD}` : '3px solid transparent',
                  cursor: 'pointer', textAlign: 'left', color: '#fff', minHeight: 48
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${sel ? GOLD : 'rgba(255,255,255,0.2)'}`, background: sel ? GOLD : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <span style={{ color: '#000', fontSize: '0.6rem', fontWeight: 900 }}>{order + 1}</span>}
                  </div>
                  <div style={{ width: 54, height: 32, borderRadius: 5, flexShrink: 0, overflow: 'hidden', background: '#000' }}>
                    <img src={videoService.getThumbnailUrl(v)} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</span>
                </button>
              )
            })}
          </div>

          {error && <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>{error}</div>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: isMobile ? '0.7rem 1rem' : '0.75rem 1.2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Annuleer</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '0.7rem', background: saving ? 'rgba(255,215,0,0.3)' : GOLD, border: 'none', borderRadius: 6, color: '#000', fontSize: '0.72rem', fontWeight: 800, cursor: saving ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Check size={14} /> {saving ? 'Opslaan…' : (course?.id ? 'Bewaren' : 'Cursus aanmaken')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
