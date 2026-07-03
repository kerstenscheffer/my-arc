// src/modules/manual-workout-builder/components/ExerciseVideoEditor.jsx
// Small modal where a coach can paste a video URL + thumbnail URL for an
// exercise. Writes back to the `exercises` table via ExerciseService —
// the client-side workout cards already render a play-button overlay when
// `video_url` is set, so a successful save here lights up the video in the
// client dashboard immediately.
//
// URL-only flow (no upload) — works with any host: YouTube, Vimeo, raw
// MP4 link, Supabase Storage signed URL, etc. Upload-to-storage can be
// layered on later without changing this UI.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Video, Image as ImageIcon, Trash2, Save, ExternalLink } from 'lucide-react'
import ExerciseService from '../../../services/ExerciseService'

const GOLD = '#FFD700'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v)

// Best-effort YouTube thumbnail derivation so the coach doesn't HAVE to
// supply a thumbnail too — we infer it from the video URL when possible.
const deriveYoutubeThumb = (url) => {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  if (!m) return null
  return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`
}

export default function ExerciseVideoEditor({
  isOpen, onClose, exercise, isMobile = false, onSaved,
}) {
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setVideoUrl(exercise?.video_url || '')
    setThumbnailUrl(exercise?.thumbnail_url || '')
    setSaving(false)
  }, [isOpen, exercise?.id])

  if (!isOpen || !exercise) return null

  const derivedThumb = deriveYoutubeThumb(videoUrl)
  const effectiveThumb = thumbnailUrl || derivedThumb || exercise.image_url || null

  // The DayBuilder generates a local timestamp id per row for React keys —
  // that's NOT the real exercises.id (uuid). Only pass it to the service
  // when it looks like a real UUID; otherwise let the service resolve by
  // name. Avoids the "invalid input syntax for type uuid" error.
  const realId = isUuid(exercise?.id) ? exercise.id : null

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await ExerciseService.updateExerciseVideo({
        exerciseId: realId,
        exerciseName: exercise.name,
        // De Library-modal voegt _source toe ('exercises' vs
        // 'custom_exercises') zodat de service naar de juiste tabel
        // schrijft. Zonder dat zou een custom-row niet bestaan in
        // exercises en zouden we per ongeluk een nieuwe shared-row
        // verwachten.
        source: exercise._source || null,
        videoUrl: videoUrl.trim() || null,
        thumbnailUrl: thumbnailUrl.trim() || null,
      })
      onSaved?.({
        ...exercise,
        video_url: videoUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
      })
      onClose?.()
    } catch (e) {
      alert('Opslaan mislukt — ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!videoUrl && !thumbnailUrl) { onClose?.(); return }
    if (!window.confirm('Video + thumbnail van deze oefening verwijderen?')) return
    setSaving(true)
    try {
      await ExerciseService.updateExerciseVideo({
        exerciseId: realId,
        exerciseName: exercise.name,
        videoUrl: null,
        thumbnailUrl: null,
      })
      onSaved?.({ ...exercise, video_url: null, thumbnail_url: null })
      onClose?.()
    } catch (e) {
      alert('Verwijderen mislukt — ' + (e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.55rem 0.7rem',
    background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${GOLD}33`,
    borderRadius: 6,
    color: '#fff', fontSize: '0.8rem',
    fontFamily: 'monospace', outline: 'none',
  }
  const labelStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: '0.6rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    marginBottom: 4,
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483560,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          maxHeight: isMobile ? '92vh' : '85vh',
          background: '#0a0a0a',
          border: `1px solid ${GOLD}33`,
          borderRadius: isMobile ? '14px 14px 0 0' : 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 14px 50px rgba(0,0,0,0.7), 0 0 24px ${GOLD}22`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.55rem',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `${GOLD}10`,
        }}>
          <Video size={17} color={GOLD} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: 800,
              color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Video bij oefening
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {exercise.name}
            </div>
          </div>
          <button onClick={onClose} title="Sluiten" style={{
            width: 28, height: 28, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', touchAction: 'manipulation',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '0.85rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.8rem',
        }}>
          <div>
            <div style={labelStyle}>
              <Video size={10} /> Video URL
            </div>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="bv. https://youtube.com/watch?v=… of https://cdn.../squat.mp4"
              style={inputStyle}
            />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Werkt met YouTube, Vimeo, Supabase Storage of een directe MP4-link.
            </div>
          </div>

          <div>
            <div style={labelStyle}>
              <ImageIcon size={10} /> Thumbnail URL <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginLeft: 4 }}>(optioneel)</span>
            </div>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder={derivedThumb ? `auto · ${derivedThumb}` : 'https://cdn.../thumb.jpg'}
              style={inputStyle}
            />
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {derivedThumb
                ? 'YouTube thumbnail wordt automatisch afgeleid als je dit leeg laat.'
                : 'Leeg = de bestaande exercise-image wordt gebruikt.'}
            </div>
          </div>

          {/* Preview */}
          {effectiveThumb && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <div style={labelStyle}>Preview</div>
              <div style={{
                position: 'relative',
                aspectRatio: '16 / 9',
                background: '#000',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <img
                  src={effectiveThumb}
                  alt="thumbnail preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                {videoUrl && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)',
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'rgba(255,0,0,0.85)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                    }}>
                      <div style={{
                        width: 0, height: 0,
                        borderLeft: '14px solid #fff',
                        borderTop: '9px solid transparent',
                        borderBottom: '9px solid transparent',
                        marginLeft: 4,
                      }} />
                    </div>
                  </div>
                )}
              </div>
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '0.65rem', color: GOLD, fontWeight: 700,
                    textDecoration: 'none', alignSelf: 'flex-start',
                  }}
                >
                  <ExternalLink size={10} /> Test link openen
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 6,
          padding: '0.7rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleClear}
            disabled={saving || (!videoUrl && !thumbnailUrl && !exercise.video_url && !exercise.thumbnail_url)}
            title="Video weghalen"
            style={{
              padding: '0.55rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 6,
              color: '#fca5a5', fontSize: '0.7rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation',
            }}
          >
            <Trash2 size={11} /> Weghalen
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.6rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer',
          }}>Annuleer</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: '0.6rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: GOLD,
              border: `1px solid ${GOLD}`,
              borderRadius: 6,
              color: '#000', fontSize: '0.8rem', fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Save size={13} /> {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
