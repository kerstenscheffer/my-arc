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
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import { X, Trash2, Play, ExternalLink } from 'lucide-react'
import ExerciseService from '../../../services/ExerciseService'
import { colors, radius, space, overlay } from '../../../ui/tokens'
import { getVideoSource, getYouTubeEmbedUrl } from '../../videos/utils/youtubeHelpers'

const LIJN = '1px solid rgba(255,255,255,0.12)'

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

// De rij uit de builder draagt vaak alleen naam + sets: video, thumbnail en
// foto staan in exercises (of custom_exercises). Die halen we er zelf bij,
// anders opende dit venster leeg terwijl de oefening al een video had.
async function laadOefening(exercise) {
  const sb = ExerciseService.supabase
  if (!sb || !exercise) return null
  const kolommen = 'id, name, image_url, video_url, thumbnail_url'
  const tabel = exercise._source === 'custom_exercises' ? 'custom_exercises' : 'exercises'
  if (isUuid(exercise.id)) {
    const { data } = await sb.from(tabel).select(kolommen).eq('id', exercise.id).maybeSingle().then(r => r, () => ({ data: null }))
    if (data) return data
  }
  const naam = String(exercise.name || '').trim()
  if (!naam) return null
  for (const t of ['exercises', 'custom_exercises']) {
    const { data } = await sb.from(t).select(kolommen).ilike('name', naam).limit(1).then(r => r, () => ({ data: [] }))
    if (data?.length) return data[0]
  }
  return null
}

export default function ExerciseVideoEditor({
  isOpen, onClose, exercise, isMobile = false, onSaved,
}) {
  const modalHost = useModalHost()
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [fotoUrl, setFotoUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const [speelt, setSpeelt] = useState(false)
  const [toon, setToon] = useState('video') // 'video' | 'foto'

  useEffect(() => {
    if (!isOpen) return
    setVideoUrl(exercise?.video_url || '')
    setThumbnailUrl(exercise?.thumbnail_url || '')
    setFotoUrl(exercise?.image_url || null)
    setSaving(false); setSpeelt(false); setToon('video')
    let weg = false
    laadOefening(exercise).then(rij => {
      if (weg || !rij) return
      // Alleen aanvullen wat de rij uit de builder mist.
      setVideoUrl(v => v || rij.video_url || '')
      setThumbnailUrl(t => t || rij.thumbnail_url || '')
      setFotoUrl(f => f || rij.image_url || null)
    })
    return () => { weg = true }
  }, [isOpen, exercise?.id, exercise?.name])

  if (!isOpen || !exercise) return null

  const derivedThumb = deriveYoutubeThumb(videoUrl)
  const videoThumb = thumbnailUrl || derivedThumb || fotoUrl || null
  const bron = getVideoSource(videoUrl.trim())
  const embed = bron.kind === 'youtube' ? getYouTubeEmbedUrl(bron.youtubeId)
    : bron.kind === 'zoom-embed' || bron.kind === 'instagram-embed' ? bron.embedUrl : null
  const isMp4 = /\.(mp4|webm|mov)(\?|$)/i.test(videoUrl)
  const heeftVideo = !!videoUrl.trim()
  const heeftFoto = !!fotoUrl
  const beide = heeftVideo && heeftFoto
  const opVideo = heeftVideo && (toon === 'video' || !heeftFoto)

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
        source: exercise._source || null,
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

  const veld = {
    width: '100%', boxSizing: 'border-box', height: 44,
    padding: `0 ${space[3]}px`,
    background: colors.surface, border: LIJN, borderRadius: radius.btn,
    color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600,
    fontFamily: 'inherit', outline: 'none',
  }
  const label = { fontSize: '0.8rem', fontWeight: 800, color: colors.textPrimary, marginBottom: space[2] }
  const hint = { fontSize: '0.74rem', fontWeight: 600, color: colors.textSecondary, marginTop: space[1] }
  const balkKnop = (kant) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: space[2],
    padding: `0 ${space[4]}px`, background: 'transparent', border: 'none',
    [kant === 'links' ? 'borderRight' : 'borderLeft']: LIJN,
    color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
    cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483560,
        background: overlay.color, backdropFilter: overlay.blur, WebkitBackdropFilter: overlay.blur,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : space[4],
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          maxHeight: isMobile ? '94vh' : '90vh',
          background: colors.bg, border: LIJN,
          borderRadius: isMobile ? `${radius.card}px ${radius.card}px 0 0` : radius.card,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Balk: naam links, sluiten rechts. Zelfde vorm als de maaltijd-info. */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: 48, flexShrink: 0, borderBottom: LIJN }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: `0 ${space[4]}px`, fontSize: '0.95rem', fontWeight: 900, color: colors.textPrimary, letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exercise.name}
          </div>
          <button onClick={onClose} aria-label="Sluiten" title="Sluiten" style={{ ...balkKnop('rechts'), padding: 0, width: 48 }}>
            <X size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Beeld: video (speelt hier af) of de foto van de oefening. */}
          {(heeftVideo || heeftFoto) && (
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#000', borderBottom: LIJN }}>
              {opVideo && speelt && (embed
                ? <iframe src={embed} title={exercise.name} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                : isMp4
                  ? <video src={videoUrl} controls autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
                  : null)}
              {!(opVideo && speelt && (embed || isMp4)) && (
                <>
                  {(opVideo ? videoThumb : fotoUrl) && (
                    <img src={opVideo ? videoThumb : fotoUrl} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: opVideo ? 'cover' : 'contain', background: '#000' }} />
                  )}
                  {opVideo && (
                    <button
                      onClick={() => { if (embed || isMp4) setSpeelt(true); else window.open(videoUrl, '_blank', 'noopener') }}
                      aria-label="Video afspelen"
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: 'none', cursor: 'pointer' }}>
                      <span style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }}>
                        {embed || isMp4 ? <Play size={24} color="#000" fill="#000" style={{ marginLeft: 3 }} /> : <ExternalLink size={22} color="#000" />}
                      </span>
                    </button>
                  )}
                </>
              )}
              {/* Video / Foto: alleen als er allebei is. */}
              {beide && (
                <div style={{ position: 'absolute', top: space[3], left: space[3], display: 'flex', height: 32, borderRadius: radius.btn, overflow: 'hidden', background: 'rgba(0,0,0,0.7)', border: LIJN }}>
                  {[{ id: 'video', label: 'Video' }, { id: 'foto', label: 'Foto' }].map((o, i) => (
                    <button key={o.id} onClick={() => { setToon(o.id); setSpeelt(false) }} style={{
                      padding: `0 ${space[3]}px`, border: 'none', borderLeft: i ? LIJN : 'none',
                      background: toon === o.id ? '#fff' : 'transparent', color: toon === o.id ? '#000' : '#fff',
                      fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    }}>{o.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: space[4], display: 'flex', flexDirection: 'column', gap: space[4] }}>
            <div>
              <div style={label}>Video-link</div>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setSpeelt(false) }}
                placeholder="YouTube, Vimeo of een MP4-link"
                style={veld}
              />
            </div>

            <div>
              <div style={label}>Thumbnail</div>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder={derivedThumb ? 'Leeg = de YouTube-thumbnail' : 'Leeg = de foto van de oefening'}
                style={veld}
              />
              {!thumbnailUrl && (
                <div style={hint}>{derivedThumb ? 'Leeg laten: de thumbnail komt van YouTube.' : 'Leeg laten: de foto van de oefening wordt gebruikt.'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Eén primaire actie; weghalen klein links. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: space[3], padding: space[4], borderTop: LIJN, flexShrink: 0 }}>
          {(exercise.video_url || exercise.thumbnail_url || videoUrl || thumbnailUrl) && (
            <button
              onClick={handleClear}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: space[2], height: 44, padding: `0 ${space[2]}px`, background: 'transparent', border: 'none', color: colors.danger, fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <Trash2 size={15} strokeWidth={2.4} /> Weghalen
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 44, padding: `0 ${space[6]}px`,
              background: '#fff', border: 'none', borderRadius: radius.btn,
              color: '#000', fontSize: '0.9rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>,
    modalHost,
  )
}
